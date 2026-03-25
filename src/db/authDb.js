// src/db/authDb.js
// import mysql from "mysql2/promise";
import "dotenv/config";
import mysql from "mysql2/promise";

const authPool = mysql.createPool({
    // host: process.env.AUTH_DB_HOST,
    // user: process.env.AUTH_DB_USER,
    // password: process.env.AUTH_DB_PASSWORD,
    // database: process.env.AUTH_DB_NAME,

      host: process.env.MYSQL_HOST || "68.178.172.171",
    user: process.env.MYSQL_USER || "ecommerce_ecommerce",
    password: process.env.MYSQL_PASSWORD || "School@32#$",
    database: process.env.AUTH_DB_NAME || "ecommerce_mojija_auth",
    
    waitForConnections: true,
    connectionLimit: 10,
});

export default authPool;
