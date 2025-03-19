const express = require("express");
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  bulkImportCustomers,
  sendEmail,
  sendBulkEmail,
  getCustomerProfile,
  updateWelcomeStatus,
  getPublicWelcomeInfo,
  createPublicCustomer,
  getPublicCustomer,
  getTags,
} = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/welcome/:userId", getPublicWelcomeInfo);
router.post("/public-referral", createPublicCustomer);
router.get("/:id/public", getPublicCustomer);

// Business owner routes
router.post("/", protect, authorize("business"), createCustomer);
router.get("/", protect, authorize("business"), getCustomers);
router.get("/:id", protect, authorize("business"), getCustomer);
router.put("/:id", protect, authorize("business"), updateCustomer);
router.delete("/:id", protect, authorize("business"), deleteCustomer);
router.post("/import", protect, authorize("business"), bulkImportCustomers);

// Customer user routes
router.get("/profile", protect, authorize("customer"), getCustomerProfile);
router.put(
  "/update-welcome",
  protect,
  authorize("customer"),
  updateWelcomeStatus
);

// Customer routes
router.post("/:id/email", protect, sendEmail);
router.post("/email", protect, sendBulkEmail);

// All routes are protected
router.use(protect);

// Customer routes
router.route("/tags").get(getTags);
router
  .route("/:id")
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
