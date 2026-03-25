import dotenv from "dotenv";
dotenv.config();

console.log("🔥 ENV Loaded:", {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    pass: process.env.MYSQL_PASSWORD,
    db: process.env.MYSQL_DATABASE,
    jwt: process.env.JWT_SECRET
});
