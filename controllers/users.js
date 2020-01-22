const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHnadler');

const User = require('../models/User');

// @Desc      Get Users
// @route     GET  /api/v1/users
// @access    Private/admin
exports.getUsers = asyncHandler(async (req, res, next) =>
  res.status(200).json(res.advancedResult)
);

// @Desc      Get User
// @route     GET  /api/v1/users/:id
// @access    Private/admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('No user Found!', 404));
  }

  res.status(200).json({ success: true, data: user });
});

// @Desc      Create new User
// @route     POST  /api/v1/users
// @access    Private/admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(200).json({ success: true, data: user });
});

// @Desc      Update User
// @route     PUT  /api/v1/users/:id
// @access    Private/admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('No User Found!', 404));
  }

  res.status(200).json({ success: true, data: user });
});

// @Desc      Delete User
// @route     DELETE  /api/v1/user/:id
// @access    Private/admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new ErrorResponse('No User Found!', 404));
  }

  res.status(200).json({ success: true, data: {} });
});
