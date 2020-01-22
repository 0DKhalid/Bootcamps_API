const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHnadler');
const geocoder = require('../utils/geocoder');

const Bootcamp = require('../models/Bootcamp');

// @Desc      get all bootcamps
// @route     GET  /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResult);
});

// @Desc      get specific bootcamp
// @route     GET  /api/v1/bootcamps/:id
// @access    Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Could not find Bootcamp with this id: ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// @Desc      create  new bootcamp
// @route     POST  /api/v1/bootcamps
// @access    Private
exports.postBootcamp = asyncHandler(async (req, res, next) => {
  //add logged user to req.body
  req.body.user = req.user.id;

  //Check for publisher bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  //If the user is not admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID:${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res.status(200).json({ success: true, data: bootcamp });
});

// @Desc      update bootcamp
// @route     PUT  /api/v1/bootcamps/:id
// @access    Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(new ErrorResponse('Could not update bootcamp', 400));
  }

  //Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorize to update this bootcamp`,
        401
      )
    );
  }

  const updatedBootcamp = await Bootcamp.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({ success: true, data: updatedBootcamp });
});

// @Desc      delete bootcamp
// @route     DELETE  /api/v1/bootcamps/:id
// @access    Private
exports.removeBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(new ErrorResponse('Could not delete bootcamp', 400));
  }

  //Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorize to update this bootcamp`,
        401
      )
    );
  }

  await bootcamp.remove();

  res.status(200).json({ success: true, data: {} });
});

// @Desc      get bootcamps by redius
// @route     GET  /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;
  //get lat and lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  //Calc Radius using radians
  //Divide dist by radius of Earth
  // Earth Radius 3,958.8 mi
  const radius = distance / 3958.8;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps
  });
});

// @Desc      Upload image to server
// @route     PUT  /api/v1/bootcamps/:id/photo
// @access    Private
exports.uploadBootcampImage = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  //check if bootcamp exists
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Could not found bootcamp with this id: ${req.params.id}`,
        400
      )
    );
  }

  //Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorize to update this bootcamp`,
        401
      )
    );
  }

  //check if not image sent
  if (!req.files) {
    return next(new ErrorResponse(`Please make sure you upload file`, 400));
  }

  const file = req.files.file;
  //check image mimtype
  const mimeType = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/jpg': 'jpg'
  };
  if (!mimeType[file.mimetype]) {
    return next(
      new ErrorResponse(
        `File should be image with extension of jpeg, jpg, png `,
        400
      )
    );
  }

  //check for image size
  if (file.size > process.env.MAX_IMAGE_SIZE) {
    return next(
      new ErrorResponse(
        `Make sure image size less than ${process.env.MAX_IMAGE_SIZE}`,
        400
      )
    );
  }

  file.name = `photo_${bootcamp.id}.${mimeType[file.mimetype]}`;

  //upload file on server and save file name in database
  file.mv(`${process.env.FILE_UPLOADS_PATH}/${file.name}`, async err => {
    if (err) {
      return next(new ErrorResponse('we face issues with uploads file', 500));
    }

    const updatedBootcamp = await Bootcamp.findByIdAndUpdate(
      req.params.id,
      {
        photo: file.name
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedBootcamp });
  });
});
