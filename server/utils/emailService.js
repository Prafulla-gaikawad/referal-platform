const nodemailer = require("nodemailer");

// Validate required environment variables
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL",
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingVars.join(", ")
  );
  process.exit(1); // Exit the process if required variables are missing
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Using Gmail service directly
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration on startup
transporter
  .verify()
  .then(() => {
    console.log("Email service is ready to send emails");
    console.log("Using email account:", process.env.SMTP_USER);
  })
  .catch((error) => {
    console.error("Email configuration error:", error);
  });

// Function to send email to a single recipient
const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Attempting to send email to: ${to}`);

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully to:", to);
    console.log("Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Function to send email to multiple recipients
const sendBulkEmail = async (recipients, subject, html) => {
  console.log(`Starting bulk email send to ${recipients.length} recipients`);
  const results = [];

  for (const recipient of recipients) {
    console.log(`Processing email for: ${recipient}`);
    const result = await sendEmail(recipient, subject, html);
    results.push({ recipient, ...result });

    // Add a small delay between emails
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(
    `Bulk email sending completed. Success: ${successful}, Failed: ${failed}`
  );

  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmail,
};
