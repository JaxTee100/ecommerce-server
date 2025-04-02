import express from "express";
import {
  addToCart,
  clearEntireCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../controllers/cart-controller";

const router = express.Router();

router.get("/fetch-cart",  getCart);
router.post("/add-to-cart", addToCart);
router.delete("/remove/:id", removeFromCart);
router.put("/update/:id",  updateCartItemQuantity);
router.post("/clear-cart",  clearEntireCart);

export default router;