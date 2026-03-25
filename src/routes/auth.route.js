// const express = require('express');
// const authenticatemiddleware = require('../middlewares/auth.middleware');
// const authValidation = require('../middlewares/authValidation.middleware');

// /* CONTROLLERS */
// const authControlers = require('../controllers/auth.controller');
// const optControlers = require('../controllers/opt.controller');

// const route = express.Router();

// /* =============================================================
//   📘 SWAGGER: AUTH ROUTES DOCUMENTATION
// ============================================================= */

// /**
//  * @swagger
//  * tags:
//  *   - name: Auth
//  *     description: Authentication & OTP APIs
//  */

// /* =============================================================
//    🟦 REGISTER USER — POST /api/auth/register
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/register:
//  *   post:
//  *     summary: Register new user after OTP verification
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               username: { type: string }
//  *               email: { type: string }
//  *               password: { type: string }
//  *               phone: { type: string }
//  *     responses:
//  *       201:
//  *         description: User registered successfully
//  */
// route.post('/register', authValidation.registerUserValidator, authControlers.registerController);

// /* =============================================================
//    🟦 LOGIN (Password) — POST /api/auth/login
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/login:
//  *   post:
//  *     summary: Login using phone & password
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *               password: { type: string }
//  *     responses:
//  *       200:
//  *         description: Login success
//  */
// route.post('/login', authValidation.loginValidation, authControlers.loginController);

// /* =============================================================
//    🟦 SEND LOGIN OTP — POST /api/auth/send-otp
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/send-otp:
//  *   post:
//  *     summary: Send OTP for login
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *     responses:
//  *       200:
//  *         description: Login OTP sent
//  */
// route.post('/send-otp', optControlers.sendOtp);

// /* =============================================================
//    🟦 SEND SIGNUP OTP — POST /api/auth/send-signup-otp
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/send-signup-otp:
//  *   post:
//  *     summary: Send OTP for signup
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *     responses:
//  *       200:
//  *         description: Signup OTP sent
//  */
// route.post('/send-signup-otp', optControlers.sendSignupOtp);

// /* =============================================================
//    🟦 SEND FORGOT PASSWORD OTP — POST /api/auth/send-forgot-otp
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/send-forgot-otp:
//  *   post:
//  *     summary: Send OTP for forgot password
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *     responses:
//  *       200:
//  *         description: Forgot password OTP sent
//  */
// route.post('/send-forgot-otp', optControlers.sendForgotOtp);

// /* =============================================================
//    🟦 VERIFY OTP — POST /api/auth/verify-otp
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/verify-otp:
//  *   post:
//  *     summary: Universal OTP verification (login, signup, forgot)
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *               otp: { type: string }
//  *     responses:
//  *       200:
//  *         description: OTP verified successfully
//  */
// route.post('/verify-otp', optControlers.verifyOtp);

// /* =============================================================
//    🟦 VERIFY FORGOT OTP (Specific) — POST /api/auth/verify-Forgot-Otp
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/verify-Forgot-Otp:
//  *   post:
//  *     summary: Verify OTP only for forgot password flow
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *               otp: { type: string }
//  *     responses:
//  *       200:
//  *         description: Forgot OTP verified
//  */
// route.post('/verify-forgot-Otp', optControlers.verifyForgotOtp);

// /* =============================================================
//    🟦 LOGOUT — GET /api/auth/logout
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/logout:
//  *   get:
//  *     summary: Logout user and clear cookie
//  *     tags: [Auth]
//  *     responses:
//  *       200:
//  *         description: User logged out
//  */
// route.get('/logout', authControlers.logout);

// /* =============================================================
//    🟦 FORGOT PASSWORD — POST /api/auth/forget-password
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/forget-password:
//  *   post:
//  *     summary: Request forgot password OTP
//  *     tags: [Auth]
//  */
// route.post('/forget-password', authControlers.forgotPassword);

// /* =============================================================
//    🟦 RESET PASSWORD — POST /api/auth/reset-password
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/reset-password:
//  *   post:
//  *     summary: Reset password using token
//  *     tags: [Auth]
//  */
// route.post('/reset-password', authControlers.resetPassword);

// /* =============================================================
//    🟦 GET LOGGED USER — GET /api/auth/me
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/me:
//  *   get:
//  *     summary: Get logged-in user data
//  *     tags: [Auth]
//  *     security:
//  *       - bearerAuth: []
//  */
// route.get('/me', authenticatemiddleware.authMiddleware, authControlers.getUserProfile);

// /* =============================================================
//    🟦 ADD/UPDATE ADDRESS — POST /api/auth/address
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/address:
//  *   post:
//  *     summary: Add or update user address
//  *     tags: [Auth]
//  */
// route.post('/address', authenticatemiddleware.authMiddleware, authControlers.addUserAddress);

// /* =============================================================
//    🟦 GET ALL USER ADDRESS — GET /api/auth/get-user-all-address
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/get-user-all-address:
//  *   get:
//  *     summary: Get all addresses for logged user
//  *     tags: [Auth]
//  */
// route.get('/get-user-all-address', authenticatemiddleware.authMiddleware, authControlers.getAllAddress);

// /* =============================================================
//    🟦 DELETE ADDRESS — DELETE /api/auth/address/:address_id
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/address/{address_id}:
//  *   delete:
//  *     summary: Delete user address
//  *     tags: [Auth]
//  *     parameters:
//  *       - in: path
//  *         name: address_id
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Address deleted
//  */
// route.delete('/address/:address_id', authenticatemiddleware.authMiddleware, authControlers.deleteUserAddress);

// /* =============================================================
//    🟦 GET ALL USERS — GET /api/auth/allusers
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/allusers:
//  *   get:
//  *     summary: Get all users (Admin/Testing)
//  *     tags: [Auth]
//  */
// route.get('/allusers', authControlers.getAllUsers);

// /* =============================================================
//    🟦 UPDATE PROFILE — PUT /api/auth/update-profile
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/update-profile:
//  *   put:
//  *     summary: Update user name & gender
//  *     tags: [Auth]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               firstName: { type: string }
//  *               lastName: { type: string }
//  *               gender: { type: string, enum: [Male, Female] }
//  *     responses:
//  *       200:
//  *         description: Profile updated
//  */
// route.put(
//    '/update-profile',
//    authenticatemiddleware.authMiddleware,
//    authControlers.updateProfile
// );

// /* =============================================================
//    🟦 UPDATE EMAIL — PUT /api/auth/update-email
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/update-email:
//  *   put:
//  *     summary: Update user email
//  *     tags: [Auth]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email: { type: string }
//  *     responses:
//  *       200:
//  *         description: Email updated
//  */
// route.put(
//    '/update-email',
//    authenticatemiddleware.authMiddleware,
//    authControlers.updateEmail
// );

// /* =============================================================
//    🟦 UPDATE PHONE — PUT /api/auth/update-phone
// ============================================================= */
// /**
//  * @swagger
//  * /api/auth/update-phone:
//  *   put:
//  *     summary: Update user mobile number
//  *     tags: [Auth]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               phone: { type: string }
//  *     responses:
//  *       200:
//  *         description: Phone updated
//  */
// route.put(
//    '/update-phone',
//    authenticatemiddleware.authMiddleware,
//    authControlers.updatePhone
// );


// module.exports = route;
const express = require("express");
const authenticatemiddleware = require("../middlewares/auth.middleware");
const authValidation = require("../middlewares/authValidation.middleware");

/* CONTROLLERS */
const authControlers = require("../controllers/auth.controller");
const optControlers = require("../controllers/opt.controller");


const route = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs (Password + OTP for Signup/Forgot)
 */

/* =========================
   REGISTER USER
========================= */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user after signup OTP verification
 *     tags: [Auth]
 */
route.post(
   "/register",
   authValidation.registerUserValidator,
   authControlers.registerController
);

/* =========================
   LOGIN (PASSWORD ONLY)
========================= */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login using phone & password
 *     tags: [Auth]
 */
route.post(
   "/login",
   authValidation.loginValidation,
   authControlers.loginController
);

/* =========================
   SIGNUP OTP
========================= */
/**
 * @swagger
 * /api/auth/send-signup-otp:
 *   post:
 *     summary: Send OTP for signup
 *     tags: [Auth]
 */
// route.post("/send-signup-otp", optControlers.sendSignupOtp);
route.post("/send-signup-otp", optControlers.sendSignupOtp1);

/**
 * @swagger
 * /api/auth/verify-signup-otp:
 *   post:
 *     summary: Verify signup OTP
 *     tags: [Auth]
 */
route.post("/verify-signup-otp", optControlers.verifySignupOtp);

/* =========================
   FORGOT PASSWORD OTP
========================= */
/**
 * @swagger
 * /api/auth/send-forgot-otp:
 *   post:
 *     summary: Send OTP for forgot password
 *     tags: [Auth]
 */
route.post("/send-forgot-otp", optControlers.sendForgotOtp);

/**
 * @swagger
 * /api/auth/verify-forgot-otp:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [Auth]
 */
route.post("/verify-forgot-otp", optControlers.verifyForgotOtp);

/* =========================
   RESET PASSWORD
========================= */
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 */
route.post("/reset-password", authControlers.resetPassword);

/* =========================
   LOGOUT
========================= */
/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 */
route.get("/logout", authControlers.logout);

/* =========================
   PROFILE
========================= */
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged-in user
 *     tags: [Auth]
 */
route.get(
   "/me",
   authenticatemiddleware.authMiddleware,
   authControlers.getUserProfile
);

route.put(
   "/update-profile",
   authenticatemiddleware.authMiddleware,
   authControlers.updateProfile
);

route.put(
   "/update-email",
   authenticatemiddleware.authMiddleware,
   authControlers.updateEmail
);

route.put(
   "/update-phone",
   authenticatemiddleware.authMiddleware,
   authControlers.updatePhone
);

/* =========================
   ADDRESS
========================= */
route.post(
   "/address",
   authenticatemiddleware.authMiddleware,
   authControlers.addUserAddress
);

route.get(
   "/get-user-all-address",
   authenticatemiddleware.authMiddleware,
   authControlers.getAllAddress
);

route.delete(
   "/address/:address_id",
   authenticatemiddleware.authMiddleware,
   authControlers.deleteUserAddress
);

/* =========================
   ADMIN / TEST
========================= */
route.get("/allusers", authControlers.getAllUsers);

module.exports = route;
