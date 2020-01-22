const mongoose = require('mongoose');

const connectDB = async (req, res, next) => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  });
  console.log(`MongoBD Connected ${conn.connection.host}`.cyan.underline.bold);
};

module.exports = connectDB;
