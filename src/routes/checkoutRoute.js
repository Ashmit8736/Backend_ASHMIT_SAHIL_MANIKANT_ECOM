
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const {
  placeOrder,
  getMyOrders,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  cancelOrder,
} = require("../controllers/checkout.controller");

const router = express.Router();

router.post("/place-order", authMiddleware, placeOrder);
router.get("/orders", authMiddleware, getMyOrders);
router.get("/addresses", authMiddleware, getMyAddresses);
router.post("/address", authMiddleware, addAddress);
router.put("/address/:address_id", authMiddleware, updateAddress);
router.delete("/address/:address_id", authMiddleware, deleteAddress);
router.put("/order/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;