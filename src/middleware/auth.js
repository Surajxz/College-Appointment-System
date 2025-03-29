const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const auth = async (req, res, next) => {
  try {
    //std
    // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2UwMzBlM2MzZmJiMjJlNjUyMzJmOTYiLCJpYXQiOjE3NDI3NDU4MzV9.NdUKelEfr27b6TBw95eqmp7YGw7zXKnOQCWwCUoGG5o";
    // //prof
    // // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2RmOGE4N2QwZDA3NTdlMGFhNTE1OWEiLCJpYXQiOjE3NDI3MDM5NzZ9.BG0aEF0fl4qZF1xmnMLawRbjqREaXvRjJmiE6z18Z1k";
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
    // res.status(200)
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;