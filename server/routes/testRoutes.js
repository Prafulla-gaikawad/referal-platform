const express = require("express");
const { sendEmail } = require("../utils/emailService");
const Customer = require("../models/Customer");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { sendBulkEmail } = require("../utils/emailService");
const Business = require("../models/Business");

// @route   GET /api/test/customers
// @desc    Get all customers
// @access  Public
router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find().select("name email business");
    console.log("All customers in database:", customers);

    res.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Test email functionality
// @route   POST /api/test/email
// @access  Private
router.post("/email", protect, async (req, res) => {
  try {
    // Get business profile
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Find all customers with email addresses
    const customers = await Customer.find({
      business: business._id,
      email: { $exists: true, $ne: null },
    });

    console.log(`Found ${customers.length} customers with email addresses`);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No customers found with email addresses",
        suggestion: "Please add some customers with email addresses first",
      });
    }

    // Send test email
    const subject = "Test Email from Referral Platform";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; text-align: center;">Test Email</h2>
        <p style="color: #34495e;">This is a test email from your referral platform.</p>
        <p style="color: #34495e;">If you received this email, your email configuration is working correctly!</p>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #7f8c8d; font-size: 0.9em;">
            This email was sent by ${business.name}.<br>
            This is just a test email to verify the email functionality.
          </p>
        </div>
      </div>
    `;

    console.log("Sending test email to:", customers.map(c => c.email));
    
    const emailResults = await sendBulkEmail(
      customers.map((customer) => customer.email),
      subject,
      html
    );

    console.log("Test email results:", JSON.stringify(emailResults, null, 2));

    res.status(200).json({
      success: true,
      message: "Test emails sent",
      emailsSentTo: customers.map(c => c.email),
      results: emailResults,
    });

  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      success: false,
      message: "Error sending test email",
      error: error.message,
    });
  }
});

// @route   GET /api/test/direct-email
// @desc    Send a test email directly to gaikawadprafulla@gmail.com
// @access  Public
router.get("/direct-email", async (req, res) => {
  try {
    const testResult = await sendEmail(
      "gaikawadprafulla@gmail.com",
      "Test Email from Referral Platform",
      `
        <h2>Direct Test Email</h2>
        <p>This is a direct test email from your Referral Platform.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `
    );

    console.log("Direct email test result:", testResult);

    res.json({
      success: true,
      message: "Direct test email sent",
      result: testResult,
    });
  } catch (error) {
    console.error("Direct test email error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending direct test email",
      error: error.message,
    });
  }
});

module.exports = router;
