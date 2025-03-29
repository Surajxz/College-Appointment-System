const express = require('express');
const { register, login } = require('../controllers/AuthController.js');

const router = express.Router();

router.post('/register', register);//Defines a POST route for /register. When a POST request is made to this endpoint, the register function from AuthController.js will be executed.
router.post('/login', login);

module.exports = router;