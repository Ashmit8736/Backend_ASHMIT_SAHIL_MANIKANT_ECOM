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