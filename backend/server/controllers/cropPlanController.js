const CropPlan = require("../models/CropPlan");
const Event = require("../models/Event");

// --------------------------------------------------
// @desc    Add a new crop plan
// @route   POST /api/crop-plans
// --------------------------------------------------
const addCropPlan = async (req, res) => {
  try {
    const { farmerId, farmName, cropName, season, year, area, actualYield, latitude, longitude } = req.body;

    if (!farmerId || !farmName || !cropName || !season || !year || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "farmerId, farmName, cropName, season, year, latitude, and longitude are required.",
      });
    }

    // Check if it already exists for the same season and year
    const existingPlan = await CropPlan.findOne({ farmerId, farmName, cropName, season, year });
    if (existingPlan) {
      return res.status(200).json({
        success: true,
        message: "Crop plan already exists for this season and year.",
        data: existingPlan,
      });
    }

    const newPlan = await CropPlan.create({
      farmerId,
      farmName,
      cropName,
      season,
      year,
      area: area || 0,
      actualYield: actualYield || 0,
      latitude,
      longitude,
    });

    return res.status(201).json({
      success: true,
      message: "Crop plan added.",
      data: newPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error adding crop plan.",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// @desc    Get all crop plans for a farmer
// @route   GET /api/crop-plans?farmerId=xxxx
// --------------------------------------------------
const getCropPlans = async (req, res) => {
  try {
    const { farmerId } = req.query;
    const filter = farmerId ? { farmerId } : {};

    const plans = await CropPlan.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching crop plans.",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// @desc    Naya crop calendar event add karna
// @route   POST /api/crop-plans/events
// --------------------------------------------------
const addEvent = async (req, res) => {
  try {
    // Get event data
    const { title, eventType, date, cropPlanId, status, fertilizerName, pesticideName, diseaseName, dosage, cost, notes, actualYield } = req.body;

    // basic validation - zaroori fields check karna
    if (!title || !eventType || !date || !cropPlanId) {
      return res.status(400).json({
        success: false,
        message: "title, eventType, date, and cropPlanId are required",
      });
    }

    // Check if the cropPlan exists
    const cropPlan = await CropPlan.findById(cropPlanId);
    if (!cropPlan) {
      return res.status(404).json({
        success: false,
        message: "Crop plan not found",
      });
    }

    // If it's a Harvest event with an actualYield, update the crop plan
    if (eventType === "Harvest" && actualYield) {
      cropPlan.actualYield = actualYield;
      await cropPlan.save();
    }

    // Create the event
    const newEvent = await Event.create({
      title,
      eventType,
      date,
      cropPlanId,
      status: status || "upcoming",
      fertilizerName,
      pesticideName,
      diseaseName,
      dosage,
      cost,
      notes,
      actualYield: eventType === "Harvest" ? actualYield : 0
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
// @route   GET /api/crop-plans/events?farmerId=xxxx
// --------------------------------------------------
const getEvents = async (req, res) => {
  try {
    const { cropPlanId, farmerId } = req.query;
    
    let filter = {};
    if (cropPlanId) {
      filter = { cropPlanId };
    } else if (farmerId) {
      // Fetch all events for all plans belonging to this farmer
      const userPlans = await CropPlan.find({ farmerId }).select('_id');
      const planIds = userPlans.map(plan => plan._id);
      filter = { cropPlanId: { $in: planIds } };
    }

    // populate cropPlanId to get access to farmName, cropName, latitude, longitude
    const events = await Event.find(filter).populate("cropPlanId").sort({ date: 1 });
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
  addCropPlan,
  getCropPlans,
  addEvent,
  getEvents,
};
