
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  addToCart,
  getUserCart,
  updateCartQuantity,
  deleteFromCart,
} = require("../controllers/cartController");

const router = express.Router();

// ADD TO CART
router.post("/add", authMiddleware, addToCart);

// GET USER CART
router.get("/", authMiddleware, getUserCart);

// UPDATE QUANTITY
router.put("/update/:cart_id", authMiddleware, updateCartQuantity);

// DELETE FROM CART
router.delete("/:cart_id", authMiddleware, deleteFromCart);

module.exports = router;