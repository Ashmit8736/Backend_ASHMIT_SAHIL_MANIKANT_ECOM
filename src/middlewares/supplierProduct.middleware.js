import jwt from "jsonwebtoken";
import authDb from "../db/authDb.js";

const verifySupplierProduct = async (req, res, next) => {
    try {
        // 🔐 TOKEN FROM HEADER OR COOKIE (SAME NAME)
        const token =
            req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : req.cookies?.suppliertoken; // ✅ SAME AS LOGIN

        console.log("🔐 SUPPLIER TOKEN:", token);

        if (!token || token === "undefined" || token === "null") {
            return res.status(401).json({ message: "Supplier not logged in" });
        }

        // 🔓 VERIFY TOKEN
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔍 FETCH SUPPLIER FROM AUTH DB
        const [rows] = await authDb.query(
            "SELECT id, email, fullname, approval_status FROM supplier WHERE id = ?",
            [decoded.id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        if (rows[0].approval_status !== "approved") {
            return res.status(403).json({ message: "Supplier not approved" });
        }

        // ✅ ATTACH SUPPLIER
        req.supplier = {
            id: rows[0].id,
            email: rows[0].email,
            fullname: rows[0].fullname,
        };

        next();
    } catch (err) {
        console.error("SUPPLIER AUTH ERROR:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default verifySupplierProduct;
