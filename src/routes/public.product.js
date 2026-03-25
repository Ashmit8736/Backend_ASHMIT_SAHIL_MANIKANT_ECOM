import express from "express";
import {
    getPublicProducts,
    getPublicProductById,
    getPublicProductsByCategory,
    getPublicProductDetails,

} from "../controllers/publicProduct.js";


const router = express.Router();



router.get("/products", getPublicProducts);
router.get("/products/:id", getPublicProductById);
// router.get("/category/:name", getPublicProductsByCategory);
router.get("/products/by-category/:id", getPublicProductsByCategory);
router.get("/product/:id", getPublicProductDetails);


export default router; 
