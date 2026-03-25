// import jwt from "jsonwebtoken";

// const authMiddleware = (req, res, next) => {
//   try {
//     let token = null;

//     // ✅ 1️⃣ Buyer login cookie (CURRENT LOGIN CONTROLLER)
//     if (req.cookies?.token) {
//       token = req.cookies.token;
//     }

//     // ✅ 2️⃣ Future-safe: buyerToken bhi allow
//     else if (req.cookies?.buyerToken) {
//       token = req.cookies.buyerToken;
//     }

//     // ✅ 3️⃣ Authorization header fallback
//     else if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer ")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       return res.status(401).json({ message: "Please login to continue" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       id: decoded.id,
//       phone: decoded.phone,
//       role: decoded.role || "buyer",
//     };

//     next();
//   } catch (err) {
//     console.error("CART AUTH ERROR:", err.message);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// // export default authMiddleware;

// module.exports = authMiddleware;


const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.buyerToken) {
      token = req.cookies.buyerToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Please login to continue" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role || "buyer",
    };

    next();
  } catch (err) {
    console.error("CART AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;