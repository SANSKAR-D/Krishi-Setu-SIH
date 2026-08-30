const express = require("express");
const { addEvent, getEvents } = require("../controllers/eventController");

const router = express.Router();

// --------------------------------------------------
// @route   POST /api/events
// @desc    Naya event add karna
// --------------------------------------------------
router.post("/events", addEvent);

// --------------------------------------------------
// @route   GET /api/events
// @desc    Saare events fetch karna (farmerId optional query param)
// --------------------------------------------------
router.get("/events", getEvents);

module.exports = router;

