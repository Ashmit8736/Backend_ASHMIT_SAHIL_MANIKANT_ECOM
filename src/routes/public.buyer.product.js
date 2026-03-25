import express from "express";
import {
    getBuyerProducts, getPopularProducts, getProductsByCategory, getBuyerProductsByCategory,
    getBuyerCategoryProducts, getBuyerPriceRange, searchBuyerProducts
} from "../controllers/publicBuyerProduct.js";

const router = express.Router();

// ⭐ BUYERS → seller + supplier products
router.get("/buyer/products", getBuyerProducts);
router.get("/popular-products", getPopularProducts);

router.get("/products/by-category/:id", getProductsByCategory);
router.get(
    "/buyer/products/by-category/:id",
    getBuyerProductsByCategory
);

router.get("/buyer/category-products/:id", getBuyerCategoryProducts);

router.get("/price-range", getBuyerPriceRange);


router.get("/buyer/search", searchBuyerProducts);


export default router;
