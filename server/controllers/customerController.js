const Customer = require("../models/Customer");
const Business = require("../models/Business");
const nodemailer = require("nodemailer");
const Referral = require("../models/Referral");
const Campaign = require("../models/Campaign");
const Reward = require("../models/Reward");

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, source, referralCode, tags, notes } =
      req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business profile not found. Please create a business profile first.",
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
        message: "Customer with this email already exists",
      });
    }

    let referralData = {};
    let campaign = null;
    let referrer = null;

    // Handle referral code if provided
    if (referralCode) {
      // Find the referral record
      const referral = await Referral.findOne({ referralCode });

      if (!referral) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      // Get campaign and referrer details
      campaign = await Campaign.findById(referral.campaign);
      referrer = await Customer.findById(referral.referrer);

      if (!campaign || !referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral information",
        });
      }

      referralData = {
        source: "referral",
        referredBy: referrer._id,
        referralCampaign: campaign._id,
        isReferral: true,
      };

      // Update referral status
      referral.referee = {
        name,
        email,
        phone,
        convertedToCustomer: true,
      };
      referral.status = "converted";
      await referral.save();

      // Update campaign statistics
      await Campaign.findByIdAndUpdate(campaign._id, {
        $inc: {
          "statistics.successfulReferrals": 1,
          "statistics.pendingReferrals": -1,
        },
      });

      // Update referrer statistics
      await Customer.findByIdAndUpdate(referrer._id, {
        $inc: {
          "referralStats.successfulReferrals": 1,
          "referralStats.pendingReferrals": -1,
          "referralStats.totalRewardsEarned":
            campaign.referrerReward?.value || 0,
        },
      });
    }

    // Create customer
    const customer = await Customer.create({
      business: business._id,
      name,
      email,
      phone,
      address,
      source: referralData.source || source || "direct",
      ...referralData,
      tags: Array.isArray(tags)
        ? [
            ...tags,
            referralData.source === "referral" ? "referred" : null,
          ].filter(Boolean)
        : [referralData.source === "referral" ? "referred" : null].filter(
            Boolean
          ),
      notes,
    });

    // Prepare response data
    const responseData = {
      success: true,
      customer,
    };

    // Add referral information to response if applicable
    if (referralCode && campaign && referrer) {
      responseData.referralInfo = {
        campaign: {
          name: campaign.name,
          referrerReward: campaign.referrerReward,
          refereeReward: campaign.refereeReward,
        },
        referrer: {
          name: referrer.name,
          email: referrer.email,
        },
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all customers for a business
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
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
    const total = await Customer.countDocuments({ business: business._id });

    // Search and filter
    let query = { business: business._id };

    if (req.query.search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { phone: { $regex: req.query.search, $options: "i" } },
        ],
      };
    }

    if (req.query.tag) {
      query = {
        ...query,
        tags: { $in: [req.query.tag] },
      };
    }

    if (req.query.source) {
      query = {
        ...query,
        source: req.query.source,
      };
    }

    // Get customers
    const customers = await Customer.find(query)
      .sort(req.query.sort || "-createdAt")
      .skip(startIndex)
      .limit(limit)
      .populate("referredBy", "name email");

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
      count: customers.length,
      pagination,
      total,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get customer
    const customer = await Customer.findOne({
      _id: req.params.id,
      business: business._id,
    }).populate("referredBy", "name email");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find customer
    let customer = await Customer.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Update customer
    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find customer
    const customer = await Customer.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Delete customer
    await customer.remove();

    res.status(200).json({
      success: true,
      message: "Customer deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Bulk import customers
// @route   POST /api/customers/import
// @access  Private
exports.bulkImportCustomers = async (req, res) => {
  try {
    const { customers } = req.body;

    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Validate customers array
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of customers",
      });
    }

    // Process each customer
    const results = {
      success: [],
      failed: [],
    };

    for (const customerData of customers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
          business: business._id,
          email: customerData.email,
        });

        if (existingCustomer) {
          results.failed.push({
            email: customerData.email,
            reason: "Customer with this email already exists",
          });
          continue;
        }

        // Create customer
        const customer = await Customer.create({
          business: business._id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          source: customerData.source || "import",
          tags: customerData.tags,
          notes: customerData.notes,
        });

        results.success.push({
          _id: customer._id,
          name: customer.name,
          email: customer.email,
        });
      } catch (error) {
        results.failed.push({
          email: customerData.email,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send email to customer
// @route   POST /api/customers/:id/email
// @access  Private
exports.sendEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide subject and message",
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

    // Find customer
    const customer = await Customer.findOne({
      _id: req.params.id,
      business: business._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if customer has email
    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: "Customer does not have an email address",
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

    // Send email
    await transporter.sendMail({
      from: `${business.businessName} <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject,
      text: message,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send bulk email to customers
// @route   POST /api/customers/email
// @access  Private
exports.sendBulkEmail = async (req, res) => {
  try {
    const { subject, message, customerIds } = req.body;

    // Validate input
    if (!subject || !message || !customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide subject, message, and an array of customer IDs",
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

    // Find customers
    const customers = await Customer.find({
      _id: { $in: customerIds },
      business: business._id,
      email: { $exists: true, $ne: "" },
    });

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid customers found",
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

    // Send emails
    const results = {
      success: [],
      failed: [],
    };

    for (const customer of customers) {
      try {
        await transporter.sendMail({
          from: `${business.businessName} <${process.env.EMAIL_USER}>`,
          to: customer.email,
          subject,
          text: message,
        });

        results.success.push({
          _id: customer._id,
          name: customer.name,
          email: customer.email,
        });
      } catch (error) {
        results.failed.push({
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get customer profile
// @route   GET /api/customers/profile
// @access  Private (Customer)
exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id })
      .populate("business", "name industry description")
      .populate("referredBy", "name email");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer profile",
      error: error.message,
    });
  }
};

// @desc    Update welcome status
// @route   PUT /api/customers/update-welcome
// @access  Private (Customer)
exports.updateWelcomeStatus = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { user: req.user._id },
      { hasSeenWelcome: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error updating welcome status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating welcome status",
      error: error.message,
    });
  }
};

// @desc    Get public welcome information
// @route   GET /api/customers/welcome/:userId
// @access  Public
exports.getPublicWelcomeInfo = async (req, res) => {
  try {
    console.log("Searching for customer with user ID:", req.params.userId);

    const customer = await Customer.findOne({ user: req.params.userId })
      .populate("business", "name industry description")
      .populate("referredBy", "name");

    console.log("Found customer:", customer);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Welcome information not found. Please try logging in again.",
      });
    }

    // Return only necessary information
    res.status(200).json({
      success: true,
      welcomeInfo: {
        customerName: customer.name,
        business: customer.business,
        referrer: customer.referredBy,
      },
    });
  } catch (error) {
    console.error("Error in getPublicWelcomeInfo:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching welcome information",
      error: error.message,
    });
  }
};

// @desc    Create a new customer from public referral link
// @route   POST /api/customers/public-referral
// @access  Public
exports.createPublicCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, tags, notes, campaignId, referrerId } =
      req.body;

    if (!name || !email || !campaignId || !referrerId) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, campaign ID, and referrer ID",
      });
    }

    // Find the campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Get business ID from campaign
    const businessId = campaign.business;

    // Find the referrer
    const referrer = await Customer.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referrer not found",
      });
    }

    // Check if customer already exists for this business
    const existingCustomer = await Customer.findOne({
      business: businessId,
      email,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    // Create a new customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      business: businessId,
      source: "referral",
      referredBy: referrerId,
      referralCampaign: campaignId,
      isReferral: true,
      tags: tags || ["referred"],
      notes,
    });

    // Create or update referral record
    const referralCode = `REF-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const referral = await Referral.create({
      business: businessId,
      campaign: campaignId,
      referrer: referrerId,
      referralCode,
      status: "converted",
      referee: {
        name,
        email,
        phone,
        convertedToCustomer: true,
        customerId: customer._id,
      },
    });

    // Update campaign statistics
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: {
        "statistics.successfulReferrals": 1,
      },
    });

    // Update referrer statistics
    await Customer.findByIdAndUpdate(referrerId, {
      $inc: {
        "referralStats.successfulReferrals": 1,
        "referralStats.totalRewardsEarned": campaign.referrerReward?.value || 0,
      },
    });

    // Create rewards
    // Referrer reward
    const referrerReward = await Reward.findOneAndUpdate(
      {
        business: businessId,
        campaign: campaignId,
        referral: referral._id,
        recipient: referrerId,
        recipientType: "referrer",
      },
      {
        type: campaign.referrerReward?.type,
        value: campaign.referrerReward?.value,
        description: campaign.referrerReward?.description,
        status: "issued",
        issuedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    // Referee reward
    const refereeReward = await Reward.findOneAndUpdate(
      {
        business: businessId,
        campaign: campaignId,
        referral: referral._id,
        recipient: customer._id,
        recipientType: "referee",
      },
      {
        type: campaign.refereeReward?.type,
        value: campaign.refereeReward?.value,
        description: campaign.refereeReward?.description,
        status: "issued",
        issuedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    // Get business name
    const business = await Business.findById(businessId);
    const businessName = business ? business.name : "Business";

    // Send welcome email to the new customer
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
      const subject = `Welcome to ${businessName}!`;
      const body = `Hello ${name},\n\nThank you for joining ${businessName}! We're excited to have you as our customer.\n\nYou were referred by ${
        referrer.name
      } and have received the following reward: ${
        campaign.refereeReward?.description || "A special offer"
      }\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n${businessName} Team`;

      // Send email
      await transporter.sendMail({
        from: `${businessName} <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text: body,
      });
    } catch (error) {
      console.error("Email sending error:", error);
    }

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customer,
        businessId,
        businessName,
        referral,
        rewards: {
          referrer: referrerReward,
          referee: refereeReward,
        },
      },
    });
  } catch (error) {
    console.error("Error creating public customer:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get customer details for public access
// @route   GET /api/customers/:id/public
// @access  Public
exports.getPublicCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select(
      "name email"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email ? customer.email.substring(0, 3) + "***" : null,
      },
    });
  } catch (error) {
    console.error("Error fetching public customer:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer details",
      error: error.message,
    });
  }
};
