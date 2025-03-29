const express = require('express');
const auth = require('../middleware/auth.js');
const { createAvailability, getAvailability } = require('../controllers/AvailabilityController.js');

const router = express.Router();

router.post('/', auth, createAvailability);
router.get('/', getAvailability);

module.exports = router;