const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to send SMS to a single number
const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    console.log("SMS sent successfully:", response.sid);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
};

// Function to send SMS to multiple numbers
const sendBulkSMS = async (numbers, message) => {
  const results = [];
  for (const number of numbers) {
    const result = await sendSMS(number, message);
    results.push({ number, ...result });
  }
  return results;
};

module.exports = {
  sendSMS,
  sendBulkSMS,
};
