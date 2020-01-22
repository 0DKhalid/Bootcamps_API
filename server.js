const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSantizie = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const ratingLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const errorHandler = require('./middleware/error');

//load env Vars
dotenv.config({ path: './config/config.env' });

//connect to database

connectDB();

const bootCampsRoutes = require('./routes/bootcamps');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');

const app = express();

app.use(express.json());
//dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// santize data
app.use(mongoSantizie());

// Set security headers
app.use(helmet());

//Prevent xss attack
app.use(xss());

//request limit
const limit = ratingLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});
app.use(limit);

//Prevent hpp
app.use(hpp());

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(fileUpload());

app.use('/api/v1/bootcamps', bootCampsRoutes);

app.use('/api/v1/courses', coursesRoutes);

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/users', usersRoutes);

app.use('/api/v1/reviews', reviewsRoutes);

//handle Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} on port: ${PORT}`.yellow.bold
  )
);

//Handle Unhandled Promise Rejection
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err}`.red.bold);

  server.close(() => process.exit(1));
});
