const express = require('express');

const {
  register,
  login,
  getMe,
  resetPassword,
  updatePassword,
  updateDetails,
  changePassword,
  logout
} = require('../controllers/auth');

const router = express.Router();

//portect Middleware
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/changepassword', protect, changePassword);
router.post('/forgotpassword', resetPassword);
router.put('/resetpassword/:restToken', updatePassword);

module.exports = router;
