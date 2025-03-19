const nodemailer = require("nodemailer");

// Check if all required environment variables are present
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    "Warning: Email service is not fully configured. Missing environment variables:",
    missingEnvVars.join(", ")
  );
  console.warn(
    "Email notifications will be disabled. To enable email notifications, please set all required environment variables."
  );
}

// Create transporter only if all required variables are present
let transporter = null;
if (missingEnvVars.length === 0) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify transporter configuration
  transporter.verify((error) => {
    if (error) {
      console.error("Error configuring email service:", error);
    } else {
      console.log("Email service is ready to send emails");
      console.log("Using email account:", process.env.SMTP_FROM_EMAIL);
    }
  });
}

// Send email function with error handling
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.warn(
      "Email service is not configured. Skipping email send to:",
      to
    );
    return {
      success: false,
      error: "Email service is not configured",
    };
  }

  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send bulk emails with error handling
const sendBulkEmail = async (recipients, subject, html) => {
  if (!transporter) {
    console.warn(
      "Email service is not configured. Skipping bulk email send to:",
      recipients.length,
      "recipients"
    );
    return recipients.map((recipient) => ({
      recipient,
      success: false,
      error: "Email service is not configured",
    }));
  }

  const results = [];
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, subject, html);
    results.push({
      recipient,
      ...result,
    });
  }
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmail,
};
