const express = require("express");
const authenticatemiddleware = require("../middlewares/auth.middleware");
const sellerController = require("../controllers/sellerAuth.controller");
const sellerOptController = require("../controllers/sellerOpt.controller");

const router = express.Router();

/* =====================================================
   SELLER REGISTRATION (OTP + EMAIL OTP)
===================================================== */

/**
 * @swagger
 * /api/auth/seller-register-send-otp:
 *   post:
 *     summary: Send phone OTP for seller registration
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
    "/seller-register-send-otp",
    sellerOptController.sellerRegisterSendOTP
);

/**
 * @swagger
 * /api/auth/seller-register-verify-otp:
 *   post:
 *     summary: Verify phone OTP for seller registration
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone OTP verified
 */
router.post(
    "/seller-register-verify-otp",
    sellerOptController.sellerRegisterVerifyOTP
);

/**
 * @swagger
 * /api/auth/seller-register-send-email-otp:
 *   post:
 *     summary: Send email OTP for seller registration
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "seller@email.com"
 *     responses:
 *       200:
 *         description: Email OTP sent
 */
router.post(
    "/seller-register-send-email-otp",
    sellerOptController.sellerRegisterSendEmailOTP
);

/**
 * @swagger
 * /api/auth/seller-register-verify-email-otp:
 *   post:
 *     summary: Verify email OTP for seller registration
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email OTP verified
 */
router.post(
    "/seller-register-verify-email-otp",
    sellerOptController.sellerRegisterVerifyEmailOTP
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register seller (final step)
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, email, fullname, password]
 *     responses:
 *       201:
 *         description: Seller registered successfully
 */
router.post("/register", sellerController.sellerRegistration);

/* =====================================================
   SELLER LOGIN
===================================================== */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Seller login using phone & password
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", sellerController.sellerLogin);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP for seller login
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login OTP sent
 */
router.post("/send-otp", sellerOptController.sellerSendOtp);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify seller login OTP
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *     responses:
 *       200:
 *         description: Login OTP verified
 */
router.post("/verify-otp", sellerOptController.sellerVerifyOtp);

/* =====================================================
   FORGOT & RESET PASSWORD (PHONE BASED)
===================================================== */

/**
 * @swagger
 * /api/auth/forget-password:
 *   post:
 *     summary: Send OTP for seller forgot password
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *     responses:
 *       200:
 *         description: Forgot password OTP sent
 */
router.post("/forget-password", sellerController.sellerForgotPassword);

/**
 * @swagger
 * /api/auth/verify-forgot-otp:
 *   post:
 *     summary: Verify forgot-password OTP
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *     responses:
 *       200:
 *         description: Forgot OTP verified
 */
router.post(
    "/verify-forgot-otp",
    sellerOptController.sellerVerifyForgotOtp
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset seller password
 *     tags: [Seller Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, newPassword]
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", sellerController.sellerResetPassword);

/* =====================================================
   PROTECTED SELLER ROUTES
===================================================== */

/**
 * @swagger
 * /api/auth/seller-data:
 *   get:
 *     summary: Get logged-in seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile returned
 */
router.get(
    "/seller-data",
    authenticatemiddleware.sellerAuthMiddleware,
    sellerController.getsellerData
);

/**
 * @swagger
 * /api/auth/seller-update-profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
    "/seller-update-profile",
    authenticatemiddleware.sellerAuthMiddleware,
    sellerController.updateSellerProfile
);

/**
 * @swagger
 * /api/auth/seller/change-password:
 *   put:
 *     summary: Change seller password
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put(
    "/change-password",
    authenticatemiddleware.sellerAuthMiddleware,
    sellerController.changeSellerPassword
);

module.exports = router;
