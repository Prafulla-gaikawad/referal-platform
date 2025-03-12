const express = require("express");
const router = express.Router();
const {
  getDashboardAnalytics,
  getReferralAnalytics,
  getCustomerAnalytics,
  getRewardAnalytics,
  generateAnalytics,
  getHistoricalAnalytics,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

// Analytics routes
router.get("/dashboard", protect, getDashboardAnalytics);
router.get("/referrals", protect, getReferralAnalytics);
router.get("/customers", protect, getCustomerAnalytics);
router.get("/rewards", protect, getRewardAnalytics);
router.post("/generate", protect, generateAnalytics);
router.get("/history", protect, getHistoricalAnalytics);

module.exports = router;
