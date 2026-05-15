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
        updateItemStatus,
        getOrderTracking,
        updateProductStatus,
} from "../controllers/sellerProduct.js";
import verifyBuyer from "../middlewares/buyerAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// PRODUCT
router.post("/product", verifySellerProduct, upload.none(), sellerProduct);
router.post("/product/image", verifySellerProduct, upload.array("image", 5), sellerImage);

// UPDATE / DELETE
router.put("/product/:id", verifySellerProduct, updateProduct);
router.put("/product/:id/status", verifySellerProduct, updateProductStatus);
router.delete("/product/:id", verifySellerProduct, deleteProduct);

// INVENTORY
router.get("/inventory", verifySellerProduct, getSellerInventory);
router.put("/inventory/:id", verifySellerProduct, updateSellerStock);

// PAYMENTS
router.get("/payments/wallet", verifySellerProduct, getSellerWallet);
router.get("/payments/transactions", verifySellerProduct, getSellerTransactions);
router.post("/payments/withdraw", verifySellerProduct, requestWithdraw);

// ORDERS
// ✅ TRACKING FETCH
router.get(
  "/orders/item/:itemId/tracking",
  verifySellerProduct,
  getOrderTracking
);


router.get("/orders", verifySellerProduct, getSellerOrders);
router.put("/orders/:id/status", verifySellerProduct, updateOrderStatus);
// ✅ YAHAN ADD KARO — item-level status update
router.put("/orders/:orderId/item/:itemId/status", verifySellerProduct, updateItemStatus);


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
