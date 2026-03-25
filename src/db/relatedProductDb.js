

//changes today

import db from "./productDB.js";

export const getRelatedProducts = async (productId) => {

  /* 🔍 1. CHECK: PRODUCT SELLER ME HAI YA NAHI */
  const [[sellerCheck]] = await db.execute(
    `SELECT category_master_id FROM product WHERE product_id = ?`,
    [productId]
  );

  /* ================= SELLER PRODUCT ================= */
  if (sellerCheck) {
    const [rows] = await db.execute(
      `
      SELECT 
          p2.product_id,
          p2.product_name,
          p2.product_price,
          p2.rating_avg,
          p2.remaining_stock AS stock,
          'seller' AS source,
          (
              SELECT JSON_UNQUOTE(JSON_EXTRACT(pi.url, '$[0]'))
              FROM product_url pi
              WHERE pi.product_id = p2.product_id
              LIMIT 1
          ) AS product_url

      FROM product p1

      JOIN product p2 
          ON p1.category_master_id = p2.category_master_id
          AND p2.product_id != p1.product_id

      WHERE p1.product_id = ?

      ORDER BY 
          (p1.brand = p2.brand) DESC,
          p2.rating_avg DESC

      LIMIT 8
      `,
      // 🔥 CHANGE 1 — AND p2.stock > 0 hataya
      // PEHLE: WHERE p1.product_id = ? AND p2.stock > 0
      // AB: stock column exist nahi karta seller table me, remaining_stock hai
      // isliye stock filter hataya — frontend pe badge dikhega
      [productId]
    );

    return rows;
  }

  /* ================= SUPPLIER PRODUCT ================= */
  const [[supplierCheck]] = await db.execute(
    `SELECT category_master_id FROM supplier_product WHERE product_id = ?`,
    [productId]
  );

  if (supplierCheck) {
    const [rows] = await db.execute(
      `
      SELECT 
          sp2.product_id,
          sp2.product_name,
          sp2.wholesale_price AS product_price,
          0 AS rating_avg,
          sp2.remaining_stock AS stock,
          'supplier' AS source,
          (
              SELECT spu.url
              FROM supplier_product_url spu
              WHERE spu.product_id = sp2.product_id
              LIMIT 1
          ) AS product_url

      FROM supplier_product sp1

      JOIN supplier_product sp2
          ON sp1.category_master_id = sp2.category_master_id
          AND sp2.product_id != sp1.product_id

      WHERE sp1.product_id = ?
      AND sp2.remaining_stock > 0

      LIMIT 8
      `,
      [productId]
    );

    return rows;
  }

  /* ❌ DONO ME NAHI MILA */
  return [];
};