const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    referee: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      phone: String,
      convertedToCustomer: {
        type: Boolean,
        default: false,
      },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "clicked",
        "converted",
        "rewarded",
        "expired",
        "rejected",
      ],
      default: "pending",
    },
    referralLink: {
      type: String,
      required: false,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    lastClickedAt: {
      type: Date,
    },
    conversionDetails: {
      convertedAt: Date,
      conversionType: String,
      conversionValue: Number,
      notes: String,
    },
    rewards: {
      referrer: {
        type: {
          type: String,
          enum: ["percentage", "fixed", "points", "custom"],
        },
        value: Number,
        description: String,
        status: {
          type: String,
          enum: ["pending", "issued", "claimed", "expired"],
          default: "pending",
        },
        issuedAt: Date,
        claimedAt: Date,
      },
      referee: {
        type: {
          type: String,
          enum: ["percentage", "fixed", "points", "custom"],
        },
        value: Number,
        description: String,
        status: {
          type: String,
          enum: ["pending", "issued", "claimed", "expired"],
          default: "pending",
        },
        issuedAt: Date,
        claimedAt: Date,
      },
    },
    sharingMethod: {
      type: String,
      enum: [
        "sms",
        "email",
        "facebook",
        "twitter",
        "whatsapp",
        "copy",
        "other",
      ],
      default: "other",
    },
    followUps: [
      {
        sentAt: Date,
        method: {
          type: String,
          enum: ["email", "sms", "ai"],
          default: "email",
        },
        message: String,
        status: {
          type: String,
          enum: ["sent", "delivered", "opened", "clicked", "failed"],
          default: "sent",
        },
      },
    ],
    expiresAt: {
      type: Date,
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code
ReferralSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `${randomCode}`;
  }

  // Set expiration date if not set
  if (!this.expiresAt) {
    const defaultExpiration = 30; // days
    this.expiresAt = new Date(
      Date.now() + defaultExpiration * 24 * 60 * 60 * 1000
    );
  }

  next();
});

module.exports = mongoose.model("Referral", ReferralSchema);
