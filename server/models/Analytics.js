const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    referrals: {
      total: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      clicked: {
        type: Number,
        default: 0,
      },
      converted: {
        type: Number,
        default: 0,
      },
      rewarded: {
        type: Number,
        default: 0,
      },
      expired: {
        type: Number,
        default: 0,
      },
      rejected: {
        type: Number,
        default: 0,
      },
    },
    campaigns: {
      active: {
        type: Number,
        default: 0,
      },
      ended: {
        type: Number,
        default: 0,
      },
      totalReferrals: {
        type: Number,
        default: 0,
      },
      conversionRate: {
        type: Number,
        default: 0,
      },
    },
    customers: {
      total: {
        type: Number,
        default: 0,
      },
      new: {
        type: Number,
        default: 0,
      },
      active: {
        type: Number,
        default: 0,
      },
      referred: {
        type: Number,
        default: 0,
      },
    },
    rewards: {
      total: {
        type: Number,
        default: 0,
      },
      issued: {
        type: Number,
        default: 0,
      },
      claimed: {
        type: Number,
        default: 0,
      },
      expired: {
        type: Number,
        default: 0,
      },
      totalValue: {
        type: Number,
        default: 0,
      },
    },
    sharing: {
      sms: {
        type: Number,
        default: 0,
      },
      email: {
        type: Number,
        default: 0,
      },
      facebook: {
        type: Number,
        default: 0,
      },
      twitter: {
        type: Number,
        default: 0,
      },
      whatsapp: {
        type: Number,
        default: 0,
      },
      copy: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    aiAssistant: {
      interactions: {
        type: Number,
        default: 0,
      },
      suggestionsAccepted: {
        type: Number,
        default: 0,
      },
      followUpsSent: {
        type: Number,
        default: 0,
      },
    },
    financials: {
      totalRevenue: {
        type: Number,
        default: 0,
      },
      rewardsCost: {
        type: Number,
        default: 0,
      },
      estimatedROI: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for business and date to ensure uniqueness
AnalyticsSchema.index({ business: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Analytics", AnalyticsSchema);
