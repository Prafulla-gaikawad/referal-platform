const express = require("express");
const router = express.Router();
const {
  generateSharingSuggestions,
  generateFollowUp,
  getRecommendations,
  getChatResponse,
  generateEmailContent,
  analyzeReferralPerformance,
  generateCampaignIdeas,
  optimizeRewardStrategy,
} = require("../controllers/aiController");

const { protect } = require("../middleware/auth");

// AI routes
router.post("/sharing-suggestions", protect, generateSharingSuggestions);
router.post("/follow-up", protect, generateFollowUp);
router.get("/recommendations", protect, getRecommendations);
router.post("/chat", getChatResponse); // Making chat public for testing
router.post("/email-content", protect, generateEmailContent);
router.post("/analyze-performance", protect, analyzeReferralPerformance);
router.post("/campaign-ideas", protect, generateCampaignIdeas);
router.post("/optimize-rewards", protect, optimizeRewardStrategy);

module.exports = router;
