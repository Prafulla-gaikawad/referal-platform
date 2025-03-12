const express = require("express");
const router = express.Router();
const {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaignStatus,
  getCampaignStats,
  getActiveCampaigns,
  getPublicCampaign,
} = require("../controllers/campaignController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/:id/public", getPublicCampaign);

// Business owner routes
router.post("/", protect, authorize("business"), createCampaign);
router.get("/", protect, authorize("business"), getCampaigns);
router.get("/:id", protect, getCampaign);
router.put("/:id", protect, authorize("business"), updateCampaign);
router.delete("/:id", protect, authorize("business"), deleteCampaign);
router.put("/:id/toggle", protect, toggleCampaignStatus);
router.get("/:id/stats", protect, getCampaignStats);

// Customer routes
router.get("/active", protect, authorize("customer"), getActiveCampaigns);

module.exports = router;
