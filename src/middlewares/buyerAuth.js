import jwt from "jsonwebtoken";



export const verifyBuyer = (req, res, next) => {
  try {
    const cookieToken = req.cookies?.token;
    const bearerToken = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "Login required to perform this action",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user = {
    //   id: decoded.id,
    //   phone: decoded.phone,
    //   role: decoded.role,
    // };

    req.buyer = { id: decoded.id, phone: decoded.phone, role: decoded.role };
req.user = req.buyer;

    next();
  } catch (err) {
    console.error("BUYER AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyBuyer;
