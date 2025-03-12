const express = require("express");
const router = express.Router();
const {
  getRewards,
  getReward,
  updateRewardStatus,
  verifyRewardCode,
  claimReward,
  sendRewardNotification,
  getCustomerRewards,
} = require("../controllers/rewardController");
const { protect, authorize } = require("../middleware/auth");

// Business owner routes
router.get("/", protect, authorize("business"), getRewards);
router.get("/:id", protect, getReward);
router.put("/:id/status", protect, authorize("business"), updateRewardStatus);
router.post("/verify", protect, authorize("business"), verifyRewardCode);
router.post(
  "/:id/notify",
  protect,
  authorize("business"),
  sendRewardNotification
);

// Customer routes
router.get("/customer", protect, authorize("customer"), getCustomerRewards);
router.post("/:id/claim", protect, authorize("customer"), claimReward);

module.exports = router;
