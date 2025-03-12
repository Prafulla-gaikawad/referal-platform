/**
 * Mock AI Controller
 * Provides sample data when the real OpenAI API is not available
 */

// @desc    Generate sharing suggestions
// @route   POST /api/mock-ai/sharing-suggestions
// @access  Private
exports.generateSharingSuggestions = async (req, res) => {
  try {
    const { campaignId, customerId, referralLink } = req.body;

    // Use provided referral link or generate a mock one
    const link = referralLink || "https://example.com/refer/ABC123";

    // Return mock suggestions
    res.status(200).json({
      success: true,
      suggestions: {
        sms: `Hey! I thought you might like this offer. Click my referral link to get a special discount. We both win! ${link}`,
        email: {
          subject: "Special offer just for you - Click my referral link",
          body: `Hi there,\n\nI've been using this service and thought you might like it too. If you sign up using my referral link, you'll get a special discount, and I'll earn a reward too.\n\nIt's a win-win!\n\nJust click this link to register: ${link}\n\nCheers,\n[Your Name]`,
        },
        facebook: `I've been loving my experience! They're offering a special discount to friends who sign up with my referral link. Click here and we both get rewards. It's a win-win! ${link}`,
        twitter: `Loving this service! Click my referral link and we both get rewards. It's a win-win! #referral #discount ${link}`,
        whatsapp: `Hey! 👋 I've been using this service and thought you might like it too. They have a great referral program - if you register with my link, you get a discount and I earn rewards too! Here's the link: ${link}`,
      },
    });
  } catch (error) {
    console.error("Error generating mock sharing suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Error generating mock sharing suggestions",
      error: error.message,
    });
  }
};

// @desc    Generate follow-up message
// @route   POST /api/mock-ai/follow-up
// @access  Private
exports.generateFollowUp = async (req, res) => {
  try {
    const { referralId, type = "reminder" } = req.body;

    // Return mock follow-up message
    res.status(200).json({
      success: true,
      message: {
        subject: "A friendly reminder about your referral invitation",
        body: "Hi there,\n\nI just wanted to follow up on the referral invitation I sent you recently for [Business]. The offer is still available, and I thought you might be interested.\n\nIf you have any questions, feel free to ask!\n\nBest regards,\n[Your Name]",
      },
    });
  } catch (error) {
    console.error("Error generating mock follow-up message:", error);
    res.status(500).json({
      success: false,
      message: "Error generating mock follow-up message",
      error: error.message,
    });
  }
};

// @desc    Get recommendations
// @route   GET /api/mock-ai/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    // Return mock recommendations
    res.status(200).json({
      success: true,
      recommendations: [
        {
          type: "action",
          title: "Follow up with pending referrals",
          description:
            "You have 5 pending referrals that haven't converted yet. Consider sending a follow-up message to increase conversion rates.",
          priority: "high",
        },
        {
          type: "insight",
          title: "Email campaigns performing well",
          description:
            "Your email referral campaigns have a 25% higher conversion rate than social media campaigns. Consider focusing more on email referrals.",
          priority: "medium",
        },
        {
          type: "suggestion",
          title: "Increase reward value",
          description:
            "Campaigns with rewards valued at $25 or more have shown 40% better conversion rates than those with lower value rewards.",
          priority: "medium",
        },
        {
          type: "action",
          title: "Reactivate dormant customers",
          description:
            "You have 12 customers who haven't referred anyone in the last 3 months. Send them a special incentive to reactivate them.",
          priority: "low",
        },
      ],
    });
  } catch (error) {
    console.error("Error getting mock recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Error getting mock recommendations",
      error: error.message,
    });
  }
};

// @desc    Get chat response
// @route   POST /api/mock-ai/chat
// @access  Private
exports.getChatResponse = async (req, res) => {
  try {
    const { message } = req.body;

    // Return mock chat response
    res.status(200).json({
      success: true,
      response: {
        text: "I'd be happy to help you with that! The referral program offers rewards for both you and your friend when they sign up using your unique link. You'll receive your reward once they complete their first purchase. Is there anything specific you'd like to know about the program?",
        suggestions: [
          "How do I share my referral link?",
          "When will I receive my reward?",
          "What rewards are available?",
        ],
      },
    });
  } catch (error) {
    console.error("Error getting mock chat response:", error);
    res.status(500).json({
      success: false,
      message: "Error getting mock chat response",
      error: error.message,
    });
  }
};

// @desc    Generate email content
// @route   POST /api/mock-ai/email-content
// @access  Private
exports.generateEmailContent = async (req, res) => {
  try {
    const { customerId, purpose } = req.body;

    // Return mock email content
    res.status(200).json({
      success: true,
      content: {
        subject: "Welcome to our Referral Program!",
        body: "Dear [Customer],\n\nThank you for joining our referral program! We're excited to have you on board.\n\nHere's your unique referral link: [REFERRAL_LINK]\n\nShare this link with your friends and family, and when they sign up, you'll both receive rewards!\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe [Business] Team",
      },
    });
  } catch (error) {
    console.error("Error generating mock email content:", error);
    res.status(500).json({
      success: false,
      message: "Error generating mock email content",
      error: error.message,
    });
  }
};

// @desc    Analyze referral performance
// @route   POST /api/mock-ai/analyze-performance
// @access  Private
exports.analyzeReferralPerformance = async (req, res) => {
  try {
    // Return mock analysis
    res.status(200).json({
      success: true,
      analysis: {
        metrics: {
          totalReferrals: 125,
          conversionRate: 32.8,
          averageTimeToConversion: "3.5 days",
          topReferrers: [
            { name: "John Doe", count: 15 },
            { name: "Jane Smith", count: 12 },
            { name: "Bob Johnson", count: 8 },
          ],
        },
        trends: {
          weekly: [
            { period: "Week 1", referrals: 28, conversions: 8 },
            { period: "Week 2", referrals: 35, conversions: 12 },
            { period: "Week 3", referrals: 30, conversions: 10 },
            { period: "Week 4", referrals: 32, conversions: 11 },
          ],
          monthly: [
            { period: "Jan", referrals: 95, conversions: 30 },
            { period: "Feb", referrals: 110, conversions: 35 },
            { period: "Mar", referrals: 125, conversions: 41 },
          ],
        },
        strengths: [
          "Email campaigns have a 35% conversion rate, significantly above average",
          "Weekend referrals convert 20% better than weekday referrals",
          "Discount-based rewards perform 15% better than fixed-value rewards",
        ],
        weaknesses: [
          "Social media referrals have only a 18% conversion rate",
          "Average time to conversion is increasing month over month",
          "Mobile users have a 25% lower conversion rate than desktop users",
        ],
        recommendations: [
          "Increase email campaign frequency by 25%",
          "Optimize mobile experience to improve conversion rates",
          "Test higher value rewards for social media referrals",
          "Implement automated follow-up system for referrals older than 2 days",
        ],
      },
    });
  } catch (error) {
    console.error("Error analyzing mock referral performance:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing mock referral performance",
      error: error.message,
    });
  }
};

// @desc    Generate campaign ideas
// @route   POST /api/mock-ai/campaign-ideas
// @access  Private
exports.generateCampaignIdeas = async (req, res) => {
  try {
    // Return mock campaign ideas
    res.status(200).json({
      success: true,
      ideas: [
        {
          title: "Double Reward Weekend",
          description:
            "Offer double rewards for both referrer and referee for referrals that convert during weekends.",
          targetAudience: "Existing customers with high engagement",
          rewardStrategy: "Double the standard reward amount for both parties",
          expectedOutcome: "25% increase in weekend referral activity",
          implementationSteps: [
            "Configure special weekend reward multiplier",
            "Create email and notification campaign",
            "Highlight limited-time nature of the promotion",
          ],
        },
        {
          title: "Tiered Loyalty Referral Program",
          description:
            "Create a tiered system where customers earn increasingly valuable rewards as they make more successful referrals.",
          targetAudience: "Repeat customers and brand advocates",
          rewardStrategy:
            "Progressive rewards that increase in value with each successful referral",
          expectedOutcome:
            "40% increase in multiple referrals from the same customer",
          implementationSteps: [
            "Define 3-5 reward tiers with increasing value",
            "Create visual progress tracker for customers",
            "Send congratulatory messages when customers reach new tiers",
          ],
        },
        {
          title: "Social Media Sharing Contest",
          description:
            "Run a monthly contest where customers who share their referral link on social media are entered to win a premium prize.",
          targetAudience: "Social media active customers",
          rewardStrategy:
            "Standard referral rewards plus contest entries for social shares",
          expectedOutcome: "50% increase in social media referral link shares",
          implementationSteps: [
            "Create contest rules and prize structure",
            "Implement social sharing tracking",
            "Develop automated entry confirmation system",
          ],
        },
        {
          title: "New Product Early Access",
          description:
            "Offer early access to new products or features for customers who successfully refer a certain number of friends.",
          targetAudience: "Product enthusiasts and early adopters",
          rewardStrategy:
            "Exclusive access and special status rather than monetary rewards",
          expectedOutcome: "30% increase in referrals from product enthusiasts",
          implementationSteps: [
            "Coordinate with product team on early access capabilities",
            "Create exclusive branding for early access members",
            "Develop communication plan for early access opportunities",
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Error generating mock campaign ideas:", error);
    res.status(500).json({
      success: false,
      message: "Error generating mock campaign ideas",
      error: error.message,
    });
  }
};

// @desc    Optimize reward strategy
// @route   POST /api/mock-ai/optimize-rewards
// @access  Private
exports.optimizeRewardStrategy = async (req, res) => {
  try {
    // Return mock optimized reward strategy
    res.status(200).json({
      success: true,
      strategy: {
        recommendations: [
          {
            type: "discount",
            value: "25%",
            expectedImpact: "35% increase in conversion rate",
            reasoning:
              "Historical data shows that discounts of 25% or higher have the best conversion rates for your industry.",
          },
          {
            type: "dual_reward",
            value: "$20 for both parties",
            expectedImpact: "40% increase in referral sharing",
            reasoning:
              "Equal rewards for both referrer and referee have shown the highest engagement rates.",
          },
          {
            type: "tiered_rewards",
            value: "Progressive rewards from $10 to $50",
            expectedImpact: "60% increase in multiple referrals",
            reasoning:
              "Tiered rewards encourage customers to make multiple referrals over time.",
          },
        ],
        optimalTiming: {
          dayOfWeek: "Friday",
          timeOfDay: "Evening",
          reasoning:
            "Referrals sent on Friday evenings have 28% higher open rates and 15% higher conversion rates.",
        },
      },
    });
  } catch (error) {
    console.error("Error optimizing mock reward strategy:", error);
    res.status(500).json({
      success: false,
      message: "Error optimizing mock reward strategy",
      error: error.message,
    });
  }
};
