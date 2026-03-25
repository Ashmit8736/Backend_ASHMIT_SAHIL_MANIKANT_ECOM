const express = require("express");
const router = express.Router();

const supplierAuthController = require("../controllers/supplierAuth.controller");
const supplierOtpController = require("../controllers/supplierOtp.controller");

/**
 * @swagger
 * tags:
 *   name: Supplier
 *   description: Supplier Registration & Login APIs
 */

//
// ------------------------- PHONE OTP -------------------------
//

/**
 * @swagger
 * /api/supplier/register-send-otp:
 *   post:
 *     summary: Send OTP to supplier phone for registration
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Phone already exists or invalid
 */
router.post("/register-send-otp", supplierOtpController.supplierRegisterSendOTP);

/**
 * @swagger
 * /api/supplier/register-verify-otp:
 *   post:
 *     summary: Verify supplier phone OTP
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/register-verify-otp", supplierOtpController.supplierRegisterVerifyOTP);

//
// ------------------------- EMAIL OTP -------------------------
//

/**
 * @swagger
 * /api/supplier/register-send-email-otp:
 *   post:
 *     summary: Send email OTP to supplier for registration
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "supplier@example.com"
 *     responses:
 *       200:
 *         description: Email OTP sent successfully
 *       400:
 *         description: Email already exists or invalid
 */
router.post("/register-send-email-otp", supplierOtpController.supplierRegisterSendEmailOTP);

/**
 * @swagger
 * /api/supplier/register-verify-email-otp:
 *   post:
 *     summary: Verify supplier email OTP
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email OTP verified successfully
 */
router.post("/register-verify-email-otp", supplierOtpController.supplierRegisterVerifyEmailOTP);

//
// ------------------------- FINAL REGISTRATION -------------------------
//

/**
 * @swagger
 * /api/supplier/register:
 *   post:
 *     summary: Final supplier registration after OTP verification
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               company_name:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               gst_no:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier registered successfully
 *       400:
 *         description: OTP not verified or existing user
 */
router.post("/register", supplierAuthController.supplierRegistration);

//
// ------------------------- LOGIN -------------------------
//

/**
 * @swagger
 * /api/supplier/login:
 *   post:
 *     summary: Supplier login using phone & password
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Supplier not approved
 */
router.post("/login", supplierAuthController.supplierLogin);

//
// ------------------------- FORGOT PASSWORD -------------------------
//

/**
 * @swagger
 * /api/supplier/forgot-password/send-otp:
 *   post:
 *     summary: Send OTP for supplier forgot password
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
    "/forgot-password/send-otp",
    supplierAuthController.supplierForgotPasswordSendOtp
);

/**
 * @swagger
 * /api/supplier/forgot-password/verify-otp:
 *   post:
 *     summary: Verify OTP for supplier forgot password
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post(
    "/forgot-password/verify-otp",
    supplierAuthController.supplierForgotPasswordVerifyOtp
);

/**
 * @swagger
 * /api/supplier/reset-password:
 *   post:
 *     summary: Reset supplier password
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
    "/reset-password",
    supplierAuthController.supplierResetPassword
);


module.exports = router;
