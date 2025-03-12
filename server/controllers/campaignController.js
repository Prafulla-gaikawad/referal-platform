const Campaign = require("../models/Campaign");
const Business = require("../models/Business");
const Customer = require("../models/Customer");

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      task,
      referrerReward,
      refereeReward,
      startDate,
      endDate,
      targetAudience,
      conversionCriteria,
      customConversionDetails,
      landingPage,
      sharingOptions,
      defaultMessage,
      followUpSettings,
    } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business profile not found. Please create a business profile first.",
      });
    }

    // Create campaign
    const campaign = await Campaign.create({
      business: business._id,
      name,
      description,
      type,
      task,
      referrerReward,
      refereeReward,
      startDate,
      endDate,
      targetAudience,
      conversionCriteria,
      customConversionDetails,
      landingPage,
      sharingOptions,
      defaultMessage,
      followUpSettings,
    });

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all campaigns for a business
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get campaigns
    const campaigns = await Campaign.find({ business: business._id }).sort(
      "-createdAt"
    );

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single campaign
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaign = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get campaign
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find campaign
    let campaign = await Campaign.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Update campaign
    campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find campaign
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Delete campaign
    await campaign.remove();

    res.status(200).json({
      success: true,
      message: "Campaign deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle campaign active status
// @route   PUT /api/campaigns/:id/toggle
// @access  Private
exports.toggleCampaignStatus = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find campaign
    let campaign = await Campaign.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Toggle active status
    campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { active: !campaign.active },
      { new: true }
    );

    res.status(200).json({
      success: true,
      active: campaign.active,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get campaign statistics
// @route   GET /api/campaigns/:id/stats
// @access  Private
exports.getCampaignStats = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find campaign
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      statistics: campaign.statistics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get active campaigns for customers
// @route   GET /api/campaigns/active
// @access  Private (Customer)
exports.getActiveCampaigns = async (req, res) => {
  try {
    // Find customer by user ID
    const customer = await Customer.findOne({ user: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Get active campaigns for the customer's business
    const campaigns = await Campaign.find({
      business: customer.business,
      status: "active",
      endDate: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error("Error fetching active campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active campaigns",
      error: error.message,
    });
  }
};

// @desc    Get campaign details for public access
// @route   GET /api/campaigns/:id/public
// @access  Public
exports.getPublicCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select("name description type referrerReward refereeReward business")
      .populate("business", "name industry description");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check if campaign is active
    const now = new Date();
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return res.status(400).json({
        success: false,
        message: "This campaign has ended",
      });
    }

    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return res.status(400).json({
        success: false,
        message: "This campaign has not started yet",
      });
    }

    if (!campaign.isActive) {
      return res.status(400).json({
        success: false,
        message: "This campaign is not active",
      });
    }

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Error fetching public campaign:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching campaign details",
      error: error.message,
    });
  }
};
