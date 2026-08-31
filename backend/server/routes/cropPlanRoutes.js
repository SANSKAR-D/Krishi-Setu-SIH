const express = require("express");
const router = express.Router();
const { addCropPlan, getCropPlans, addEvent, getEvents } = require("../controllers/cropPlanController");

router.route("/")
  .post(addCropPlan)
  .get(getCropPlans);

router.route("/events")
  .post(addEvent)
  .get(getEvents);

module.exports = router;
