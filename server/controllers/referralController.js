const Referral = require("../models/Referral");
const Campaign = require("../models/Campaign");
const Customer = require("../models/Customer");
const Business = require("../models/Business");
const Reward = require("../models/Reward");
const nodemailer = require("nodemailer");

// @desc    Create a new referral
// @route   POST /api/referrals
// @access  Private
exports.createReferral = async (req, res) => {
  try {
    const {
      campaignId,
      referrerId,
      refereeName,
      refereeEmail,
      refereePhone,
      sharingMethod,
    } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Check if campaign exists
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

    // Check if referrer exists
    const referrer = await Customer.findOne({
      _id: referrerId,
      business: business._id,
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referrer not found",
      });
    }

    // Check if referee already exists as a customer
    const existingReferee = await Customer.findOne({
      email: refereeEmail,
      business: business._id,
    });

    // Generate referral link and code
    const referralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const referralLink = `https://helpful-cajeta-f1a22b.netlify.app/refer/${referrerId}/${campaignId}`;

    // Create shareable links for different platforms
    const shareableLinks = {
      default: referralLink,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        referralLink
      )}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        referralLink
      )}&text=${encodeURIComponent(
        `Check out this special offer from ${business.name}!`
      )}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(
        `Check out this special offer from ${business.name}: ${referralLink}`
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        referralLink
      )}`,
      email: `mailto:?subject=${encodeURIComponent(
        `Special offer from ${business.name}`
      )}&body=${encodeURIComponent(
        `I thought you might be interested in this offer: ${referralLink}`
      )}`,
    };

    // Create referral
    const referral = await Referral.create({
      campaign: campaignId,
      business: business._id,
      referrer: referrerId,
      referee: {
        name: refereeName,
        email: refereeEmail,
        phone: refereePhone,
        convertedToCustomer: existingReferee ? true : false,
        customerId: existingReferee ? existingReferee._id : null,
      },
      referralLink,
      referralCode,
      sharingMethod,
    });

    // Update campaign statistics
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: {
        "statistics.totalReferrals": 1,
        "statistics.pendingReferrals": 1,
      },
    });

    // Update referrer statistics
    await Customer.findByIdAndUpdate(referrerId, {
      $inc: {
        "referralStats.totalReferrals": 1,
        "referralStats.pendingReferrals": 1,
      },
    });

    // Send email to referee if email is provided
    if (refereeEmail) {
      try {
        // Create email transporter
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Prepare email content
        const subject =
          campaign.defaultMessage?.email?.subject ||
          `${referrer.name} has referred you to ${business.businessName}`;
        const body =
          campaign.defaultMessage?.email?.body ||
          `Hello ${refereeName},\n\n${referrer.name} thinks you might be interested in ${business.businessName}.\n\nClick the link below to learn more and claim your special offer:\n${referralLink}\n\nThank you!`;

        // Send email
        await transporter.sendMail({
          from: `${business.businessName} <${process.env.EMAIL_USER}>`,
          to: refereeEmail,
          subject,
          text: body,
        });
      } catch (error) {
        console.error("Email sending error:", error);
      }
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: referral,
      shareableLinks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all referrals for a business
// @route   GET /api/referrals
// @access  Private
exports.getReferrals = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Referral.countDocuments({ business: business._id });

    // Filter options
    let query = { business: business._id };

    if (req.query.campaign) {
      query.campaign = req.query.campaign;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.referrer) {
      query.referrer = req.query.referrer;
    }

    // Get referrals
    const referrals = await Referral.find(query)
      .sort(req.query.sort || "-createdAt")
      .skip(startIndex)
      .limit(limit)
      .populate("campaign", "name type referrerReward refereeReward")
      .populate("referrer", "name email phone")
      .populate("referee.customerId", "name email phone")
      .populate("business", "name");

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: referrals.length,
      pagination,
      total,
      referrals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single referral
// @route   GET /api/referrals/:id
// @access  Private
exports.getReferral = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get referral
    const referral = await Referral.findOne({
      _id: req.params.id,
      business: business._id,
    })
      .populate("campaign", "name type referrerReward refereeReward")
      .populate("referrer", "name email phone");

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    res.status(200).json({
      success: true,
      referral,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update referral status
// @route   PUT /api/referrals/:id/status
// @access  Private
exports.updateReferralStatus = async (req, res) => {
  try {
    const { status, conversionDetails } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "clicked",
      "converted",
      "rewarded",
      "expired",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find referral
    let referral = await Referral.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Get campaign
    const campaign = await Campaign.findById(referral.campaign);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Update campaign statistics based on status change
    const updateCampaignStats = {};
    const updateReferrerStats = {};

    // Decrement old status count
    if (referral.status === "pending") {
      updateCampaignStats["statistics.pendingReferrals"] = -1;
      updateReferrerStats["referralStats.pendingReferrals"] = -1;
    } else if (referral.status === "clicked") {
      updateCampaignStats["statistics.clickedReferrals"] = -1;
    } else if (referral.status === "converted") {
      updateCampaignStats["statistics.successfulReferrals"] = -1;
      updateReferrerStats["referralStats.successfulReferrals"] = -1;
    }

    // Increment new status count
    if (status === "pending") {
      updateCampaignStats["statistics.pendingReferrals"] = 1;
      updateReferrerStats["referralStats.pendingReferrals"] = 1;
    } else if (status === "clicked") {
      updateCampaignStats["statistics.clickedReferrals"] = 1;
    } else if (status === "converted") {
      updateCampaignStats["statistics.successfulReferrals"] = 1;
      updateReferrerStats["referralStats.successfulReferrals"] = 1;
    } else if (status === "rewarded") {
      updateCampaignStats["statistics.totalRewards"] = 1;
      updateReferrerStats["referralStats.totalRewardsEarned"] = 1;
    }

    // Update campaign statistics
    await Campaign.findByIdAndUpdate(referral.campaign, {
      $inc: updateCampaignStats,
    });

    // Update referrer statistics
    await Customer.findByIdAndUpdate(referral.referrer, {
      $inc: updateReferrerStats,
    });

    // Update referral
    const updateData = { status };

    if (status === "converted" && conversionDetails) {
      updateData.conversionDetails = {
        ...conversionDetails,
        convertedAt: Date.now(),
      };
    }

    referral = await Referral.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // If status is converted, create rewards
    if (status === "converted") {
      // Create referrer reward
      await Reward.create({
        business: business._id,
        campaign: campaign._id,
        referral: referral._id,
        recipient: referral.referrer,
        recipientType: "referrer",
        type: campaign.referrerReward.type,
        value: campaign.referrerReward.value,
        description: campaign.referrerReward.description,
        status: "issued",
        issuedAt: Date.now(),
      });

      // Create referee reward if they are a customer
      if (referral.referee.customerId) {
        await Reward.create({
          business: business._id,
          campaign: campaign._id,
          referral: referral._id,
          recipient: referral.referee.customerId,
          recipientType: "referee",
          type: campaign.refereeReward.type,
          value: campaign.refereeReward.value,
          description: campaign.refereeReward.description,
          status: "issued",
          issuedAt: Date.now(),
        });
      }
    }

    res.status(200).json({
      success: true,
      referral,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Track referral click
// @route   PUT /api/referrals/:id/click
// @access  Public
exports.trackReferralClick = async (req, res) => {
  try {
    console.log("Tracking referral click for ID:", req.params.id);

    // Find referral by ID, code, or campaign ID
    let referral;
    const id = req.params.id;

    if (id.length === 24) {
      // Try to find by ID first
      console.log("Attempting to find referral by ID:", id);
      referral = await Referral.findById(id);

      // If not found, try to find by campaign ID
      if (!referral) {
        console.log("Referral not found by ID, trying campaign ID:", id);
        // Find the most recent referral for this campaign
        referral = await Referral.findOne({ campaign: id }).sort({
          createdAt: -1,
        });

        if (referral) {
          console.log("Found referral by campaign ID:", referral._id);
        }
      } else {
        console.log("Found referral by ID:", referral._id);
      }
    } else {
      // Try to find by referral code
      console.log("Attempting to find referral by code:", id);
      referral = await Referral.findOne({ referralCode: id });

      if (referral) {
        console.log("Found referral by code:", referral._id);
      }
    }

    if (!referral) {
      console.log("No referral found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Check if referral is expired
    if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
      console.log("Referral has expired:", referral._id);
      return res.status(400).json({
        success: false,
        message: "Referral has expired",
      });
    }

    // Update referral
    console.log("Updating referral click count for:", referral._id);
    referral = await Referral.findByIdAndUpdate(
      referral._id,
      {
        $inc: { clickCount: 1 },
        lastClickedAt: Date.now(),
        status: referral.status === "pending" ? "clicked" : referral.status,
      },
      { new: true }
    );

    // Update campaign statistics if status changed
    if (referral.status === "clicked") {
      console.log("Updating campaign statistics for:", referral.campaign);
      await Campaign.findByIdAndUpdate(referral.campaign, {
        $inc: {
          "statistics.pendingReferrals": -1,
          "statistics.clickedReferrals": 1,
        },
      });
    }

    console.log("Referral click tracked successfully:", referral._id);
    res.status(200).json({
      success: true,
      referral: {
        _id: referral._id,
        referralCode: referral.referralCode,
        clickCount: referral.clickCount,
        lastClickedAt: referral.lastClickedAt,
        status: referral.status,
      },
    });
  } catch (error) {
    console.error("Error tracking referral click:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking referral click",
      error: error.message,
    });
  }
};

// @desc    Convert referee to customer
// @route   POST /api/referrals/:id/convert
// @access  Private
exports.convertReferee = async (req, res) => {
  try {
    const { customerData, conversionDetails } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find referral
    let referral = await Referral.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Check if referee is already converted
    if (referral.referee.convertedToCustomer) {
      return res.status(400).json({
        success: false,
        message: "Referee is already converted to a customer",
      });
    }

    // Create customer from referee
    const customer = await Customer.create({
      business: business._id,
      name: customerData.name || referral.referee.name,
      email: customerData.email || referral.referee.email,
      phone: customerData.phone || referral.referee.phone,
      address: customerData.address,
      source: "referral",
      referredBy: referral.referrer,
      tags: customerData.tags || ["referred"],
      notes: customerData.notes,
    });

    // Update referral
    referral = await Referral.findByIdAndUpdate(
      req.params.id,
      {
        "referee.convertedToCustomer": true,
        "referee.customerId": customer._id,
        status: "converted",
        conversionDetails: {
          ...conversionDetails,
          convertedAt: Date.now(),
        },
      },
      { new: true }
    );

    // Update campaign statistics
    await Campaign.findByIdAndUpdate(referral.campaign, {
      $inc: {
        "statistics.pendingReferrals": -1,
        "statistics.successfulReferrals": 1,
      },
    });

    // Update referrer statistics
    await Customer.findByIdAndUpdate(referral.referrer, {
      $inc: {
        "referralStats.pendingReferrals": -1,
        "referralStats.successfulReferrals": 1,
      },
    });

    // Get campaign
    const campaign = await Campaign.findById(referral.campaign);

    // Create rewards
    // Referrer reward
    const referrerReward = await Reward.create({
      business: business._id,
      campaign: campaign._id,
      referral: referral._id,
      recipient: referral.referrer,
      recipientType: "referrer",
      type: campaign.referrerReward.type,
      value: campaign.referrerReward.value,
      description: campaign.referrerReward.description,
      status: "issued",
      issuedAt: Date.now(),
    });

    // Referee reward
    const refereeReward = await Reward.create({
      business: business._id,
      campaign: campaign._id,
      referral: referral._id,
      recipient: customer._id,
      recipientType: "referee",
      type: campaign.refereeReward.type,
      value: campaign.refereeReward.value,
      description: campaign.refereeReward.description,
      status: "issued",
      issuedAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      customer,
      referral,
      rewards: {
        referrer: referrerReward,
        referee: refereeReward,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send follow-up to referee
// @route   POST /api/referrals/:id/followup
// @access  Private
exports.sendFollowUp = async (req, res) => {
  try {
    const { message, method } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find referral
    const referral = await Referral.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Check if referral is still active
    if (referral.status === "expired" || referral.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Cannot send follow-up to a ${referral.status} referral`,
      });
    }

    // Check if referee has email for email method
    if (method === "email" && !referral.referee.email) {
      return res.status(400).json({
        success: false,
        message: "Referee does not have an email address",
      });
    }

    // Check if referee has phone for SMS method
    if (method === "sms" && !referral.referee.phone) {
      return res.status(400).json({
        success: false,
        message: "Referee does not have a phone number",
      });
    }

    // Send follow-up based on method
    let status = "sent";
    try {
      if (method === "email") {
        // Create email transporter
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Send email
        await transporter.sendMail({
          from: `${business.businessName} <${process.env.EMAIL_USER}>`,
          to: referral.referee.email,
          subject: "Follow-up on your referral",
          text: message,
        });
      } else if (method === "sms") {
        // SMS implementation would go here
        // This is a placeholder for SMS functionality
        console.log(`SMS to ${referral.referee.phone}: ${message}`);
      } else if (method === "ai") {
        // AI follow-up implementation would go here
        // This is a placeholder for AI functionality
        console.log(`AI follow-up to ${referral.referee.name}: ${message}`);
      }
    } catch (error) {
      status = "failed";
      console.error("Follow-up sending error:", error);
    }

    // Add follow-up to referral
    const followUp = {
      sentAt: Date.now(),
      method,
      message,
      status,
    };

    await Referral.findByIdAndUpdate(
      req.params.id,
      { $push: { followUps: followUp } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      followUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate referral code
// @route   POST /api/referrals/generate-code
// @access  Private
exports.generateReferralCode = async (req, res) => {
  try {
    const { campaignId, customerId } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Check if campaign exists
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

    // Check if referrer exists
    const referrer = await Customer.findOne({
      _id: customerId,
      business: business._id,
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Generate a unique referral code
    const referralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // Generate a shareable referral link
    const baseReferralLink = `https://helpful-cajeta-f1a22b.netlify.app/refer/${customerId}/${campaignId}`;

    // Create shareable links for different platforms
    const shareableLinks = {
      default: baseReferralLink,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        baseReferralLink
      )}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        baseReferralLink
      )}&text=${encodeURIComponent(
        `Check out this special offer from ${business.name}!`
      )}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(
        `Check out this special offer from ${business.name}: ${baseReferralLink}`
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        baseReferralLink
      )}`,
      email: `mailto:?subject=${encodeURIComponent(
        `Special offer from ${business.name}`
      )}&body=${encodeURIComponent(
        `I thought you might be interested in this offer: ${baseReferralLink}`
      )}`,
    };

    // Create or update referral record
    const referral = await Referral.findOneAndUpdate(
      {
        campaign: campaignId,
        referrer: customerId,
      },
      {
        campaign: campaignId,
        business: business._id,
        referrer: customerId,
        referralCode,
        referralLink: baseReferralLink,
        status: "clicked",
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      referralCode: referral.referralCode,
      referralLink: referral.referralLink,
      shareableLinks,
    });
  } catch (error) {
    console.error("Error generating referral links:", error);
    res.status(500).json({
      success: false,
      message: "Error generating referral links",
      error: error.message,
    });
  }
};

// @desc    Get referrals for logged-in customer
// @route   GET /api/referrals/customer
// @access  Private (Customer)
exports.getCustomerReferrals = async (req, res) => {
  try {
    // Find customer by user ID
    const customer = await Customer.findOne({ user: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Get referrals where this customer is the referrer
    const referrals = await Referral.find({ referrer: customer._id })
      .populate("campaign", "name description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: referrals.length,
      referrals,
    });
  } catch (error) {
    console.error("Error fetching customer referrals:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer referrals",
      error: error.message,
    });
  }
};

// @desc    Convert referral from public link
// @route   POST /api/referrals/convert-public
// @access  Public
exports.convertPublicReferral = async (req, res) => {
  try {
    const { campaignId, referrerId, name, email, phone } = req.body;

    if (!campaignId || !referrerId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Find referrer
    const referrer = await Customer.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referrer not found",
      });
    }

    // Find business
    const business = await Business.findById(campaign.business);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      business: business._id,
      email,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "You are already registered as a customer",
        data: {
          customerId: existingCustomer._id,
          businessId: business._id,
        },
      });
    }

    // Find existing referral or create a new one
    let referral = await Referral.findOne({
      campaign: campaignId,
      referrer: referrerId,
      "referee.email": email,
    });

    if (!referral) {
      // Generate referral code
      const referralCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      // Create referral
      referral = await Referral.create({
        campaign: campaignId,
        business: business._id,
        referrer: referrerId,
        referee: {
          name,
          email,
          phone,
          convertedToCustomer: false,
        },
        referralCode,
        referralLink: `https://helpful-cajeta-f1a22b.netlify.app/refer/${referrerId}/${campaignId}`,
        status: "clicked",
      });

      // Update campaign statistics
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          "statistics.totalReferrals": 1,
          "statistics.clickedReferrals": 1,
        },
      });

      // Update referrer statistics
      await Customer.findByIdAndUpdate(referrerId, {
        $inc: {
          "referralStats.totalReferrals": 1,
        },
      });
    }

    // Create customer
    const customer = await Customer.create({
      business: business._id,
      name,
      email,
      phone,
      source: "referral",
      referredBy: referrerId,
      referralCampaign: campaignId,
      isReferral: true,
      tags: ["referred"],
    });

    // Update referral
    referral = await Referral.findByIdAndUpdate(
      referral._id,
      {
        "referee.convertedToCustomer": true,
        "referee.customerId": customer._id,
        status: "converted",
        conversionDetails: {
          convertedAt: Date.now(),
          conversionType: "signup",
        },
      },
      { new: true }
    );

    // Update campaign statistics
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: {
        "statistics.clickedReferrals": -1,
        "statistics.successfulReferrals": 1,
      },
    });

    // Update referrer statistics
    await Customer.findByIdAndUpdate(referrerId, {
      $inc: {
        "referralStats.successfulReferrals": 1,
      },
    });

    // Create rewards
    // Referrer reward
    const referrerReward = await Reward.create({
      business: business._id,
      campaign: campaignId,
      referral: referral._id,
      recipient: referrerId,
      recipientType: "referrer",
      type: campaign.referrerReward.type,
      value: campaign.referrerReward.value,
      description: campaign.referrerReward.description,
      status: "issued",
      issuedAt: Date.now(),
    });

    // Referee reward
    const refereeReward = await Reward.create({
      business: business._id,
      campaign: campaignId,
      referral: referral._id,
      recipient: customer._id,
      recipientType: "referee",
      type: campaign.refereeReward.type,
      value: campaign.refereeReward.value,
      description: campaign.refereeReward.description,
      status: "issued",
      issuedAt: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customer,
        referral,
        rewards: {
          referrer: referrerReward,
          referee: refereeReward,
        },
        businessId: business._id,
        businessName: business.name,
      },
    });
  } catch (error) {
    console.error("Error converting public referral:", error);
    res.status(500).json({
      success: false,
      message: "Error converting referral",
      error: error.message,
    });
  }
};
