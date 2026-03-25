import jwt from "jsonwebtoken";
import authDb from "../db/authDb.js";

const verifySellerProduct = async (req, res, next) => {
  try {
    let token = null;

    // Cookie check
    if (req.cookies?.sellertoken) {
      token = req.cookies.sellertoken;
    }

    // Header fallback
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await authDb.query(
      "SELECT id, email, fullname FROM seller WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // ✅ Dashboard ke liye
    req.seller = rows[0];

    // ✅ Product / Q&A ke liye
    req.user = {
      id: rows[0].id,
      role: "seller",
    };

    next();

  } catch (err) {
    console.error("VERIFY SELLER PRODUCT ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid/Expired token" });
  }
};


export default verifySellerProduct;

