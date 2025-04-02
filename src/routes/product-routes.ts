import expess from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  createProduct,
  deleteProduct,
  fetchAllProductsForAdmin,
  getProductByID,
  updateProduct,
  getProductsForClient,
} from "../controllers/product-controller";

const router = expess.Router();

router.post(
  "/create-new-product",
  authenticateJwt,
  isSuperAdmin,
  upload.array("images", 5),
  createProduct
);

//this will fetch all products created by the admin
router.get(
  "/fetch-admin-products",
  authenticateJwt,
  isSuperAdmin,
  fetchAllProductsForAdmin
);

//this will fetch all the selected images for the client
router.get("/fetch-client-products", getProductsForClient);

//for anybody to access this comes in when a user or an admin selects a product
router.get("/:id", authenticateJwt, getProductByID);

router.put("/:id", authenticateJwt, isSuperAdmin, updateProduct);
router.delete("/:id", authenticateJwt, isSuperAdmin, deleteProduct);

export default router;