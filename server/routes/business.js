const express = require("express");
const router = express.Router();
const {
  createBusiness,
  getBusiness,
  updateBusiness,
  updateSettings,
  updateZapierIntegration,
  uploadLogo,
  deleteBusiness,
  getPublicBusiness,
} = require("../controllers/businessController");
const { protect } = require("../middleware/auth");
const multer = require("multer");

// Public routes
router.get("/:id/public", getPublicBusiness);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/logos");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image file (jpg, jpeg, png)"));
    }
    cb(null, true);
  },
});

// Business routes
router.post("/", protect, createBusiness);
router.get("/", protect, getBusiness);
router.put("/", protect, updateBusiness);
router.put("/settings", protect, updateSettings);
router.put("/zapier", protect, updateZapierIntegration);
router.put("/logo", protect, upload.single("logo"), uploadLogo);
router.delete("/", protect, deleteBusiness);

module.exports = router;
