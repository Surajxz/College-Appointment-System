const Availability = require('../models/Availability.js');

const createAvailability = async (req, res) => {
  const { startTime, endTime } = req.body;
  try {
    const availability = new Availability({
      professor: req.user._id,
      startTime,
      endTime,
    });
    await availability.save();
    res.status(201).send(availability);
  } catch (err) {
    res.status(400).send(err);
  }
};

const getAvailability = async (req, res) => {
  try {
    const availability = await Availability.find({ isBooked: false });
    res.send(availability);
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { createAvailability, getAvailability };