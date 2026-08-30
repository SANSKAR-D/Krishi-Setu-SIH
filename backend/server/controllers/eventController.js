const Event = require("../models/Event");

// --------------------------------------------------
// @desc    Naya crop calendar event add karna
// @route   POST /api/events
// --------------------------------------------------
const addEvent = async (req, res) => {
  try {
    const {
      title,
      eventType,
      date,
      crop,
      field,
      status,
      farmerId,
      medicineName,
      dosage,
      notes,
    } = req.body;

    // basic validation - zaroori fields check karna
    if (!title || !eventType || !date || !crop || !field || !farmerId) {
      return res.status(400).json({
        success: false,
        message:
          "title, eventType, date, crop, field aur farmerId dena zaroori hai",
      });
    }

    const newEvent = await Event.create({
      title,
      eventType,
      date,
      crop,
      field,
      status, // agar nahi diya to schema mein "upcoming" default hai
      farmerId,
      medicineName,
      dosage,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Event add ho gaya",
      data: newEvent,
    });
  } catch (error) {
    // agar enum ki galat value bheji (jaise galat eventType/status) to yaha error aayega
    return res.status(500).json({
      success: false,
      message: "Event add karte waqt error aaya",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// @desc    Farmer ke saare events fetch karna (details + status)
// @route   GET /api/events?farmerId=xxxx
// --------------------------------------------------
const getEvents = async (req, res) => {
  try {
    const { farmerId } = req.query;

    // agar farmerId diya hai to sirf usi farmer ke events, warna sab events
    const filter = farmerId ? { farmerId } : {};

    const events = await Event.find(filter).sort({ date: 1 });
    // date: 1 => sabse purani/upcoming date pehle aayegi

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Events fetch karte waqt error aaya",
      error: error.message,
    });
  }
};

module.exports = {
  addEvent,
  getEvents,
};