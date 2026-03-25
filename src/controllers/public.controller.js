// const db = require("../db/db");

// // 1. Featured Partners (Sell


// // ⭐ FIX: Frontend 404 Errors ke liye dummy functions
// async function getPublicProducts(req, res) {
//     // Abhi ke liye empty data bhej rahe hain
//     res.status(200).json({ success: true, products: [], data: [] });
// }

// async function getPublicCategories(req, res) {
//     // Categories aur Category Tree dono handle karein
//     res.status(200).json({ success: true, categories: [], tree: [] });
// }

// async function getFeaturedPartners(req, res) {
//     try {
//         // const db = await connectDb();

//         // ✅ Approved Sellers
//         const [sellers] = await db.query(`
//             SELECT company_name, fullname
//             FROM seller
//             WHERE approval_status = 'approved'
//             ORDER BY created_at DESC
//             LIMIT 4
//         `);

//         // ✅ Approved Suppliers
//         const [suppliers] = await db.query(`
//             SELECT company_name, fullname
//             FROM supplier
//             WHERE approval_status = 'approved'
//             ORDER BY created_at DESC
//             LIMIT 4
//         `);

//         const sellerList = sellers.map(s => ({
//             name: s.company_name || s.fullname,
//             role: "Seller",
//             verified: true
//         }));

//         const supplierList = suppliers.map(s => ({
//             name: s.company_name || s.fullname,
//             role: "Supplier",
//             verified: true
//         }));

//         res.status(200).json({
//             success: true,
//             features: [...sellerList, ...supplierList]
//         });

//     } catch (error) {
//         console.error("Featured Partners Error:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// }

// module.exports = {
//     getFeaturedPartners,

//     getPublicProducts,
//     getPublicCategories,

// };


// const { authDB } = require("../db/db");

// async function getFeaturedPartners(req, res) {
//   try {

//     const [sellers] = await authDB.query(`
//       SELECT company_name, fullname
//       FROM seller
//       WHERE approval_status = 'approved'
//       ORDER BY created_at DESC
//       LIMIT 4
//     `);

//     const [suppliers] = await authDB.query(`
//       SELECT company_name, fullname
//       FROM supplier
//       WHERE approval_status = 'approved'
//       ORDER BY created_at DESC
//       LIMIT 4
//     `);

//     const sellerList = sellers.map(s => ({
//       name: s.company_name || s.fullname,
//       role: "Seller",
//       verified: true
//     }));

//     const supplierList = suppliers.map(s => ({
//       name: s.company_name || s.fullname,
//       role: "Supplier",
//       verified: true
//     }));

//     res.status(200).json({
//       success: true,
//       features: [...sellerList, ...supplierList]
//     });

//   } catch (error) {
//     console.error("Featured Partners Error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }

const { authDB } = require("../db/db");

async function getFeaturedPartners(req, res) {
  try {

    const [sellers] = await authDB.query(`
      SELECT company_name, fullname
      FROM seller
      WHERE approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 4
    `);

    const [suppliers] = await authDB.query(`
      SELECT company_name, fullname
      FROM supplier
      WHERE approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 4
    `);

    const sellerList = sellers.map(s => ({
      name: s.company_name || s.fullname,
      role: "Seller",
      verified: true
    }));

    const supplierList = suppliers.map(s => ({
      name: s.company_name || s.fullname,
      role: "Supplier",
      verified: true
    }));

    res.status(200).json({
      success: true,
      features: [...sellerList, ...supplierList]
    });

  } catch (error) {
    console.error("Featured Partners Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getFeaturedPartners,
};