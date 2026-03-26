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
