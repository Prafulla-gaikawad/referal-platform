const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Referral = require("../models/Referral");
const Customer = require("../models/Customer");
const Campaign = require("../models/Campaign");
const Business = require("../models/Business");

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      userType,
      businessName,
      industry,
      website,
      referralCode,
      customerId,
      businessId,
      campaignId,
      referralId,
      isReferral,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Handle different user types
    if (userType === "business") {
      // Validate business name
      if (!businessName) {
        return res.status(400).json({
          success: false,
          message: "Business name is required",
        });
      }

      // Create business user
      const user = await User.create({
        name,
        email,
        password,
        phone,
        address,
        role: "business",
      });

      // Create business profile
      const business = await Business.create({
        user: user._id,
        businessName: businessName,
        industry,
        website,
        contactEmail: email,
        contactPhone: phone,
        address: address,
      });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessId: business._id,
          businessName: business.businessName,
        },
        token,
      });
    } else if (userType === "customer") {
      // Handle pre-created customer from referral
      if (isReferral && customerId && businessId) {
        // Create customer user account
        const user = await User.create({
          name,
          email,
          password,
          phone,
          address,
          role: "customer",
        });

        // Link user to existing customer
        await Customer.findByIdAndUpdate(customerId, {
          user: user._id,
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId: customerId,
            businessId: businessId,
            campaignId: campaignId,
          },
          token,
        });
      }
      // Handle regular customer registration with referral code
      else if (referralCode) {
        // Validate referral code
        if (!referralCode) {
          return res.status(400).json({
            success: false,
            message: "Referral code is required for customer registration",
          });
        }

        // Find the referral record
        const referral = await Referral.findOne({ referralCode });

        if (!referral) {
          return res.status(400).json({
            success: false,
            message: "Invalid referral code",
          });
        }

        // Get business ID from the referral
        const businessId = referral.business;

        // Create customer user
        const user = await User.create({
          name,
          email,
          password,
          phone,
          address,
          role: "customer",
        });

        // Create customer record for the new user
        const customer = await Customer.create({
          name,
          email,
          phone,
          address,
          user: user._id,
          business: businessId,
          referredBy: referral.referrer,
          referralCampaign: referral.campaign,
          isReferral: true,
        });

        // Update referral status
        referral.referee = {
          name,
          email,
          phone,
          convertedToCustomer: true,
          customerId: customer._id,
        };
        referral.status = "converted";

        // Set referralLink if it's not already set
        if (!referral.referralLink) {
          referral.referralLink = `code:${referralCode}`;
        }

        await referral.save();

        // Update campaign statistics
        await Campaign.findByIdAndUpdate(referral.campaign, {
          $inc: {
            "statistics.successfulReferrals": 1,
            "statistics.pendingReferrals": -1,
          },
        });

        // Update referrer statistics
        await Customer.findByIdAndUpdate(referral.referrer, {
          $inc: {
            "referralStats.successfulReferrals": 1,
            "referralStats.pendingReferrals": -1,
          },
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId: customer._id,
            businessId: businessId,
            campaignId: referral.campaign,
          },
          token,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Referral information is required for customer registration",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let additionalInfo = {};

    // If user is a customer, get their customer record with business info
    if (user.role === "customer") {
      const customer = await Customer.findOne({ user: user._id }).populate(
        "business",
        "name"
      );
      if (customer) {
        additionalInfo = {
          customerId: customer._id,
          businessId: customer.business?._id,
          businessName: customer.business?.name,
        };
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...additionalInfo,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    let additionalInfo = {};

    // If user is a customer, get their customer record with business info
    if (user.role === "customer") {
      const customer = await Customer.findOne({ user: user._id }).populate(
        "business",
        "name"
      );
      if (customer) {
        additionalInfo = {
          customer: {
            _id: customer._id,
            business: customer.business,
            referredBy: customer.referredBy,
            isReferral: customer.isReferral,
            referralStats: customer.referralStats,
          },
        };
      }
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        ...additionalInfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

    // Create email message
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the following link to reset your password: \n\n ${resetUrl}`;

    try {
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
        from: `${process.env.EMAIL_USER}`,
        to: email,
        subject: "Password Reset",
        text: message,
      });

      res.status(200).json({
        success: true,
        message: "Email sent",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    // Find user by reset token and check if expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, businessName, phone, industry, address } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (businessName) user.businessName = businessName;
    if (phone) user.phone = phone;
    if (industry) user.industry = industry;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        phone: user.phone,
        industry: user.industry,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/changepassword
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
