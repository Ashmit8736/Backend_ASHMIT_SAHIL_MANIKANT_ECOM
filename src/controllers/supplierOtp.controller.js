const redis = require("../db/radis");
const { authDB } = require("../db/db");
const { sendSMS } = require("../services/opt.service");
const { sendEmail } = require("../services/sendEmail.service"); // Email OTP Service

/* ============================================================
   📌 SEND OTP TO PHONE (REGISTER)
============================================================ */

exports.supplierRegisterSendOTP = async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    // clean phone (10 digit only)
    phone = phone.toString().replace(/\D/g, "");

    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const [supplier] = await authDB.query(
      `SELECT id FROM auth_users WHERE phone = ? LIMIT 1`,
      [phone]
    );

    if (supplier.length > 0) {
      return res.status(409).json({ message: "Phone already registered!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP
    await redis.set(`supplier_otp:${phone}`, otp, "EX", 300);

    console.log("SUPPLIER PHONE OTP:", otp, phone);

    const message =
      `${otp} is your Login OTP. Do not share it with anyone Regards MOJIJA.`;

    // 🔥 NO +91
    await sendSMS(phone, message);

    return res.status(200).json({
      message: "Phone OTP Sent Successfully!",
    });

  } catch (error) {
    console.error("Supplier Phone OTP SEND ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* ============================================================
   📌 VERIFY OTP FOR PHONE
============================================================ */


exports.supplierRegisterVerifyOTP = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone & OTP required" });
    }

    // 🔥 SAME cleaning as send
    phone = phone.toString().replace(/\D/g, "");
    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // ✅ SAME Redis key
    const storedOtp = await redis.get(`supplier_otp:${phone}`);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (storedOtp !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await redis.del(`supplier_otp:${phone}`);

    // verified flag
    await redis.set(`supplier_phone_verified:${phone}`, "1", "EX", 600);

    return res.status(200).json({
      message: "Phone Verified Successfully",
      verifyPhone: true,
    });

  } catch (error) {
    console.error("Phone OTP VERIFY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* ============================================================
   📌 SEND OTP TO EMAIL (REGISTER)
============================================================ */
// exports.supplierRegisterSendEmailOTP = async (req, res) => {
//   try {
//     // const db = await connectDb();
//     const { email } = req.body;

//     if (!email) return res.status(400).json({ message: "Email is required" });

//     const [supplier] = await authDB.query(
//       `SELECT * FROM auth_users WHERE email = ?`,
//       [email]
//     );

//     if (supplier.length > 0)
//       return res.status(409).json({ message: "Email already registered!" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await redis.set(`supplier_email_otp:${email}`, otp, "EX", 300);

//     console.log("Supplier Email OTP:", otp);

//     await sendEmail(
//       email,
//       "Supplier Email Verification OTP",
//       `Your OTP is: ${otp} (Valid for 5 mins)`
//     );

//     return res.status(200).json({
//       message: "Email OTP Sent Successfully!",
//     });

//   } catch (error) {
//     console.error("Email OTP SEND ERROR:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.supplierRegisterSendEmailOTP = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = email.toLowerCase().trim();

    // ✅ CHECK EMAIL EXISTS
    const [supplier] = await authDB.query(
      "SELECT id FROM auth_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (supplier.length > 0) {
      return res.status(409).json({
        message: "Email already registered!",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ SAVE OTP
    await redis.set(`supplier_email_otp:${email}`, otp, "EX", 300);

    console.log("SUPPLIER EMAIL OTP:", otp, email);

    // ✅ SEND EMAIL
    await sendEmail(
      email,
      "Supplier Email Verification OTP",
      `${otp} is your email verification OTP. Do not share it with anyone.`
    );

    return res.status(200).json({
      message: "Email OTP Sent Successfully!",
    });

  } catch (error) {
    console.error("Email OTP SEND ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* ============================================================
   📌 VERIFY OTP FOR EMAIL
============================================================ */
exports.supplierRegisterVerifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email & OTP required" });

    const storedOtp = await redis.get(`supplier_email_otp:${email}`);

    if (!storedOtp)
      return res.status(400).json({ message: "OTP expired or invalid" });

    if (storedOtp !== otp.toString())
      return res.status(401).json({ message: "Invalid OTP" });

    await redis.del(`supplier_email_otp:${email}`);

    // ⭐ Set Verified Flag in Redis
    await redis.set(`supplier_email_verified:${email}`, "true", "EX", 600);

    return res.status(200).json({
      message: "Email Verified Successfully!",
      verifyEmail: true,
    });

  } catch (error) {
    console.error("Email OTP VERIFY ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
