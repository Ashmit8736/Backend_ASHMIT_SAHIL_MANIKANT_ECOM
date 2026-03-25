import jwt from "jsonwebtoken";

export function adminAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // ✅ header present?
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        // ✅ format check
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const token = authHeader.split(" ")[1];

        // ✅ token empty / undefined?
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ role check
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        console.error("JWT Error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
