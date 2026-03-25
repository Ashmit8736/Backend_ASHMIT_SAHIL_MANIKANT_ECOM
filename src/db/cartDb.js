import mysql from "mysql2/promise";

const cartDb = mysql.createPool({
    
    host: process.env.MYSQL_HOST || "68.178.172.171",
    user: process.env.MYSQL_USER || "ecommerce_ecommerce",
    password: process.env.MYSQL_PASSWORD || "School@32#$",
    database: process.env.CART_DB_NAME || "ecommerce_mojija_cart",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default cartDb;
