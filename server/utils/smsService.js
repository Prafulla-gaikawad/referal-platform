const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS to a single number
const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
};

// Send SMS to multiple numbers
const sendBulkSMS = async (numbers, message) => {
  try {
    const results = await Promise.all(
      numbers.map((number) => sendSMS(number, message))
    );
    return results;
  } catch (error) {
    console.error("Error sending bulk SMS:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
};
