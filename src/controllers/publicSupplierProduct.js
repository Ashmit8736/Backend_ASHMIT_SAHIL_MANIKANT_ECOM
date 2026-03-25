import db from "../db/productDB.js";


// ⭐ All Supplier Products (Public)
export async function getPublicSupplierProducts(req, res) {
  try {
    const [products] = await db.query(`
      SELECT 
        sp.product_id,
        sp.product_name,
        sp.brand,
        sp.wholesale_price AS product_price,
        sp.short_description AS description,
        sp.gst_verified,
        sp.supplier_company,
        sp.remaining_stock,
        sp.rating_avg,
        cm.category_name,
        (
          SELECT JSON_ARRAYAGG(JSON_UNQUOTE(url))
FROM supplier_product_url
          WHERE product_id = sp.product_id
        ) AS images
      FROM supplier_product sp
      JOIN category_master cm 
        ON sp.category_master_id = cm.id
      WHERE sp.status = 'active'
      ORDER BY sp.product_id DESC
    `);

    res.json({ success: true, products });
  } catch (err) {
    console.error("Public Supplier Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


// ⭐ Get Supplier Product By ID
export async function getPublicSupplierProductById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        sp.product_id,
        sp.product_name,
        sp.brand,
        sp.wholesale_price AS product_price,
        sp.short_description,
        sp.long_description,
        sp.product_unit,
        sp.stock,
        sp.gst_verified,
        sp.supplier_company,
        cm.category_name,
        (
          SELECT JSON_ARRAYAGG(JSON_UNQUOTE(url))
FROM supplier_product_url

          WHERE product_id = sp.product_id
        ) AS images
      FROM supplier_product sp
      JOIN category_master cm 
        ON sp.category_master_id = cm.id
      WHERE sp.product_id = ?
        AND sp.status = 'active'
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error("Public Supplier Product Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}



// ⭐ Get Supplier Products By Category
export async function getPublicSupplierProductsByCategory(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [products] = await db.query(`
      SELECT 
        sp.product_id,
        sp.product_name,
        sp.brand,
        sp.wholesale_price AS product_price,
        sp.short_description AS description,
        sp.gst_verified,
        sp.supplier_company,
        sp.remaining_stock,
        sp.rating_avg,
        cm.category_name,
        (
          SELECT JSON_ARRAYAGG(JSON_UNQUOTE(url))
FROM supplier_product_url

          WHERE product_id = sp.product_id
        ) AS images
      FROM supplier_product sp
      JOIN category_master cm 
        ON sp.category_master_id = cm.id
      WHERE sp.category_master_id = ?
        AND sp.status = 'active'
      ORDER BY sp.product_id DESC
    `, [id]);

    res.json({ success: true, products });
  } catch (err) {
    console.error("Public Supplier Category Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

