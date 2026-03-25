import jwt from "jsonwebtoken";

export function generateAdminToken(admin) {
    return jwt.sign(
        {
            id: admin.id,
            email: admin.email,
            role: "admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}
