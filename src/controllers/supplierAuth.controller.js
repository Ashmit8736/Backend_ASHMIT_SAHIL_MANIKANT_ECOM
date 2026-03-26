// const db = require("../db/db");
const { authDB } = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const redis = require("../db/radis");
const { sendSMS, sendSMS2 } = require("../services/opt.service");
const { isStrongPassword } = require("../utils/password.utils");

// ⭐ Supplier Registration

async function checkAuthUserExists(phone, email) {
  const [rows] = await authDB.query(
    `SELECT role FROM auth_users WHERE phone = ? OR email = ? LIMIT 1`,
    [phone, email.toLowerCase()]
  );
  return rows.length ? rows[0] : null;
}

async function supplierRegistration(req, res) {
  try {
    let {
      phone,
      email,
      fullname,
      password,
      company_name,
      city,
      state,
      pincode,
      products,
      gst_no,
    } = req.body;

    /* ================= BASIC NULL / EMPTY CHECK ================= */
    if (
      !phone || !email || !fullname || !password ||
      !company_name || !city || !state || !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    /* ================= NORMALIZE ================= */
    phone = phone.toString().replace(/\D/g, "");
    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    email = email.toLowerCase();

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    /* ================= AUTH USERS CHECK (OTP SE PEHLE 🔥) ================= */
    const existingUser = await checkAuthUserExists(phone, email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        type: "auth",
        message: `This phone/email is already registered as ${existingUser.role}. Please login.`,
      });
    }

    /* ================= OTP VERIFICATION ================= */
    const phoneVerified = await redis.get(`supplier_phone_verified:${phone}`);
    if (!phoneVerified) {
      return res.status(400).json({ message: "Phone OTP not verified" });
    }

    const emailVerified = await redis.get(`supplier_email_verified:${email}`);
    if (!emailVerified) {
      return res.status(400).json({ message: "Email OTP not verified" });
    }

    /* ================= STRONG PASSWORD ================= */
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars with upper, lower, number & special char",
      });
    }

    /* ================= HASH ================= */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ================= DB PROCEDURE ================= */
    await authDB.query(
      "CALL RegisterSupplier(?,?,?,?,?,?,?,?,?,?)",
      [
        phone,
        email,
        fullname,
        hashedPassword,
        company_name,
        city,
        state,
        pincode,
        JSON.stringify(products),
        gst_no || null,
      ]
    );

    /* ================= CLEAN OTP FLAGS ================= */
    await redis.del(`supplier_phone_verified:${phone}`);
    await redis.del(`supplier_email_verified:${email}`);

    return res.status(201).json({
      success: true,
      status: "pending",
      message:
        "Supplier account created successfully. Your account will be approved within 24 hours.",
    });

  } catch (err) {
    console.error("SUPPLIER REGISTER ERROR:", err);

    if (err.sqlState === "45000") {
      return res.status(409).json({
        success: false,
        message: err.sqlMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ⭐ Supplier Protected Data


async function supplierLogin(req, res) {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone & password required" });
  }

  try {
    const [rows] = await authDB.query(
      "SELECT * FROM supplier WHERE phone = ?",
      [phone]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const supplier = rows[0];

    // 🔐 Password check
    const isMatch = await bcrypt.compare(password, supplier.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 🚦 APPROVAL CHECK (🔥 BUYER STYLE)
    if (supplier.approval_status !== "approved") {
      return res.status(403).json({
        type: "account",
        status: supplier.approval_status, // pending | rejected
        message:
          supplier.approval_status === "pending"
            ? "Your supplier account is pending admin approval."
            : "Your supplier account has been rejected by admin.",
      });
    }

    // 🔑 JWT
    const token = jwt.sign(
      {
        id: supplier.id,
        phone: supplier.phone,
        role: "supplier",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("suppliertoken", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    delete supplier.password;

    return res.status(200).json({
      message: "Supplier login successful",
      token,
      supplier,
    });

  } catch (error) {
    console.error("❌ Supplier Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getSupplierData(req, res) {
  try {
    // const db = await connectDb();

    const [rows] = await authDB.query(
      `SELECT id, phone, email, fullname, company_name,
              city, state, pincode, products, gst_no
       FROM supplier
       WHERE id = ?`,
      [req.supplier.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Supplier not found" });

    return res.status(200).json({ supplier: rows[0] });

  } catch (error) {
    console.error("❌ Supplier Data Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


async function supplierForgotPasswordSendOtp(req, res) {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone required" });
    }

    phone = phone.toString().replace(/\D/g, "");
    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const [rows] = await authDB.query(`CALL GetSupplierByPhone(?)`, [phone]);
    const supplier = rows[0]?.[0];

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    if (supplier.approval_status !== "approved") {
      return res.status(403).json({ message: "Supplier not approved" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`supplier_forgot_pass_otp:${phone}`, otp, "EX", 300);

    const smsPhone = "91" + phone;

    // 🔥 DLT APPROVED TEMPLATE (EXACT)
    const message =
      // `${otp} is your Login OTP. Do not share it with anyone Regards MOJIJA.`;

      (`${otp} is your password reset OTP. Do not share it with anyone Regards MOJIJA`);

    await sendSMS2(smsPhone, message);

    console.log("SUPPLIER FORGOT OTP SENT:", smsPhone, otp);

    return res.status(200).json({ message: "OTP sent for password reset" });

  } catch (err) {
    console.error("Forgot OTP Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


async function supplierForgotPasswordVerifyOtp(req, res) {
  let { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone & OTP required" });
  }

  phone = phone.toString().replace(/\D/g, "");
  if (phone.length !== 10) {
    return res.status(400).json({ message: "Invalid phone number" });
  }

  const storedOtp = await redis.get(
    `supplier_forgot_pass_otp:${phone}`
  );

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (storedOtp !== otp.toString()) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  await redis.del(`supplier_forgot_pass_otp:${phone}`);
  await redis.set(
    `supplier_reset_allowed:${phone}`,
    "true",
    "EX",
    600
  );

  return res.status(200).json({ message: "OTP verified" });
}


/* =========================
   🔁 RESET PASSWORD (SECURE)
========================= */
async function supplierResetPassword(req, res) {
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword)
    return res.status(400).json({ message: "Phone & new password required" });

  if (!isStrongPassword(newPassword))
    return res.status(400).json({ message: "Weak password" });

  const allowed = await redis.get(`supplier_reset_allowed:${phone}`);
  if (!allowed)
    return res.status(403).json({ message: "OTP verification required" });

  try {
    const [rows] = await authDB.query(`CALL GetSupplierByPhone(?)`, [phone]);
    const supplier = rows[0]?.[0];

    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    const same = await bcrypt.compare(newPassword, supplier.password);
    if (same)
      return res.status(400).json({
        message: "New password cannot be same as old password",
      });

    const hashed = await bcrypt.hash(newPassword, 10);
    await authDB.query(`CALL UpdateSupplierPassword(?,?)`, [phone, hashed]);

    await redis.del(`supplier_reset_allowed:${phone}`);

    return res.status(200).json({ message: "Password reset successful" });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}



module.exports = {
  supplierRegistration,
  supplierLogin,
  getSupplierData,
  supplierForgotPasswordSendOtp,
  supplierForgotPasswordVerifyOtp,
  supplierResetPassword,
  // checkAuthUserExists,
};
