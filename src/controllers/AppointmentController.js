const Appointment = require('../models/Appointment.js');
const Availability = require('../models/Availability.js');
const User = require('../models/User.js');

const bookAppointment = async (req, res) => {
  try {
    //Validate request body
    const { professor: professorEmail, time } = req.body;
    
    if (!professorEmail || !time) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: !professorEmail ? 'Professor email is required' : 'Time is required'
      });
    }

    //Find professor by email
    const professor = await User.findOne({ 
      email: professorEmail,
      role: 'professor'
    });

    if (!professor) {
      return res.status(404).json({
        error: 'Professor not found',
        suggestion: 'Verify the professor email exists and has professor role'
      });
    }

    // 3. Parse and validate time
    const appointmentTime = new Date(time);
    if (isNaN(appointmentTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid time format',
        expectedFormat: '(e.g., "2023-10-10T10:30:00Z")'
      });
    }

    //Check availability
    const availability = await Availability.findOne({
      professor: professor._id, // Use professor's ObjectId
      startTime: { $lte: appointmentTime },
      endTime: { $gte: appointmentTime },
      isBooked: false
    });

    if (!availability) {
      return res.status(400).json({
        error: 'Time slot not available',
        details: 'Either already booked or not within professor availability'
      });
    }

    //Create and save appointment
    const appointment = new Appointment({
      student: req.user._id,
      professor: professor._id, // Store ObjectId reference
      time: appointmentTime
    });

    await appointment.save();

    //Update availability
    availability.isBooked = true;
    await availability.save();

    //Return the created appointment with populated data
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('professor', 'name email')
      .populate('student', 'name email');

    res.status(201).json(populatedAppointment);

  } catch (err) {
    console.error('Appointment booking error:', err);
    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};




const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }
    res.send(appointment);
  } catch (err) {
    res.status(500).send(err);
  }
};

const getStudentAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ student: req.params.id });
    res.send(appointments);
    
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { bookAppointment, cancelAppointment, getStudentAppointments };