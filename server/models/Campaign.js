const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["discount", "gift", "points", "cash", "custom"],
      default: "discount",
    },
    task: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
    },
    referrerReward: {
      type: {
        type: String,
        enum: ["percentage", "fixed", "points", "custom"],
        default: "fixed",
      },
      value: {
        type: Number,
        required: true,
      },
      description: String,
    },
    refereeReward: {
      type: {
        type: String,
        enum: ["percentage", "fixed", "points", "custom"],
        default: "fixed",
      },
      value: {
        type: Number,
        required: true,
      },
      description: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    conversionCriteria: {
      type: String,
      enum: ["purchase", "signup", "subscription", "custom"],
      default: "purchase",
    },
    customConversionDetails: {
      type: String,
    },
    landingPage: {
      title: String,
      description: String,
      imageUrl: String,
      buttonText: String,
      customCss: String,
    },
    sharingOptions: {
      sms: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      facebook: {
        type: Boolean,
        default: true,
      },
      twitter: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
      copyLink: {
        type: Boolean,
        default: true,
      },
    },
    defaultMessage: {
      sms: String,
      email: {
        subject: String,
        body: String,
      },
      social: String,
    },
    followUpSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: Number, // Days
        default: 3,
      },
      maxFollowUps: {
        type: Number,
        default: 3,
      },
      message: String,
    },
    statistics: {
      totalReferrals: {
        type: Number,
        default: 0,
      },
      successfulReferrals: {
        type: Number,
        default: 0,
      },
      pendingReferrals: {
        type: Number,
        default: 0,
      },
      totalRewards: {
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

module.exports = mongoose.model("Campaign", CampaignSchema);
