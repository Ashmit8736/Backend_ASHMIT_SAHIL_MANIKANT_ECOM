const validateSellerRegistration = require("../utils/seller.validation");
// const db = require("../db/db");
const { authDB } = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const { sendSMS, sendSMS2 } = require("../services/opt.service");
const redis = require("../db/radis");
const { normalizeIndianPhone } = require("../utils/phone.js");
const { isStrongPassword } = require("../utils/password.utils.js");




async function sellerRegistration(req, res) {
  try {
    let {
      phone,
      email,
      fullname,
      password,
      gst_no,
      organisation_email,

      primary_contact_person_name,
      primary_contact_person_phone,
      primary_contact_person_email,

      company_name,
      owner_name,
      owner_email,
      owner_phone,

      branch_name,
      branch_address,
      branch_city,
      branch_state,
      branch_pincode,

      warehouse_pincode,
      warehouse_state,
      warehouse_full_address,
      warehouse_order_procising_capacity,

      bank_account_holder_name,
      pan_number,
      bank_account_no,
      bank_IFCS,
      bank_name,

      account_type,
      nature_of_business,
      business_category,

      declaration,
    } = req.body;

    /* ================= 1️⃣ VALIDATION ================= */
    const validationErrors = validateSellerRegistration(req.body);
    if (validationErrors.length) {
      const errors = {};
      validationErrors.forEach(e => (errors[e.field] = e.message));
      return res.status(400).json({
        success: false,
        type: "validation",
        errors,
      });
    }
    const normalizeIndianPhone = (phone) => {
      if (!phone) return "";
      return phone.toString().replace(/\D/g, "").slice(-10);
    };

    /* ================= 2️⃣ NORMALIZE ================= */
    phone = normalizeIndianPhone(phone);
    email = email.trim().toLowerCase();
    declaration = declaration ? 1 : 0;

    /* ================= 3️⃣ OTP VERIFY ================= */
    const phoneVerified = await redis.get(`seller_phone_verified:${phone}`);
    const emailVerified = await redis.get(`seller_email_verified:${email}`);

    if (!phoneVerified || !emailVerified) {
      return res.status(400).json({
        success: false,
        type: "otp",
        message: "Phone or Email not verified with OTP",
      });
    }

    /* ================= 4️⃣ PASSWORD ================= */
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ chars with upper, lower, number & special char",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ================= 5️⃣ PROCEDURE CALL ================= */
    const [result] = await authDB.query(
      "CALL RegisterSeller(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        phone,
        email,
        fullname,
        hashedPassword,
        gst_no,
        organisation_email,

        primary_contact_person_name,
        primary_contact_person_phone,
        primary_contact_person_email,

        company_name,
        owner_name,
        owner_email,
        owner_phone,

        branch_name,
        branch_address,
        branch_city,
        branch_state,
        branch_pincode,

        warehouse_pincode,
        warehouse_state,
        warehouse_full_address,
        warehouse_order_procising_capacity,

        bank_account_holder_name,
        pan_number,
        bank_account_no,
        bank_IFCS,
        bank_name,

        account_type,
        nature_of_business,
        business_category,

        declaration,
      ]
    );

    const sellerId = result?.[0]?.[0]?.seller_id;
    if (!sellerId) {
      throw new Error("Seller registration failed");
    }

    /* ================= 6️⃣ CLEANUP ================= */
    await redis.del(`seller_phone_verified:${phone}`);
    await redis.del(`seller_email_verified:${email}`);

    /* ================= 7️⃣ RESPONSE ================= */
    return res.status(201).json({
      success: true,
      message: "Seller registered successfully. Pending admin approval.",
      sellerId,
    });

  } catch (error) {
    console.error("SELLER REGISTER ERROR:", error);

    /* 🔴 PROCEDURE DUPLICATE / BUSINESS ERROR */
    if (error.sqlState === "45000") {
      return res.status(409).json({
        success: false,
        type: "conflict",
        errors: {
          phone: error.sqlMessage,
          email: error.sqlMessage,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}



async function sellerLogin(req, res) {
  const { phone, password } = req.body

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" })
  }

  try {
    // const db = await connectDb()

    const [sellerRows] = await authDB.query(
      "SELECT id, phone, approval_status, email, fullname, password FROM seller WHERE phone = ?",
      [phone]
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const seller = sellerRows[0];

    if (seller.approval_status === "pending") {
      return res.status(409).json({ message: "till now u are not approved to login" })
    }

    if (seller.approval_status === "rejected") {
      return res.status(409).json({ message: "you are rejected by admin" })
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: seller.id,
        role: "seller",                    // ✅ ADD
        approval_status: seller.approval_status, // ✅ ADD
        email: seller.email,
        fullname: seller.fullname,
        phone: seller.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie('sellertoken', token, { httpOnly: true, sameSite: 'lax' });

    res.status(201).json({
      message: "Seller login successfully",
      token: token,   // ⭐ IMPORTANT ⭐
      seller: {
        seller: seller.id,
        phone: seller.phone,
        email: seller.email,
        fullname: seller.fullname,
        seller_status: seller.approval_status
      }
    });

  } catch (error) {
    console.error("Error logging in seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function sellerForgotPassword(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone is required" });


    // const db = await connectDb();
    const [userRow] = await authDB.query("SELECT * FROM seller WHERE phone = ?", [phone]);
    if (userRow.length === 0) return res.status(404).json({ message: "seller not found" });

    const seller = userRow[0];


    if (seller.approval_status === "pending") {
      return res.status(409).json({ message: "till now u are not approved to login" })
    }

    if (seller.approval_status === "rejected") {
      return res.status(409).json({ message: "you are rejected by admin" })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = 300; // 5 mins

    await redis.set(`seller_forgot_pass_otp:${phone}`, otp, "EX", ttl);
    await sendSMS2(phone, `${otp} is your password reset OTP. Do not share it with anyone Regards MOJIJA`);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}



async function sellerResetPassword(req, res) {
  try {
    let { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({
        message: "Phone and new password are required",
      });
    }

    phone = phone.toString().replace(/\D/g, "");
    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars with upper, lower, number & special char",
      });
    }

    const [rows] = await authDB.query(
      "SELECT approval_status FROM seller WHERE phone = ?",
      [phone]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const seller = rows[0];

    if (seller.approval_status === "pending") {
      return res.status(409).json({ message: "Not approved yet" });
    }

    if (seller.approval_status === "rejected") {
      return res.status(409).json({ message: "Rejected by admin" });
    }

    // 🔥 CHECK RESET PERMISSION (NOT OTP)
    const resetAllowed = await redis.get(`forgot_pass_token:${phone}`);
    if (!resetAllowed) {
      return res.status(403).json({
        message: "OTP verification required before resetting password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authDB.query(
      "UPDATE seller SET password = ? WHERE phone = ?",
      [hashedPassword, phone]
    );

    // 🧹 cleanup
    await redis.del(`forgot_pass_token:${phone}`);

    return res.status(200).json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}



async function getsellerData(req, res) {
  try {
    // const db = await connectDb();

    const [rows] = await authDB.query("CALL GetSellerData(?)", [req.seller.id]);

    // MySQL returns rows inside nested array → rows[0][0]
    const seller = rows[0][0];

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ seller });

  } catch (error) {
    console.error("GET SELLER DATA ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function updateSellerProfile(req, res) {
  try {
    // const db = await connectDb();
    const id = req.seller.id;

    const {
      fullname,
      phone,
      email,
      gst_no,
      organisation_email,
      primary_contact_person_name,
      primary_contact_person_phone,
      primary_contact_person_email,
      owner_name,
      owner_phone,
      owner_email,
      company_name,
      warehouse_pincode,
      warehouse_state,
      warehouse_full_address,
      warehouse_order_procising_capacity,
      bank_account_holder_name,
      bank_account_no,
      bank_IFCS,
      bank_name,
      account_type,
      nature_of_business,
      business_category,
      declaration
    } = req.body;

    // FIX 🟢 declaration should always be integer
    const declarationValue = parseInt(declaration) || 0;

    const query = `
      UPDATE seller SET
        fullname = ?,
        phone = ?,
        email = ?,
        gst_no = ?,
        organisation_email = ?,
        primary_contact_person_name = ?,
        primary_contact_person_phone = ?,
        primary_contact_person_email = ?,

        owner_name = ?, 
        owner_phone = ?, 
        owner_email = ?, 

        company_name = ?,
        warehouse_pincode = ?,
        warehouse_state = ?,
        warehouse_full_address = ?,
        warehouse_order_procising_capacity = ?,
        bank_account_holder_name = ?,
        bank_account_no = ?,
        bank_IFCS = ?,
        bank_name = ?,
        account_type = ?,
        nature_of_business = ?,
        business_category = ?,
        declaration = ?
      WHERE id = ?
    `;

    await authDB.query(query, [
      fullname,
      phone,
      email,
      gst_no,
      organisation_email,
      primary_contact_person_name,
      primary_contact_person_phone,
      primary_contact_person_email,

      owner_name,
      owner_phone,
      owner_email,

      company_name,
      warehouse_pincode,
      warehouse_state,
      warehouse_full_address,
      warehouse_order_procising_capacity,
      bank_account_holder_name,
      bank_account_no,
      bank_IFCS,
      bank_name,
      account_type,
      nature_of_business,
      business_category,

      declarationValue, // FIXED 🔥

      id
    ]);

    return res.status(200).json({ message: "Seller profile updated successfully" });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      sqlMessage: error.sqlMessage,
    });
  }
}


async function changeSellerPassword(req, res) {
  try {
    // const db = await connectDb();
    const sellerId = req.seller.id;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    // 1️⃣ Fetch seller current password
    const [rows] = await authDB.query(
      "SELECT password FROM seller WHERE id = ?",
      [sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const seller = rows[0];

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(currentPassword, seller.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // 3️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update password
    await authDB.query("UPDATE seller SET password = ? WHERE id = ?", [
      hashedPassword,
      sellerId,
    ]);

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}







module.exports = {
  sellerRegistration,
  sellerLogin,
  sellerForgotPassword,
  sellerResetPassword,
  getsellerData,
  updateSellerProfile,
  changeSellerPassword,
  // checkAuthUserExists,

};
