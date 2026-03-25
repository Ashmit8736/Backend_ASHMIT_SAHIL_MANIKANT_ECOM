const jwt = require('jsonwebtoken');
// const db = require('../db/db');
const { authDB } = require('../db/db');


/* -------------------------------
   USER AUTH MIDDLEWARE
-------------------------------- */
const authMiddleware = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.token;
    const bearerToken = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ MATCH BY PHONE (CORRECT)
    const [authRows] = await authDB.query(
      "SELECT ref_id, role FROM auth_users WHERE phone = ? LIMIT 1",
      [decoded.phone]
    );

    if (!authRows.length || authRows[0].role !== "buyer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const userId = authRows[0].ref_id;

    // 🔵 USER CHECK
    const [users] = await authDB.query(
      "SELECT id, username, email, phone, gender, approval_status FROM user WHERE id = ?",
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    if (users[0].approval_status !== "approved") {
      return res.status(403).json({
        message:
          users[0].approval_status === "pending"
            ? "Your account is pending admin approval."
            : "Your account has been rejected by admin.",
      });
    }

    req.user = users[0];
    next();

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};



const sellerAuthMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Token extract properly
    let token = null;

    // Read from cookie
    if (req.cookies?.sellertoken) {
      token = req.cookies.sellertoken;
    }

    // Read from Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No token found
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // const db = await connectDb();
    const [rows] = await authDB.query("SELECT * FROM seller WHERE id = ?", [decoded.id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // 3️⃣ Attach seller to request
    req.seller = rows[0];
    next();

  } catch (err) {
    console.error("SELLER AUTH ERROR:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid/Expired token" });
  }
};


/* -------------------------------
   SUPPLIER AUTH MIDDLEWARE ⭐ NEW
-------------------------------- */
const supplierAuthMiddleware = async (req, res, next) => {
  try {
    // 🔐 TOKEN FROM HEADER OR COOKIE
    const token =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies?.suppliertoken;

    console.log("🔐 SUPPLIER TOKEN:", token);

    if (!token) {
      return res.status(401).json({ message: "Supplier not logged in" });
    }

    // VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // const db = await connectDb();
    const [rows] = await authDB.query(
      "SELECT * FROM supplier WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // ATTACH SUPPLIER
    req.supplier = rows[0];
    next();

  } catch (err) {
    console.error("SUPPLIER AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = {
  authMiddleware,
  sellerAuthMiddleware,
  supplierAuthMiddleware, // ⭐ Exported Now
};
