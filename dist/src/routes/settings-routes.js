"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const settings_controller_1 = require("../controllers/settings-controller");
const router = express_1.default.Router();
router.post("/banners", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.upload.array("images", 5), settings_controller_1.addFeatureBanners);
router.get("/get-banners", settings_controller_1.fetchFeatureBanners);
router.post("/update-feature-products", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, settings_controller_1.updateFeaturedProducts);
router.get("/fetch-feature-products", settings_controller_1.getFeaturedProducts);
exports.default = router;
