import express from "express";
import { applyCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.post("/apply", applyCoupon);

export default router;
