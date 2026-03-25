import express from "express";
import {
  askQuestion,
  getQA,
  answerQuestion,
  getSupplierQuestions,
  getSellerQuestions
} from "../controllers/productQA.controller.js";

import buyerAuth from "../middlewares/buyerAuth.js";
import sellerAuth from "../middlewares/sellerProduct.middleware.js";
import supplierAuth from "../middlewares/supplierProduct.middleware.js";

const router = express.Router();

// Public
router.get("/:productId", getQA);

// Buyer
router.post("/ask", buyerAuth, askQuestion);

// Seller / Supplier
router.post("/answer", sellerAuth, answerQuestion);
router.post("/answer-supplier", supplierAuth, answerQuestion);
// ✅ Seller ke questions fetch karne ka route
router.get("/seller/questions", sellerAuth, getSellerQuestions);

// ✅ ADD KARO
router.get("/supplier/questions", supplierAuth, getSupplierQuestions);

export default router;
