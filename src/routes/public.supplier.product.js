import express from "express";
import {
    getPublicSupplierProducts,
    getPublicSupplierProductById,
    getPublicSupplierProductsByCategory
} from "../controllers/publicSupplierProduct.js";

const router = express.Router();

router.get("/products", getPublicSupplierProducts);
router.get("/products/by-category/:id", getPublicSupplierProductsByCategory);
router.get("/products/:id", getPublicSupplierProductById);


export default router;
