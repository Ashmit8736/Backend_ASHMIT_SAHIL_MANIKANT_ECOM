
const { sendSMS } = require("../services/opt.service");
const { authDB } = require("../db/db");
const redis = require("../db/radis");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../services/sendEmail.service");

async function sellerRegisterSendOTP(req, res) {
  try {
    let { phone } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    // only digits (10 digit)
    phone = phone.toString().replace(/\D/g, "");

    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    /* ---------- CHECK SELLER EXISTS ---------- */
    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        message: "Phone number already registered. Please login.",
      });
    }

    /* ---------- GENERATE OTP ---------- */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    /* ---------- SAVE OTP (REDIS) ---------- */
    const otpKey = `seller:register:otp:${phone}`;
    await redis.set(otpKey, otp, "EX", 300); // 5 min validity

    /* ---------- DLT APPROVED MESSAGE (EXACT) ---------- */
    const message =
      `${otp} is your Login OTP. Do not share it with anyone Regards MOJIJA.`;

    /* ---------- SEND SMS (NO +91) ---------- */
    await sendSMS(phone, message);

    console.log("SELLER REGISTER OTP:", otp, phone); 

    /* ---------- RESPONSE ---------- */
    return res.status(200).json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("sellerRegisterSendOTP error:", error);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
}

module.exports = { sellerRegisterSendOTP };




async function sellerRegisterVerifyOTP(req, res) {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    // 🔥 SAME normalization AS SEND
    phone = phone.toString().replace(/\D/g, "");

    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // 🔥 SAME REDIS KEY AS SEND
    const otpKey = `seller:register:otp:${phone}`;
    const storedOtp = await redis.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (storedOtp !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // ✅ delete OTP
    await redis.del(otpKey);

    // ✅ mark phone verified (same phone = 10 digit)
    await redis.set(
      `seller_phone_verified:${phone}`,
      "1",
      "EX",
      900 // 15 minutes
    );

    return res.status(200).json({
      message: "Phone verified successfully",
      verifyPhone: true,
    });

  } catch (error) {
    console.error("sellerRegisterVerifyOTP error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
}





async function sellerRegisterSendEmailOTP(req, res) {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    email = email.toLowerCase().trim();

    // ✅ CHECK EMAIL ALREADY EXISTS
    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        message: "Email already registered. Please login.",
      });
    }

    // 🔐 REDIS KEY
    const otpKey = `seller:register:email:otp:${email}`;

    // 🔢 OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 💾 SAVE OTP
    await redis.set(otpKey, otp, "EX", 300);

    // 📧 SEND EMAIL
    await sendEmail(
      email,
      "Seller Email Verification OTP",
      `${otp} is your email verification OTP. Do not share it with anyone.`
    );

    console.log("✅ SELLER EMAIL OTP:", otp, email);

    return res.status(200).json({
      message: "Email OTP sent successfully",
    });

  } catch (error) {
    console.error("❌ sellerRegisterSendEmailOTP error:", error);
    return res.status(500).json({
      message: "Failed to send email OTP",
    });
  }
}



async function sellerRegisterVerifyEmailOTP(req, res) {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    email = email.toLowerCase().trim();

    // 🔥 SAME KEY AS SEND
    const otpKey = `seller:register:email:otp:${email}`;
    const storedOtp = await redis.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (storedOtp !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // ✅ delete OTP
    await redis.del(otpKey);

    // ✅ mark email verified
    await redis.set(
      `seller_email_verified:${email}`,
      "1",
      "EX",
      900 // 15 min
    );

    return res.status(200).json({
      message: "Email verified successfully",
      verifyEmail: true,
    });

  } catch (error) {
    console.error("sellerRegisterVerifyEmailOTP error:", error);
    return res.status(500).json({ message: "Email OTP verification failed" });
  }
}


/* ================= LOGIN OTP ================= */

async function sellerSendOtp(req, res) {
  // const db = await connectDb();
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: "Phone required" });

  const [rows] = await db.query(
    "SELECT id, approval_status FROM seller WHERE phone = ?",
    [phone]
  );

  if (rows.length === 0) {
    return res
      .status(404)
      .json({ message: "Seller not found", redirectToRegister: true });
  }

  const seller = rows[0];

  if (seller.approval_status !== "approved") {
    return res
      .status(409)
      .json({ message: "Seller not approved by admin" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const formattedPhone = phone.startsWith("+91") ? phone : "+91" + phone;

  await redis
    .multi()
    .set(`otp:${formattedPhone}`, otp, "EX", 300)
    .set(`otp_request_time:${formattedPhone}`, Date.now(), "EX", 60)
    .exec();

  await sendSMS(formattedPhone, `${otp} is your Login OTP`);

  res.status(200).json({ message: "OTP sent successfully" });
}



async function sellerVerifyOtp(req, res) {
  let { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone & OTP required" });
  }

  // 🔥 SAME FORMAT AS SEND OTP
  const formattedPhone = phone.startsWith("+91") ? phone : "+91" + phone;

  const storedOtp = await redis.get(`otp:${formattedPhone}`);

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or invalid" });
  }

  if (storedOtp !== otp.toString()) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const [rows] = await db.query(
    "SELECT id, phone, email, fullname FROM seller WHERE phone = ?",
    [phone.replace(/\D/g, "").slice(-10)]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const seller = rows[0];

  const token = jwt.sign(
    { id: seller.id, phone: seller.phone },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 🔥 delete same key
  await redis.del(`otp:${formattedPhone}`);

  res.cookie("sellertoken", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.status(200).json({
    message: "Login successful",
    seller,
  });
}


/* ================= FORGOT OTP ================= */


async function sellerVerifyForgotOtp(req, res) {
  let { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone & OTP required" });
  }

  phone = phone.toString().replace(/\D/g, "");
  if (phone.length !== 10) {
    return res.status(400).json({ message: "Invalid phone number" });
  }

  const storedOtp = await redis.get(
    `seller_forgot_pass_otp:${phone}`
  );

  // 🔥 DEBUG LOGS
  console.log("📞 SELLER FORGOT OTP VERIFY");
  console.log("PHONE:", phone);
  console.log("OTP FROM USER:", otp);
  console.log("OTP FROM REDIS:", storedOtp);

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (storedOtp !== otp.toString()) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const resetToken = uuidv4();
  await redis.set(
    `forgot_pass_token:${phone}`,
    resetToken,
    "EX",
    600
  );

  await redis.del(`seller_forgot_pass_otp:${phone}`);

  return res.status(200).json({
    message: "OTP verified",
    resetToken,
  });
}


module.exports = {
  sellerRegisterSendOTP,
  sellerRegisterVerifyOTP,
  sellerRegisterSendEmailOTP,
  sellerRegisterVerifyEmailOTP,
  sellerSendOtp,
  sellerVerifyOtp,
  sellerVerifyForgotOtp,
};
 
