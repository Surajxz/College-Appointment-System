const express = require('express');
const auth = require('../middleware/auth.js');
const { bookAppointment, cancelAppointment, getStudentAppointments } = require('../controllers/AppointmentController.js');


const router = express.Router();

router.post('/', auth, bookAppointment);
router.delete('/:id', auth, cancelAppointment);
router.get('/student/:id', auth, getStudentAppointments);

module.exports = router;