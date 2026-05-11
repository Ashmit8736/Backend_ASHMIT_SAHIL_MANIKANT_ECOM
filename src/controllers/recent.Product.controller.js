


import db from "../db/productDB.js";

// export const getRecentProducts = async (req, res) => {
//   try {
//     const { ids } = req.query;

//     if (!ids) return res.json([]);

//     console.log("RAW IDS:", ids);

//     let idArray = ids.split(",");

//     console.log("ID ARRAY:", idArray);

//     // Clean IDs
//     const cleanIds = idArray
//       .map(item => Number(item))
//       .filter(id => !isNaN(id));

//     console.log("CLEAN IDS:", cleanIds);

//     if (!cleanIds.length) return res.json([]);

//     const [rows] = await db.query(
//       `
//       SELECT 
//         p.product_id,
//         p.product_name,
//         p.product_price AS price,
//         JSON_UNQUOTE(JSON_EXTRACT(MIN(u.url), '$[0]')) AS thumbnail
//       FROM product p
//       LEFT JOIN product_url u 
//       ON p.product_id = u.product_id
//       WHERE p.product_id IN (?)
//       GROUP BY p.product_id
//       `,
//       [cleanIds]
//     );

//     res.json(rows);

//   } catch (error) {
//     console.error("RECENT PRODUCT ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const getRecentProducts = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json([]);

    const cleanIds = ids.split(",")
      .map(item => Number(item))
      .filter(id => !isNaN(id));

    if (!cleanIds.length) return res.json([]);

    const [rows] = await db.query(
      `
      SELECT * FROM (
        -- SELLER PRODUCTS
        SELECT 
          p.product_id,
          p.product_name,
          p.product_price AS price,
          'seller' AS owner_type,
          JSON_UNQUOTE(JSON_EXTRACT(MIN(u.url), '$[0]')) AS thumbnail
        FROM product p
        LEFT JOIN product_url u ON p.product_id = u.product_id
        WHERE p.product_id IN (?)
        GROUP BY p.product_id

        UNION ALL

        -- SUPPLIER PRODUCTS
        SELECT 
          sp.product_id,
          sp.product_name,
          sp.wholesale_price AS price,
          'supplier' AS owner_type,
          MIN(spu.url) AS thumbnail
        FROM supplier_product sp
        LEFT JOIN supplier_product_url spu ON sp.product_id = spu.product_id
        WHERE sp.product_id IN (?)
        GROUP BY sp.product_id
      ) AS combined
      `,
      [cleanIds, cleanIds]
    );

    // ✅ Order maintain karo — jaise localStorage mein tha
    const ordered = cleanIds
      .map(id => rows.find(r => r.product_id === id))
      .filter(Boolean);

    res.json(ordered);

  } catch (error) {
    console.error("RECENT PRODUCT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};