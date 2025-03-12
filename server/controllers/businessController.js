const Business = require("../models/Business");
const User = require("../models/User");

// @desc    Create a business profile
// @route   POST /api/business
// @access  Private
exports.createBusiness = async (req, res) => {
  try {
    const {
      businessName,
      description,
      industry,
      website,
      contactEmail,
      contactPhone,
      address,
      socialMedia,
    } = req.body;

    // Check if business already exists for this user
    const existingBusiness = await Business.findOne({ user: req.user._id });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: "Business profile already exists for this user",
      });
    }

    // Create business
    const business = await Business.create({
      user: req.user._id,
      businessName: businessName || req.user.businessName,
      description,
      industry: industry || req.user.industry,
      website,
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone,
      address: address || req.user.address,
      socialMedia,
    });

    res.status(201).json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get business profile
// @route   GET /api/business
// @access  Private
exports.getBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/business
// @access  Private
exports.updateBusiness = async (req, res) => {
  try {
    const {
      businessName,
      description,
      industry,
      website,
      contactEmail,
      contactPhone,
      address,
      socialMedia,
      settings,
    } = req.body;

    // Find business
    let business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Update fields
    const updatedBusiness = {
      businessName: businessName || business.businessName,
      description: description || business.description,
      industry: industry || business.industry,
      website: website || business.website,
      contactEmail: contactEmail || business.contactEmail,
      contactPhone: contactPhone || business.contactPhone,
      address: address || business.address,
      socialMedia: socialMedia || business.socialMedia,
      settings: settings || business.settings,
    };

    business = await Business.findOneAndUpdate(
      { user: req.user._id },
      updatedBusiness,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update business settings
// @route   PUT /api/business/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    // Find business
    let business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Update settings
    business = await Business.findOneAndUpdate(
      { user: req.user._id },
      { settings },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      settings: business.settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update Zapier integration
// @route   PUT /api/business/zapier
// @access  Private
exports.updateZapierIntegration = async (req, res) => {
  try {
    const { zapierIntegration } = req.body;

    // Find business
    let business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Update Zapier integration
    business = await Business.findOneAndUpdate(
      { user: req.user._id },
      { zapierIntegration },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      zapierIntegration: business.zapierIntegration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload business logo
// @route   PUT /api/business/logo
// @access  Private
exports.uploadLogo = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    // Find business
    let business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Update logo
    business = await Business.findOneAndUpdate(
      { user: req.user._id },
      { logo: req.file.path },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      logo: business.logo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete business profile
// @route   DELETE /api/business
// @access  Private
exports.deleteBusiness = async (req, res) => {
  try {
    // Find business
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Delete business
    await business.remove();

    res.status(200).json({
      success: true,
      message: "Business profile deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get business details for public access
// @route   GET /api/business/:id/public
// @access  Public
exports.getPublicBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).select(
      "businessName description industry website logo"
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      business: {
        _id: business._id,
        name: business.businessName,
        description: business.description,
        industry: business.industry,
        website: business.website,
        logo: business.logo,
      },
    });
  } catch (error) {
    console.error("Error fetching public business:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching business details",
      error: error.message,
    });
  }
};
