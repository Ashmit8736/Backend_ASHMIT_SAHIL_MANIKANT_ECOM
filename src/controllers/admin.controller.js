
import {productDB} from "../db/db.js";
import {adminDB} from "../db/db.js";
import {authDB} from "../db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {cartDB} from "../db/db.js";




// ============================
// ADMIN REGISTER
// ============================
export async function adminRegisterController(req, res) {
  try {
    const { name, email, password } = req.body;

    // ✅ STEP 1: check if ANY admin already exists
    const [existingAdmin] = await adminDB.query(
      "SELECT id FROM admin LIMIT 1"
    );

    if (existingAdmin.length > 0) {
      return res.status(403).json({
        success: false,
        message: "Admin already exists. Only one admin is allowed."
      });
    }

    // ✅ STEP 2: hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ STEP 3: create admin
    await adminDB.query(
      "INSERT INTO admin (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully"
    });

  } catch (err) {
    console.error("Admin Register Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}



// ============================
// ADMIN LOGIN
// ============================


export async function adminLoginController(req, res) {
  try {
    console.log("🔥 Login Hit");

    const { email, password } = req.body;
    console.log("Email received:", email);

    const [result] = await adminDB.query(
      "SELECT * FROM admin WHERE email = ?",
      [email]
    );

    console.log("DB Result:", result);

    if (result.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = result[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("TOKEN:", token);

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// =====================================================
// SELLER / BUYER / SUPPLIER CONTROLLERS SAME AS BEFORE
// =====================================================

export async function getallsellers(req, res) {
  try {
    const [sellers] = await authDB.query(
      "SELECT * FROM seller ORDER BY created_at DESC"
    );

    res.status(200).json({ success: true, sellers });

  } catch (error) {
    console.error("Seller Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function approveSeller(req, res) {
  try {
    const { sellerId } = req.params;

    await authDB.query(
      "UPDATE seller SET approval_status='approved' WHERE id=?",
      [sellerId]
    );

    res.status(200).json({ message: "Seller approved successfully" });

  } catch (error) {
    console.error("Approve Seller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function rejectSeller(req, res) {
  try {
    const { sellerId } = req.params;

    await authDB.query(
      "UPDATE seller SET approval_status='rejected' WHERE id=?",
      [sellerId]
    );

    res.status(200).json({ message: "Seller rejected successfully" });

  } catch (error) {
    console.error("Reject Seller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getAllBuyers(req, res) {
  try {
    const [buyers] = await authDB.query(
      "SELECT * FROM user ORDER BY created_at DESC"
    );

    res.status(200).json({ success: true, buyers });

  } catch (error) {
    console.error("Buyer Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function approveBuyer(req, res) {
  try {
    const { buyerId } = req.params;

    await authDB.query(
      "UPDATE user SET approval_status='approved', status=1, is_active=1 WHERE id=?",
      [buyerId]
    );

    res.status(200).json({ message: "Buyer approved" });

  } catch (error) {
    console.error("Approve Buyer Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function rejectBuyer(req, res) {
  try {
    const { buyerId } = req.params;

    await authDB.query(
      "UPDATE user SET approval_status='rejected', status=0, is_active=0 WHERE id=?",
      [buyerId]
    );

    res.status(200).json({ message: "Buyer rejected" });

  } catch (error) {
    console.error("Reject Buyer Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getAllSuppliers(req, res) {
  try {
    const [suppliers] = await authDB.query(
      "SELECT * FROM supplier ORDER BY created_at DESC"
    );

    res.status(200).json({ success: true, suppliers });

  } catch (error) {
    console.error("Supplier Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function approveSupplier(req, res) {
  try {
    const { supplierId } = req.params;

    await authDB.query(
      "UPDATE supplier SET approval_status='approved' WHERE id=?",
      [supplierId]
    );

    res.status(200).json({ message: "Supplier approved" });

  } catch (error) {
    console.error("Approve Supplier Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function rejectSupplier(req, res) {
  try {
    const { supplierId } = req.params;

    await authDB.query(
      "UPDATE supplier SET approval_status='rejected' WHERE id=?",
      [supplierId]
    );

    res.status(200).json({ message: "Supplier rejected" });

  } catch (error) {
    console.error("Reject Supplier Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getSingleSeller(req, res) {
  try {
    const { sellerId } = req.params;

    const [seller] = await authDB.query(
      "SELECT * FROM seller WHERE id = ?",
      [sellerId]
    );

    if (seller.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ success: true, seller: seller[0] });

  } catch (error) {
    console.error("Get Single Seller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getApprovedAndRejectCount(req, res) {
  try {
    const [[approved]] = await authDB.query(
      "SELECT COUNT(*) AS approved FROM seller WHERE approval_status='approved'"
    );

    const [[rejected]] = await authDB.query(
      "SELECT COUNT(*) AS rejected FROM seller WHERE approval_status='rejected'"
    );

    res.status(200).json({
      success: true,
      approved: approved.approved,
      rejected: rejected.rejected
    });

  } catch (error) {
    console.error("Status Count Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================
// BUYER STATUS COUNTS
// ============================
export async function getBuyerStatusCounts(req, res) {
  try {
    const [[approved]] = await authDB.query(
      "SELECT COUNT(*) AS approved FROM user WHERE approval_status='approved'"
    );

    const [[rejected]] = await authDB.query(
      "SELECT COUNT(*) AS rejected FROM user WHERE approval_status='rejected'"
    );

    const [[pending]] = await authDB.query(
      "SELECT COUNT(*) AS pending FROM user WHERE approval_status='pending' OR approval_status IS NULL"
    );

    res.status(200).json({
      success: true,
      approved: approved.approved,
      rejected: rejected.rejected,
      pending: pending.pending
    });

  } catch (err) {
    console.error("Buyer Status Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================
// SUPPLIER STATUS COUNTSadminGetAllProducts
// ============================

export async function getSupplierStatusCounts(req, res) {
  try {
    const [[approved]] = await authDB.query(
      "SELECT COUNT(*) AS approved FROM supplier WHERE approval_status='approved'"
    );

    const [[rejected]] = await authDB.query(
      "SELECT COUNT(*) AS rejected FROM supplier WHERE approval_status='rejected'"
    );

    const [[pending]] = await authDB.query(
      "SELECT COUNT(*) AS pending FROM supplier WHERE approval_status='pending' OR approval_status IS NULL"
    );

    res.status(200).json({
      success: true,
      approved: approved.approved,
      rejected: rejected.rejected,
      pending: pending.pending
    });

  } catch (err) {
    console.error("Supplier Status Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
export async function getAllUsers(req, res) {
  try {
    // BUYERS
    const [buyers] = await authDB.query(
      "SELECT id, username AS name, email, phone, approval_status AS status, 'Buyer' AS role, created_at FROM user"
    );

    // SELLERS
    const [sellers] = await authDB.query(
      "SELECT id, fullname AS name, email, phone, approval_status AS status, 'Seller' AS role, created_at FROM seller"
    );

    // SUPPLIERS
    const [suppliers] = await authDB.query(
      "SELECT id, fullname AS name, email, phone, approval_status AS status, 'Supplier' AS role, created_at FROM supplier"
    );

    // ADMINS
    const [admins] = await adminDB.query(
      "SELECT id, name, email, 'active' AS status, 'Admin' AS role, created_at FROM admin"
    );

    const merged = [...buyers, ...sellers, ...suppliers, ...admins];

    res.status(200).json({
      success: true,
      total: merged.length,
      users: merged
    });

  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


// export async function adminGetAllOrders(req, res) {
//   try {
//     const [rows] = await cartDB.query(`
//       SELECT
//         bo.order_id,
//         bo.order_status,
//         bo.payment_mode,
//         bo.fulfillment_type,
//         bo.created_at,

//         oi.order_item_id,
//         oi.owner_type,
//         oi.quantity,
//         oi.subtotal AS amount,

//         -- BUYER (address first, fallback auth user)
//         COALESCE(ba.full_name, u.username) AS buyer_name,
//         COALESCE(ba.phone, u.phone) AS buyer_phone,

//         -- SELLER
//         s.fullname AS seller_name,

//         -- SUPPLIER
//         sup.company_name AS supplier_name,

//         -- PRODUCT
//         COALESCE(p.product_name, sp.product_name) AS product_name

//       FROM ecommerce_mojija_cart.order_items oi

//       JOIN ecommerce_mojija_cart.buyer_orders bo
//         ON bo.order_id = oi.order_id

//       LEFT JOIN ecommerce_mojija_cart.buyer_addresses ba
//         ON ba.address_id = bo.address_id

//       -- AUTH BUYER (FOR SUPPLIER CASE)
//       LEFT JOIN \`ecommerce_mojija_auth\`.user u
//         ON u.id = bo.buyer_id
//       -- SELLER PRODUCT
//       LEFT JOIN ecommerce_mojija_product.product p
//         ON p.product_id = oi.product_id
//         AND oi.owner_type = 'seller'

//       LEFT JOIN \`ecommerce_mojija_auth\`.seller s
//         ON s.id = p.seller_id

//       -- SUPPLIER PRODUCT
//       LEFT JOIN ecommerce_mojija_product.supplier_product sp
//         ON sp.product_id = oi.product_id
//         AND oi.owner_type = 'supplier'

//       LEFT JOIN \`ecommerce_mojija_auth\`.supplier sup
//         ON sup.id = sp.supplier_id

//       ORDER BY bo.created_at DESC
//     `);

//     const orders = rows.map(o => ({
//       order_id: o.order_id,
//       order_type: o.owner_type, // seller | supplier

//       party_name:
//         o.owner_type === "seller"
//           ? o.seller_name
//           : o.supplier_name,

//       buyer_name: o.buyer_name || "N/A",
//       buyer_phone: o.buyer_phone || "N/A",

//       product_name: o.product_name,
//       quantity: o.quantity,
//       amount: o.amount,

//       status: o.order_status,
//       payment_mode: o.payment_mode,
//       fulfillment_type: o.fulfillment_type,
//       order_date: o.created_at,
//     }));

//     res.json({
//       success: true,
//       total: orders.length,
//       orders,
//     });

//   } catch (err) {
//     console.error("ADMIN GET ALL ORDERS ERROR:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }






// ===============================
// UPDATE ORDER STATUS
// ===============================

export async function adminGetAllOrders(req, res) {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Total count ke liye alag query
    const [[{ total }]] = await cartDB.query(`
      SELECT COUNT(*) as total
      FROM ecommerce_mojija_cart.order_items oi
      JOIN ecommerce_mojija_cart.buyer_orders bo
        ON bo.order_id = oi.order_id
    `);

    // ✅ Main query — sirf LIMIT OFFSET add kiya, baaki sab same
    const [rows] = await cartDB.query(`
      SELECT
        bo.order_id,
        bo.order_status,
        bo.payment_mode,
        bo.fulfillment_type,
        bo.created_at,

        oi.order_item_id,
        oi.owner_type,
        oi.quantity,
        oi.subtotal AS amount,

        COALESCE(ba.full_name, u.username) AS buyer_name,
        COALESCE(ba.phone, u.phone) AS buyer_phone,

        s.fullname AS seller_name,
        sup.company_name AS supplier_name,
        COALESCE(p.product_name, sp.product_name) AS product_name

      FROM ecommerce_mojija_cart.order_items oi

      JOIN ecommerce_mojija_cart.buyer_orders bo
        ON bo.order_id = oi.order_id

      LEFT JOIN ecommerce_mojija_cart.buyer_addresses ba
        ON ba.address_id = bo.address_id

      LEFT JOIN \`ecommerce_mojija_auth\`.user u
        ON u.id = bo.buyer_id

      LEFT JOIN ecommerce_mojija_product.product p
        ON p.product_id = oi.product_id
        AND oi.owner_type = 'seller'

      LEFT JOIN \`ecommerce_mojija_auth\`.seller s
        ON s.id = p.seller_id

      LEFT JOIN ecommerce_mojija_product.supplier_product sp
        ON sp.product_id = oi.product_id
        AND oi.owner_type = 'supplier'

      LEFT JOIN \`ecommerce_mojija_auth\`.supplier sup
        ON sup.id = sp.supplier_id

      ORDER BY bo.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);  // ✅ yahan parameters pass kiye

    const orders = rows.map(o => ({
      order_id:        o.order_id,
      order_type:      o.owner_type,
      party_name:      o.owner_type === "seller" ? o.seller_name : o.supplier_name,
      buyer_name:      o.buyer_name || "N/A",
      buyer_phone:     o.buyer_phone || "N/A",
      product_name:    o.product_name,
      quantity:        o.quantity,
      amount:          o.amount,
      status:          o.order_status,
      payment_mode:    o.payment_mode,
      fulfillment_type: o.fulfillment_type,
      order_date:      o.created_at,
    }));

    res.json({
      success: true,
      orders,
      pagination: {
        total,                              // DB mein total orders
        page,                               // current page
        limit,                              // per page
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error("ADMIN GET ALL ORDERS ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminUpdateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "placed",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await cartDB.query(
      `
      UPDATE ecommerce_mojija_cart.buyer_orders
      SET order_status = ?
      WHERE order_id = ?
      `,
      [status, orderId]
    );

    res.json({ success: true, message: "Order status updated" });

  } catch (err) {
    console.error("ADMIN UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}



// ===============================
// GET ALL PRODUCTS (ADMIN PANEL)
// ===============================
// export async function adminGetAllProducts(req, res) {
//   try {

//     // =========================
//     // SELLER PRODUCTS
//     // =========================
//     // console.log(product_name);
//     const [sellerProducts] = await productDB.query(`
//   SELECT 
//     p.product_id AS id,
//     MAX(p.product_name) AS name,
//     MAX(p.sku) AS sku,
//     MAX(p.product_price) AS price,
//     MAX(p.remaining_stock) AS stock,

//     MAX(cm.category_name) AS category,

//     MAX(s.fullname) AS owner_name,
//     JSON_ARRAYAGG(u.url) AS images,

//     CASE 
//       WHEN MAX(p.remaining_stock) = 0 THEN 'outofstock'
//       WHEN MAX(p.remaining_stock) <= MAX(p.min_stock) THEN 'lowstock'
//       ELSE 'instock'
//     END AS status,

//     'seller' AS type

//   FROM product p

//   LEFT JOIN category_master cm 
//     ON cm.id = p.category_master_id   -- ✅ CORRECT

//   LEFT JOIN \`ecommerce_mojija_auth\`.seller s 
//     ON s.id = p.seller_id             -- ✅ FIXED

//   LEFT JOIN product_url u 
//     ON u.product_id = p.product_id

//   GROUP BY p.product_id
// `);


//     // =========================
//     // SUPPLIER PRODUCTS (OWNER FIX 🔥)
//     // =========================
//     const [supplierProducts] = await productDB.query(`
//       SELECT 
//         sp.product_id AS id,
//         MAX(sp.product_name) AS name,
//         MAX(sp.sku) AS sku,
//         MAX(sp.wholesale_price) AS price,
//         MAX(sp.stock) AS stock,

//         MAX(cm.category_name) AS category,

//         MAX(sup.fullname) AS owner_name,
//         JSON_ARRAYAGG(suimg.url) AS images,

//         CASE 
//           WHEN MAX(sp.stock) = 0 THEN 'outofstock'
//           WHEN MAX(sp.stock) <= MAX(sp.min_stock) THEN 'lowstock'
//           ELSE 'instock'
//         END AS status,

//         'supplier' AS type

//       FROM supplier_product sp
//       LEFT JOIN category_master cm 
//         ON cm.id = sp.category_master_id

//       LEFT JOIN \`ecommerce_mojija_auth\`.supplier sup
//         ON sup.id = sp.supplier_id

//       LEFT JOIN supplier_product_url suimg 
//         ON suimg.product_id = sp.product_id

//       GROUP BY sp.product_id
//     `);

//     const allProducts = [...sellerProducts, ...supplierProducts];

//     return res.status(200).json({
//       success: true,
//       count: allProducts.length,
//       products: allProducts
//     });

//   } catch (err) {
//     console.error("ADMIN GET PRODUCTS ERROR:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// }


// ===============================
// GET ALL PRODUCTS (ADMIN PANEL)
// ===============================
export async function adminGetAllProducts(req, res) {
  try {

    // =========================
    // SELLER PRODUCTS
    // =========================
    const [sellerProducts] = await productDB.query(`
      SELECT 
        p.product_id AS id,
        MAX(p.product_name) AS name,
        MAX(p.sku) AS sku,
        MAX(p.product_price) AS price,
        MAX(p.remaining_stock) AS stock,

        MAX(cm.category_name) AS category,

        MAX(s.fullname) AS owner_name,

        -- ✅ FIX: NULL + duplicate remove
        JSON_ARRAYAGG(DISTINCT u.url) AS images,

        CASE 
          WHEN MAX(p.remaining_stock) = 0 THEN 'outofstock'
          WHEN MAX(p.remaining_stock) <= MAX(p.min_stock) THEN 'lowstock'
          ELSE 'instock'
        END AS status,

        'seller' AS type

      FROM product p

      LEFT JOIN category_master cm 
        ON cm.id = p.category_master_id

      LEFT JOIN \`ecommerce_mojija_auth\`.seller s 
        ON s.id = p.seller_id

      LEFT JOIN product_url u 
        ON u.product_id = p.product_id

      GROUP BY p.product_id
    `);


    // =========================
    // SUPPLIER PRODUCTS
    // =========================
    const [supplierProducts] = await productDB.query(`
      SELECT 
        sp.product_id AS id,
        MAX(sp.product_name) AS name,
        MAX(sp.sku) AS sku,
        MAX(sp.wholesale_price) AS price,
        MAX(sp.stock) AS stock,

        MAX(cm.category_name) AS category,

        MAX(sup.fullname) AS owner_name,

        -- ✅ FIX: NULL + duplicate remove
        JSON_ARRAYAGG(DISTINCT suimg.url) AS images,

        CASE 
          WHEN MAX(sp.stock) = 0 THEN 'outofstock'
          WHEN MAX(sp.stock) <= MAX(sp.min_stock) THEN 'lowstock'
          ELSE 'instock'
        END AS status,

        'supplier' AS type

      FROM supplier_product sp

      LEFT JOIN category_master cm 
        ON cm.id = sp.category_master_id

      LEFT JOIN \`ecommerce_mojija_auth\`.supplier sup
        ON sup.id = sp.supplier_id

      LEFT JOIN supplier_product_url suimg 
        ON suimg.product_id = sp.product_id

      GROUP BY sp.product_id
    `);


    // =========================
    // MERGE BOTH
    // =========================
    const allProducts = [...sellerProducts, ...supplierProducts];



    // =========================
    // 🔥 CLEAN IMAGES ARRAY
    // =========================
    const cleanProducts = allProducts.map((p) => {
      let images = [];

      try {
        // MySQL JSON_ARRAYAGG kabhi string deta hai
        if (typeof p.images === "string") {
          images = JSON.parse(p.images);
        } else if (Array.isArray(p.images)) {
          images = p.images;
        }
      } catch (err) {
        images = [];
      }

      return {
        ...p,
        images: images.filter((img) => img && img !== "null"), // null remove
      };
    });



    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      count: cleanProducts.length,
      products: cleanProducts,
    });

  } catch (err) {
    console.error("ADMIN GET PRODUCTS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}




export async function getAdminSettings(req, res) {
  try {
    const adminId = req.admin.id; // token se aa raha hai

    // 1) Fetch admin details
    const [[admin]] = await adminDB.query(
      "SELECT id, name, email, created_at FROM admin WHERE id = ?",
      [adminId]
    );

    // 2) Fetch settings table
    const [[settings]] = await adminDB.query(
      "SELECT * FROM admin_settings LIMIT 1"
    );

    return res.status(200).json({
      success: true,
      admin,
      settings: settings || {}
    });

  } catch (err) {
    console.error("ADMIN SETTINGS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminSettings(req, res) {
  try {
    const { siteName, language, maintenanceMode } = req.body;

    await adminDB.query(
      `UPDATE admin_settings 
       SET site_name = ?, language = ?, maintenance_mode = ? 
       WHERE id = 1`,
      [siteName, language, maintenanceMode]
    );

    res.status(200).json({
      success: true,
      message: "Settings updated successfully"
    });

  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export const adminGetSupplierTransactions = async (req, res) => {
  try {
    const [rows] = await productDB.query(`
      SELECT 
          t.id,
          t.txn_id,
          t.amount,
          t.type,
          t.status,
          t.description,
          t.created_at,
          s.fullname AS supplier_name,
          s.email AS supplier_email
      FROM supplier_transactions t
      LEFT JOIN \`ecommerce_mojija_auth\`.supplier s ON s.id = t.supplier_id
      ORDER BY t.id DESC
    `);

    return res.status(200).json({
      success: true,
      transactions: rows
    });

  } catch (error) {
    console.error("ADMIN Supplier Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


export async function adminGetSupplierWithdrawals(req, res) {
  try {
    const [rows] = await authDB.query(`
      SELECT 
        w.id,
        w.supplier_id,
        s.fullname AS supplier_name,
        s.email AS supplier_email,
        w.amount,
        w.method,
        w.details,
        w.status,
        w.txn_id,
        w.created_at
      FROM supplier_withdrawal_requests w
      LEFT JOIN supplier s ON s.id = w.supplier_id
      ORDER BY w.id DESC
    `);

    res.json({ success: true, withdrawals: rows });
  } catch (err) {
    console.log("ADMIN Withdrawal Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch withdrawal requests" });
  }
}
export async function adminApproveWithdrawal(req, res) {
  try {
    const { id } = req.params;

    const [[request]] = await authDB.query(
      "SELECT * FROM supplier_withdrawal_requests WHERE id = ?",
      [id]
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    await authDB.query(
      "UPDATE supplier_withdrawal_requests SET status = 'Approved' WHERE id = ?",
      [id]
    );

    await authDB.query(
      `UPDATE supplier_wallet 
       SET pending_payouts = pending_payouts - ? 
       WHERE supplier_id = ?`,
      [request.amount, request.supplier_id]
    );

    res.json({ success: true, message: "Withdrawal Approved" });

  } catch (err) {
    console.log("ADMIN APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve withdrawal" });
  }
}
export async function adminRejectWithdrawal(req, res) {
  try {
    const { id } = req.params;

    const [[request]] = await authDB.query(
      "SELECT * FROM supplier_withdrawal_requests WHERE id = ?",
      [id]
    );

    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (request.status !== "Pending")
      return res.status(400).json({ message: "Already processed" });

    await authDB.query(
      "UPDATE supplier_withdrawal_requests SET status = 'Rejected' WHERE id = ?",
      [id]
    );

    // REFUND
    await authDB.query(
      `UPDATE supplier_wallet 
       SET withdrawable_balance = withdrawable_balance + ?, 
           pending_payouts = pending_payouts - ?
       WHERE supplier_id = ?`,
      [request.amount, request.amount, request.supplier_id]
    );

    res.json({ success: true, message: "Withdrawal Rejected & Amount Refunded" });

  } catch (err) {
    console.log("ADMIN REJECT ERROR:", err);
    res.status(500).json({ message: "Failed to reject withdrawal" });
  }
}
export async function adminGetSupplierOrders(req, res) {
  try {
    const [orders] = await productDB.query(`
      SELECT 
        o.id,
        o.order_number,
        o.amount,
        o.quantity,
        o.status,
        o.created_at,

        u.username AS buyer_name,
        u.email AS buyer_email,

        sp.fullname AS supplier_name,
        p.product_name
      FROM orders o
      LEFT JOIN \`ecommerce_mojija_auth\`.user u ON o.buyer_id = u.id
      LEFT JOIN \`ecommerce_mojija_auth\`.supplier sp ON o.seller_id = sp.id
      LEFT JOIN supplier_product p ON p.product_id = o.product_id
      ORDER BY o.id DESC
    `);

    res.json({ success: true, orders });

  } catch (err) {
    console.log("ADMIN Supplier Orders Error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
}

// --- ADMIN: Seller finance / transactions controllers ---
export const adminGetSellerTransactions = async (req, res) => {
  try {
    // seller transactions live in productDB (seller_transactions)
    // seller info (fullname, email) stored in auth DB `ecommerce_mojija_auth`.seller
    const [rows] = await productDB.query(`
      SELECT 
        t.id,
        t.txn_id,
        t.amount,
        t.type,
        t.status,
        t.description,
        t.created_at,
        s.fullname AS seller_name,
        s.email AS seller_email
      FROM seller_transactions t
      LEFT JOIN \`ecommerce_mojija_auth\`.seller s ON s.id = t.seller_id
      ORDER BY t.id DESC
    `);

    return res.status(200).json({ success: true, transactions: rows });
  } catch (error) {
    console.error("ADMIN SELLER TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export const adminGetSellerWithdrawals = async (req, res) => {
  try {
    // withdrawal requests for sellers — assume stored in authDB (withdrawal_requests)
    const [rows] = await authDB.query(`
      SELECT
        w.id,
        w.seller_id,
        w.txn_id,
        w.amount,
        w.method,
        w.details,
        w.status,
        w.created_at,
        s.fullname AS seller_name,
        s.email AS seller_email
      FROM withdrawal_requests w
      LEFT JOIN \`ecommerce_mojija_auth\`.seller s ON s.id = w.seller_id
      ORDER BY w.id DESC
    `);

    return res.json({ success: true, withdrawals: rows });
  } catch (err) {
    console.error("ADMIN Seller Withdrawals Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch withdrawals", error: err.message });
  }
};

export const adminApproveSellerWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const [[request]] = await authDB.query(
      "SELECT * FROM withdrawal_requests WHERE id = ?",
      [id]
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending" && request.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    // mark approved
    await authDB.query("UPDATE withdrawal_requests SET status = 'Approved' WHERE id = ?", [id]);

    // adjust seller_wallet (use authDB if wallet stored there)
    await authDB.query(
      `UPDATE seller_wallet 
       SET pending_payouts = pending_payouts - ? 
       WHERE seller_id = ?`,
      [request.amount, request.seller_id]
    );

    return res.json({ success: true, message: "Withdrawal approved" });
  } catch (err) {
    console.error("ADMIN Approve Seller Withdrawal Error:", err);
    return res.status(500).json({ success: false, message: "Failed to approve", error: err.message });
  }
};

export const adminRejectSellerWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const [[request]] = await authDB.query(
      "SELECT * FROM withdrawal_requests WHERE id = ?",
      [id]
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending" && request.status !== "Pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    // mark rejected
    await authDB.query("UPDATE withdrawal_requests SET status = 'Rejected' WHERE id = ?", [id]);

    // refund into seller_wallet withdrawable_balance and reduce pending_payouts
    await authDB.query(
      `UPDATE seller_wallet 
       SET withdrawable_balance = withdrawable_balance + ?, 
           pending_payouts = pending_payouts - ?
       WHERE seller_id = ?`,
      [request.amount, request.amount, request.seller_id]
    );

    return res.json({ success: true, message: "Withdrawal rejected and refunded" });
  } catch (err) {
    console.error("ADMIN Reject Seller Withdrawal Error:", err);
    return res.status(500).json({ success: false, message: "Failed to reject", error: err.message });
  }
};

export const adminGetSellerOrders = async (req, res) => {
  try {
    // orders table lives in ecommerce_mojija_product.orders. Seller info in `ecommerce_mojija_auth`.seller
    const [orders] = await productDB.query(`
      SELECT 
        o.id,
        o.order_number,
        o.amount,
        o.quantity,
        o.status,
        o.created_at,
        u.username AS buyer_name,
        u.email AS buyer_email,
        s.fullname AS seller_name,
        p.product_name
      FROM orders o
      LEFT JOIN \`ecommerce_mojija_auth\`.user u ON o.buyer_id = u.id
      LEFT JOIN \`ecommerce_mojija_auth\`.seller s ON o.seller_id = s.id
      LEFT JOIN supplier_product p ON p.product_id = o.product_id
      ORDER BY o.id DESC
    `);

    return res.json({ success: true, total: orders.length, orders });
  } catch (err) {
    console.error("ADMIN Seller Orders Error:", err);
    return res.status(500).json({ success: false, message: "Failed to load orders", error: err.message });
  }
};

export const adminGetSellerWalletSummary = async (req, res) => {
  try {
    // summary of wallets for admin panel
    const [rows] = await authDB.query(`
      SELECT 
        sw.seller_id,
        s.fullname AS seller_name,
        s.email AS seller_email,
        sw.withdrawable_balance,
        sw.pending_payouts,
        sw.total_earnings
      FROM seller_wallet sw
      LEFT JOIN \`ecommerce_mojija_auth\`.seller s ON s.id = sw.seller_id
      ORDER BY sw.id DESC
    `);

    return res.json({ success: true, wallets: rows });
  } catch (err) {
    console.error("ADMIN Seller Wallet Summary Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch wallets", error: err.message });
  }
};

export async function getAdminProfile(req, res) {
  try {
    const adminId = req.admin.id; // token se milega

    const [rows] = await adminDB.query(
      `SELECT id, name, email, created_at 
       FROM admin 
       WHERE id = ?`,
      [adminId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      success: true,
      admin: rows[0],
    });

  } catch (error) {
    console.log("Admin Profile Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function adminGetInventory(req, res) {
  try {

    // 🟦 SELLER PRODUCTS (product table)
    const [sellerProducts] = await productDB.query(`
      SELECT 
        p.product_name AS name,
        p.sku AS sku,
        p.remaining_stock AS stock,
        p.min_stock AS reorder_point,
        s.fullname AS owner,
        p.location_city AS city
      FROM product p
      LEFT JOIN \`ecommerce_mojija_auth\`.seller s ON p.seller_id = s.id
    `);

    // 🟪 SUPPLIER PRODUCTS (supplier_product table)
    const [supplierProducts] = await productDB.query(`
      SELECT 
        sp.product_name AS name,
        sp.product_id AS sku,
        sp.stock AS stock,
        sp.min_stock AS reorder_point,
        su.fullname AS owner,
        sp.city AS city
      FROM supplier_product sp
      LEFT JOIN \`ecommerce_mojija_auth\`.supplier su ON sp.supplier_id = su.id
    `);

    // 🟩 FORMAT DATA FOR FRONTEND
    const formatItem = (p) => {
      const stock = Number(p.stock);
      const reorder = Number(p.reorder_point ?? 0);

      let status = "In Stock";
      if (stock === 0) status = "Out of Stock";
      else if (stock <= reorder) status = "Low Stock";
      else if (stock <= reorder + 20) status = "Reorder Soon";

      return {
        name: p.name,
        sku: p.sku,
        owner: p.owner,
        warehouse: p.city ? `${p.city} Warehouse` : "Main Warehouse",
        stock,
        reorder,
        status,
        days_left: stock === 0 ? "Out of stock" : `${Math.floor(stock / 10)} days`
      };
    };

    const inventory = [
      ...sellerProducts.map(formatItem),
      ...supplierProducts.map(formatItem)
    ];

    return res.status(200).json({
      success: true,
      warehouses: ["Main Warehouse"],  // ⭐ REQUIRED
      inventory
    });

  } catch (err) {
    console.error("ADMIN INVENTORY ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
export async function adminGetAnalytics(req, res) {
  try {
    const range = req.query.range || 7; // 7, 30, 365

    // -----------------------------
    // 🔥 TOTAL REVENUE
    // -----------------------------
    const [revenueResult] = await productDB.query(
      `
      SELECT SUM(amount) AS totalRevenue 
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL ? DAY
    `,
      [range]
    );

    // -----------------------------
    // 🔥 TOTAL ORDERS
    // -----------------------------
    const [ordersResult] = await productDB.query(
      `
      SELECT COUNT(*) AS totalOrders 
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL ? DAY
    `,
      [range]
    );

    // -----------------------------
    // 🔥 NEW CUSTOMERS
    // TABLE = ecommerce_mojija_auth.user
    // -----------------------------
    const [customerResult] = await authDB.query(
      `
      SELECT COUNT(*) AS newCustomers
      FROM user
      WHERE created_at >= NOW() - INTERVAL ? DAY
    `,
      [range]
    );

    // -----------------------------
    // 🔥 AVG ORDER VALUE
    // -----------------------------
    const avgOrderValue =
      revenueResult[0].totalRevenue > 0 && ordersResult[0].totalOrders > 0
        ? (revenueResult[0].totalRevenue / ordersResult[0].totalOrders).toFixed(2)
        : 0;

    // -----------------------------
    // 🔥 REVENUE TREND GRAPH DATA
    // -----------------------------
    const [trendResult] = await productDB.query(
      `
      SELECT 
        DATE(created_at) AS date,
        SUM(amount) AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL ? DAY
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `,
      [range]
    );

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------
    return res.status(200).json({
      success: true,
      metrics: {
        totalRevenue: revenueResult[0].totalRevenue || 0,
        totalOrders: ordersResult[0].totalOrders || 0,
        newCustomers: customerResult[0].newCustomers || 0,
        avgOrderValue,
      },
      chartData: trendResult,
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
}

export async function adminCategoryStats(req, res) {
  try {
    const [rows] = await productDB.query(`
      SELECT 
        c.category_name AS category, 
        COUNT(p.product_id) AS total_products
      FROM category c
      LEFT JOIN product p ON p.category_id = c.id
      GROUP BY c.id
    `);

    const total = rows.reduce((sum, r) => sum + r.total_products, 0);

    const categories = rows.map((r, i) => ({
      category: r.category,
      value: r.total_products,
      percentage: total > 0 ? Math.round((r.total_products / total) * 100) : 0
    }));

    return res.status(200).json({
      success: true,
      categories
    });

  } catch (err) {
    console.error("CATEGORY STATS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load category stats"
    });
  }
}

export async function adminTopProducts(req, res) {
  try {
    const [rows] = await productDB.query(`
      SELECT 
        p.product_name AS name,
        SUM(o.quantity) AS units_sold,
        SUM(o.amount) AS total_sales
      FROM orders o
      LEFT JOIN product p ON p.product_id = o.product_id
      GROUP BY o.product_id
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    const topProducts = rows.map(r => ({
      name: r.name,
      units: `${r.units_sold} units sold`,
      sales: r.total_sales,
      trend: "up"
    }));

    return res.status(200).json({
      success: true,
      products: topProducts
    });

  } catch (err) {
    console.error("TOP PRODUCTS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load top products"
    });
  }
}


// ==============================
// GET ALL NOTIFICATIONS
// ==============================
export const getNotifications = async (req, res) => {
  try {
    const [rows] = await adminDB.query(`
      SELECT * FROM admin_notifications
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      notifications: rows,
    });
  } catch (err) {
    console.error("NOTIF LIST ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

// ==============================
// GET UNREAD COUNT
// ==============================
export const getUnreadCount = async (req, res) => {
  try {
    const [rows] = await adminDB.query(`
      SELECT COUNT(*) AS count
      FROM admin_notifications
      WHERE is_read = 0
    `);

    return res.status(200).json({
      success: true,
      count: rows[0].count || 0,
    });
  } catch (err) {
    console.error("NOTIF COUNT ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load unread count" });
  }
};

// ==============================
// MARK AS READ
// ==============================
export const markAsRead = async (req, res) => {
  try {
    const id = req.params.id;

    await adminDB.query(
      "UPDATE admin_notifications SET is_read = 1 WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};

export const adminDashboardStats = async (req, res) => {
  try {
    /* ===============================
       USERS
    =============================== */

    const [[buyerResult]] = await authDB.query(`
      SELECT COUNT(*) AS count
      FROM user
      WHERE approval_status = 'approved'
    `);

    const [[sellerResult]] = await authDB.query(`
      SELECT COUNT(*) AS count
      FROM seller
      WHERE approval_status = 'approved'
    `);

    const [[supplierResult]] = await authDB.query(`
      SELECT COUNT(*) AS count
      FROM supplier
      WHERE approval_status = 'approved'
    `);

    /* ===============================
       PRODUCTS
    =============================== */

    const [[sellerProductResult]] = await productDB.query(`
      SELECT COUNT(*) AS count
      FROM product
    `);

    const [[supplierProductResult]] = await productDB.query(`
      SELECT COUNT(*) AS count
      FROM supplier_product
      WHERE status = 'active'
    `);

    const totalProducts =
      sellerProductResult.count + supplierProductResult.count;

    /* ===============================
       ORDERS & REVENUE (FIXED)
    =============================== */

    const [[orderStats]] = await cartDB.query(`
      SELECT 
        COUNT(*) AS totalOrders,
        IFNULL(SUM(total_amount), 0) AS totalRevenue
      FROM buyer_orders
      WHERE order_status = 'delivered'
    `);

    /* ===============================
       RESPONSE
    =============================== */

    return res.status(200).json({
      success: true,
      data: {
        users: {
          buyers: buyerResult.count,
          sellers: sellerResult.count,
          suppliers: supplierResult.count,
        },
        products: {
          total: totalProducts,
          seller: sellerProductResult.count,
          supplier: supplierProductResult.count,
        },
        orders: {
          total: orderStats.totalOrders,
          revenue: orderStats.totalRevenue,
        },
      },
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

export const adminAnalytics = async (req, res) => {
  try {
    const range = Number(req.query.range) || 365;

    const [rows] = await cartDB.query(
      `
      SELECT 
        DATE(created_at) AS date,
        SUM(total_amount) AS revenue
      FROM buyer_orders
      WHERE order_status = 'delivered'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
      `,
      [range]
    );

    return res.status(200).json({
      success: true,
      chartData: rows, // [{ date, revenue }]
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
    });
  }
};

export const adminCategoryStats1 = async (req, res) => {
  try {
    const [[total]] = await cartDB.query(`
      SELECT IFNULL(SUM(total_amount), 0) AS revenue
      FROM buyer_orders
      WHERE order_status = 'delivered'
    `);

    // Agar revenue 0 ho, tab bhi pie break na ho
    const categories =
      total.revenue > 0
        ? [{ name: "All Products", percentage: 100 }]
        : [];

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("CATEGORY STATS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category stats",
    });
  }
};



