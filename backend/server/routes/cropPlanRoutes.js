const express = require("express");
const router = express.Router();
const { addCropPlan, getCropPlans } = require("../controllers/cropPlanController");

router.route("/")
  .post(addCropPlan)
  .get(getCropPlans);

module.exports = router;
