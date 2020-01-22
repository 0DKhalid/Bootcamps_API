const express = require('express');

const {
  getBootcamps,
  getBootcamp,
  postBootcamp,
  updateBootcamp,
  removeBootcamp,
  getBootcampsInRadius,
  uploadBootcampImage
} = require('../controllers/bootcamps');

//include Other resource router
const coursesRouter = require('./courses');
const reviewsRouter = require('./reviews');

const Bootcamp = require('../models/Bootcamp');

const router = express.Router();

//protect middleware
const advancedResult = require('../middleware/advancedResult');
const { protect, authorize } = require('../middleware/auth');

//Re-route into other resource router
router.use('/:bootcampId/courses', coursesRouter);
router.use('/:bootcampId/reviews', reviewsRouter);

router.route('/:id/photo').put(protect, uploadBootcampImage);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/')
  .get(advancedResult(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), postBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), removeBootcamp);

module.exports = router;
