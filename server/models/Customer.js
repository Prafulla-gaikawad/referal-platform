const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    source: {
      type: String,
      enum: ["direct", "referral", "import", "other"],
      default: "direct",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    referralCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    isReferral: {
      type: Boolean,
      default: false,
    },
    hasSeenWelcome: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    notes: String,
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    referralStats: {
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
      totalRewardsEarned: {
        type: Number,
        default: 0,
      },
    },
    referralLink: {
      type: String,
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
    },
    active: {
      type: Boolean,
      default: true,
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

// Generate referral link
CustomerSchema.pre("save", function (next) {
  if (!this.referralLink) {
    this.referralLink = `${process.env.CLIENT_URL}/refer/${this._id}`;
  }
  next();
});

module.exports = mongoose.model("Customer", CustomerSchema);
