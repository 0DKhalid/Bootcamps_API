const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },

  email: {
    type: String,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    required: [true, 'Please add an email']
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user'
  },

  restPasswordToken: String,
  restPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt a Passowrd within bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//Method For create and return JWT token
UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this.id }, process.env.JWT_SEC, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

//Compare entered password from login controller
UserSchema.methods.isPasswordMatch = async function(password) {
  return await bcrypt.compare(password, this.password);
};

//Generate restPasswordToken and hashed

UserSchema.methods.getResetTokenPassword = function() {
  //Generate Token
  const resetToken = crypto.randomBytes(20).toString('hex');

  //hash token and set to resetPasswordToken
  this.restPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //set expire
  this.restPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
