const Analytics = require("../models/Analytics");
const Business = require("../models/Business");
const Campaign = require("../models/Campaign");
const Customer = require("../models/Customer");
const Referral = require("../models/Referral");
const Reward = require("../models/Reward");
const mongoose = require("mongoose");

// @desc    Get business dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    const { startDate, endDate, campaignId } = req.query;
    const query = { business: business._id };
    if (campaignId && campaignId !== "all") {
      query.campaign = campaignId;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get counts for current period
    const referralsCount = await Referral.countDocuments(query);
    const convertedReferralsCount = await Referral.countDocuments({
      ...query,
      status: "converted",
    });
    const rewardsCount = await Reward.countDocuments(query);
    const claimedRewardsCount = await Reward.countDocuments({
      ...query,
      status: "claimed",
    });
    const newCustomersCount = await Customer.countDocuments({
      ...query,
      source: "referral",
    });

    // Get counts for previous period
    const previousQuery = { ...query };
    if (startDate && endDate) {
      const duration = new Date(endDate) - new Date(startDate);
      previousQuery.createdAt = {
        $gte: new Date(new Date(startDate) - duration),
        $lte: new Date(startDate),
      };
    }

    const previousReferralsCount = await Referral.countDocuments(previousQuery);
    const previousConvertedCount = await Referral.countDocuments({
      ...previousQuery,
      status: "converted",
    });
    const previousRewardsCount = await Reward.countDocuments({
      ...previousQuery,
      status: "claimed",
    });
    const previousCustomersCount = await Customer.countDocuments({
      ...previousQuery,
      source: "referral",
    });

    // Calculate growth rates
    const referralGrowth =
      previousReferralsCount > 0
        ? ((referralsCount - previousReferralsCount) / previousReferralsCount) *
          100
        : 0;
    const conversionGrowth =
      previousConvertedCount > 0
        ? ((convertedReferralsCount - previousConvertedCount) /
            previousConvertedCount) *
          100
        : 0;
    const rewardsGrowth =
      previousRewardsCount > 0
        ? ((claimedRewardsCount - previousRewardsCount) /
            previousRewardsCount) *
          100
        : 0;
    const customerGrowth =
      previousCustomersCount > 0
        ? ((newCustomersCount - previousCustomersCount) /
            previousCustomersCount) *
          100
        : 0;

    // Get referral trend data
    const referralTrend = await Referral.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          clicks: { $sum: 1 },
          conversions: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get referral sources data
    const referralSources = await Referral.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$sharingMethod",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          value: 1,
          _id: 0,
        },
      },
    ]);

    // Get campaign performance data
    const campaignPerformance = await Campaign.aggregate([
      {
        $match: campaignId
          ? { _id: mongoose.Types.ObjectId(campaignId) }
          : { business: business._id },
      },
      {
        $lookup: {
          from: "referrals",
          localField: "_id",
          foreignField: "campaign",
          as: "referrals",
        },
      },
      {
        $project: {
          name: 1,
          referrals: { $size: "$referrals" },
          conversions: {
            $size: {
              $filter: {
                input: "$referrals",
                as: "ref",
                cond: { $eq: ["$$ref.status", "converted"] },
              },
            },
          },
        },
      },
    ]);

    // Get top referrers
    const topReferrers = await Customer.aggregate([
      { $match: { business: business._id } },
      {
        $lookup: {
          from: "referrals",
          localField: "_id",
          foreignField: "referrer",
          as: "referrals",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          referrals: { $size: "$referrals" },
          conversions: {
            $size: {
              $filter: {
                input: "$referrals",
                as: "ref",
                cond: { $eq: ["$$ref.status", "converted"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ["$referrals", 0] },
              { $multiply: [{ $divide: ["$conversions", "$referrals"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { referrals: -1 } },
      { $limit: 5 },
    ]);

    // Get recent activity
    const recentActivity = await Referral.find(query)
      .sort("-createdAt")
      .limit(10)
      .populate("campaign", "name")
      .populate("referrer", "name")
      .lean()
      .then((activities) =>
        activities.map((activity) => ({
          date: activity.createdAt,
          event:
            activity.status === "converted" ? "Conversion" : "Referral Click",
          campaign: activity.campaign?.name || "Unknown Campaign",
          customer: activity.referrer?.name || "Unknown Customer",
        }))
      );

    res.status(200).json({
      success: true,
      data: {
        counts: {
          referrals: referralsCount,
          convertedReferrals: convertedReferralsCount,
          rewards: rewardsCount,
          claimedRewards: claimedRewardsCount,
          newCustomers: newCustomersCount,
        },
        conversionRate:
          referralsCount > 0
            ? (convertedReferralsCount / referralsCount) * 100
            : 0,
        referralGrowth,
        conversionGrowth,
        rewardsGrowth,
        customerGrowth,
        referralTrend,
        referralSources,
        campaignPerformance,
        topReferrers,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data. Please try again.",
    });
  }
};

// @desc    Get referral analytics
// @route   GET /api/analytics/referrals
// @access  Private
exports.getReferralAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get time period from query params
    const period = req.query.period || "monthly";
    const limit = parseInt(req.query.limit, 10) || 12;

    // Get referral counts by status
    const referralStatusCounts = await Referral.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format referral status counts
    const statusCounts = {};
    referralStatusCounts.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Get referral counts by sharing method
    const sharingMethodCounts = await Referral.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$sharingMethod", count: { $sum: 1 } } },
    ]);

    // Format sharing method counts
    const methodCounts = {};
    sharingMethodCounts.forEach((item) => {
      methodCounts[item._id] = item.count;
    });

    // Get referral trends over time
    const now = new Date();
    const referralTrends = await Referral.aggregate([
      { $match: { business: business._id } },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          status: 1,
        },
      },
      {
        $group: {
          _id:
            period === "daily"
              ? { year: "$year", month: "$month", day: "$day" }
              : period === "weekly"
              ? { year: "$year", week: "$week" }
              : { year: "$year", month: "$month" },
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          clicked: {
            $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] },
          },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
          rewarded: {
            $sum: { $cond: [{ $eq: ["$status", "rewarded"] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
          "_id.week": -1,
          "_id.day": -1,
        },
      },
      { $limit: limit },
    ]);

    // Format trends data for chart
    const trends = referralTrends
      .map((item) => {
        let label;
        if (period === "daily") {
          label = `${item._id.year}-${item._id.month}-${item._id.day}`;
        } else if (period === "weekly") {
          label = `${item._id.year}-W${item._id.week}`;
        } else {
          label = `${item._id.year}-${item._id.month}`;
        }

        return {
          label,
          total: item.total,
          pending: item.pending,
          clicked: item.clicked,
          converted: item.converted,
          rewarded: item.rewarded,
          expired: item.expired,
          rejected: item.rejected,
        };
      })
      .reverse();

    // Get campaign performance
    const campaignPerformance = await Campaign.find({ business: business._id })
      .select("name statistics")
      .sort("-statistics.successfulReferrals");

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        methodCounts,
        trends,
        campaignPerformance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private
exports.getCustomerAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get time period from query params
    const period = req.query.period || "monthly";
    const limit = parseInt(req.query.limit, 10) || 12;

    // Get customer counts by source
    const customerSourceCounts = await Customer.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]);

    // Format customer source counts
    const sourceCounts = {};
    customerSourceCounts.forEach((item) => {
      sourceCounts[item._id] = item.count;
    });

    // Get customer growth over time
    const now = new Date();
    const customerGrowth = await Customer.aggregate([
      { $match: { business: business._id } },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          source: 1,
        },
      },
      {
        $group: {
          _id:
            period === "daily"
              ? { year: "$year", month: "$month", day: "$day" }
              : period === "weekly"
              ? { year: "$year", week: "$week" }
              : { year: "$year", month: "$month" },
          total: { $sum: 1 },
          direct: {
            $sum: { $cond: [{ $eq: ["$source", "direct"] }, 1, 0] },
          },
          referral: {
            $sum: { $cond: [{ $eq: ["$source", "referral"] }, 1, 0] },
          },
          import: {
            $sum: { $cond: [{ $eq: ["$source", "import"] }, 1, 0] },
          },
          other: {
            $sum: { $cond: [{ $eq: ["$source", "other"] }, 1, 0] },
          },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
          "_id.week": -1,
          "_id.day": -1,
        },
      },
      { $limit: limit },
    ]);

    // Format growth data for chart
    const growth = customerGrowth
      .map((item) => {
        let label;
        if (period === "daily") {
          label = `${item._id.year}-${item._id.month}-${item._id.day}`;
        } else if (period === "weekly") {
          label = `${item._id.year}-W${item._id.week}`;
        } else {
          label = `${item._id.year}-${item._id.month}`;
        }

        return {
          label,
          total: item.total,
          direct: item.direct,
          referral: item.referral,
          import: item.import,
          other: item.other,
        };
      })
      .reverse();

    // Get top referrers
    const topReferrers = await Customer.find({ business: business._id })
      .sort("-referralStats.successfulReferrals")
      .limit(10)
      .select("name email referralStats");

    res.status(200).json({
      success: true,
      data: {
        sourceCounts,
        growth,
        topReferrers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reward analytics
// @route   GET /api/analytics/rewards
// @access  Private
exports.getRewardAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get reward counts by status
    const rewardStatusCounts = await Reward.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format reward status counts
    const statusCounts = {};
    rewardStatusCounts.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Get reward counts by type
    const rewardTypeCounts = await Reward.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // Format reward type counts
    const typeCounts = {};
    rewardTypeCounts.forEach((item) => {
      typeCounts[item._id] = item.count;
    });

    // Get reward counts by recipient type
    const recipientTypeCounts = await Reward.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: "$recipientType", count: { $sum: 1 } } },
    ]);

    // Format recipient type counts
    const recipientCounts = {};
    recipientTypeCounts.forEach((item) => {
      recipientCounts[item._id] = item.count;
    });

    // Get reward value by campaign
    const rewardValueByCampaign = await Reward.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: "$campaign",
          totalValue: { $sum: "$value" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaignInfo",
        },
      },
      { $unwind: "$campaignInfo" },
      {
        $project: {
          campaignName: "$campaignInfo.name",
          totalValue: 1,
          count: 1,
          averageValue: { $divide: ["$totalValue", "$count"] },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        typeCounts,
        recipientCounts,
        rewardValueByCampaign,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate and store periodic analytics
// @route   POST /api/analytics/generate
// @access  Private
exports.generateAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get period from request body
    const { period } = req.body;
    if (!period || !["daily", "weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Must be one of: daily, weekly, monthly, yearly",
      });
    }

    // Get date for analytics
    const date = new Date();

    // Check if analytics already exist for this period
    const existingAnalytics = await Analytics.findOne({
      business: business._id,
      period,
      date: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    });

    if (existingAnalytics) {
      return res.status(400).json({
        success: false,
        message: `${period} analytics already generated for today`,
      });
    }

    // Get referral counts
    const referralCounts = await Referral.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          clicked: {
            $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] },
          },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
          rewarded: {
            $sum: { $cond: [{ $eq: ["$status", "rewarded"] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get campaign counts
    const campaignCounts = await Campaign.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: null,
          active: {
            $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] },
          },
          ended: {
            $sum: { $cond: [{ $eq: ["$active", false] }, 1, 0] },
          },
          totalReferrals: { $sum: "$statistics.totalReferrals" },
        },
      },
    ]);

    // Calculate conversion rate
    const conversionRate =
      referralCounts.length > 0 && referralCounts[0].total > 0
        ? (referralCounts[0].converted / referralCounts[0].total) * 100
        : 0;

    // Get customer counts
    const customerCounts = await Customer.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          referred: {
            $sum: { $cond: [{ $eq: ["$source", "referral"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get new customers in the last period
    const newCustomerCounts = await Customer.countDocuments({
      business: business._id,
      createdAt: {
        $gte:
          period === "daily"
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
            : period === "weekly"
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
            : period === "monthly"
            ? new Date(date.getFullYear(), date.getMonth() - 1, date.getDate())
            : new Date(date.getFullYear() - 1, date.getMonth(), date.getDate()),
      },
    });

    // Get reward counts
    const rewardCounts = await Reward.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          issued: {
            $sum: { $cond: [{ $eq: ["$status", "issued"] }, 1, 0] },
          },
          claimed: {
            $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
          totalValue: { $sum: "$value" },
        },
      },
    ]);

    // Get sharing method counts
    const sharingCounts = await Referral.aggregate([
      { $match: { business: business._id } },
      {
        $group: {
          _id: "$sharingMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format sharing counts
    const sharing = {
      sms: 0,
      email: 0,
      facebook: 0,
      twitter: 0,
      whatsapp: 0,
      copy: 0,
      other: 0,
    };

    sharingCounts.forEach((item) => {
      if (item._id && sharing.hasOwnProperty(item._id)) {
        sharing[item._id] = item.count;
      } else {
        sharing.other += item.count;
      }
    });

    // Create analytics object
    const analytics = {
      business: business._id,
      date,
      period,
      referrals: {
        total: referralCounts.length > 0 ? referralCounts[0].total : 0,
        pending: referralCounts.length > 0 ? referralCounts[0].pending : 0,
        clicked: referralCounts.length > 0 ? referralCounts[0].clicked : 0,
        converted: referralCounts.length > 0 ? referralCounts[0].converted : 0,
        rewarded: referralCounts.length > 0 ? referralCounts[0].rewarded : 0,
        expired: referralCounts.length > 0 ? referralCounts[0].expired : 0,
        rejected: referralCounts.length > 0 ? referralCounts[0].rejected : 0,
      },
      campaigns: {
        active: campaignCounts.length > 0 ? campaignCounts[0].active : 0,
        ended: campaignCounts.length > 0 ? campaignCounts[0].ended : 0,
        totalReferrals:
          campaignCounts.length > 0 ? campaignCounts[0].totalReferrals : 0,
        conversionRate,
      },
      customers: {
        total: customerCounts.length > 0 ? customerCounts[0].total : 0,
        new: newCustomerCounts,
        active: customerCounts.length > 0 ? customerCounts[0].total : 0, // Assuming all customers are active
        referred: customerCounts.length > 0 ? customerCounts[0].referred : 0,
      },
      rewards: {
        total: rewardCounts.length > 0 ? rewardCounts[0].total : 0,
        issued: rewardCounts.length > 0 ? rewardCounts[0].issued : 0,
        claimed: rewardCounts.length > 0 ? rewardCounts[0].claimed : 0,
        expired: rewardCounts.length > 0 ? rewardCounts[0].expired : 0,
        totalValue: rewardCounts.length > 0 ? rewardCounts[0].totalValue : 0,
      },
      sharing,
      aiAssistant: {
        interactions: 0, // Placeholder for AI interactions
        suggestionsAccepted: 0, // Placeholder for AI suggestions
        followUpsSent: 0, // Placeholder for AI follow-ups
      },
      financials: {
        totalRevenue: 0, // Placeholder for revenue
        rewardsCost: rewardCounts.length > 0 ? rewardCounts[0].totalValue : 0,
        estimatedROI: 0, // Placeholder for ROI
      },
    };

    // Save analytics
    const savedAnalytics = await Analytics.create(analytics);

    res.status(201).json({
      success: true,
      analytics: savedAnalytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get historical analytics
// @route   GET /api/analytics/history
// @access  Private
exports.getHistoricalAnalytics = async (req, res) => {
  try {
    // Get business ID
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    // Get period from query params
    const period = req.query.period || "monthly";
    const limit = parseInt(req.query.limit, 10) || 12;

    // Get historical analytics
    const analytics = await Analytics.find({
      business: business._id,
      period,
    })
      .sort("-date")
      .limit(limit);

    res.status(200).json({
      success: true,
      count: analytics.length,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
