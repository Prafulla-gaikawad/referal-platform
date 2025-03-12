const Business = require("../models/Business");
const Customer = require("../models/Customer");
const Campaign = require("../models/Campaign");
const Referral = require("../models/Referral");
const Reward = require("../models/Reward");
const Analytics = require("../models/Analytics");
const { openai, detectTopic, getRandomResponse } = require("../config/openai");
const config = require("../config/config");
const mockAIController = require("./mockAIController");

// Helper function to handle OpenAI errors
const handleOpenAIError = (error, req, res, mockFunction) => {
  console.error(`OpenAI API Error: ${error.message}`);

  // If it's a model not found error or API key issue, use mock data
  if (
    error.code === "model_not_found" ||
    error.code === "invalid_api_key" ||
    !config.openaiApiKey
  ) {
    console.log("Using mock AI controller as fallback");
    return mockFunction(req, res);
  }

  // For other errors, return error response
  return res.status(500).json({
    success: false,
    message: "Error with AI service",
    error: error.message,
  });
};

// @desc    Generate sharing suggestions
// @route   POST /api/ai/sharing-suggestions
// @access  Private
exports.generateSharingSuggestions = async (req, res) => {
  try {
    const { campaignId, customerId, referralLink } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get campaign details
    const campaign = await Campaign.findOne({
      _id: campaignId,
      business: business._id,
    });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Get customer details
    const customer = await Customer.findOne({
      _id: customerId,
      business: business._id,
    });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    try {
      // Use OpenAI to generate personalized sharing suggestions
      const prompt = `
        Generate personalized sharing suggestions for a referral campaign with the following details:
        
        Business Name: ${business.name}
        Business Industry: ${business.industry || "Not specified"}
        Campaign Name: ${campaign.name}
        Campaign Description: ${campaign.description || "Not specified"}
        Campaign Reward: ${campaign.reward?.description || "Not specified"}
        Customer Name: ${customer.name}
        Referral Link: ${referralLink}
        
        Generate 5 different sharing suggestions:
        1. A short SMS message (max 160 characters)
        2. An email subject line and body
        3. A Facebook post
        4. A Twitter/X post (max 280 characters)
        5. A WhatsApp message
        
        Each message should be personalized, mention the business name, briefly explain the referral program, 
        and include the referral link. Make it clear that the recipient should click this link to register.
        
        Format the response as a JSON object with keys: sms, email (with subject and body), facebook, twitter, whatsapp.
      `;

      const completion = await openai.chat.completions.create({
        model: config.ai.model,
        messages: [
          {
            role: "system",
            content:
              "You are a marketing expert specializing in referral programs.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      // Parse the AI response
      const aiResponse = JSON.parse(completion.choices[0].message.content);

      // Return the suggestions
      res.status(200).json({
        success: true,
        suggestions: aiResponse,
      });
    } catch (error) {
      // Use mock controller as fallback
      req.body.referralLink = referralLink;
      return handleOpenAIError(
        error,
        req,
        res,
        mockAIController.generateSharingSuggestions
      );
    }
  } catch (error) {
    console.error("Error generating sharing suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Error generating sharing suggestions",
      error: error.message,
    });
  }
};

// @desc    Generate follow-up message
// @route   POST /api/ai/follow-up
// @access  Private
exports.generateFollowUp = async (req, res) => {
  try {
    const { referralId, type = "reminder" } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get referral details
    const referral = await Referral.findOne({
      _id: referralId,
      business: business._id,
    }).populate("campaign");

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Use OpenAI to generate personalized follow-up message
    const prompt = `
      Generate a personalized follow-up ${type} message for a referral with the following details:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Campaign Name: ${referral.campaign?.name || "Not specified"}
      Campaign Description: ${referral.campaign?.description || "Not specified"}
      Referral Status: ${referral.status}
      Customer Name: ${referral.customerName || "Not specified"}
      Customer Email: ${referral.customerEmail || "Not specified"}
      Referrer Name: ${referral.referrerName || "Not specified"}
      
      The follow-up type is: ${type} (initial, reminder, or final)
      
      Generate an email subject line and body that is personalized, mentions the business name,
      explains the referral program status, and includes a clear call to action.
      
      Format the response as a JSON object with keys: subject, body.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a customer relationship expert specializing in referral programs.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the follow-up message
    res.status(200).json({
      success: true,
      message: aiResponse,
    });
  } catch (error) {
    console.error("Error generating follow-up message:", error);
    res.status(500).json({
      success: false,
      message: "Error generating follow-up message",
      error: error.message,
    });
  }
};

// @desc    Get recommendations
// @route   GET /api/ai/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get pending referrals
    const pendingReferrals = await Referral.find({
      business: business._id,
      status: "pending",
    }).countDocuments();

    // Get clicked referrals
    const clickedReferrals = await Referral.find({
      business: business._id,
      status: "clicked",
    }).countDocuments();

    // Get inactive campaigns
    const inactiveCampaigns = await Campaign.find({
      business: business._id,
      status: "inactive",
    }).countDocuments();

    // Get top customers
    const topCustomers = await Customer.aggregate([
      { $match: { business: business._id } },
      {
        $lookup: {
          from: "referrals",
          localField: "_id",
          foreignField: "referrerId",
          as: "referrals",
        },
      },
      { $addFields: { referralCount: { $size: "$referrals" } } },
      { $sort: { referralCount: -1 } },
      { $limit: 5 },
    ]);

    // Get recent analytics
    const recentAnalytics = await Analytics.find({
      business: business._id,
    })
      .sort({ date: -1 })
      .limit(30);

    // Use OpenAI to generate actionable recommendations
    const analyticsData = recentAnalytics.map((a) => ({
      date: a.date,
      referrals: a.referrals,
      conversions: a.conversions,
      revenue: a.revenue,
    }));

    const prompt = `
      Generate actionable recommendations for a referral program based on the following data:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Pending Referrals: ${pendingReferrals}
      Clicked Referrals: ${clickedReferrals}
      Inactive Campaigns: ${inactiveCampaigns}
      Top Customers: ${JSON.stringify(
        topCustomers.map((c) => ({ name: c.name, referrals: c.referralCount }))
      )}
      Recent Analytics: ${JSON.stringify(analyticsData)}
      
      Generate 5 specific, actionable recommendations to improve the referral program performance.
      Each recommendation should have:
      1. A clear title
      2. A brief explanation of the recommendation
      3. Expected impact
      4. Implementation difficulty (Easy, Medium, Hard)
      
      Format the response as a JSON array of recommendation objects, each with title, explanation, impact, and difficulty properties.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a business analytics expert specializing in referral programs.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the recommendations with context data
    res.status(200).json({
      success: true,
      data: {
        pendingReferrals,
        clickedReferrals,
        inactiveCampaigns,
        topCustomers: topCustomers.map((c) => ({
          id: c._id,
          name: c.name,
          email: c.email,
          referrals: c.referralCount,
        })),
        recommendations: aiResponse.recommendations || aiResponse,
      },
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Error getting recommendations",
      error: error.message,
    });
  }
};

// @desc    Get chat response
// @route   POST /api/ai/chat
// @access  Public
exports.getChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "No prompt provided",
      });
    }

    // Detect topic and get random response
    const topic = detectTopic(prompt);
    const suggestion = getRandomResponse(topic);

    // Wait 3 seconds before sending response
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Send single response with the random message
    return res.status(200).json({
      success: true,
      loading: false,
      message: suggestion,
      data: {
        response: suggestion,
        topic: topic,
      },
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Generate email content
// @route   POST /api/ai/email-content
// @access  Private
exports.generateEmailContent = async (req, res) => {
  try {
    const { customerId, purpose, additionalContext = {} } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get customer details
    const customer = await Customer.findOne({
      _id: customerId,
      business: business._id,
    });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Use OpenAI to generate personalized email content
    const prompt = `
      Generate personalized email content for a customer with the following details:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Customer Name: ${customer.name}
      Customer Email: ${customer.email}
      Email Purpose: ${purpose}
      Additional Context: ${JSON.stringify(additionalContext)}
      
      Generate an email subject line and body that is personalized, professional, and engaging.
      The email should be appropriate for the specified purpose (${purpose}).
      
      Format the response as a JSON object with keys: subject, body.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are an email marketing expert specializing in customer communications.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the email content
    res.status(200).json({
      success: true,
      content: aiResponse,
    });
  } catch (error) {
    console.error("Error generating email content:", error);
    res.status(500).json({
      success: false,
      message: "Error generating email content",
      error: error.message,
    });
  }
};

// @desc    Analyze referral performance
// @route   POST /api/ai/analyze-performance
// @access  Private
exports.analyzeReferralPerformance = async (req, res) => {
  try {
    const { campaignId, dateRange } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Prepare query for analytics
    const query = { business: business._id };

    if (dateRange) {
      query.date = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate),
      };
    }

    // Get analytics data
    const analyticsData = await Analytics.find(query).sort({ date: 1 });

    // Get campaign data if specified
    let campaignData = null;
    if (campaignId) {
      const campaign = await Campaign.findOne({
        _id: campaignId,
        business: business._id,
      });

      if (campaign) {
        // Get referrals for this campaign
        const referrals = await Referral.find({
          campaign: campaignId,
          business: business._id,
        });

        campaignData = {
          campaign,
          referrals,
        };
      }
    }

    // Use OpenAI to analyze performance
    const prompt = `
      Analyze the referral program performance based on the following data:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Analytics Data: ${JSON.stringify(
        analyticsData.map((a) => ({
          date: a.date,
          referrals: a.referrals,
          conversions: a.conversions,
          revenue: a.revenue,
        }))
      )}
      ${
        campaignData
          ? `Campaign Data: ${JSON.stringify({
              name: campaignData.campaign.name,
              description: campaignData.campaign.description,
              referrals: campaignData.referrals.length,
              conversions: campaignData.referrals.filter(
                (r) => r.status === "approved"
              ).length,
            })}`
          : ""
      }
      
      Provide a comprehensive analysis including:
      1. Key performance metrics and trends
      2. Conversion rate analysis
      3. Revenue impact
      4. Areas of strength
      5. Areas for improvement
      6. Specific, actionable recommendations
      
      Format the response as a JSON object with sections for metrics, trends, strengths, weaknesses, and recommendations.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a business analytics expert specializing in referral programs.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the analysis
    res.status(200).json({
      success: true,
      analysis: aiResponse,
    });
  } catch (error) {
    console.error("Error analyzing referral performance:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing referral performance",
      error: error.message,
    });
  }
};

// @desc    Generate campaign ideas
// @route   POST /api/ai/campaign-ideas
// @access  Private
exports.generateCampaignIdeas = async (req, res) => {
  try {
    const { parameters = {} } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get past campaigns
    const pastCampaigns = await Campaign.find({
      business: business._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Use OpenAI to generate campaign ideas
    const prompt = `
      Generate creative referral campaign ideas for a business with the following details:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Business Description: ${business.description || "Not specified"}
      Past Campaigns: ${JSON.stringify(
        pastCampaigns.map((c) => ({
          name: c.name,
          description: c.description,
          reward: c.reward,
        }))
      )}
      Parameters: ${JSON.stringify(parameters)}
      
      Generate 5 unique campaign ideas. Each idea should include:
      1. Campaign name
      2. Campaign description
      3. Target audience
      4. Reward structure
      5. Sharing incentives
      6. Expected outcomes
      7. Implementation steps
      
      Format the response as a JSON array of campaign idea objects.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a marketing expert specializing in referral programs and campaign design.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the campaign ideas
    res.status(200).json({
      success: true,
      ideas: aiResponse.ideas || aiResponse,
    });
  } catch (error) {
    console.error("Error generating campaign ideas:", error);
    res.status(500).json({
      success: false,
      message: "Error generating campaign ideas",
      error: error.message,
    });
  }
};

// @desc    Optimize reward strategy
// @route   POST /api/ai/optimize-rewards
// @access  Private
exports.optimizeRewardStrategy = async (req, res) => {
  try {
    const { parameters = {} } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get past rewards
    const pastRewards = await Reward.find({
      business: business._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get referral conversion data
    const referrals = await Referral.find({
      business: business._id,
    }).populate("campaign");

    // Calculate conversion rates by reward type
    const rewardPerformance = {};
    referrals.forEach((referral) => {
      if (referral.campaign && referral.campaign.reward) {
        const rewardType = referral.campaign.reward.type;
        if (!rewardPerformance[rewardType]) {
          rewardPerformance[rewardType] = {
            total: 0,
            conversions: 0,
          };
        }
        rewardPerformance[rewardType].total++;
        if (referral.status === "approved") {
          rewardPerformance[rewardType].conversions++;
        }
      }
    });

    // Calculate conversion rates
    Object.keys(rewardPerformance).forEach((key) => {
      const data = rewardPerformance[key];
      data.conversionRate =
        data.total > 0 ? (data.conversions / data.total) * 100 : 0;
    });

    // Use OpenAI to optimize reward strategy
    const prompt = `
      Optimize the reward strategy for a referral program based on the following data:
      
      Business Name: ${business.name}
      Business Industry: ${business.industry || "Not specified"}
      Past Rewards: ${JSON.stringify(
        pastRewards.map((r) => ({
          type: r.type,
          value: r.value,
          status: r.status,
        }))
      )}
      Reward Performance: ${JSON.stringify(rewardPerformance)}
      Parameters: ${JSON.stringify(parameters)}
      
      Provide an optimized reward strategy including:
      1. Recommended reward types and values
      2. Tiered reward structure (if applicable)
      3. Reward distribution strategy
      4. Expected impact on conversion rates
      5. Implementation recommendations
      
      Format the response as a JSON object with sections for recommendations, structure, distribution, impact, and implementation.
    `;

    const completion = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a rewards program expert specializing in optimizing referral incentives.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Return the optimized strategy
    res.status(200).json({
      success: true,
      strategy: aiResponse,
    });
  } catch (error) {
    console.error("Error optimizing reward strategy:", error);
    res.status(500).json({
      success: false,
      message: "Error optimizing reward strategy",
      error: error.message,
    });
  }
};
