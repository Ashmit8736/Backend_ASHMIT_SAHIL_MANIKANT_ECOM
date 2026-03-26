const { sendSMS } = require("../services/opt.service");
const { sendSMS2 } = require("../services/opt.service");

const { authDB } = require("../db/db");
const redis = require("../db/radis");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const normalizeIndianPhone = require("../utils/phone");




// simple phone cleaner
function cleanPhone(phone) {
  return phone ? phone.toString().replace(/\D/g, "") : "";
}

async function sendSignupOtp(req, res) {
  try {
    const rawPhone = cleanPhone(req.body.phone);

    if (!rawPhone || rawPhone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // check if already exists
    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE phone = ? LIMIT 1",
      [rawPhone]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        type: "exists",
        message: "Account already exists with this phone number. Please login."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP
    await redis.set(`signup_otp:${rawPhone}`, otp, "EX", 300);

    // ⚠️ DLT-SAFE MESSAGE (EXACT)
    const message =
      `${otp} is your OTP for login. Do not share it with anyone. Regards MOJIJA.`;

    // ⚠️ sendSMS2 EXPECTS 91XXXXXXXXXX
    const phoneWithCountry = "91" + rawPhone;

    await sendSMS2(phoneWithCountry, message);

    // console.log("✅ SIGNUP OTP SENT:", phoneWithCountry, otp);

    return res.status(200).json({ message: "Signup OTP sent successfully" });

  } catch (err) {
    console.error("SEND SIGNUP OTP ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}



async function sendSignupOtp1(req, res) {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    phone = phone.toString().replace(/\D/g, "");

    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        type: "exists",
        message: "Account already exists with this phone number. Please login."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`signup_otp:${phone}`, otp, "EX", 300);

    const message =
      `${otp} is your Login OTP. Do not share it with anyone Regards MOJIJA.`;

    await sendSMS(phone, message);

    // console.log("✅ SIGNUP OTP SENT:", phone, otp);

    return res.status(200).json({ message: "Signup OTP sent successfully" });

  } catch (error) {
    console.error("sendSignupOtp1 ERROR:", error);
    return res.status(500).json({ message: "Failed to send signup OTP" });
  }
}



async function sendForgotOtp(req, res) {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    phone = phone.toString().replace(/\D/g, "");
    if (phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (!exists.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`forgot_pass_otp:${phone}`, otp, "EX", 300);

    const message =
      `${otp} is your password reset OTP. Do not share it with anyone Regards MOJIJA`;

    await sendSMS2("91" + phone, message);

    // console.log("✅ FORGOT OTP SENT:", phone, otp);

    return res.status(200).json({ message: "Forgot OTP sent successfully" });

  } catch (error) {
    console.error("sendForgotOtp ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}




async function verifySignupOtp(req, res) {
  const phone = cleanPhone(req.body.phone);
  const otp = String(req.body.otp);

  const storedOtp = await redis.get(`signup_otp:${phone}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  await redis.del(`signup_otp:${phone}`);

  return res.status(200).json({
    message: "Signup OTP verified",
    allowRegister: true,
  });
}
async function verifyForgotOtp(req, res) {
  const phone = cleanPhone(req.body.phone);
  const otp = String(req.body.otp);

  const storedOtp = await redis.get(`forgot_pass_otp:${phone}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const resetToken = uuidv4();

  await redis.del(`forgot_pass_otp:${phone}`);
  await redis.set(`reset_token:${phone}`, resetToken, { EX: 600 });

  return res.status(200).json({
    message: "OTP verified",
    resetToken,
  });
}


module.exports = {
  // signup
  sendSignupOtp,
  sendSignupOtp1,
  verifySignupOtp,

  // forgot password
  sendForgotOtp,
  verifyForgotOtp,
};


