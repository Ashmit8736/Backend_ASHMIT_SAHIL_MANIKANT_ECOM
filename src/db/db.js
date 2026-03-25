const mysql = require("mysql2/promise");

// Common DB config
const baseConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
};

// 🔐 AUTH DB
const authDB = mysql.createPool({
  ...baseConfig,
  database: process.env.MYSQL_AUTH_DATABASE,
});

// 👨‍💼 ADMIN DB
const adminDB = mysql.createPool({
  ...baseConfig,
  database: process.env.MYSQL_ADMIN_DATABASE,
});

// 📦 PRODUCT DB
const productDB = mysql.createPool({
  ...baseConfig,
  database: process.env.MYSQL_PRODUCT_DATABASE,
});

// 🛒 CART DB
const cartDB = mysql.createPool({
  ...baseConfig,
  database: process.env.CART_DB_NAME,
});

// Test connections
(async () => {
  try {
    await authDB.query("SELECT 1");
    await adminDB.query("SELECT 1");
    await productDB.query("SELECT 1");
    await cartDB.query("SELECT 1");
    console.log("✅ All Databases Connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
})();

module.exports = {
  authDB,
  adminDB,
  productDB,
  cartDB,
};