// const db = require("../db/db"); // your DB connection
const { authDB } = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../db/radis");
const { sendSMS2 } = require("../services/opt.service");
const normalizeIndianPhone = require("../utils/phone");
const { isStrongPassword } = require("../utils/passwordValidator");



async function checkAuthUserExists(phone, email) {
  const [rows] = await authDB.query(
    "SELECT role FROM auth_users WHERE phone = ? OR email = ? LIMIT 1",
    [phone, email]
  );
  return rows.length ? rows[0] : null;
}



async function registerController(req, res) {
  let conn;

  try {
    let { username, email, password, phone, gender } = req.body;

    if (!username || !email || !password || !phone || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        type: "validation",
        errors: { password: "Weak password" },
      });
    }

    phone = normalizeIndianPhone(phone);
    email = email.toLowerCase();

    /* 🔴 GLOBAL AUTH CHECK */
    const existingAuth = await checkAuthUserExists(phone, email);
    if (existingAuth) {
      return res.status(409).json({
        message: `Already registered as ${existingAuth.role}. Please login.`,
      });
    }

    conn = await authDB.getConnection();
    await conn.beginTransaction();

    const hashPassword = await bcrypt.hash(password, 10);

    const [rows] = await conn.query(
      "CALL registerUser(?, ?, ?, ?, ?)",
      [username, email, hashPassword, phone, gender]
    );

    const user = rows?.[0]?.[0];
    if (!user) throw new Error("User insert failed");

    await conn.commit();

    return res.status(201).json({
      message: "User registered successfully. Pending admin approval.",
      user: {
        id: user.user_id,
        username,
        email,
        phone,
      },
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
}


async function loginController(req, res) {
  let { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone and password are required" });
  }

  try {
    phone = normalizeIndianPhone(phone);

    const [authRow] = await authDB.query(
      "SELECT role FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (!authRow.length || authRow[0].role !== "buyer") {
      return res.status(404).json({
        message: "Buyer account not found. Please register first.",
      });
    }

    const [userRow] = await authDB.query(
      "SELECT id, username, email, phone, password, approval_status FROM user WHERE phone = ?",
      [phone]
    );

    if (!userRow.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRow[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.approval_status !== "approved") {
      return res.status(403).json({
        type: "account",
        status: user.approval_status, // 👈 frontend ko kaam aayega
        message:
          user.approval_status === "pending"
            ? "Your account is pending admin approval."
            : "Your account has been rejected by admin.",
      });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: "buyer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies.token;

    if (token) {
      await redis.set(`blacklist:${token}`, "true", "EX", 24 * 60 * 60);
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



async function forgotPassword(req, res) {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone is required" });

    phone = normalizeIndianPhone(phone);

    const [auth] = await authDB.query(
      "SELECT role FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (!auth.length || auth[0].role !== "buyer") {
      return res.status(404).json({ message: "Buyer account not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`forgot_pass_otp:${phone}`, otp, "EX", 300);

    await sendSMS2(phone, `${otp} is your password reset OTP`);

    return res.status(200).json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("FORGOT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


async function resetPassword(req, res) {
  try {
    let { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        message: "Phone, OTP and new password are required",
      });
    }

    // 🔐 PASSWORD STRENGTH CHECK
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    phone = normalizeIndianPhone(phone);

    // 🔴 BUYER CHECK
    const [authRow] = await authDB.query(
      "SELECT role FROM auth_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (!authRow.length || authRow[0].role !== "buyer") {
      return res.status(404).json({ message: "Buyer account not found" });
    }

    // 🔵 USER CHECK (FETCH PASSWORD ALSO)
    const [userRow] = await authDB.query(
      "SELECT id, password, approval_status FROM user WHERE phone = ?",
      [phone]
    );

    if (!userRow.length) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userRow[0].approval_status !== "approved") {
      return res.status(403).json({
        message:
          userRow[0].approval_status === "pending"
            ? "Your account is pending admin approval."
            : "Your account has been rejected by admin.",
      });
    }

    // 🔐 OTP VERIFY
    const storedOtp = await redis.get(`forgot_pass_otp:${phone}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 🚫 SAME PASSWORD CHECK (IMPORTANT 🔥)
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userRow[0].password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be same as old password",
      });
    }

    // 🔐 HASH & UPDATE PASSWORD
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authDB.query(
      "UPDATE user SET password = ? WHERE phone = ?",
      [hashedPassword, phone]
    );

    // 🧹 CLEAR OTP
    await redis.del(`forgot_pass_otp:${phone}`);

    return res.status(200).json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}




async function getAllUsers(req, res) {
  console.log("hello user");

  try {
    // const db = await connectDb();
    const [rows] = await authDB.query("SELECT * FROM user");

    // remove password before sending
    const users = rows.map(({ password, ...rest }) => rest);

    res.status(200).json({ message: "All users fetched", users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addUserAddress(req, res) {
  try {
    const user_id = req.user.id;

    const {
      address_id, // null for new address, or id for update
      building_name,
      floor_number,
      street,
      landmark,
      city,
      state,
      country,
      pincode,
      location,
      is_default,
    } = req.body;

    // const db = await connectDb();

    const [result] = await authDB.query(
      `CALL AddOrUpdateAddress(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        address_id || null,
        building_name || null,
        floor_number || null,
        street || null,
        landmark || null,
        city || null,
        state || null,
        country || null,
        pincode || null,
        location || null,
        is_default || false,
      ]
    );

    // Stored procedure returns user’s full address list
    return res.status(200).json({
      message: address_id
        ? "Address updated successfully"
        : "Address added successfully",
      addresses: result[0],
    });
  } catch (error) {
    console.error("Error in AddOrUpdateAddress:", error);

    // Handle MySQL SIGNAL error (custom message from procedure)
    if (error.sqlState === "45000") {
      return res.status(400).json({ message: error.sqlMessage });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getAllAddress(req, res) {
  try {
    const user_id = req.user.id

    // const db = await connectDb();

    const [addresses] = await authDB.query(
      `SELECT * FROM address WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [user_id]
    )

    return res.status(200).json({
      message: "Addresses fetched successfully",
      count: addresses.length,
      addresses
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteUserAddress(req, res) {
  try {
    const user_id = req.user.id;
    const { address_id } = req.params

    // const db = await connectDb()

    const [addressRows] = await authDB.query(
      `SELECT id FROM address WHERE id = ? AND user_id = ?`,
      [address_id, user_id]
    )

    if (addressRows.length === 0) {
      return res.status(404).json({ message: "Address not found or not authorized" });
    }

    await authDB.query("DELETE FROM address WHERE id = ? AND user_id = ?", [address_id, user_id]);

    res.status(200).json({ message: "Address deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }

}
async function updateProfile(req, res) {
  try {
    const user_id = req.user.id;
    const { firstName, lastName, gender } = req.body;

    const username = `${firstName} ${lastName}`.trim();
    const finalGender = gender.toLowerCase();

    // const db = await connectDb();

    await authDB.query(
      "UPDATE user SET username = ?, gender = ? WHERE id = ?",
      [username, finalGender, user_id]
    );

    return res.status(200).json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
async function updateEmail(req, res) {
  try {
    const user_id = req.user.id;
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = email.toLowerCase().trim();

    // 🔴 GLOBAL DUPLICATE CHECK
    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE email = ? AND role != 'buyer' LIMIT 1",
      [email]
    );

    if (exists.length) {
      return res.status(409).json({
        message: "Email already used by another account",
      });
    }

    // 🔵 USER TABLE
    await authDB.query(
      "UPDATE user SET email = ? WHERE id = ?",
      [email, user_id]
    );

    // 🔵 AUTH_USERS TABLE
    await authDB.query(
      "UPDATE auth_users SET email = ? WHERE role = 'buyer' AND ref_id = ?",
      [email, user_id]
    );

    return res.status(200).json({ message: "Email updated successfully" });

  } catch (error) {
    console.error("EMAIL UPDATE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


async function updatePhone(req, res) {
  try {
    let { phone } = req.body;
    const user_id = req.user.id;

    phone = normalizeIndianPhone(phone);

    // const db = await connectDb();

    // 🔴 GLOBAL DUPLICATE CHECK
    const [exists] = await authDB.query(
      "SELECT id FROM auth_users WHERE phone = ? AND role != 'user' LIMIT 1",
      [phone]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        message: "Phone already used by another account",
      });
    }

    await authDB.query(
      "UPDATE user SET phone = ? WHERE id = ?",
      [phone, user_id]
    );

    await authDB.query(
      "UPDATE auth_users SET phone = ? WHERE role='user' AND ref_id = ?",
      [phone, user_id]
    );

    return res.status(200).json({ message: "Phone updated successfully" });

  } catch (error) {
    console.error("PHONE UPDATE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// async function getUserProfile(req, res) {
//   try {
//     const [rows] = await db.query(
//       "SELECT id, username, email, phone, gender FROM user WHERE id = ?",
//       [req.user.id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const user = rows[0];

//     return res.status(200).json({
//       user: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone,
//         gender:
//           user.gender === "male"
//             ? "Male"
//             : user.gender === "female"
//               ? "Female"
//               : "Other",
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }

async function getUserProfile(req, res) {
  try {
    const [rows] = await authDB.query(
      `
      SELECT 
        id,
        username,
        email,
        phone,
        gender,
        approval_status,
        created_at
      FROM user
      WHERE id = ?
      `,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,          // ✅ RAW: male / female / other
        approval_status: user.approval_status,
        joined_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


module.exports = {
  registerController,
  loginController,
  logout,
  forgotPassword,
  resetPassword,

  getAllUsers,
  addUserAddress,
  getAllAddress,
  deleteUserAddress,
  updateProfile,
  updateEmail,
  updatePhone
  , getUserProfile,
};
