import express from "express";
import { getPublicCategories, publicGetCategoryTree, getProductsByCategory } from "../controllers/publicCategory.js";

const router = express.Router();

router.get("/categories", getPublicCategories);
router.get("/categories/tree", publicGetCategoryTree);
router.get(
    "/products/by-category/:id",
    getProductsByCategory
);



export default router;
