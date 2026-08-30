const CropPlan = require("../models/CropPlan");

// --------------------------------------------------
// @desc    Add a new crop plan
// @route   POST /api/crop-plans
// --------------------------------------------------
const addCropPlan = async (req, res) => {
  try {
    const { farmerId, farmName, cropName } = req.body;

    if (!farmerId || !farmName || !cropName) {
      return res.status(400).json({
        success: false,
        message: "farmerId, farmName, and cropName are required.",
      });
    }

    // Check if it already exists
    const existingPlan = await CropPlan.findOne({ farmerId, farmName, cropName });
    if (existingPlan) {
      return res.status(200).json({
        success: true,
        message: "Crop plan already exists.",
        data: existingPlan,
      });
    }

    const newPlan = await CropPlan.create({
      farmerId,
      farmName,
      cropName,
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

module.exports = {
  addCropPlan,
  getCropPlans,
};
