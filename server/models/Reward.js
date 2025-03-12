const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    recipientType: {
      type: String,
      enum: ["referrer", "referee"],
      required: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed", "points", "custom"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    description: String,
    code: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "issued", "claimed", "expired", "cancelled"],
      default: "pending",
    },
    issuedAt: Date,
    claimedAt: Date,
    expiresAt: Date,
    claimMethod: {
      type: String,
      enum: ["code", "link", "email", "manual", "automatic"],
      default: "code",
    },
    claimDetails: {
      claimedBy: String,
      claimLocation: String,
      transactionId: String,
      notes: String,
    },
    notificationsSent: [
      {
        type: {
          type: String,
          enum: ["issued", "reminder", "expiring_soon", "expired"],
        },
        method: {
          type: String,
          enum: ["email", "sms", "push"],
        },
        sentAt: Date,
        status: {
          type: String,
          enum: ["sent", "delivered", "failed"],
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique reward code
RewardSchema.pre("save", function (next) {
  if (!this.code) {
    const randomCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    this.code = `${this.type.substring(0, 1).toUpperCase()}${randomCode}`;
  }

  // Set expiration date if not set
  if (!this.expiresAt) {
    const defaultExpiration = 90; // days
    this.expiresAt = new Date(
      Date.now() + defaultExpiration * 24 * 60 * 60 * 1000
    );
  }

  next();
});

module.exports = mongoose.model("Reward", RewardSchema);
