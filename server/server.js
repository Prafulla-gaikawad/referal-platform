const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "https://helpful-cajeta-f1a22b.netlify.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const campaignRoutes = require("./routes/campaign");
const referralRoutes = require("./routes/referral");
const customerRoutes = require("./routes/customer");
const rewardRoutes = require("./routes/reward");
const analyticsRoutes = require("./routes/analytics");
const aiRoutes = require("./routes/ai");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
const logosDir = path.join(uploadsDir, "logos");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir);
}

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
  });
}

// Error handling middleware
const errorHandler = require("./middleware/error");
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
