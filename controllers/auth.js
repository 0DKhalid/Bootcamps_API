const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHnadler');
const sendEmail = require('../utils/sendEmail');

const User = require('../models/User');

// @Desc      register new user
// @route     POST  /api/v1/auth/redister
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = new User({
    name,
    email,
    password,
    role
  });

  await user.save();

  //set cookie and send token response
  sendTokenResponse(user, 200, res);
});

// @Desc      login user
// @route     POST  /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //check if req body empty
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Wrong Credentials', 401));
  }

  //check if entered password match hashPasssword
  const isMatch = await user.isPasswordMatch(password);
  if (!isMatch) {
    return next(new ErrorResponse('Wrond Credentials', 401));
  }

  //set cookie and send token response
  sendTokenResponse(user, 200, res);
});

// @Desc      user logout/ clear cookie
// @route     GET  /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, data: {} });
});

// @Desc      get current logged user
// @route     GET  /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @Desc      Update user details
// @route     PUT  /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const updatedFields = {
    name: req.body.name,
    email: req.body.email
  };
  const user = await User.findByIdAndUpdate(req.user.id, updatedFields, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
});

// @Desc      Change user password
// @route     GET  /api/v1/auth/me
// @access    Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.isPasswordMatch(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @Desc      reset password
// @route     POST  /api/v1/auth/forgotpassword
// @access    Private
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('No user with this email', 404));
  }

  const resetToken = user.getResetTokenPassword();

  await user.save({ validateBeforeSave: false });

  //Create reset link
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  //create email message
  const message = `To reset you\`r password please click this link ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset a Password',
      message
    });

    res.status(200).json({ success: true, data: 'Email Sent' });
  } catch (error) {
    console.log(error);

    (user.restPasswordToken = undefined), (user.restPasswordExpire = undefined);

    user.save({ validateBeforeSave: false });
  }
});

// @Desc      Update Password
// @route     PUT  /api/v1/auth/restpassword/:restToken
// @access    Public
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const restPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.restToken)
    .digest('hex');

  const user = await User.findOne({
    restPasswordToken,
    restPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  user.password = req.body.password;
  user.restPasswordToken = undefined;
  user.restPasswordExpire = undefined;

  await user.save();

  //set cookie and send token response
  sendTokenResponse(user, 200, res);
});

//Get user model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //cookie config
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  const token = user.getSignedToken();

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
