
import express from "express";
import multer from "multer";
import verifySupplierProduct from "../middlewares/supplierProduct.middleware.js";

import {
   supplierProduct,
   supplierProductImage,

   getSupplierProducts,
   getAllSupplierProduct,
   updateSupplierProduct,
   deleteSupplierProduct,

   getSupplierInventory,
   updateSupplierStock,

   getSupplierOrders,
   updateSupplierOrderStatus,

   getSupplierProfile,
   updateSupplierProfile,

   getSupplierSettings,
   upsertSupplierSettings,
   verifyIFSC,

   getSupplierMessages,
   getSupplierMessageById,
   sendSupplierMessage,
   getSupplierUnreadCount,

   getTradeAssuranceStats,
   getTradeAssuranceSummary,
   getTradeAssuranceTrend,
   getTradeAssuranceClaims,

   getFinanceStats,
   getSupplierEarningsTrend,
   getSupplierPayouts,
   getSupplierWallet,
   createWithdrawRequest,
   getWithdrawRequests,

   getMarketplaceInsights,
   getSupplierDashboardStats,
   getSupplierRecentOrders,
   supplierCreateCustomCategory,

} from "../controllers/supplierProduct.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ======================================================
   📦 PRODUCTS (CATEGORY MASTER BASED)
====================================================== */

// 1️⃣ Create Product (Level 2 / 3 category_master only)
router.post(
   "/products",
   verifySupplierProduct,
   supplierProduct
);

// 2️⃣ Upload Product Images (max 5)
router.post(
   "/products/:id/images",
   verifySupplierProduct,
   upload.array("image", 5),
   supplierProductImage
);

// 3️⃣ Products (simple list / sort)
router.get(
   "/products",
   verifySupplierProduct,
   getSupplierProducts
);

// 4️⃣ Products (paginated list)
router.get(
   "/products/paginated",
   verifySupplierProduct,
   getAllSupplierProduct
);

// 5️⃣ Update Product
router.put(
   "/products/:id",
   verifySupplierProduct,
   updateSupplierProduct
);

// 6️⃣ Delete Product
router.delete(
   "/products/:id",
   verifySupplierProduct,
   deleteSupplierProduct
);

/* ======================================================
   📦 INVENTORY
====================================================== */
router.get(
   "/inventory",
   verifySupplierProduct,
   getSupplierInventory
);

router.put(
   "/inventory/:id",
   verifySupplierProduct,
   updateSupplierStock
);

/* ======================================================
   📦 ORDERS
====================================================== */
router.get(
   "/orders",
   verifySupplierProduct,
   getSupplierOrders
);

router.put(
   "/orders/:order_id/status",
   verifySupplierProduct,
   updateSupplierOrderStatus
);

/* ======================================================
   👤 PROFILE & SETTINGS
====================================================== */
router.get(
   "/profile",
   verifySupplierProduct,
   getSupplierProfile
);

router.put(
   "/profile",
   verifySupplierProduct,
   updateSupplierProfile
);

router.get(
   "/settings",
   verifySupplierProduct,
   getSupplierSettings
);

router.put(
   "/settings",
   verifySupplierProduct,
   upsertSupplierSettings
);

router.get(
   "/verify-ifsc/:ifsc",
   verifySupplierProduct,
   verifyIFSC
);

/* ======================================================
   💬 MESSAGES
====================================================== */
router.get(
   "/messages",
   verifySupplierProduct,
   getSupplierMessages
);

router.get(
   "/messages/unread-count",
   verifySupplierProduct,
   getSupplierUnreadCount
);

router.get(
   "/messages/:id",
   verifySupplierProduct,
   getSupplierMessageById
);

router.post(
   "/messages",
   verifySupplierProduct,
   sendSupplierMessage
);

/* ======================================================
   🛡️ TRADE ASSURANCE
====================================================== */
router.get(
   "/trade-assurance/stats",
   verifySupplierProduct,
   getTradeAssuranceStats
);

router.get(
   "/trade-assurance/summary",
   verifySupplierProduct,
   getTradeAssuranceSummary
);

router.get(
   "/trade-assurance/trend",
   verifySupplierProduct,
   getTradeAssuranceTrend
);

router.get(
   "/trade-assurance/claims",
   verifySupplierProduct,
   getTradeAssuranceClaims
);

/* ======================================================
   💰 FINANCE & PAYOUTS
====================================================== */
router.get(
   "/finance/stats",
   verifySupplierProduct,
   getFinanceStats
);

router.get(
   "/finance/earnings-trend",
   verifySupplierProduct,
   getSupplierEarningsTrend
);

router.get(
   "/finance/payouts",
   verifySupplierProduct,
   getSupplierPayouts
);

router.get(
   "/finance/wallet",
   verifySupplierProduct,
   getSupplierWallet
);

router.post(
   "/finance/withdraw",
   verifySupplierProduct,
   createWithdrawRequest
);

router.get(
   "/finance/withdrawals",
   verifySupplierProduct,
   getWithdrawRequests
);

/* ======================================================
   📊 DASHBOARD & INSIGHTS
====================================================== */
router.get(
   "/marketplace/insights",
   verifySupplierProduct,
   getMarketplaceInsights
);

router.get(
   "/dashboard/stats",
   verifySupplierProduct,
   getSupplierDashboardStats
);

router.get(
   "/dashboard/recent-orders",
   verifySupplierProduct,
   getSupplierRecentOrders
);

router.post(
   "/category/custom",
   verifySupplierProduct,
   supplierCreateCustomCategory
);


export default router;
