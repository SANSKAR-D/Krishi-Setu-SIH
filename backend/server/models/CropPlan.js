const mongoose = require("mongoose");

const cropPlanSchema = new mongoose.Schema(
  {
    farmerId: {
      type: String,
      required: true,
      trim: true,
    },
    farmName: {
      type: String,
      required: true,
      trim: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent duplicate plans for the exact same farm and crop for a farmer
cropPlanSchema.index({ farmerId: 1, farmName: 1, cropName: 1 }, { unique: true });

module.exports = mongoose.model("CropPlan", cropPlanSchema);
