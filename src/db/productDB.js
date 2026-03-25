import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "68.178.172.171",
    user: process.env.MYSQL_USER || "ecommerce_ecommerce",
    password: process.env.MYSQL_PASSWORD || "School@32#$",
    database: process.env.MYSQL_DATABASE || "ecommerce_mojija_product",

    waitForConnections: true,
    connectionLimit: 10,
});

export default pool;
