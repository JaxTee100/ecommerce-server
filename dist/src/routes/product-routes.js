"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const product_controller_1 = require("../controllers/product-controller");
const router = express_1.default.Router();
router.post("/create-new-product", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.upload.array("images", 5), product_controller_1.createProduct);
//this will fetch all products created by the admin
router.get("/fetch-admin-products", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, product_controller_1.fetchAllProductsForAdmin);
//this will fetch all the selected images for the client
router.get("/fetch-client-products", product_controller_1.getProductsForClient);
//for anybody to access this comes in when a user or an admin selects a product
router.get("/:id", authMiddleware_1.authenticateJwt, product_controller_1.getProductByID);
router.put("/:id", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, product_controller_1.updateProduct);
router.delete("/:id", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, product_controller_1.deleteProduct);
exports.default = router;
