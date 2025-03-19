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
      validate: {
        validator: function (v) {
          // Remove all non-digit characters
          const digits = v.replace(/\D/g, "");
          // Check if the number is between 10 and 15 digits
          return digits.length >= 10 && digits.length <= 15;
        },
        message: (props) =>
          `${props.value} is not a valid phone number! Please enter a valid phone number with 10-15 digits.`,
      },
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

// Format phone number before saving
CustomerSchema.pre("save", function (next) {
  if (this.phone) {
    // Remove all non-digit characters
    const digits = this.phone.replace(/\D/g, "");

    // If the number doesn't start with a country code, add it
    if (digits.length === 10) {
      // Assuming US/Canada numbers if no country code
      this.phone = `+1${digits}`;
    } else if (digits.length > 10) {
      // If it has a country code, add the plus sign
      this.phone = `+${digits}`;
    }
  }
  next();
});

// Generate referral link
CustomerSchema.pre("save", function (next) {
  if (!this.referralLink && this.referralCampaign) {
    this.referralLink = `https://helpful-cajeta-f1a22b.netlify.app/refer/${this._id}/${this.referralCampaign}`;
  }
  next();
});

module.exports = mongoose.model("Customer", CustomerSchema);
