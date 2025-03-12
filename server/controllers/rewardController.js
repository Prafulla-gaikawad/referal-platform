const Reward = require("../models/Reward");
const Business = require("../models/Business");
const Customer = require("../models/Customer");
const nodemailer = require("nodemailer");

// @desc    Get all rewards for a business
// @route   GET /api/rewards
// @access  Private
exports.getRewards = async (req, res) => {
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
    const total = await Reward.countDocuments({ business: business._id });

    // Filter options
    let query = { business: business._id };

    if (req.query.campaign) {
      query.campaign = req.query.campaign;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.recipientType) {
      query.recipientType = req.query.recipientType;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    // Get rewards
    const rewards = await Reward.find(query)
      .sort(req.query.sort || "-createdAt")
      .skip(startIndex)
      .limit(limit)
      .populate("campaign", "name")
      .populate("recipient", "name email")
      .populate("referral", "referralCode");

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
      count: rewards.length,
      pagination,
      total,
      rewards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single reward
// @route   GET /api/rewards/:id
// @access  Private
exports.getReward = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get reward
    const reward = await Reward.findOne({
      _id: req.params.id,
      business: business._id,
    })
      .populate("campaign", "name type")
      .populate("recipient", "name email phone")
      .populate("referral");

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    res.status(200).json({
      success: true,
      reward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update reward status
// @route   PUT /api/rewards/:id/status
// @access  Private
exports.updateRewardStatus = async (req, res) => {
  try {
    const { status, claimDetails } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "issued",
      "claimed",
      "expired",
      "cancelled",
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

    // Find reward
    let reward = await Reward.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    // Update reward
    const updateData = { status };

    if (status === "issued" && !reward.issuedAt) {
      updateData.issuedAt = Date.now();
    }

    if (status === "claimed") {
      updateData.claimedAt = Date.now();
      if (claimDetails) {
        updateData.claimDetails = claimDetails;
      }
    }

    reward = await Reward.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // If status is issued, send notification to recipient
    if (status === "issued") {
      try {
        // Get recipient
        const recipient = await Customer.findById(reward.recipient);

        if (recipient && recipient.email) {
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
            to: recipient.email,
            subject: "Your Reward is Ready!",
            text: `Congratulations! Your reward from ${
              business.businessName
            } is now available.\n\nReward Details:\nType: ${
              reward.type
            }\nValue: ${reward.value}\n${
              reward.description ? `Description: ${reward.description}\n` : ""
            }\nCode: ${
              reward.code
            }\n\nTo claim your reward, please visit our store or website and present this code.\n\nThank you for your referral!`,
          });

          // Add notification to reward
          await Reward.findByIdAndUpdate(reward._id, {
            $push: {
              notificationsSent: {
                type: "issued",
                method: "email",
                sentAt: Date.now(),
                status: "sent",
              },
            },
          });
        }
      } catch (error) {
        console.error("Notification sending error:", error);
      }
    }

    res.status(200).json({
      success: true,
      reward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify reward code
// @route   POST /api/rewards/verify
// @access  Private
exports.verifyRewardCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reward code",
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

    // Find reward by code
    const reward = await Reward.findOne({
      code,
      business: business._id,
    })
      .populate("campaign", "name")
      .populate("recipient", "name email")
      .populate("referral");

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Invalid reward code",
      });
    }

    // Check if reward is expired
    if (reward.status === "expired" || reward.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Reward is ${reward.status}`,
      });
    }

    // Check if reward is already claimed
    if (reward.status === "claimed") {
      return res.status(400).json({
        success: false,
        message: "Reward has already been claimed",
      });
    }

    // Check if reward is expired by date
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
      // Update reward status to expired
      await Reward.findByIdAndUpdate(reward._id, { status: "expired" });

      return res.status(400).json({
        success: false,
        message: "Reward has expired",
      });
    }

    res.status(200).json({
      success: true,
      reward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get rewards for logged-in customer
// @route   GET /api/rewards/customer
// @access  Private (Customer)
exports.getCustomerRewards = async (req, res) => {
  try {
    // Find customer by user ID
    const customer = await Customer.findOne({ user: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Get rewards for this customer
    const rewards = await Reward.find({ recipient: customer._id })
      .populate("campaign", "name description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rewards.length,
      rewards,
    });
  } catch (error) {
    console.error("Error fetching customer rewards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer rewards",
      error: error.message,
    });
  }
};

// @desc    Claim a reward
// @route   POST /api/rewards/:id/claim
// @access  Private (Customer)
exports.claimReward = async (req, res) => {
  try {
    // Find customer by user ID
    const customer = await Customer.findOne({ user: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Find the reward
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    // Check if this reward belongs to the customer
    if (reward.recipient.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to claim this reward",
      });
    }

    // Check if reward is already claimed
    if (reward.status === "claimed") {
      return res.status(400).json({
        success: false,
        message: "Reward has already been claimed",
      });
    }

    // Check if reward is expired
    if (reward.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Reward has expired",
      });
    }

    // Update reward status
    reward.status = "claimed";
    reward.claimedAt = Date.now();
    await reward.save();

    res.status(200).json({
      success: true,
      message: "Reward claimed successfully",
      reward,
    });
  } catch (error) {
    console.error("Error claiming reward:", error);
    res.status(500).json({
      success: false,
      message: "Error claiming reward",
      error: error.message,
    });
  }
};

// @desc    Send reward notification
// @route   POST /api/rewards/:id/notify
// @access  Private
exports.sendRewardNotification = async (req, res) => {
  try {
    const { type, message } = req.body;

    // Validate notification type
    const validTypes = ["issued", "reminder", "expiring_soon", "expired"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type",
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

    // Find reward
    const reward = await Reward.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    // Get recipient
    const recipient = await Customer.findById(reward.recipient);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Check if recipient has email
    if (!recipient.email) {
      return res.status(400).json({
        success: false,
        message: "Recipient does not have an email address",
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare email content
    let subject;
    let text;

    switch (type) {
      case "issued":
        subject = "Your Reward is Ready!";
        text =
          message ||
          `Congratulations! Your reward from ${
            business.businessName
          } is now available.\n\nReward Details:\nType: ${
            reward.type
          }\nValue: ${reward.value}\n${
            reward.description ? `Description: ${reward.description}\n` : ""
          }\nCode: ${
            reward.code
          }\n\nTo claim your reward, please visit our store or website and present this code.\n\nThank you for your referral!`;
        break;
      case "reminder":
        subject = "Reminder: You Have an Unclaimed Reward";
        text =
          message ||
          `Hello ${
            recipient.name
          },\n\nThis is a friendly reminder that you have an unclaimed reward from ${
            business.businessName
          }.\n\nReward Details:\nType: ${reward.type}\nValue: ${
            reward.value
          }\n${
            reward.description ? `Description: ${reward.description}\n` : ""
          }\nCode: ${
            reward.code
          }\n\nTo claim your reward, please visit our store or website and present this code.\n\nThank you!`;
        break;
      case "expiring_soon":
        subject = "Your Reward is Expiring Soon";
        text =
          message ||
          `Hello ${recipient.name},\n\nYour reward from ${
            business.businessName
          } is expiring soon.\n\nReward Details:\nType: ${
            reward.type
          }\nValue: ${reward.value}\n${
            reward.description ? `Description: ${reward.description}\n` : ""
          }\nCode: ${reward.code}\n\nExpiration Date: ${new Date(
            reward.expiresAt
          ).toLocaleDateString()}\n\nTo claim your reward, please visit our store or website and present this code before it expires.\n\nThank you!`;
        break;
      case "expired":
        subject = "Your Reward Has Expired";
        text =
          message ||
          `Hello ${
            recipient.name
          },\n\nWe're sorry to inform you that your reward from ${
            business.businessName
          } has expired.\n\nReward Details:\nType: ${reward.type}\nValue: ${
            reward.value
          }\n${
            reward.description ? `Description: ${reward.description}\n` : ""
          }\n\nIf you would like to earn more rewards, consider referring more friends to our business.\n\nThank you!`;
        break;
    }

    // Send email
    let status = "sent";
    try {
      await transporter.sendMail({
        from: `${business.businessName} <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject,
        text,
      });
    } catch (error) {
      status = "failed";
      console.error("Notification sending error:", error);
    }

    // Add notification to reward
    const notification = {
      type,
      method: "email",
      sentAt: Date.now(),
      status,
    };

    await Reward.findByIdAndUpdate(
      req.params.id,
      { $push: { notificationsSent: notification } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
