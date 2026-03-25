import express from "express";
import multer from "multer";
import verifySellerProduct from "../middlewares/sellerProduct.middleware.js";

import {
        sellerProduct,
        sellerImage,
        deleteProduct,
        updateProduct,
        getSellerInventory,
        updateSellerStock,
        getSellerWallet,
        getSellerTransactions,
        requestWithdraw,
        getSellerOrders,
        updateOrderStatus,
        getSellerProducts,
        sellerCreateCustomCategory,
        updateProductImages,
        getSellerDashboardStats,
        getSellerOrderGraph,
} from "../controllers/sellerProduct.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// PRODUCT
router.post("/product", verifySellerProduct, upload.none(), sellerProduct);
router.post("/product/image", verifySellerProduct, upload.array("image", 5), sellerImage);

// UPDATE / DELETE
router.put("/product/:id", verifySellerProduct, updateProduct);
router.delete("/product/:id", verifySellerProduct, deleteProduct);

// INVENTORY
router.get("/inventory", verifySellerProduct, getSellerInventory);
router.put("/inventory/:id", verifySellerProduct, updateSellerStock);

// PAYMENTS
router.get("/payments/wallet", verifySellerProduct, getSellerWallet);
router.get("/payments/transactions", verifySellerProduct, getSellerTransactions);
router.post("/payments/withdraw", verifySellerProduct, requestWithdraw);

// ORDERS
router.get("/orders", verifySellerProduct, getSellerOrders);
router.put("/orders/:id/status", verifySellerProduct, updateOrderStatus);

// PRODUCTS (LIST)
router.get("/products", verifySellerProduct, getSellerProducts);

router.post(
        "/category/custom",
        verifySellerProduct,
        sellerCreateCustomCategory
);

router.put(
        "/product/:id/images",
        verifySellerProduct,
        upload.array("image", 5),
        updateProductImages
);
router.get("/dashboard/stats", verifySellerProduct, getSellerDashboardStats);
router.get(
        "/dashboard/order-graph",
        verifySellerProduct,
        getSellerOrderGraph
);
export default router;
