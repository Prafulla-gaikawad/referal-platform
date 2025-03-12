const OpenAI = require("openai");

// Fallback responses for different topics
const fallbackResponses = {
  customerAcquisition: [
    `Here's how to boost your customer acquisition:
• Create personalized landing pages for different referral links - this typically increases conversion rates by 35%
• Implement an early-bird referral bonus system with unique tracking links - offering increased rewards for first 50 referrals boosts participation by 40%
• Add social proof elements like testimonials and real-time referral activity to your sharing pages - this builds trust and increases conversions by 45%`,

    `Tips for acquiring more customers through referrals:
• Set up automated onboarding sequences for new referrers with pre-populated sharing links - improves activation rates by 60%
• Integrate with social networks to enable one-click sharing of referral links - increases participation by 55%
• Offer special welcome bonuses for first-time referrers who share their links - boosts program adoption by 45%`,

    `Proven customer acquisition strategies:
• Implement mobile-first referral experiences with QR codes that link directly to your referral page - converts 25% better than desktop
• Add video testimonials to referral emails with prominent call-to-action links - increases click-through rates by 65%
• Create a tiered reward system for repeat referrers based on link click performance - improves long-term engagement by 40%`,
  ],

  campaignOptimization: [
    `Optimize your referral campaigns with these strategies:
• Launch multi-channel campaigns with platform-specific referral links across email, SMS, and social - shows 3x better results
• Create limited-time flash campaigns with countdown timers on referral landing pages - generates 45% more urgency
• Implement gamification with progress bars and badges for referral link shares - retains participants 3x longer`,

    `Key campaign optimization techniques:
• Enable personalized referral messages with auto-inserted sharing links - converts 50% better than generic templates
• Add visual progress tracking for referral link clicks and conversions - increases completion rates by 28%
• Implement A/B testing for referral landing pages - can improve conversion rates by up to 35%`,

    `Campaign performance boosters:
• Design mobile-first campaign flows with tap-to-share referral links - increases engagement by 40%
• Create seasonal themed promotions with custom referral link landing pages - lifts participation by 25%
• Set up automated follow-up sequences for referral links that were clicked but not converted - improves conversion rates by 30%`,
  ],

  rewardStrategy: [
    `Effective reward strategies for referral programs:
• Implement two-sided rewards triggered by referral link conversions - increases completion rates by 70%
• Offer experiential rewards like VIP access for top referral link sharers - shows 40% higher engagement than cash
• Create progressive reward tiers based on referral link performance - increases repeat referrals by 85%`,

    `Optimize your reward structure:
• Provide instant gratification rewards as soon as referral links are clicked - converts 3x better than delayed rewards
• Offer choice-based reward options for successful referral link conversions - shows 50% higher satisfaction rates
• Add milestone-based bonus rewards for referral link sharing milestones - improves long-term engagement by 45%`,

    `Strategic reward planning:
• Implement community-based group rewards when referral link sharing reaches thresholds - increases program virality by 65%
• Create early-bird reward bonuses for the first wave of referral link shares - boosts initial adoption by 55%
• Set up tiered reward structures based on referral link conversion quality - increases participant retention by 40%`,
  ],

  marketingStrategy: [
    `Effective marketing strategies for referral programs:
• Focus on email referral campaigns with prominent sharing links - shows 40% higher ROI than social media
• Launch seasonal referral promotions with themed landing pages - increases participation by 35%
• Encourage user-generated content sharing alongside referral links - boosts credibility by 50%`,

    `Marketing optimization techniques:
• Implement cross-channel tracking for referral links - improves attribution by 60%
• Create targeted referral segments with customized sharing links - performs 45% better than generic campaigns
• Partner with micro-influencers to amplify referral link reach - amplifies reach by 75%`,

    `Strategic marketing approaches:
• Develop comprehensive content marketing that educates on referral benefits - increases program understanding by 40%
• Optimize social media integration with platform-specific sharing links - boosts visibility by 55%
• Create automated email nurture sequences with progressive referral link CTAs - improves conversion by 35%`,
  ],

  performance: [
    `Advanced Performance Optimization Tactics:
• Implement smart segmentation for referral targeting - increases conversion rates by 85%
• Use predictive analytics to identify high-potential referrers - improves program efficiency by 70%
• Set up automated performance alerts for key metrics - enables real-time optimization and 55% faster response to issues`,

    `Data-Driven Performance Strategies:
• Deploy machine learning for referral pattern analysis - identifies successful patterns with 75% accuracy
• Implement dynamic reward adjustments based on performance - increases program ROI by 65%
• Create personalized referrer dashboards with AI insights - boosts engagement by 90%`,

    `Strategic Performance Enhancements:
• Use behavioral analytics to optimize referral journey - reduces drop-off rates by 60%
• Implement multi-touch attribution modeling - improves campaign effectiveness by 80%
• Set up automated A/B testing cycles - continuously improves conversion rates by 45%`,

    `Performance Optimization Framework:
• Deploy real-time analytics dashboard - enables 40% faster decision making
• Implement cohort-based performance tracking - reveals optimization opportunities with 70% accuracy
• Use AI-powered conversion prediction - helps prevent drop-offs with 65% accuracy`,

    `Advanced Metrics Optimization:
• Set up customer lifetime value tracking - improves long-term program ROI by 85%
• Implement viral coefficient monitoring - helps achieve 3x program growth
• Use advanced funnel visualization - identifies bottlenecks with 90% accuracy`,
  ],

  generalTips: [
    `General referral program best practices:
• Add clear progress tracking with visual indicators - increases completion rates by 40%
• Implement automated follow-up sequences - boosts conversion by 30%
• Optimize for mobile devices - shows 2x higher submission rates`,

    `Essential program improvements:
• Display social proof elements - increases trust by 45%
• Create educational content and guides - improves engagement by 25%
• Add one-click sharing options - increases referral sends by 50%`,

    `Key program optimization tips:
• Send personalized thank-you messages - improves retention by 35%
• Provide clear program rules - reduces support queries by 40%
• Implement milestone notifications - increases program completion by 30%`,
  ],
};

function getRandomResponse(topic) {
  // Get responses for the specific topic or general tips
  const responses = fallbackResponses[topic] || fallbackResponses.generalTips;

  // Get a random response
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

function detectTopic(message) {
  const keywords = {
    customerAcquisition: [
      "customer",
      "acquisition",
      "lead",
      "prospect",
      "growth",
      "new customers",
      "customer base",
      "expand",
      "grow",
      "acquire",
      "referral link",
      "sharing link",
      "invite link",
    ],
    campaignOptimization: [
      "campaign",
      "optimization",
      "improve",
      "performance",
      "tracking",
      "optimize",
      "efficiency",
      "campaign performance",
      "results",
      "metrics",
      "link tracking",
      "click rates",
      "conversion tracking",
    ],
    rewardStrategy: [
      "reward",
      "incentive",
      "bonus",
      "points",
      "benefits",
      "perks",
      "compensation",
      "recognition",
      "prizes",
      "gifts",
      "link conversion",
      "sharing rewards",
    ],
    marketingStrategy: [
      "marketing",
      "strategy",
      "promotion",
      "advertising",
      "brand",
      "outreach",
      "awareness",
      "visibility",
      "presence",
      "reach",
      "social sharing",
      "link distribution",
      "sharing channels",
    ],
    performance: [
      "metrics",
      "analytics",
      "data",
      "results",
      "statistics",
      "numbers",
      "performance",
      "tracking",
      "measurement",
      "insights",
      "link clicks",
      "link performance",
      "conversion rate",
    ],
  };

  // Convert message to lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();

  // Score each topic based on keyword matches
  const scores = {};
  for (const [topic, topicKeywords] of Object.entries(keywords)) {
    scores[topic] = topicKeywords.filter((keyword) =>
      lowerMessage.includes(keyword)
    ).length;
  }

  // Find the topic with the highest score
  const maxScore = Math.max(...Object.values(scores));
  const bestTopic = Object.entries(scores).find(
    ([_, score]) => score === maxScore
  )?.[0];

  // Return the best matching topic or generalTips if no strong match
  return maxScore > 0 ? bestTopic : "generalTips";
}

function validateApiKey(apiKey) {
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  if (!apiKey.startsWith("sk-")) {
    throw new Error("Invalid OpenAI API key format");
  }
}

// Initialize OpenAI with API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;

try {
  validateApiKey(apiKey);

  const openai = new OpenAI({
    apiKey: apiKey,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  });

  module.exports = { openai, detectTopic, getRandomResponse };
} catch (error) {
  console.error("OpenAI Configuration Error:", error.message);

  // Export mock client and helper functions
  module.exports = {
    openai: {
      chat: {
        completions: {
          create: async ({ messages }) => {
            throw new Error("OpenAI service unavailable");
          },
        },
      },
    },
    detectTopic,
    getRandomResponse,
  };
}
