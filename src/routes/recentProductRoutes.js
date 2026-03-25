import express from "express";
import { getRecentProducts } from "../controllers/recent.Product.controller.js";

const router = express.Router();

router.get("/products/recent", getRecentProducts);

export default router;
