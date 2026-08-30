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

    // kaunsi crop se related hai
    crop: {
      type: String,
      required: true,
      trim: true,
    },

    // field/location, jaise "North Field", "Greenhouse B", "East Plot"
    field: {
      type: String,
      required: true,
      trim: true,
    },

    // event ka current status
    status: {
      type: String,
      required: true,
      enum: ["upcoming", "completed", "overdue"],
      default: "upcoming",
    },

    // ye event kis farmer ka hai (auth nahi hai abhi, isliye simple String/ID rakha hai)
    farmerId: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true, // createdAt aur updatedAt apne aap add ho jayenge
  }
);

module.exports = mongoose.model("Event", eventSchema);