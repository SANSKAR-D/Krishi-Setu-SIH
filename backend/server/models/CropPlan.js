const mongoose = require("mongoose");

const cropPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    season: {
      type: String,
      enum: ['Kharif', 'Rabi', 'Zaid', 'Annual', 'Other'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    area: {
      type: Number,
      default: 0,
    },
    actualYield: {
      type: Number,
      default: 0,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate plans for the exact same farm, crop, season, and year
cropPlanSchema.index({ userId: 1, farmName: 1, cropName: 1, season: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("CropPlan", cropPlanSchema);
