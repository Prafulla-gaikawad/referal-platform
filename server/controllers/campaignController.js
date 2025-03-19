const Campaign = require("../models/Campaign");
const Business = require("../models/Business");
const Customer = require("../models/Customer");
const { sendBulkSMS } = require("../utils/smsService");
const { sendBulkEmail } = require("../utils/emailService");

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    // Get business profile
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business profile not found. Please create a business profile first.",
      });
    }

    // Clean and validate campaign data
    const campaignData = {
      ...req.body,
      business: business._id,
      conversionCriteria: "form",
      status: "draft",
      active: true,
      notifications: {
        smsSent: false,
        emailSent: false,
      },
      statistics: {
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalRewards: 0,
      },
    };

    // Remove any fields that are not in the schema
    delete campaignData.task;
    delete campaignData._id;
    delete campaignData.createdAt;
    delete campaignData.updatedAt;

    // Create campaign
    const campaign = await Campaign.create(campaignData);

    // Find all customers with email addresses
    const customers = await Customer.find({
      business: business._id,
      email: { $exists: true, $ne: null },
    });

    console.log(
      `Found ${customers.length} customers to notify about new campaign`
    );

    if (customers.length === 0) {
      console.log(
        "No customers found with email addresses. Skipping email notifications."
      );
    }

    if (customers.length > 0) {
      // Log customer emails for verification
      console.log(
        "Preparing to send emails to:",
        customers.map((c) => c.email)
      );

      // Prepare email content
      const subject = `New Campaign: ${campaign.name} - Special Offer Inside! 🎁`;
      console.log("Email subject:", subject);

      // Create a reward description based on the campaign type
      let rewardDescription = "";
      if (campaign.referrerReward.type === "percentage") {
        rewardDescription = `${campaign.referrerReward.value}% discount`;
      } else if (campaign.referrerReward.type === "fixed") {
        rewardDescription = `$${campaign.referrerReward.value} off`;
      } else if (campaign.referrerReward.type === "points") {
        rewardDescription = `${campaign.referrerReward.value} points`;
      } else {
        rewardDescription =
          campaign.referrerReward.description || "special reward";
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; text-align: center;">New Campaign Alert! 🎉</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">${campaign.name}</h3>
            <p style="color: #34495e;">${
              campaign.description || "We have an exciting new offer for you!"
            }</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h4 style="color: #2c3e50; margin-top: 0;">Campaign Details:</h4>
              <ul style="color: #34495e;">
                <li>Reward: ${rewardDescription}</li>
                <li>Start Date: ${new Date(
                  campaign.startDate
                ).toLocaleDateString()}</li>
                ${
                  campaign.endDate
                    ? `<li>End Date: ${new Date(
                        campaign.endDate
                      ).toLocaleDateString()}</li>`
                    : ""
                }
                <li>Type: ${campaign.type}</li>
              </ul>
            </div>

            <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h4 style="color: #2c3e50; margin-top: 0;">How to Participate:</h4>
              <p style="color: #34495e;">
                ${
                  campaign.description ||
                  "Join our referral program and earn amazing rewards! Share with your friends and family to start earning."
                }
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #7f8c8d; font-size: 0.9em;">
              This email was sent by ${business.name}.<br>
              If you have any questions, please contact us.
            </p>
          </div>
        </div>
      `;

      try {
        // Send emails to all customers
        console.log("Starting email send process...");
        const emailResults = await sendBulkEmail(
          customers.map((customer) => customer.email),
          subject,
          html
        );

        console.log(
          "Email sending complete. Results:",
          JSON.stringify(emailResults, null, 2)
        );

        // Update campaign with email notification status
        campaign.notifications = {
          emailSent: true,
          emailSentAt: new Date(),
          emailResults: emailResults.map((result) => ({
            email: result.recipient,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          })),
        };
        await campaign.save();
        console.log("Campaign updated with email notification status");
      } catch (emailError) {
        console.error(
          "Error sending campaign notification emails:",
          emailError.message,
          "\nStack trace:",
          emailError.stack
        );
      }
    }

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
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
