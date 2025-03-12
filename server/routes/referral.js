const express = require("express");
const router = express.Router();
const {
  createReferral,
  getReferrals,
  getReferral,
  updateReferralStatus,
  trackReferralClick,
  convertReferee,
  sendFollowUp,
  generateReferralCode,
  getCustomerReferrals,
  convertPublicReferral,
} = require("../controllers/referralController");
const { protect, authorize } = require("../middleware/auth");

// Business owner routes
router.post("/", protect, authorize("business"), createReferral);
router.get("/", protect, authorize("business"), getReferrals);
router.get("/:id", protect, authorize("business"), getReferral);
router.put("/:id/status", protect, authorize("business"), updateReferralStatus);
router.post("/:id/convert", protect, authorize("business"), convertReferee);
router.post("/:id/followup", protect, authorize("business"), sendFollowUp);

// Customer routes
router.get("/customer", protect, authorize("customer"), getCustomerReferrals);
router.post("/generate-code", protect, generateReferralCode);

// Public routes
router.put("/:id/click", trackReferralClick);
router.post("/convert-public", convertPublicReferral);

module.exports = router;
