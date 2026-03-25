import express from "express";
import relatedProductController from "../controllers/relatedProduct.controller.js";

const router = express.Router();

router.get("/:id/related", relatedProductController.getRelatedProducts);

export default router;
