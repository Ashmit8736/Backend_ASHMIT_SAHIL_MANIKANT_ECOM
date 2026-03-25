// import db from "../db/productDB.js";

// export async function getBuyerProducts(req, res) {
//   try {
//     // SELLER PRODUCTS
//     const [sellerProducts] = await db.query(`
//       SELECT 
//         p.product_id,
//         p.product_name,
//         p.brand,
//         p.wholesale_price AS product_price
// ,
//         p.description,
//         p.gst_verified,
//         p.rating_avg,
//         c.category_name,
//         'seller' AS product_source,
//         (SELECT JSON_ARRAYAGG(JSON_EXTRACT(url, '$[0]'))
//          FROM product_url WHERE product_id = p.product_id) AS images
//       FROM product p
//       LEFT JOIN category c ON p.category_id = c.id
//     `);

//     // SUPPLIER PRODUCTS
//     const [supplierProducts] = await db.query(`
//       SELECT 
//         p.product_id,
//         p.product_name,
//         p.brand,
//         p.product_price,
//         p.description,
//         p.gst_verified,
//         p.rating_avg,
//         sc.supplier_company AS category_name,
//         'supplier' AS product_source,
//         (SELECT JSON_ARRAYAGG(JSON_EXTRACT(url, '$[0]'))
//          FROM supplier_product_url WHERE product_id = p.product_id) AS images
//       FROM supplier_product p
//       LEFT JOIN supplier_category sc ON p.category_id = sc.id
//     `);

//     const products = [...sellerProducts, ...supplierProducts];

//     res.json({
//       success: true,
//       total: products.length,
//       products,
//     });

//   } catch (err) {
//     console.error("Buyer Product Error:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }


// export const getPopularProducts = async (req, res) => {
//   try {
//     const [rows] = await db.query("CALL sp_get_popular_products()");

//     // MySQL CALL returns [[rows], fields]
//     const products = rows[0].map(p => ({
//       ...p,
//       images: p.images
//         ? Array.isArray(p.images)
//           ? p.images
//           : JSON.parse(p.images)
//         : []
//     }));

//     res.json({
//       success: true,
//       products
//     });
//   } catch (error) {
//     console.error("POPULAR PRODUCTS ERROR:", error);
//     res.status(500).json({ message: "Failed to fetch popular products" });
//   }
// };

// export const getProductsByCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id || isNaN(Number(id))) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category id",
//       });
//     }

//     const categoryId = Number(id);

//     /* ===============================
//        1️⃣ CATEGORY TREE (LEVEL 1/2/3)
//     =============================== */
//     const [categories] = await db.query(
//       "SELECT id, parent_id FROM category_master WHERE status = 1"
//     );

//     const ids = [];
//     const findChildren = (currentId) => {
//       ids.push(currentId);
//       categories
//         .filter((c) => c.parent_id === currentId)
//         .forEach((c) => findChildren(c.id));
//     };

//     findChildren(categoryId);

//     /* ===============================
//        2️⃣ SELLER PRODUCTS
//     =============================== */
//     const [sellerRows] = await db.query(
//       `
//       SELECT 
//         p.product_id,
//         p.product_name,
//         p.brand,
//         p.wholesale_price AS product_price,
//         p.description,
//         p.gst_verified,
//         p.rating_avg,
//         'seller' AS source,
//         (
//           SELECT JSON_ARRAYAGG(JSON_EXTRACT(pu.url, '$[0]'))
//           FROM product_url pu
//           WHERE pu.product_id = p.product_id
//         ) AS images,
//         p.created_at
//       FROM product p
//       WHERE p.category_id IN (?)
//       `,
//       [ids]
//     );

//     /* ===============================
//        3️⃣ SUPPLIER PRODUCTS
//     =============================== */
//     const [supplierRows] = await db.query(
//       `
//       SELECT 
//         sp.product_id,
//         sp.product_name,
//         sp.brand,
//         sp.product_price,
//         sp.description,
//         sp.gst_verified,
//         sp.rating_avg,
//         'supplier' AS source,
//         (
//           SELECT JSON_ARRAYAGG(spu.url)
//           FROM supplier_product_url spu
//           WHERE spu.product_id = sp.product_id
//         ) AS images,
//         sp.created_at
//       FROM supplier_product sp
//       WHERE sp.category_master_id IN (?)
//         AND sp.status = 'active'
//       `,
//       [ids]
//     );

//     /* ===============================
//        4️⃣ NORMALIZE IMAGES
//     =============================== */
//     const normalizeImages = (images) => {
//       if (!images) return [];
//       if (Array.isArray(images)) return images;
//       try {
//         return JSON.parse(images);
//       } catch {
//         return [];
//       }
//     };

//     const products = [
//       ...sellerRows.map((p) => ({
//         ...p,
//         images: normalizeImages(p.images),
//       })),
//       ...supplierRows.map((p) => ({
//         ...p,
//         images: normalizeImages(p.images),
//       })),
//     ];

//     /* ===============================
//        5️⃣ RESPONSE
//     =============================== */
//     res.json({
//       success: true,
//       count: products.length,
//       products,
//     });
//   } catch (err) {
//     console.error("CATEGORY BUYER PRODUCTS ERROR:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// export const getBuyerProductsByCategory = async (req, res) => {
//   try {
//     const categoryId = Number(req.params.id);

//     // 🔥 1️⃣ CATEGORY CHAIN (MASTER)
//     const [categories] = await db.query(
//       `
//       WITH RECURSIVE category_tree AS (
//         SELECT id
//         FROM category_master
//         WHERE id = ?

//         UNION ALL

//         SELECT cm.id
//         FROM category_master cm
//         INNER JOIN category_tree ct ON cm.parent_id = ct.id
//       )
//       SELECT id FROM category_tree
//       `,
//       [categoryId]
//     );

//     const categoryIds = categories.map(c => c.id);

//     if (!categoryIds.length) {
//       return res.json({ success: true, products: [] });
//     }

//     // 🔥 2️⃣ SELLER + SUPPLIER PRODUCTS (UNION)
//     const [products] = await db.query(
//       `
//       -- SELLER PRODUCTS
//       SELECT
//         p.product_id,
//         p.product_name,
//         p.brand,
//         p.product_price,
//         p.rating_avg,
//         'seller' AS product_source,
//         (
//           SELECT JSON_ARRAYAGG(pu.url)
//           FROM product_url pu
//           WHERE pu.product_id = p.product_id
//         ) AS images
//       FROM product p
//       WHERE p.category_master_id IN (?)

//       UNION ALL

//       -- SUPPLIER PRODUCTS
//       SELECT
//         sp.product_id,
//         sp.product_name,
//         sp.brand,
//         sp.wholesale_price AS product_price,
//         0 AS rating_avg,
//         'supplier' AS product_source,
//         (
//           SELECT JSON_ARRAYAGG(spu.url)
//           FROM supplier_product_url spu
//           WHERE spu.product_id = sp.product_id
//         ) AS images
//       FROM supplier_product sp
//       WHERE sp.category_master_id IN (?)
//       `,
//       [categoryIds, categoryIds]
//     );

//     res.json({
//       success: true,
//       count: products.length,
//       products,
//     });

//   } catch (error) {
//     console.error("CATEGORY BUYER ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };







// export const getBuyerCategoryProducts = async (req, res) => {
//   try {
//     const categoryId = Number(req.params.id);
//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category id",
//       });
//     }

//     /* ===============================
//        QUERY PARAMS
//     =============================== */
//     const { sort = "newest", page = 1, limit = 20 } = req.query;
//     const offset = (Number(page) - 1) * Number(limit);

//     const SORT_MAP = {
//       price_asc: "product_price ASC",
//       price_desc: "product_price DESC",
//       newest: "created_at DESC",
//       moq_asc: "moq ASC",
//       moq_desc: "moq DESC",
//     };
//     const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

//     /* ===============================
//        1️⃣ CATEGORY TREE (SELF + CHILDREN)
//     =============================== */
//     const [categories] = await db.query(
//       `
//       WITH RECURSIVE category_tree AS (
//         SELECT id
//         FROM category_master
//         WHERE id = ?

//         UNION ALL

//         SELECT cm.id
//         FROM category_master cm
//         INNER JOIN category_tree ct ON cm.parent_id = ct.id
//       )
//       SELECT id FROM category_tree
//       `,
//       [categoryId]
//     );

//     const categoryIds = categories.map(c => c.id);

//     if (!categoryIds.length) {
//       return res.json({
//         success: true,
//         products: [],
//         count: 0,
//       });
//     }

//     /* ===============================
//        2️⃣ MYSQL2 SAFE PLACEHOLDERS
//     =============================== */
//     const placeholders = categoryIds.map(() => "?").join(",");

//     /* ===============================
//        3️⃣ FINAL QUERY (NO IN (?) BUG)
//     =============================== */
//     const query = `
//       SELECT * FROM (
//         -- SELLER PRODUCTS
//         SELECT
//           p.product_id,
//           p.product_name,
//           p.brand,
//           p.product_price,
//           1 AS moq,
//           p.rating_avg,
//           'seller' AS product_source,
//           (
//             SELECT JSON_ARRAYAGG(pu.url)
//             FROM product_url pu
//             WHERE pu.product_id = p.product_id
//           ) AS images,
//           p.created_at
//         FROM product p
//         WHERE p.category_master_id IN (${placeholders})

//         UNION ALL

//         -- SUPPLIER PRODUCTS
//         SELECT
//           sp.product_id,
//           sp.product_name,
//           sp.brand,
//           sp.wholesale_price AS product_price,
//           sp.wholesale_moq AS moq,
//           0 AS rating_avg,
//           'supplier' AS product_source,
//           (
//             SELECT JSON_ARRAYAGG(spu.url)
//             FROM supplier_product_url spu
//             WHERE spu.product_id = sp.product_id
//           ) AS images,
//           sp.created_at
//         FROM supplier_product sp
//         WHERE sp.category_master_id IN (${placeholders})
//           AND sp.status = 'active'
//       ) AS products
//       ORDER BY ${orderBy}
//       LIMIT ? OFFSET ?
//     `;

//     /* ===============================
//        4️⃣ PARAMS (IMPORTANT)
//     =============================== */
//     const params = [
//       ...categoryIds,   // seller IN
//       ...categoryIds,   // supplier IN
//       Number(limit),
//       Number(offset),
//     ];

//     const [products] = await db.query(query, params);

//     /* ===============================
//        5️⃣ NORMALIZE IMAGES
//     =============================== */
//     const normalizeImages = (imgs) => {
//       if (!imgs) return [];
//       if (Array.isArray(imgs)) return imgs;
//       try {
//         return JSON.parse(imgs);
//       } catch {
//         return [];
//       }
//     };

//     const finalProducts = products.map(p => ({
//       ...p,
//       images: normalizeImages(p.images),
//     }));

//     /* ===============================
//        6️⃣ RESPONSE
//     =============================== */
//     res.json({
//       success: true,
//       page: Number(page),
//       limit: Number(limit),
//       count: finalProducts.length,
//       products: finalProducts,
//     });
//   } catch (error) {
//     console.error("getBuyerCategoryProducts ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };




// // controllers/buyerProduct.controller.js
// export const getBuyerPriceRange = async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         MIN(product_price) AS minPrice,
//         MAX(product_price) AS maxPrice
//       FROM (
//         SELECT wholesale_price AS product_price FROM product
//         UNION ALL
//         SELECT wholesale_price AS product_price FROM supplier_product
//       ) t
//     `);

//     res.json({
//       success: true,
//       minPrice: rows[0].minPrice || 0,
//       maxPrice: rows[0].maxPrice || 0
//     });
//   } catch (err) {
//     console.error("PRICE RANGE ERROR:", err);
//     res.status(500).json({ message: "Failed to fetch price range" });
//   }
// };

// // import db from "../db/productDb.js";

// export const searchBuyerProducts = async (req, res) => {
//   try {
//     const { query = "", page = 1, limit = 20 } = req.query;

//     if (!query.trim()) {
//       return res.json({
//         success: true,
//         products: [],
//         count: 0,
//       });
//     }

//     const q = `%${query.toLowerCase()}%`;
//     const offset = (Number(page) - 1) * Number(limit);

//     const [rows] = await db.query(
//       `
//       SELECT * FROM (
//         /* ================= SELLER PRODUCTS ================= */
//         SELECT
//           p.product_id,
//           p.product_name,
//           p.brand,
//           p.product_price,
//           p.rating_avg,
//           'seller' AS product_source,
//           cm.category_name,
//           (
//             SELECT JSON_ARRAYAGG(pu.url)
//             FROM product_url pu
//             WHERE pu.product_id = p.product_id
//           ) AS images,
//           p.created_at
//         FROM product p
//         LEFT JOIN category_master cm ON p.category_master_id = cm.id
//         WHERE LOWER(p.product_name) LIKE ?
//            OR LOWER(p.brand) LIKE ?
//            OR LOWER(cm.category_name) LIKE ?

//         UNION ALL

//         /* ================= SUPPLIER PRODUCTS ================= */
//         SELECT
//           sp.product_id,
//           sp.product_name,
//           sp.brand,
//           sp.wholesale_price AS product_price,
//           0 AS rating_avg,
//           'supplier' AS product_source,
//           cm.category_name,
//           (
//             SELECT JSON_ARRAYAGG(spu.url)
//             FROM supplier_product_url spu
//             WHERE spu.product_id = sp.product_id
//           ) AS images,
//           sp.created_at
//         FROM supplier_product sp
//         LEFT JOIN category_master cm ON sp.category_master_id = cm.id
//         WHERE (
//             LOWER(sp.product_name) LIKE ?
//          OR LOWER(sp.brand) LIKE ?
//          OR LOWER(cm.category_name) LIKE ?
//         )
//         AND sp.status = 'active'
//       ) AS products
//       ORDER BY created_at DESC
//       LIMIT ? OFFSET ?
//       `,
//       [q, q, q, q, q, q, Number(limit), Number(offset)]
//     );

//     const normalizeImages = (imgs) => {
//       if (!imgs) return [];
//       if (Array.isArray(imgs)) return imgs;
//       try {
//         return JSON.parse(imgs);
//       } catch {
//         return [];
//       }
//     };

//     const products = rows.map((p) => ({
//       ...p,
//       images: normalizeImages(p.images),
//     }));

//     res.json({
//       success: true,
//       page: Number(page),
//       limit: Number(limit),
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     console.error("BUYER SEARCH ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Search failed",
//     });
//   }
// };



import db from "../db/productDB.js";

export async function getBuyerProducts(req, res) {
  try {
    // SELLER PRODUCTS
    const [sellerProducts] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        p.wholesale_price AS product_price,
        p.description,
        p.gst_verified,
        p.rating_avg,
        p.remaining_stock,
        c.category_name,
        'seller' AS product_source,
        (SELECT JSON_ARRAYAGG(JSON_EXTRACT(url, '$[0]'))
         FROM product_url WHERE product_id = p.product_id) AS images
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
    `);

    // SUPPLIER PRODUCTS
    const [supplierProducts] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        p.product_price,
        p.description,
        p.gst_verified,
        p.rating_avg,
        NULL AS remaining_stock,
        sc.supplier_company AS category_name,
        'supplier' AS product_source,
        (SELECT JSON_ARRAYAGG(JSON_EXTRACT(url, '$[0]'))
         FROM supplier_product_url WHERE product_id = p.product_id) AS images
      FROM supplier_product p
      LEFT JOIN supplier_category sc ON p.category_id = sc.id
    `);

    const products = [...sellerProducts, ...supplierProducts];

    res.json({
      success: true,
      total: products.length,
      products,
    });

  } catch (err) {
    console.error("Buyer Product Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const getPopularProducts = async (req, res) => {
  try {
    const [rows] = await db.query("CALL sp_get_popular_products()");

    const products = rows[0].map(p => ({
      ...p,
      images: p.images
        ? Array.isArray(p.images)
          ? p.images
          : JSON.parse(p.images)
        : []
    }));

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error("POPULAR PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch popular products" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const categoryId = Number(id);

    const [categories] = await db.query(
      "SELECT id, parent_id FROM category_master WHERE status = 1"
    );

    const ids = [];
    const findChildren = (currentId) => {
      ids.push(currentId);
      categories
        .filter((c) => c.parent_id === currentId)
        .forEach((c) => findChildren(c.id));
    };

    findChildren(categoryId);

    const [sellerRows] = await db.query(
      `
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        p.wholesale_price AS product_price,
        p.description,
        p.gst_verified,
        p.rating_avg,
        p.remaining_stock,
        'seller' AS source,
        (
          SELECT JSON_ARRAYAGG(JSON_EXTRACT(pu.url, '$[0]'))
          FROM product_url pu
          WHERE pu.product_id = p.product_id
        ) AS images,
        p.created_at
      FROM product p
      WHERE p.category_id IN (?)
      `,
      [ids]
    );

    const [supplierRows] = await db.query(
      `
      SELECT 
        sp.product_id,
        sp.product_name,
        sp.brand,
        sp.product_price,
        sp.description,
        sp.gst_verified,
        sp.rating_avg,
        NULL AS remaining_stock,
        'supplier' AS source,
        (
          SELECT JSON_ARRAYAGG(spu.url)
          FROM supplier_product_url spu
          WHERE spu.product_id = sp.product_id
        ) AS images,
        sp.created_at
      FROM supplier_product sp
      WHERE sp.category_master_id IN (?)
        AND sp.status = 'active'
      `,
      [ids]
    );

    const normalizeImages = (images) => {
      if (!images) return [];
      if (Array.isArray(images)) return images;
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    };

    const products = [
      ...sellerRows.map((p) => ({
        ...p,
        images: normalizeImages(p.images),
      })),
      ...supplierRows.map((p) => ({
        ...p,
        images: normalizeImages(p.images),
      })),
    ];

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("CATEGORY BUYER PRODUCTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBuyerProductsByCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const [categories] = await db.query(
      `
      WITH RECURSIVE category_tree AS (
        SELECT id
        FROM category_master
        WHERE id = ?

        UNION ALL

        SELECT cm.id
        FROM category_master cm
        INNER JOIN category_tree ct ON cm.parent_id = ct.id
      )
      SELECT id FROM category_tree
      `,
      [categoryId]
    );

    const categoryIds = categories.map(c => c.id);

    if (!categoryIds.length) {
      return res.json({ success: true, products: [] });
    }

    const [products] = await db.query(
      `
      -- SELLER PRODUCTS
      SELECT
        p.product_id,
        p.product_name,
        p.brand,
        p.product_price,
        p.rating_avg,
        p.remaining_stock,
        'seller' AS product_source,
        (
          SELECT JSON_ARRAYAGG(pu.url)
          FROM product_url pu
          WHERE pu.product_id = p.product_id
        ) AS images
      FROM product p
      WHERE p.category_master_id IN (?)

      UNION ALL

      -- SUPPLIER PRODUCTS
      SELECT
        sp.product_id,
        sp.product_name,
        sp.brand,
        sp.wholesale_price AS product_price,
         sp.rating_avg,
        sp.remaining_stock,
        'supplier' AS product_source,
        (
          SELECT JSON_ARRAYAGG(spu.url)
          FROM supplier_product_url spu
          WHERE spu.product_id = sp.product_id
        ) AS images
      FROM supplier_product sp
      WHERE sp.category_master_id IN (?)
      `,
      [categoryIds, categoryIds]
    );

    res.json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {
    console.error("CATEGORY BUYER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getBuyerCategoryProducts = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const { sort = "newest", page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const SORT_MAP = {
      price_asc: "product_price ASC",
      price_desc: "product_price DESC",
      newest: "created_at DESC",
      moq_asc: "moq ASC",
      moq_desc: "moq DESC",
    };
    const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

    const [categories] = await db.query(
      `
      WITH RECURSIVE category_tree AS (
        SELECT id
        FROM category_master
        WHERE id = ?

        UNION ALL

        SELECT cm.id
        FROM category_master cm
        INNER JOIN category_tree ct ON cm.parent_id = ct.id
      )
      SELECT id FROM category_tree
      `,
      [categoryId]
    );

    const categoryIds = categories.map(c => c.id);

    if (!categoryIds.length) {
      return res.json({
        success: true,
        products: [],
        count: 0,
      });
    }

    const placeholders = categoryIds.map(() => "?").join(",");

    const query = `
      SELECT * FROM (
        -- SELLER PRODUCTS
        SELECT
          p.product_id,
          p.product_name,
          p.brand,
          p.product_price,
          1 AS moq,
          p.rating_avg,
          p.remaining_stock,
          'seller' AS product_source,
          (
            SELECT JSON_ARRAYAGG(pu.url)
            FROM product_url pu
            WHERE pu.product_id = p.product_id
          ) AS images,
          p.created_at
        FROM product p
        WHERE p.category_master_id IN (${placeholders})

        UNION ALL

        -- SUPPLIER PRODUCTS
        SELECT
          sp.product_id,
          sp.product_name,
          sp.brand,
          sp.wholesale_price AS product_price,
          sp.wholesale_moq AS moq,
          sp.rating_avg,
           sp.remaining_stock,
          'supplier' AS product_source,
          (
            SELECT JSON_ARRAYAGG(spu.url)
            FROM supplier_product_url spu
            WHERE spu.product_id = sp.product_id
          ) AS images,
          sp.created_at
        FROM supplier_product sp
        WHERE sp.category_master_id IN (${placeholders})
          AND sp.status = 'active'
      ) AS products
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const params = [
      ...categoryIds,
      ...categoryIds,
      Number(limit),
      Number(offset),
    ];

    const [products] = await db.query(query, params);

    const normalizeImages = (imgs) => {
      if (!imgs) return [];
      if (Array.isArray(imgs)) return imgs;
      try {
        return JSON.parse(imgs);
      } catch {
        return [];
      }
    };

    const finalProducts = products.map(p => ({
      ...p,
      images: normalizeImages(p.images),
    }));

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      count: finalProducts.length,
      products: finalProducts,
    });
  } catch (error) {
    console.error("getBuyerCategoryProducts ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getBuyerPriceRange = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        MIN(product_price) AS minPrice,
        MAX(product_price) AS maxPrice
      FROM (
        SELECT wholesale_price AS product_price FROM product
        UNION ALL
        SELECT wholesale_price AS product_price FROM supplier_product
      ) t
    `);

    res.json({
      success: true,
      minPrice: rows[0].minPrice || 0,
      maxPrice: rows[0].maxPrice || 0
    });
  } catch (err) {
    console.error("PRICE RANGE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch price range" });
  }
};


export const searchBuyerProducts = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 20 } = req.query;

    if (!query.trim()) {
      return res.json({
        success: true,
        products: [],
        count: 0,
      });
    }

    const q = `%${query.toLowerCase()}%`;
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await db.query(
      `
      SELECT * FROM (
        /* ================= SELLER PRODUCTS ================= */
        SELECT
          p.product_id,
          p.product_name,
          p.brand,
          p.product_price,
          p.rating_avg,
          p.remaining_stock,
          'seller' AS product_source,
          cm.category_name,
          (
            SELECT JSON_ARRAYAGG(pu.url)
            FROM product_url pu
            WHERE pu.product_id = p.product_id
          ) AS images,
          p.created_at
        FROM product p
        LEFT JOIN category_master cm ON p.category_master_id = cm.id
        WHERE LOWER(p.product_name) LIKE ?
           OR LOWER(p.brand) LIKE ?
           OR LOWER(cm.category_name) LIKE ?

        UNION ALL

        /* ================= SUPPLIER PRODUCTS ================= */
        SELECT
          sp.product_id,
          sp.product_name,
          sp.brand,
          sp.wholesale_price AS product_price,
          sp.rating_avg,
          sp.remaining_stock,
          'supplier' AS product_source,
          cm.category_name,
          (
            SELECT JSON_ARRAYAGG(spu.url)
            FROM supplier_product_url spu
            WHERE spu.product_id = sp.product_id
          ) AS images,
          sp.created_at
        FROM supplier_product sp
        LEFT JOIN category_master cm ON sp.category_master_id = cm.id
        WHERE (
            LOWER(sp.product_name) LIKE ?
         OR LOWER(sp.brand) LIKE ?
         OR LOWER(cm.category_name) LIKE ?
        )
        AND sp.status = 'active'
      ) AS products
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [q, q, q, q, q, q, Number(limit), Number(offset)]
    );

    const normalizeImages = (imgs) => {
      if (!imgs) return [];
      if (Array.isArray(imgs)) return imgs;
      try {
        return JSON.parse(imgs);
      } catch {
        return [];
      }
    };

    const products = rows.map((p) => ({
      ...p,
      images: normalizeImages(p.images),
    }));

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("BUYER SEARCH ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};