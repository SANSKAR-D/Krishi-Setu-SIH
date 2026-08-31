const mongoose = require("mongoose");

// --------------------------------------------------
// Event Schema (Crop Calendar)
// --------------------------------------------------

const eventSchema = new mongoose.Schema(
  {
    // event ka naam/label, jaise "Wheat sown", "Irrigate N.Field"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // event kis type ka hai
    eventType: {
      type: String,
      required: true,
      enum: ["Sowing", "Irrigation", "Harvest", "Fertilizer", "Pesticide", "Disease", "Others"],
    },

    // event kis din hoga/hua
    date: {
      type: Date,
      required: true,
    },

    // reference to the crop plan (farm)
    cropPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropPlan",
      required: true,
    },

    // event ka current status
    status: {
      type: String,
      required: true,
      enum: ["upcoming", "completed", "overdue"],
      default: "upcoming",
    },

    // agar event fertilizer se related hai
    fertilizerName: {
      type: String,
      trim: true,
      default: "",
    },

    // agar event pesticide se related hai
    pesticideName: {
      type: String,
      trim: true,
      default: "",
    },

    // agar event disease se related hai
    diseaseName: {
      type: String,
      trim: true,
      default: "",
    },

    // dawai ki kitni matra/dosage daalni hai (optional), jaise "50ml", "2kg/acre"
    dosage: {
      type: String,
      trim: true,
      default: "",
    },

    // extra cost, tractor rent, etc (optional)
    cost: {
      type: String,
      trim: true,
      default: "",
    },

    // koi extra note (optional)
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // harvest ke time yield quantity
    actualYield: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt aur updatedAt apne aap add ho jayenge
  }
);

module.exports = mongoose.model("Event", eventSchema);