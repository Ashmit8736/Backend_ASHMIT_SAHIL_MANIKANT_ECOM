import express from "express";
import {
    addOrUpdateProductRating,
    getProductRatings,
} from "../controllers/productRating.controller.js";

import { verifyBuyer } from "../middlewares/buyerAuth.js";

const router = express.Router();

/* ⭐ Buyer gives rating */
router.post("/rating", verifyBuyer, addOrUpdateProductRating);

/* ⭐ Public reviews */
router.get(
    "/ratings/:product_id/:owner_type",
    getProductRatings
);

export default router;
