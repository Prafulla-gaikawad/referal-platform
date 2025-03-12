require("dotenv").config();

/**
 * Configuration settings for the application
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || "development",

  // Server settings
  port: process.env.PORT || 5000,

  // MongoDB connection
  mongoURI:
    process.env.MONGO_URI || "mongodb://localhost:27017/referral-platform",

  // JWT settings
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  jwtExpire: process.env.JWT_EXPIRE || "30d",

  // Client URL
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  // OpenAI API key
  openaiApiKey: process.env.OPENAI_API_KEY,

  // Email settings
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || "noreply@referralplatform.com",
  },

  // File upload settings
  upload: {
    maxSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // AI settings
  ai: {
    model: process.env.AI_MODEL || "gpt-3.5-turbo",
    maxTokens: process.env.AI_MAX_TOKENS || 1000,
    temperature: process.env.AI_TEMPERATURE || 0.7,
  },
};

module.exports = config;
