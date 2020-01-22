const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (error, req, res, next) => {
  let err = { ...error };

  console.log(error);
  err.message = error.message;
  //console for developer
  // console.log(error);

  //Mongoose Bad ObjectId
  if (error.name === 'CastError') {
    const message = `Resource Could not Found!`;
    err = new ErrorResponse(message, 404);
  }

  //Mongoose dublicate key
  if (error.code === 11000) {
    const message = `Dublicated Field Value Entered`;
    err = new ErrorResponse(message, 400);
  }

  //Mongoose Validation Value
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message);
    err = new ErrorResponse(message, 400);
  }

  res
    .status(err.errorCode || 500)
    .json({ success: false, message: err.message });
};

module.exports = errorHandler;
