// import connectProductDb from "../db/productDb.js";
import db from "../db/productDB.js";

import { uploadImage } from "../services/services.js";

import cartDb from "../db/cartDb.js";





async function sellerProduct(req, res) {
  try {
    const { id: seller_id } = req.seller;

    const {
      product_name,
      category_master_id,
      sku,
      brand,
      location_city,
      location_state,
      location_country,
      gst_verified,
      product_price,
      product_unit,
      total_stock,
      remaining_stock,
      short_description,
      long_description,
      description,
      product_date = new Date(),
    } = req.body;

    if (!product_name || !category_master_id) {
      return res.status(400).json({
        message: "product_name & category_master_id are required",
      });
    }

    // ✅ validate category
    const [cat] = await db.query(
      `SELECT id FROM category_master WHERE id = ?`,
      [category_master_id]
    );

    if (!cat.length) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    const totalStock = Number(total_stock) || 0;
    const remainingStock = Number(remaining_stock) || totalStock;
    const formattedDate = new Date(product_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const [result] = await db.query(
      `
      INSERT INTO product (
        seller_id,
        category_master_id,
        product_name,
        sku,
        brand,
        location_city,
        location_state,
        location_country,
        gst_verified,
        product_price,
        product_unit,
        stock,
        total_stock,
        remaining_stock,
        short_description,
        long_description,
        description,
        product_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        seller_id,
        category_master_id,
        product_name,
        sku || null,
        brand,
        location_city,
        location_state,
        location_country,
        gst_verified,
        product_price,
        product_unit,
        totalStock,
        totalStock,
        remainingStock,
        short_description,
        long_description,
        description,
        formattedDate,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product_id: result.insertId,
    });
  } catch (err) {
    console.error("SELLER PRODUCT ERROR:", err);
    res.status(500).json({ message: "Same SKU already exists. Please use a different SKU" });
  }
}



async function sellerImage(req, res) {
  try {
    // const db = await connectProductDb();
    const { id: seller_id } = req.seller;

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to image service
    const uploaded = await Promise.all(files.map((f) => uploadImage(f)));
    const valid = uploaded.filter((img) => img.success);

    if (valid.length === 0) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    const urls = valid.map((i) => i.optimized_url);

    // GET LAST PRODUCT ADDED BY THIS SELLER
    const [productRow] = await db.query(
      `SELECT product_id FROM product 
       WHERE seller_id = ?
       ORDER BY product_id DESC LIMIT 1`,
      [seller_id]
    );

    if (!productRow.length) {
      return res.status(404).json({ message: "No product found to attach images" });
    }

    const product_id = productRow[0].product_id;

    // Insert URLs (matching your DB structure)
    for (let url of urls) {
      await db.query(
        `INSERT INTO product_url (product_id, seller_id, url)
         VALUES (?, ?, ?)`,
        [product_id, seller_id, JSON.stringify([url])]
      );
    }

    res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      product_id,
      urls
    });

  } catch (error) {
    console.error("IMAGE UPLOAD ERROR:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
}


async function getAllProduct(req, res) {
  try {
    // const db = await connectProductDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sellerId = req.seller?.id;

    let rowsQuery = "SELECT * FROM ecommerce_mojija_product.product";
    let countQuery = "SELECT COUNT(*) as total FROM ecommerce_mojija_product.product";
    const params = [];
    const countParams = [];

    if (sellerId) {
      rowsQuery += " WHERE seller_id = ?";
      countQuery += " WHERE seller_id = ?";
      params.push(sellerId);
      countParams.push(sellerId);
    }

    rowsQuery += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(rowsQuery, params);
    const [totalResult] = await db.query(countQuery, countParams);
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    if (rows.length === 0) {
      const msg = sellerId
        ? "No products found for this seller"
        : "Product not found";
      return res.status(404).json({ message: msg });
    }

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalRecords: total,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getImageUrl(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller?.id;
    if (!sellerId)
      return res.status(401).json({ message: "Unauthorized" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [results] = await db.query(
      "CALL GetProductDetailsWithImagesBySeller(?)",
      [sellerId]
    );
    const productList = results[0] || [];

    const processedProducts = productList.map((p) => {
      const out = { ...p };
      try {
        if (out.image_urls && typeof out.image_urls === "string") {
          out.image_urls = JSON.parse(out.image_urls);
        } else if (!out.image_urls) {
          out.image_urls = [];
        }
      } catch (e) {
        console.error("Error parsing image_urls:", e);
        out.image_urls = [];
      }
      return out;
    });

    const total = processedProducts.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = processedProducts.slice(
      offset,
      offset + limit
    );

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalRecords: total,
      count: paginated.length,
      data: paginated,
    });
  } catch (error) {
    console.error("getImageUrl error:", error);
    res
      .status(500)
      .json({ message: "getImgUrl Internal server error" });
  }
}

async function deleteProduct(req, res) {
  try {
    // const db = await connectProductDb();
    const { id: seller_id } = req.seller;
    const product_id = req.params.id;

    const [product] = await db.query(
      "SELECT * FROM product WHERE product_id = ? AND seller_id = ?",
      [product_id, seller_id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        message: "Product not found or unauthorized",
      });
    }

    await db.query("DELETE FROM product_url WHERE product_id = ?", [
      product_id,
    ]);
    await db.query(
      "DELETE FROM product WHERE product_id = ? AND seller_id = ?",
      [product_id, seller_id]
    );

    res.status(200).json({
      message: "Product deleted successfully",
      product_id,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Product delete failed" });
  }
}

/**
 * UPDATE PRODUCT (only total_stock & remaining_stock from frontend)
 * stock column in DB = total_stock (auto set here)
 */
async function updateProduct(req, res) {
  try {
    const { id: seller_id } = req.seller;
    const product_id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM product WHERE product_id = ? AND seller_id = ?",
      [product_id, seller_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = rows[0];

    // 🔒 SAFE MERGE (frontend jo bheje wahi update ho)
    const payload = {
      product_name: req.body.product_name ?? existing.product_name,
      sku: req.body.sku?.trim() || existing.sku,
      brand: req.body.brand ?? existing.brand,
      product_price: req.body.product_price ?? existing.product_price,
      product_unit: req.body.product_unit ?? existing.product_unit,
      total_stock: req.body.total_stock ?? existing.total_stock,
      remaining_stock: req.body.remaining_stock ?? existing.remaining_stock,
      short_description: req.body.short_description ?? existing.short_description,
      long_description: req.body.long_description ?? existing.long_description,
      description: req.body.description ?? existing.description,
      location_city: req.body.location_city ?? existing.location_city,
      location_state: req.body.location_state ?? existing.location_state,
      location_country: req.body.location_country ?? existing.location_country,
      gst_verified: req.body.gst_verified ?? existing.gst_verified,
    };

    await db.query(
      `UPDATE product SET
        product_name=?,
        sku=?,
        brand=?,
        product_price=?,
        product_unit=?,
        stock=?,
        total_stock=?,
        remaining_stock=?,
        short_description=?,
        long_description=?,
        description=?,
        location_city=?,
        location_state=?,
        location_country=?,
        gst_verified=?
      WHERE product_id=? AND seller_id=?`,
      [
        payload.product_name,
        payload.sku,
        payload.brand,
        payload.product_price,
        payload.product_unit,
        payload.total_stock,   // stock sync
        payload.total_stock,
        payload.remaining_stock,
        payload.short_description,
        payload.long_description,
        payload.description,
        payload.location_city,
        payload.location_state,
        payload.location_country,
        payload.gst_verified,
        product_id,
        seller_id
      ]
    );

    res.json({ message: "Product updated successfully" });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Same SKU already exists. Please use a different SKU" });
  }
}




async function getSellerInventory(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller.id;

    const [rows] = await db.query(
      `
      SELECT 
        p.product_id AS id,
        p.product_name AS name,
        p.brand,
        p.product_price,
        p.remaining_stock AS stock,
        p.min_stock,
        JSON_ARRAYAGG(JSON_EXTRACT(pu.url, '$[0]')) AS images
      FROM ecommerce_mojija_product.product p
      LEFT JOIN ecommerce_mojija_product.product_url pu 
        ON p.product_id = pu.product_id
      WHERE p.seller_id = ?
      GROUP BY 
        p.product_id, p.product_name, p.brand, 
        p.product_price, p.remaining_stock, p.min_stock
      `,
      [sellerId]
    );

    // 🔥 SAFE IMAGE PARSER
    const formatted = rows.map(item => {
      let images = [];

      try {
        const parsed = JSON.parse(item.images);
        if (Array.isArray(parsed)) images = parsed;
      } catch (error) {
        if (item.images) images = [item.images];
      }

      return {
        ...item,
        minStock: item.min_stock ?? 0,
        images,
      };
    });

    res.status(200).json({ success: true, inventory: formatted });

  } catch (error) {
    console.error("GET INVENTORY ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function updateSellerStock(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller.id;
    const { id } = req.params;
    let { stock } = req.body;

    if (stock === undefined)
      return res.status(400).json({ message: "Stock is required" });

    // Convert to number
    stock = Number(stock);
    if (isNaN(stock) || stock < 0)
      return res.status(400).json({ message: "Invalid stock value" });

    // Update only remaining stock (inventory stock)
    await db.query(
      `
      UPDATE ecommerce_mojija_product.product
      SET remaining_stock = ?
      WHERE product_id = ? AND seller_id = ?
      `,
      [stock, id, sellerId]
    );

    // 🟢 Fetch updated record to return clean updated data
    const [updated] = await db.query(
      `
      SELECT 
        product_id AS id,
        product_name AS name,
        remaining_stock AS stock,
        min_stock
      FROM ecommerce_mojija_product.product
      WHERE product_id = ? AND seller_id = ?
      `,
      [id, sellerId]
    );

    res.status(200).json({
      message: "Stock updated successfully",
      updatedProduct: updated[0]
    });

  } catch (error) {
    console.error("UPDATE STOCK ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getSellerWallet(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller.id;

    const [rows] = await db.query(
      `
      SELECT withdrawable_balance, total_earnings, pending_payouts
      FROM seller_wallet 
      WHERE seller_id = ?
      ORDER BY id DESC 
      LIMIT 1
      `,
      [sellerId]
    );

    if (!rows.length) {
      return res.json({
        total_earnings: 0,
        withdrawable_balance: 0,
        pending_payouts: 0
      });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("WALLET ERROR:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}



async function getSellerTransactions(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller.id;

    const [rows] = await db.query(
      `
      SELECT 
        id, txn_id, amount, type, status, description, created_at 
      FROM seller_transactions 
      WHERE seller_id = ?
      ORDER BY created_at DESC
      `,
      [sellerId]
    );

    res.json({ transactions: rows });

  } catch (err) {
    console.error("TRANSACTION ERROR:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
async function requestWithdraw(req, res) {
  try {
    // const db = await connectProductDb();
    const sellerId = req.seller.id;

    const { amount, method, details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    // 1️⃣ GET WALLET BALANCE
    const [row] = await db.query(
      "SELECT withdrawable_balance FROM seller_wallet WHERE seller_id = ?",
      [sellerId]
    );

    if (!row.length) {
      return res.status(400).json({ message: "Wallet not found" });
    }

    const balance = row[0].withdrawable_balance;

    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 2️⃣ GENERATE TRANSACTION ID
    const txnId = "WD" + Date.now();

    // 3️⃣ INSERT TRANSACTION RECORD
    await db.query(
      `
      INSERT INTO seller_transactions 
      (seller_id, txn_id, amount, type, status, description)
      VALUES (?, ?, ?, 'DEBIT', 'pending', ?)
      `,
      [sellerId, txnId, amount, `Withdraw request via ${method}`]
    );

    // 4️⃣ DEDUCT BALANCE TEMPORARILY
    await db.query(
      `
      UPDATE seller_wallet
      SET withdrawable_balance = withdrawable_balance - ?
      WHERE seller_id = ?
      `,
      [amount, sellerId]
    );

    // 5️⃣ INSERT INTO withdrawal_requests TABLE
    await db.query(
      `
      INSERT INTO withdrawal_requests 
      (seller_id, txn_id, amount, method, details, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
      `,
      [sellerId, txnId, amount, method, JSON.stringify(details)]
    );

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      txn_id: txnId
    });

  } catch (err) {
    console.error("WITHDRAW REQUEST ERROR:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}





export const getSellerOrders = async (req, res) => {
  try {
    if (!req.seller?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sellerId = req.seller.id;

    const [rows] = await cartDb.query(
      `
  SELECT
    bo.order_id AS order_id,
    bo.order_status AS status,
    bo.fulfillment_type,
    bo.created_at,

    ba.full_name AS buyer_name,
    ba.phone AS buyer_phone,
    ba.address_line,
    ba.city,
    ba.state,
    ba.pincode,

    p.product_name,
    oi.quantity,
    oi.subtotal AS amount

  FROM ecommerce_mojija_cart.order_items oi
  JOIN ecommerce_mojija_cart.buyer_orders bo
    ON oi.order_id = bo.order_id
  JOIN ecommerce_mojija_product.product p
    ON oi.product_id = p.product_id
  LEFT JOIN ecommerce_mojija_cart.buyer_addresses ba
    ON bo.address_id = ba.address_id

  WHERE oi.owner_type = 'seller'
    AND p.seller_id = ?

  ORDER BY bo.created_at DESC
  `,
      [sellerId]
    );

    const orders = rows.map(o => ({
      order_id: o.order_id,
      status: o.status,
      fulfillment_type: o.fulfillment_type,
      payment_mode: "COD",

      product_name: o.product_name,
      quantity: o.quantity,
      amount: o.amount,

      buyer_name: o.buyer_name,
      buyer_phone: o.buyer_phone,

      // ✅ created_at ko ISO string mein convert karo
      created_at: o.created_at ? new Date(o.created_at).toISOString() : null,


      address:
        o.fulfillment_type === "pickup"
          ? "Pickup Order"
          : {
            address_line: o.address_line,
            city: o.city,
            state: o.state,
            pincode: o.pincode,
          }
    }));
    return res.json({ success: true, orders });

  } catch (err) {
    console.error("GET SELLER ORDERS ERROR:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};






/* ================================
   UPDATE ORDER STATUS (SELLER)
================================ */
export const updateOrderStatus = async (req, res) => {
  try {
    if (!req.seller?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sellerId = req.seller.id;
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatus = [
      "placed",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    /* 🔒 OWNERSHIP CHECK (SELLER → ORDER) */
    const [ownership] = await cartDb.query(
      `
      SELECT bo.order_id
      FROM ecommerce_mojija_cart.order_items oi
      JOIN ecommerce_mojija_cart.buyer_orders bo 
        ON oi.order_id = bo.order_id
      JOIN ecommerce_mojija_product.product p 
        ON oi.product_id = p.product_id
      WHERE bo.order_id = ?
        AND oi.owner_type = 'seller'
        AND p.seller_id = ?
      `,
      [orderId, sellerId]
    );

    if (!ownership.length) {
      return res.status(404).json({
        message: "Order not found or not owned by this seller",
      });
    }

    /* ✅ UPDATE STATUS (cartDb ONLY) */
    await cartDb.query(
      `
      UPDATE ecommerce_mojija_cart.buyer_orders
      SET order_status = ?
      WHERE order_id = ?
      `,
      [status, orderId]
    );

    /* 🔄 FETCH UPDATED ORDER (OPTIONAL BUT BEST) */
    const [[updated]] = await cartDb.query(
      `
      SELECT order_id, order_status, fulfillment_type, payment_mode
      FROM ecommerce_mojija_cart.buyer_orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order: updated,
    });

  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

async function getSellerProducts(req, res) {
  try {
    const sellerId = req.seller.id;

    const [rows] = await db.query(
      `
      SELECT 
        p.product_id,
        p.product_name,
        p.product_price,
        p.product_unit,
        p.total_stock,
        p.remaining_stock,
        p.short_description,
        p.long_description,
        p.created_at, 
        cm.category_name,

        JSON_ARRAYAGG(JSON_EXTRACT(pu.url, '$[0]')) AS image_urls

      FROM product p
      LEFT JOIN product_url pu ON p.product_id = pu.product_id
      LEFT JOIN category_master cm ON cm.id = p.category_master_id

      WHERE p.seller_id = ?
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      `,
      [sellerId]
    );

        // ✅ created_at ko ISO string mein convert karo
    const products = rows.map(p => ({
      ...p,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null
    }));

    res.json({
      success: true,
      products: products,
    });

  } catch (error) {
    console.error("GET SELLER PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



async function sellerCreateCustomCategory(req, res) {
  try {
    let { category_name, parent_id } = req.body;

    if (!category_name || !parent_id) {
      return res.status(400).json({
        message: "category_name and parent_id are required",
      });
    }

    category_name = category_name.trim();

    // 🔍 Validate parent
    const [[parent]] = await db.query(
      `SELECT id, level FROM category_master WHERE id = ?`,
      [parent_id]
    );

    if (!parent) {
      return res.status(400).json({ message: "Invalid parent category" });
    }

    if (parent.level >= 3) {
      return res.status(400).json({
        message: "Only up to 3 levels allowed",
      });
    }

    // ❌ Duplicate under same parent
    const [[exists]] = await db.query(
      `
      SELECT id FROM category_master
      WHERE LOWER(category_name) = LOWER(?)
        AND parent_id = ?
      `,
      [category_name, parent_id]
    );

    if (exists) {
      return res.status(400).json({
        message: "Category already exists under this parent",
      });
    }

    const level = parent.level + 1;

    // ✅ CLEAN INSERT (NO EXTRA COLUMNS)
    const [result] = await db.query(
      `
      INSERT INTO category_master
      (
        category_name,
        parent_id,
        level,
        status,
        created_at
      )
      VALUES (?, ?, ?, 1, NOW())
      `,
      [category_name, parent_id, level]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        id: result.insertId,
        category_name,
        parent_id,
        level,
      },
    });
  } catch (err) {
    console.error("SELLER CUSTOM CATEGORY ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}



async function updateProductImages(req, res) {
  try {
    const { id: seller_id } = req.seller;
    const product_id = req.params.id;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // 🔐 ownership check
    const [[product]] = await db.query(
      "SELECT product_id FROM product WHERE product_id = ? AND seller_id = ?",
      [product_id, seller_id]
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // 🧹 DELETE OLD IMAGES (RECOMMENDED)
    await db.query("DELETE FROM product_url WHERE product_id = ?", [product_id]);

    // ⬆️ upload new images
    const uploaded = await Promise.all(files.map(f => uploadImage(f)));
    const valid = uploaded.filter(i => i.success);

    for (let img of valid) {
      await db.query(
        `INSERT INTO product_url (product_id, seller_id, url)
         VALUES (?, ?, ?)`,
        [product_id, seller_id, JSON.stringify([img.optimized_url])]
      );
    }

    res.json({
      success: true,
      message: "Product images updated successfully",
      uploaded: valid.length
    });

  } catch (err) {
    console.error("UPDATE PRODUCT IMAGES ERROR:", err);
    res.status(500).json({ message: "Image update failed" });
  }
}

export const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const [[revenue]] = await cartDb.query(
      `SELECT
         IFNULL(SUM(oi.subtotal), 0) AS totalRevenue
       FROM ecommerce_mojija_cart.order_items oi
       JOIN ecommerce_mojija_cart.buyer_orders bo 
         ON bo.order_id = oi.order_id
       JOIN ecommerce_mojija_product.product p
         ON p.product_id = oi.product_id
       WHERE p.seller_id = ?
         AND oi.owner_type = 'seller'
         AND bo.order_status IN ('confirmed','shipped','delivered')`,
      [sellerId]
    );

    return res.json({
      totalRevenue: revenue.totalRevenue
    });

  } catch (err) {
    console.error("Seller Revenue Error:", err);
    return res.status(500).json({ message: "Revenue calculation failed" });
  }
};
export const getSellerOrderGraph = async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const [rows] = await cartDb.query(`
      SELECT
          DATE(bo.created_at) AS order_date,
          COUNT(oi.order_item_id) AS total_orders
      FROM buyer_orders bo
      JOIN order_items oi ON oi.order_id = bo.order_id
      JOIN ecommerce_mojija_product.product p ON p.product_id = oi.product_id
      WHERE oi.owner_type = 'seller'
        AND p.seller_id = ?
        AND bo.created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(bo.created_at)
      ORDER BY order_date ASC
    `, [sellerId]);

    // 🧠 Last 7 days (including zero orders)
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = d.toISOString().split("T")[0];

      const found = rows.find(r =>
        r.order_date &&
        r.order_date.toISOString().split("T")[0] === key
      );

      result.push({
        day: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short"
        }),
        orders: found ? Number(found.total_orders) : 0
      });
    }

    return res.json({ graph: result });

  } catch (err) {
    console.error("SELLER ORDER GRAPH ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch order graph" });
  }
};




export {
  sellerProduct,
  // sellerCategory,
  // sellerSubCategory,
  // nestedSubCategory,
  // getAllCategory,
  // getSubCategory,
  // getNestedCategory,
  getAllProduct,
  sellerImage,
  getImageUrl,
  deleteProduct,
  updateProduct,
  getSellerInventory,
  updateSellerStock,
  getSellerWallet,
  getSellerTransactions,
  requestWithdraw,
  //getSellerOrders,
  // updateOrderStatus,
  getSellerProducts,
  sellerCreateCustomCategory,
  // createWithdrawRequest,
  updateProductImages,

};
