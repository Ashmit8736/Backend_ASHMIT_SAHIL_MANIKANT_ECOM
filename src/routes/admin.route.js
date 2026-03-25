// import express from "express";
const express = require("express");

const {
    adminRegisterController,
    adminLoginController,
    getallsellers,
    approveSeller,
    rejectSeller,
    getSingleSeller,
    getApprovedAndRejectCount,
    getAllBuyers,
    approveBuyer,
    rejectBuyer,
    getAllSuppliers,
    approveSupplier,
    rejectSupplier,
    getBuyerStatusCounts,
    getSupplierStatusCounts,
    getAllUsers,
    adminGetAllProducts,
    adminGetAllOrders,
    adminUpdateOrderStatus,
    getAdminSettings, updateAdminSettings,
    adminGetSupplierTransactions,
    adminGetSupplierWithdrawals,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminGetSupplierOrders,
    adminGetSellerTransactions,
    adminGetSellerWithdrawals,
    adminApproveSellerWithdrawal,
    adminRejectSellerWithdrawal,
    adminGetSellerOrders,
    adminGetSellerWalletSummary,
    getAdminProfile,
    adminGetInventory,
    adminGetAnalytics,
    adminTopProducts,
    adminCategoryStats,
    getNotifications,
    getUnreadCount,
    markAsRead,
    adminDashboardStats,
    adminAnalytics,
    adminCategoryStats1,
} = require("../controllers/admin.controller.js");

const{
    adminAddCategory,
    adminGetCategories,
    adminUpdateCategory,
    // adminUpdateCategoryImage,
    adminEnableCategory,
    adminDisableCategory,
    adminDeleteCategory,
    // adminDeleteCategory,
    adminAddCategoryV2,
    adminGetCategoryTree,
    adminBulkUploadCategories,



}  = require("../controllers/adminCategory.controller.js");


const{ imagekitAuth }  = require ("../controllers/imagekit.controller.js");

const { adminAuth }  = require("../middlewares/adminAuth.js");
const { uploadExcel }  = require ("../middlewares/uploadExcel.js");

const route = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Admin registered successfully
 */
route.post("/register", adminRegisterController);


/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: mojija@gmail.com
 *               password:
 *                 type: string
 *                 example: Ashish09876
 */
route.post("/login", adminLoginController);


/**
 * @swagger
 * /api/admin/all-seller:
 *   get:
 *     summary: Get all sellers
 *     tags: [Admin]
 */
route.get("/all-seller", adminAuth, getallsellers);


/**
 * @swagger
 * /api/admin/approveSeller/{sellerId}:
 *   patch:
 *     summary: Approve a seller
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Seller ID
 */
route.patch("/approveSeller/:sellerId", adminAuth, approveSeller);


/**
 * @swagger
 * /api/admin/rejectSeller/{sellerId}:
 *   patch:
 *     summary: Reject a seller
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Seller ID
 */
route.patch("/rejectSeller/:sellerId", adminAuth, rejectSeller);


/**
 * @swagger
 * /api/admin/single-seller/{sellerId}:
 *   get:
 *     summary: Get single seller details
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Seller ID
 */
route.get("/single-seller/:sellerId", adminAuth, getSingleSeller);


/**
 * @swagger
 * /api/admin/statusCount:
 *   get:
 *     summary: Count approved and rejected sellers
 *     tags: [Admin]
 */
route.get("/statusCount", adminAuth, getApprovedAndRejectCount);


/**
 * @swagger
 * /api/admin/all-buyers:
 *   get:
 *     summary: Get all buyers
 *     tags: [Admin]
 */
route.get("/all-buyers", adminAuth, getAllBuyers);


/**
 * @swagger
 * /api/admin/approveBuyer/{buyerId}:
 *   patch:
 *     summary: Approve buyer
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Buyer ID
 */
route.patch("/approveBuyer/:buyerId", adminAuth, approveBuyer);


/**
 * @swagger
 * /api/admin/rejectBuyer/{buyerId}:
 *   patch:
 *     summary: Reject buyer
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Buyer ID
 */
route.patch("/rejectBuyer/:buyerId", adminAuth, rejectBuyer);


/**
 * @swagger
 * /api/admin/all-suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Admin]
 */
route.get("/all-suppliers", adminAuth, getAllSuppliers);


/**
 * @swagger
 * /api/admin/approveSupplier/{supplierId}:
 *   patch:
 *     summary: Approve supplier
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Supplier ID
 */
route.patch("/approveSupplier/:supplierId", adminAuth, approveSupplier);


/**
 * @swagger
 * /api/admin/rejectSupplier/{supplierId}:
 *   patch:
 *     summary: Reject supplier
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Supplier ID
 */
route.patch("/rejectSupplier/:supplierId", adminAuth, rejectSupplier);

/**
 * @swagger
 * /api/admin/buyers/status-count:
 *   get:
 *     summary: Get buyer approval status counts (approved, rejected, pending)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer approval status counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 approved:
 *                   type: integer
 *                   example: 12
 *                 rejected:
 *                   type: integer
 *                   example: 3
 *                 pending:
 *                   type: integer
 *                   example: 5
 */
route.get("/buyers/status-count", adminAuth, getBuyerStatusCounts);

/**
 * @swagger
 * /api/admin/suppliers/status-count:
 *   get:
 *     summary: Get supplier approval status counts (approved, rejected, pending)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supplier approval status counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 approved:
 *                   type: integer
 *                   example: 8
 *                 rejected:
 *                   type: integer
 *                   example: 2
 *                 pending:
 *                   type: integer
 *                   example: 4
 */
route.get("/suppliers/status-count", adminAuth, getSupplierStatusCounts);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (buyers, sellers, suppliers, admins)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns merged user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                         example: Buyer
 *                       status:
 *                         type: string
 *                         example: approved
 *                       created_at:
 *                         type: string
 */
route.get("/users", adminAuth, getAllUsers);


/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products from sellers and suppliers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all seller + supplier products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       sku:
 *                         type: string
 *                       category:
 *                         type: string
 *                       owner_name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       stock:
 *                         type: number
 *                       type:
 *                         type: string
 *                         example: seller
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 */
route.get("/all-products", adminAuth, adminGetAllProducts);
/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin]
 */
route.get("/orders", adminAuth, adminGetAllOrders);


/**
 * @swagger
 * /api/admin/orders/update-status/{orderId}:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin]
 */
route.patch("/orders/update-status/:orderId", adminAuth, adminUpdateOrderStatus);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get current admin settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns admin site settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 settings:
 *                   type: object
 *                   properties:
 *                     site_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     language:
 *                       type: string
 *                     two_factor:
 *                       type: boolean
 *                     maintenance_mode:
 *                       type: string
 */
route.get("/settings", adminAuth, getAdminSettings);


/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update admin settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *                 example: MojiJa Admin
 *               email:
 *                 type: string
 *                 example: admin@mojija.com
 *               language:
 *                 type: string
 *                 example: English
 *               twoFactor:
 *                 type: boolean
 *                 example: false
 *               maintenanceMode:
 *                 type: string
 *                 example: Off
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
route.put("/settings", adminAuth, updateAdminSettings);


/**
 * @swagger
 * /api/admin/supplier-transactions:
 *   get:
 *     summary: Get all supplier transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all supplier transactions
 */
route.get("/supplier-transactions", adminAuth, adminGetSupplierTransactions);


/**
 * @swagger
 * /api/admin/supplier-withdrawals:
 *   get:
 *     summary: Get all supplier withdrawal requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of withdrawal requests
 */
route.get("/supplier-withdrawals", adminAuth, adminGetSupplierWithdrawals);
/**
 * @swagger
 * /api/admin/withdrawals/{id}/approve:
 *   patch:
 *     summary: Approve supplier withdrawal request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal approved successfully
 */
route.patch("/withdrawals/:id/approve", adminAuth, adminApproveWithdrawal);
/**
 * @swagger
 * /api/admin/withdrawals/{id}/reject:
 *   patch:
 *     summary: Reject supplier withdrawal request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal rejected & refunded
 */
route.patch("/withdrawals/:id/reject", adminAuth, adminRejectWithdrawal);
/**
 * @swagger
 * /api/admin/supplier-orders:
 *   get:
 *     summary: Get all supplier orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All supplier orders with buyer & supplier details
 */
route.get("/supplier-orders", adminAuth, adminGetSupplierOrders);

/**
 * @swagger
 * /api/admin/seller-transactions:
 *   get:
 *     summary: Get all seller transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all seller wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       seller_id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                         example: 5000.00
 *                       type:
 *                         type: string
 *                         example: credit
 *                       status:
 *                         type: string
 *                         example: Completed
 *                       txn_id:
 *                         type: string
 *                         example: "TXN12345"
 *                       description:
 *                         type: string
 *                         example: "Order payout received"
 *                       created_at:
 *                         type: string
 *                         example: "2025-12-09 16:25:55"
 *                       seller_name:
 *                         type: string
 *                       seller_email:
 *                         type: string
 */
route.get("/seller-transactions", adminAuth, adminGetSellerTransactions);


/**
 * @swagger
 * /api/admin/seller-withdrawals:
 *   get:
 *     summary: Get all seller withdrawal requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller withdrawal requests
 */
route.get("/seller-withdrawals", adminAuth, adminGetSellerWithdrawals);

/**
 * @swagger
 * /api/admin/seller-withdrawals/{id}/approve:
 *   patch:
 *     summary: Approve seller withdrawal request
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Withdrawal Request ID
 */
route.patch("/seller-withdrawals/:id/approve", adminAuth, adminApproveSellerWithdrawal);
/**
 * @swagger
 * /api/admin/seller-withdrawals/{id}/reject:
 *   patch:
 *     summary: Reject seller withdrawal request
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Withdrawal Request ID
 */
route.patch("/seller-withdrawals/:id/reject", adminAuth, adminRejectSellerWithdrawal);
/**
 * @swagger
 * /api/admin/seller-orders:
 *   get:
 *     summary: Get all seller orders for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
route.get("/seller-orders", adminAuth, adminGetSellerOrders);
/**
 * @swagger
 * /api/admin/seller-wallets:
 *   get:
 *     summary: Get all seller wallet summaries
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
route.get("/seller-wallets", adminAuth, adminGetSellerWalletSummary);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get logged-in admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Admin User
 *                     email:
 *                       type: string
 *                       example: admin@b2b.com
 *                     created_at:
 *                       type: string
 *                       example: "2024-01-01 12:30:00"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
route.get("/profile", adminAuth, getAdminProfile);

/**
 * @swagger
 * /api/admin/inventory:
 *   get:
 *     summary: Get inventory of all products
 *     tags: [Admin]
 */
route.get("/inventory", adminAuth, adminGetInventory);


/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get analytics data for revenue, orders, customers & trends
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: integer
 *           enum: [7, 30, 365]
 *         required: true
 *         description: 
 *           Time range for analytics  
 *           - 7 = Last 7 days  
 *           - 30 = Last 30 days  
 *           - 365 = This year
 *     responses:
 *       200:
 *         description: Analytics data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 26000
 *                     totalOrders:
 *                       type: integer
 *                       example: 124
 *                     newCustomers:
 *                       type: integer
 *                       example: 32
 *                     avgOrderValue:
 *                       type: number
 *                       example: 209.67
 *                 chartData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-01-14"
 *                       revenue:
 *                         type: number
 *                         example: 18000
 */
// route.get("/analytics", adminAuth, adminGetAnalytics);



/**
 * @swagger
 * /api/admin/top-products:
 *   get:
 *     summary: Get top 5 selling products for dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top selling products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Wireless Headphones Pro
 *                       units:
 *                         type: string
 *                         example: "1243 units sold"
 *                       sales:
 *                         type: string
 *                         example: ₹124300
 *                       trend:
 *                         type: string
 *                         example: up
 */
route.get("/top-products", adminAuth, adminTopProducts);
/**
 * @swagger
 * /api/admin/category-stats:
 *   get:
 *     summary: Get product sales distribution by categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categoryStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Electronics
 *                       percentage:
 *                         type: number
 *                         example: 35
 *                       value:
 *                         type: number
 *                         example: 120
 *                       color:
 *                         type: string
 *                         example: "#4F46E5"
 */
// route.get("/category-stats", adminAuth, adminCategoryStats);

/**
 * @swagger
 * /api/admin/notifications/count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification count fetched
 */

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get all admin notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification list fetched
 */
route.get("/notifications", adminAuth, getNotifications);


/**
 * @swagger
 * /api/admin/notifications/count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched
 */
route.get("/notifications/count", adminAuth, getUnreadCount);


/**
 * @swagger
 * /api/admin/notifications/read/{id}:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
route.patch("/notifications/read/:id", adminAuth, markAsRead);


/* ================= ADMIN CATEGORIES ================= */

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Add new category (Level 1 / 2 / 3)
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *               - image_url
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: All electronic items
 *               image_url:
 *                 type: string
 *                 example: https://ik.imagekit.io/demo/electronics.png
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       200:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
route.post("/categories", adminAuth, adminAddCategory);

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories (Admin view)
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
route.get("/categories", adminAuth, adminGetCategories);


/**
 * @swagger
 * /api/admin/categories/{id}:
 *   patch:
 *     summary: Update category details (image / description)
 *     tags: [Admin]
 */
route.patch("/categories/:id", adminAuth, adminUpdateCategory);

/**
 * @swagger
 * /api/admin/categories/{id}/enable:
 *   patch:
 *     summary: Enable category
 *     tags: [Admin]
 */
route.patch("/categories/:id/enable", adminAuth, adminEnableCategory);

/**
 * @swagger
 * /api/admin/categories/{id}/disable:
 *   patch:
 *     summary: Disable category (soft delete)
 *     tags: [Admin]
 */
route.patch("/categories/:id/disable", adminAuth, adminDisableCategory);

// /**
//  * @swagger
//  * /api/admin/categories/{id}:
//  *   delete:
//  *     summary: Permanently delete category (only if no products)
//  *     tags: [Admin]
//  */
// route.delete("/categories/:id", adminAuth, adminDeleteCategory);



/**
 * @swagger
 * /api/admin/imagekit-auth:
 *   get:
 *     summary: Get ImageKit authentication parameters
 *     description: |
 *       Generates ImageKit authentication parameters (signature, token, expire)
 *       required for secure image upload from frontend.
 *       This endpoint is protected and can only be accessed by admin users.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ImageKit auth parameters generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "ab12cd34ef..."
 *                 expire:
 *                   type: integer
 *                   example: 1700000000
 *                 signature:
 *                   type: string
 *                   example: "e4f8c8b9f7..."
 *       401:
 *         description: Unauthorized - Admin token missing or invalid
 *       500:
 *         description: Failed to generate ImageKit authentication parameters
 */
route.get("/imagekit-auth", adminAuth, imagekitAuth);


/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Permanently delete category (only if no products)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
route.delete(
    "/categories/:id",
    adminAuth,
    adminDeleteCategory
);
/* ================= CATEGORY TREE (NEW) ================= */

route.post(
    "/categories-v2",
    adminAuth,
    adminAddCategoryV2
);

route.get(
    "/categories/tree",
    adminAuth,
    adminGetCategoryTree
);

route.get("/dashboard-stats",
    adminAuth,
    adminDashboardStats
);
route.get("/analytics",
    adminAuth,
    adminAnalytics
);

route.get("/category-stats",
    adminAuth,
    adminCategoryStats1
);




route.post(
    "/categories/bulk-upload",
    adminAuth,
    uploadExcel.single("file"),
    adminBulkUploadCategories
);



// export default route;
module.exports = route;