

// import connectProductDb from "../db/productDb.js";
import db from "../db/productDB.js";

// import connectAuthDb from "../db/authDb.js";
import authDb from "../db/authDb.js";
import { uploadImage } from "../services/services.js";

import cartDb from "../db/cartDb.js";

// import verifySupplier from "../middleware/supplierProduct.middleware.js";


export async function supplierProduct(req, res) {
    try {
        const supplier_id = req.supplier.id;

        const {
            product_name,
            sku,
            brand,
            short_description,
            long_description,
            category_master_id,
            wholesale_price,
            wholesale_moq,
            product_unit,
            total_stock,
            remaining_stock, 
            min_stock,
            city,
            state,
            country,
            gst_verified
        } = req.body;

        if (!product_name || !category_master_id || !sku || !brand) {
            return res.status(400).json({
                message: "product_name, category_master_id, sku & brand required"
            });
        }

        /* ===============================
           ✅ CATEGORY VALIDATION (LEVEL 2 / 3)
        =============================== */
        const [cat] = await db.query(
            `SELECT level FROM category_master WHERE id=? AND status=1`,
            [category_master_id]
        );

        if (!cat.length || ![2, 3].includes(cat[0].level)) {
            return res.status(400).json({
                message: "Select sub or nested category only"
            });
        }

        /* ===============================
           ✅ DUPLICATE SKU CHECK
        =============================== */
        const [dup] = await db.query(
            `SELECT product_id FROM supplier_product 
       WHERE supplier_id=? AND sku=?`,
            [supplier_id, sku]
        );

        if (dup.length) {
            return res.status(409).json({ message: "SKU already exists" });
        }

        /* ===============================
           🔥 CALL STORED PROCEDURE
        =============================== */
/* ===============================
   🔥 CALL STORED PROCEDURE
=============================== */
const [rows] = await db.query(
    `CALL sp_create_supplier_product(
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )`,
    [
        supplier_id,          // 1
        product_name,         // 2
        sku,                  // 3
        brand,                // 4
        short_description,    // 5
        long_description,     // 6
        category_master_id,   // 7
        wholesale_price,      // 8
        wholesale_moq,        // 9
        product_unit,         // 10
        total_stock,          // 11 ✅ total_stock
        remaining_stock ?? total_stock,  // 12 ✅ remaining_stock
        min_stock,            // 13
        city,                 // 14
        state,                // 15
        country,              // 16
        gst_verified          // 17
    ]
);




        // MySQL procedure result
        const product_id = rows[0][0].product_id;

        res.status(201).json({
            success: true,
            product_id
        });

    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        res.status(500).json({ message: "Create product failed" });
    }
}









export async function supplierProductImage(req, res) {
    try {
        const supplier_id = req.supplier.id;
        const product_id = req.params.id; // ✅ FIX

        if (!product_id) {
            return res.status(400).json({ message: "product_id required" }); 
        }

        const [product] = await db.query(
            `SELECT product_id FROM supplier_product 
       WHERE product_id=? AND supplier_id=?`,
            [product_id, supplier_id]
        );

        if (!product.length) {
            return res.status(404).json({ message: "Unauthorized product" });
        }

        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const uploaded = await Promise.all(files.map(f => uploadImage(f)));
        const valid = uploaded.filter(i => i?.success && i?.optimized_url);

        for (const img of valid) {
            await db.query(
                `INSERT INTO supplier_product_url (product_id, supplier_id, url)
         VALUES (?,?,?)`,
                [product_id, supplier_id, img.optimized_url]
            );
        }

        res.json({
            success: true,
            product_id,
            images: valid.map(v => v.optimized_url)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Image upload failed" });
    }
}


export async function getSupplierProducts(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const { sort } = req.query;

        // 🔥 DEFAULT SORT
        let orderBy = "p.created_at DESC";

        switch (sort) {
            case "price_low":
                orderBy = "p.wholesale_price ASC";
                break;

            case "price_high":
                orderBy = "p.wholesale_price DESC";
                break;

            case "oldest":
                orderBy = "p.created_at ASC";
                break;

            case "newest":
            default:
                orderBy = "p.created_at DESC";
        }

        const [rows] = await db.query(
            `
      SELECT 
        p.product_id,
        p.product_name,
        p.wholesale_price,
        p.created_at,
        
        JSON_ARRAYAGG(spu.url) AS images
      FROM supplier_product p
      LEFT JOIN supplier_product_url spu 
        ON p.product_id = spu.product_id
      WHERE p.supplier_id = ?
      GROUP BY p.product_id
      ORDER BY ${orderBy}
      `,
            [supplier_id]
        );

        res.json({
            success: true,
            products: rows
        });

    } catch (err) {
        console.error("Supplier Get Products Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function deleteSupplierProduct(req, res) {
    try { 
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;
        const { id: product_id } = req.params;

        // Check product ownership
        const [check] = await db.query(
            "SELECT * FROM supplier_product WHERE product_id = ? AND supplier_id = ?",
            [product_id, supplier_id]
        );

        if (!check.length) {
            return res.status(404).json({
                message: "Product not found or unauthorized",
            });
        }

        // Delete images
        await db.query(
            "DELETE FROM supplier_product_url WHERE product_id = ?",
            [product_id]
        );

        // Delete product
        await db.query(
            "DELETE FROM supplier_product WHERE product_id = ? AND supplier_id = ?",
            [product_id, supplier_id]
        );

        res.json({
            message: "Product deleted",
            product_id,
        });

    } catch (err) {
        console.error("Delete Supplier Product Error:", err);
        res.status(500).json({ message: "Failed to delete product" });
    }
}


export async function updateSupplierProduct(req, res) {
    try {
        const supplier_id = req.supplier.id;
        const { id: product_id } = req.params;

        const {
            product_name, sku, brand, wholesale_price, wholesale_moq,
            product_unit, total_stock, remaining_stock, min_stock,
            short_description, long_description, city, state, country, gst_verified,
            category_master_id
        } = req.body;

        const [check] = await db.query(
            "SELECT * FROM supplier_product WHERE product_id = ? AND supplier_id = ?",
            [product_id, supplier_id]
        );

        if (!check.length) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }

        const total = Number(total_stock) || check[0].total_stock;

        // ✅ remaining_stock ko alag rakho — total se override mat karo
        const remaining = remaining_stock !== undefined
            ? Number(remaining_stock)
            : check[0].remaining_stock;

        await db.query(
            `UPDATE supplier_product SET
                product_name = ?,
                sku = ?,
                brand = ?,
                wholesale_price = ?,
                wholesale_moq = ?,
                product_unit = ?,
                total_stock = ?,
                remaining_stock = ?,
                stock = ?,
                min_stock = ?,
                short_description = ?,
                long_description = ?,
                city = ?,
                state = ?,
                country = ?,
                gst_verified = ?,
                category_master_id = ?
            WHERE product_id = ? AND supplier_id = ?`,
            [
                product_name || check[0].product_name,
                sku || check[0].sku,
                brand || check[0].brand,
                wholesale_price || check[0].wholesale_price,
                wholesale_moq || check[0].wholesale_moq,
                product_unit || check[0].product_unit,
                total,
                remaining,   // ✅ actual remaining stock
                total,
                min_stock || check[0].min_stock,
                short_description || check[0].short_description,
                long_description || check[0].long_description,
                city || check[0].city,
                state || check[0].state,
                country || check[0].country,
                gst_verified || check[0].gst_verified,
                category_master_id || check[0].category_master_id,
                product_id,
                supplier_id,
            ]
        );

        res.json({ message: "Product updated successfully", product_id });

    } catch (err) {
        console.error("Update Supplier Product Error:", err);
        res.status(500).json({ message: "Failed to update product" });
    }
}
export async function getSupplierInventory(req, res) {
    try {
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(`
            SELECT 
                p.product_id AS id,
                p.product_name AS name,
                p.brand,
                p.wholesale_price,
                p.remaining_stock AS stock,
                JSON_ARRAYAGG(spu.url) AS images
            FROM supplier_product p
            LEFT JOIN supplier_product_url spu 
                ON p.product_id = spu.product_id
            WHERE p.supplier_id = ?
            GROUP BY p.product_id
        `, [supplier_id]);

        // ✅ CLEAN
        const clean = rows.map(p => ({
            ...p,
            images: (p.images || []).filter(Boolean)
        }));

        res.json({ success: true, inventory: clean });

    } catch (err) {
        console.error("Supplier Inventory Error:", err);
        res.status(500).json({ message: "Failed to get inventory" });
    }
}


export async function updateSupplierStock(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;
        const { id } = req.params;
        const { stock } = req.body;

        await db.query(
            `
            UPDATE supplier_product 
            SET remaining_stock = ?
            WHERE product_id = ? AND supplier_id = ?
        `,
            [stock, id, supplier_id]
        );

        res.json({ message: "Stock updated", product_id: id });

    } catch (err) {
        console.error("Supplier Stock Error:", err);
        res.status(500).json({ message: "Stock update failed" });
    }
}





export const getSupplierOrders = async (req, res) => {
  try {
    if (!req.supplier?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const supplierId = req.supplier.id;

    const page   = parseInt(req.query.page) || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, status, sort } = req.query;

    let where = `WHERE oi.owner_type = 'supplier' AND sp.supplier_id = ?`;
    let params = [supplierId];

    /* ================= SEARCH ================= */
    if (search) {
      where += `
        AND (
          LOWER(ba.full_name) LIKE LOWER(?) OR
          ba.phone LIKE ? OR
          LOWER(ba2.full_name) LIKE LOWER(?) OR
          ba2.phone LIKE ?
        )
      `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    /* ================= STATUS ================= */
    if (status) {
      where += ` AND bo.order_status = ?`;
      params.push(status);
    }

    /* ================= SORT ================= */
    let orderBy = `ORDER BY bo.created_at DESC`;

    if (sort === "Oldest First") orderBy = `ORDER BY bo.created_at ASC`;
    if (sort === "Highest Value") orderBy = `ORDER BY oi.subtotal DESC`;
    if (sort === "Lowest Value") orderBy = `ORDER BY oi.subtotal ASC`;

    /* ================= COUNT ================= */
    const [[{ total }]] = await cartDb.query(
      `
      SELECT COUNT(*) as total
      FROM order_items oi
      JOIN buyer_orders bo ON bo.order_id = oi.order_id
      JOIN ecommerce_mojija_product.supplier_product sp
        ON sp.product_id = oi.product_id
      LEFT JOIN buyer_addresses ba ON ba.address_id = bo.address_id
      LEFT JOIN buyer_addresses ba2 ON ba2.buyer_id = bo.buyer_id
      ${where}
      `,
      params
    );

    /* ================= DATA ================= */
    const [rows] = await cartDb.query(
      `
      SELECT
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.subtotal,

        bo.order_status,
        bo.created_at,
        bo.payment_mode,

        COALESCE(ba.full_name, ba2.full_name) AS buyer_name,
        COALESCE(ba.phone, ba2.phone) AS buyer_phone,

        sp.product_name

      FROM order_items oi
      JOIN buyer_orders bo ON bo.order_id = oi.order_id
      JOIN ecommerce_mojija_product.supplier_product sp
        ON sp.product_id = oi.product_id
      LEFT JOIN buyer_addresses ba ON ba.address_id = bo.address_id
      LEFT JOIN buyer_addresses ba2 ON ba2.buyer_id = bo.buyer_id

      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: rows.map((o) => ({
        orderItemId: o.order_item_id,
        orderId: o.order_id,
        date: o.created_at
          ? new Date(o.created_at).toISOString()
          : null,
        buyer: {
          name: o.buyer_name,
          phone: o.buyer_phone,
        },
        product: {
          id: o.product_id,
          name: o.product_name,
        },
        quantity: o.quantity,
        amount: o.subtotal,
        paymentMode: o.payment_mode,
        status: o.order_status,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    });

  } catch (err) {
    console.error("GET SUPPLIER ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch supplier orders" });
  }
};




const mapOrderStatus = (status) => {
    if (status === "placed") return "Pending";
    if (status === "confirmed") return "Processing";
    if (status === "shipped") return "Shipped";
    if (status === "delivered") return "Completed";
    return status;
};




export const updateSupplierOrderStatus = async (req, res) => {
    try {
        if (!req.supplier?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { order_id } = req.params;
        const { status } = req.body;

        if (!order_id || !status) {
            return res.status(400).json({
                success: false,
                message: "order_id and status required",
            });
        }

        // ✅ allowed supplier actions
        const allowedStatus = ["confirmed", "shipped", "delivered", "cancelled"];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const [result] = await cartDb.query(
            `
      UPDATE buyer_orders
      SET order_status = ?
      WHERE order_id = ?
        AND order_status != 'cancelled'
      `,
            [status, order_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or already closed",
            });
        }

        return res.json({
            success: true,
            message: `Order status updated to ${status}`,
        });

    } catch (err) {
        console.error("UPDATE SUPPLIER ORDER STATUS ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
        });
    }
};



export async function getAllSupplierProduct(req, res) {
    try {
        const supplier_id = req.supplier.id;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `
            SELECT 
                p.product_id,
                p.product_name,
                p.sku,
                p.brand,
                p.short_description,
                p.long_description,
                p.wholesale_price,
                p.product_unit,
                p.total_stock,
                p.remaining_stock,
                p.status,
                p.created_at,
                
                JSON_ARRAYAGG(spu.url) AS images

            FROM supplier_product p
            LEFT JOIN supplier_product_url spu 
                ON p.product_id = spu.product_id
            WHERE p.supplier_id = ?
            GROUP BY p.product_id
            ORDER BY p.product_id DESC
            LIMIT ? OFFSET ?
            `,
            [supplier_id, limit, offset]
        );

        // ✅ 🔥 CLEAN IMAGES (MOST IMPORTANT FIX)
        const cleanRows = rows.map(p => {
            let images = [];

            if (p.images) {
                try {
                    // 👉 agar string aa rahi hai to parse karo
                    if (typeof p.images === "string") {
                        images = JSON.parse(p.images);
                    } else {
                        images = p.images;
                    }
                } catch {
                    images = [];
                }
            }

            return {
                ...p,
                images: (images || []).filter(img => img && img !== "null")
            };
        });

        const [[count]] = await db.query(
            `SELECT COUNT(*) AS total FROM supplier_product WHERE supplier_id = ?`,
            [supplier_id]
        );

        res.json({
            data: cleanRows,
            currentPage: page,
            totalPages: Math.ceil(count.total / limit),
            totalRecords: count.total
        });

    } catch (err) {
        console.error("Get Supplier Products Error:", err);
        res.status(500).json({ message: "Failed to fetch supplier products" });
    }
}



export async function getSupplierTransactions(req, res) {
    try {
        const supplier_id = req.supplier.id;
        // const db = await connectProductDb();

        const [rows] = await db.query(`
            SELECT id, txn_id, amount, type, status, description, created_at
            FROM supplier_transactions
            WHERE supplier_id = ?
            ORDER BY created_at DESC
        `, [supplier_id]);

        res.json({ success: true, transactions: rows });

    } catch (err) {
        console.log("Supplier Transactions Error:", err);
        res.status(500).json({ message: "Failed to load transactions" });
    }
}
export async function requestSupplierWithdraw(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const { amount, method, details } = req.body;

        const [wallet] = await db.query(
            "SELECT withdrawable_balance FROM supplier_wallet WHERE supplier_id = ? LIMIT 1",
            [supplier_id]
        );

        if (!wallet.length)
            return res.status(404).json({ message: "Wallet not found" });

        if (wallet[0].withdrawable_balance < amount)
            return res.status(400).json({ message: "Insufficient balance" });

        const txn_id = "WDR-" + Date.now();

        await db.query(`
            INSERT INTO supplier_withdrawal_requests 
            (supplier_id, amount, method, details, txn_id)
            VALUES (?, ?, ?, ?, ?)
        `, [
            supplier_id,
            amount,
            method,
            JSON.stringify(details),
            txn_id
        ]);

        await db.query(`
            UPDATE supplier_wallet 
            SET pending_payouts = pending_payouts + ?, 
                withdrawable_balance = withdrawable_balance - ?
            WHERE supplier_id = ?
        `, [amount, amount, supplier_id]);

        res.json({
            success: true,
            message: "Withdrawal request submitted",
            txn_id
        });

    } catch (err) {
        console.log("Withdraw Request Error:", err);
        res.status(500).json({ message: "Withdraw failed" });
    }
}


// ===============================
// SUPPLIER PROFILE IMAGE (ONLY)
// ===============================
export async function getSupplierProfile(req, res) {
    try {
        const supplier_id = req.supplier.id;

        // const authDb = await connectAuthDb(); // ⭐⭐ MOST IMPORTANT

        const [rows] = await authDb.query(
            `
      SELECT 
        company_name,
        fullname,
        email,
        phone,
        city,
        state,
        pincode,
        gst_no,
        approval_status
      FROM supplier
      WHERE id = ?
      LIMIT 1
      `,
            [supplier_id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const s = rows[0];

        res.json({
            success: true,
            profile: {
                company_name: s.company_name || "",
                fullname: s.fullname || "",
                email: s.email || "",
                phone: s.phone || "",
                address: `${s.city || ""}${s.state ? ", " + s.state : ""}`,
                pincode: s.pincode || "",
                gst_no: s.gst_no || "",
                approval_status: s.approval_status || "pending",
            },
        });

    } catch (err) {
        console.error("Get Supplier Profile Error:", err);
        res.status(500).json({ message: "Failed to load profile" });
    }
}


// ===============================
// UPDATE SUPPLIER PROFILE
// ===============================
// ===============================
// UPDATE SUPPLIER PROFILE
// ===============================
export async function updateSupplierProfile(req, res) {
    try {
        const supplier_id = req.supplier.id;

        // const authDb = await connectAuthDb(); // ⭐ MUST

        const {
            company_name = "",
            fullname = "",
            phone = "",
            address = "",
            pincode = null,
        } = req.body;

        let city = "";
        let state = "";

        if (address) {
            const parts = address.split(",");
            city = parts[0]?.trim() || "";
            state = parts[1]?.trim() || "";
        }

        await authDb.query(
            `
      UPDATE supplier SET
        company_name = ?,
        fullname = ?,
        phone = ?,
        city = ?,
        state = ?,
        pincode = ?
      WHERE id = ?
      `,
            [company_name, fullname, phone, city, state, pincode, supplier_id]
        );

        res.json({
            success: true,
            message: "Supplier profile updated successfully",
        });

    } catch (err) {
        console.error("Update Supplier Profile Error:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
}




// ===============================
// GET SUPPLIER SETTINGS
// ===============================
export async function getSupplierSettings(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(
            `SELECT * FROM supplier_settings WHERE supplier_id = ? LIMIT 1`,
            [supplier_id]
        );

        if (!rows.length) {
            return res.json({
                success: true,
                settings: {
                    store_name: "",
                    description: "",
                    address: "",
                    phone: "",
                    min_order_amount: 0,
                    tax_enabled: false,

                    bank_name: "",
                    account_holder: "",
                    account_number: "",
                    ifsc_code: "",

                    upi_id: "",
                    card_holder: "",
                    card_last4: "",
                    card_brand: "",

                    shipping_regions: [],
                    shipping_charge: 0,

                    notify_orders: true,
                    notify_payments: true,
                    notify_system: true,
                },
            });
        }

        res.json({
            success: true,
            settings: {
                ...rows[0],
                shipping_regions: rows[0].shipping_regions || [],
                upi_id: rows[0].upi_id || "",
                card_holder: rows[0].card_holder || "",
                card_last4: rows[0].card_last4 || "",
                card_brand: rows[0].card_brand || "",
            },
        });
    } catch (err) {
        console.error("Get Supplier Settings Error:", err);
        res.status(500).json({ message: "Failed to load settings" });
    }
}


// ===============================
// CREATE / UPDATE SUPPLIER SETTINGS
// ===============================
import axios from "axios";


// ===============================
// CREATE / UPDATE SUPPLIER SETTINGS
// ===============================
export async function upsertSupplierSettings(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        let {
            store_name = "",
            description = "",
            address = "",
            phone = "",
            min_order_amount = 0,
            tax_enabled = false,

            // BANK
            bank_name = "",
            account_holder = "",
            account_number = "",
            ifsc_code = "",

            // UPI
            upi_id = "",

            // CARD
            card_holder = "",
            card_last4 = "",
            card_brand = "",

            shipping_regions = [],
            shipping_charge = 0,

            notify_orders = true,
            notify_payments = true,
            notify_system = true,
        } = req.body;

        // ===============================
        // 🔐 IFSC VALIDATION (BANK ONLY)
        // ===============================
        if (ifsc_code && account_number) {
            try {
                const ifscRes = await axios.get(
                    `https://ifsc.razorpay.com/${ifsc_code}`
                );

                // auto-fill bank name safely
                if (ifscRes.data?.BANK) {
                    bank_name = ifscRes.data.BANK;
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid IFSC code",
                });
            }
        }

        const [exists] = await db.query(
            "SELECT id FROM supplier_settings WHERE supplier_id = ?",
            [supplier_id]
        );

        const safeRegions = JSON.stringify(
            Array.isArray(shipping_regions) ? shipping_regions : []
        );

        if (!exists.length) {
            await db.query(
                `
        INSERT INTO supplier_settings
        (
          supplier_id,
          store_name, description, address, phone,
          min_order_amount, tax_enabled,

          bank_name, account_holder, account_number, ifsc_code,
          upi_id,
          card_holder, card_last4, card_brand,

          shipping_regions, shipping_charge,
          notify_orders, notify_payments, notify_system
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    supplier_id,
                    store_name,
                    description,
                    address,
                    phone,
                    min_order_amount,
                    tax_enabled,

                    bank_name,
                    account_holder,
                    account_number,
                    ifsc_code,
                    upi_id,
                    card_holder,
                    card_last4,
                    card_brand,

                    safeRegions,
                    shipping_charge,
                    notify_orders,
                    notify_payments,
                    notify_system,
                ]
            );
        } else {
            await db.query(
                `
        UPDATE supplier_settings SET
          store_name = ?, description = ?, address = ?, phone = ?,
          min_order_amount = ?, tax_enabled = ?,

          bank_name = ?, account_holder = ?, account_number = ?, ifsc_code = ?,
          upi_id = ?,
          card_holder = ?, card_last4 = ?, card_brand = ?,

          shipping_regions = ?, shipping_charge = ?,
          notify_orders = ?, notify_payments = ?, notify_system = ?
        WHERE supplier_id = ?
        `,
                [
                    store_name,
                    description,
                    address,
                    phone,
                    min_order_amount,
                    tax_enabled,

                    bank_name,
                    account_holder,
                    account_number,
                    ifsc_code,
                    upi_id,
                    card_holder,
                    card_last4,
                    card_brand,

                    safeRegions,
                    shipping_charge,
                    notify_orders,
                    notify_payments,
                    notify_system,
                    supplier_id,
                ]
            );
        }

        res.json({
            success: true,
            message: "Settings saved successfully",
        });
    } catch (err) {
        console.error("Supplier Settings Error:", err);
        res.status(500).json({ message: "Failed to save settings" });
    }
}





export async function verifyIFSC(req, res) {
    try {
        let { ifsc } = req.params;

        if (!ifsc) {
            return res.status(400).json({
                success: false,
                message: "IFSC required",
            });
        }

        // ✅ sanitize
        ifsc = ifsc.trim().toUpperCase();

        // ✅ basic IFSC length check (11 chars)
        if (ifsc.length !== 11) {
            return res.status(400).json({
                success: false,
                message: "Invalid IFSC format",
            });
        }

        const response = await axios.get(
            `https://ifsc.razorpay.com/${ifsc}`
        );

        return res.json({
            success: true,
            bank: response.data.BANK,
            branch: response.data.BRANCH,
            city: response.data.CITY,
            state: response.data.STATE,
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Invalid IFSC code",
        });
    }
}




// ===============================
// GET ALL MESSAGES (LIST)
// ===============================
export async function getSupplierMessages(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(
            `
      SELECT 
        id,
        buyer_id,
        subject,
        message,
        sender,
        is_read,
        order_id,
        created_at
      FROM supplier_messages
      WHERE supplier_id = ?
      ORDER BY created_at DESC
      `,
            [supplier_id]
        );

        res.json({
            success: true,
            messages: rows,
        });
    } catch (err) {
        console.error("Get Supplier Messages Error:", err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
}

// ===============================
// GET SINGLE THREAD
// ===============================
export async function getSupplierMessageById(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;
        const { id } = req.params;

        const [rows] = await db.query(
            `
      SELECT *
      FROM supplier_messages
      WHERE id = ? AND supplier_id = ?
      LIMIT 1
      `,
            [id, supplier_id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Message not found" });
        }

        // mark as read
        await db.query(
            `UPDATE supplier_messages SET is_read = true WHERE id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: rows[0],
        });
    } catch (err) {
        console.error("Get Message By ID Error:", err);
        res.status(500).json({ message: "Failed to fetch message" });
    }
}

// ===============================
// SEND MESSAGE (SUPPLIER → BUYER)
// ===============================
export async function sendSupplierMessage(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const {
            buyer_id,
            subject,
            message,
            order_id = null,
        } = req.body;

        if (!buyer_id || !message) {
            return res.status(400).json({ message: "buyer_id and message required" });
        }

        await db.query(
            `
            INSERT INTO supplier_messages
            (supplier_id, buyer_id, subject, message, sender, order_id)
            VALUES (?, ?, ?, ?, 'supplier', ?)
            `,
            [supplier_id, buyer_id, subject, message, order_id]
        );

        // 🔥 SOCKET EMIT (REAL TIME)
        io.to(`buyer_${buyer_id}`).emit("new_message", {
            supplier_id,
            buyer_id,
            subject,
            message,
            sender: "supplier",
            order_id,
            created_at: new Date(),
        });

        res.json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (err) {
        console.error("Send Supplier Message Error:", err);
        res.status(500).json({ message: "Failed to send message" });
    }
}


// ===============================
// UNREAD COUNT (HEADER / BADGE)
// ===============================
export async function getSupplierUnreadCount(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [[row]] = await db.query(
            `
      SELECT COUNT(*) AS unread
      FROM supplier_messages
      WHERE supplier_id = ?
      AND is_read = false
      AND sender = 'buyer'
      `,
            [supplier_id]
        );

        res.json({
            success: true,
            unread: row.unread,
        });
    } catch (err) {
        console.error("Unread Count Error:", err);
        res.status(500).json({ message: "Failed to get unread count" });
    }
}

export async function getTradeAssuranceStats(req, res) {
    // const db = await connectProductDb();
    const supplier_id = req.supplier.id;

    const [[ongoing]] = await db.query(
        `SELECT COUNT(*) total FROM trade_assurance_claims 
     WHERE supplier_id=? AND status='pending'`,
        [supplier_id]
    );

    const [[resolved]] = await db.query(
        `SELECT COUNT(*) total FROM trade_assurance_claims 
     WHERE supplier_id=? AND status='resolved'`,
        [supplier_id]
    );

    const [[rejected]] = await db.query(
        `SELECT COUNT(*) total FROM trade_assurance_claims 
     WHERE supplier_id=? AND status='rejected'`,
        [supplier_id]
    );

    res.json({
        ongoing: ongoing.total,
        resolved: resolved.total,
        pending: ongoing.total,
        rejected: rejected.total,
    });
}



export async function getTradeAssuranceSummary(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(`
      SELECT status AS name, COUNT(*) AS value
      FROM trade_assurance_claims
      WHERE supplier_id = ?
      GROUP BY status
    `, [supplier_id]);

        res.json({
            success: true,
            summary: rows
        });
    } catch (err) {
        res.status(500).json({ message: "Summary fetch failed" });
    }
}

export async function getTradeAssuranceTrend(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(
            `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS claims
      FROM trade_assurance_claims
      WHERE supplier_id = ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
      LIMIT 6
      `,
            [supplier_id]
        );

        res.json({
            success: true,
            trend: rows
        });

    } catch (err) {
        console.error("Trade Assurance Trend Error:", err);
        res.status(500).json({ message: "Failed to load trend data" });
    }
}


export async function getTradeAssuranceClaims(req, res) {
    try {
        // const db = await connectProductDb();
        const supplier_id = req.supplier.id;

        const [rows] = await db.query(`
      SELECT 
        id,
        order_id,
        claim_type,
        status,
        description,
        created_at,
        resolved_at
      FROM trade_assurance_claims
      WHERE supplier_id=?
      ORDER BY created_at DESC
    `, [supplier_id]);

        res.json({
            success: true,
            claims: rows
        });
    } catch (err) {
        res.status(500).json({ message: "Claims fetch failed" });
    }
}





/* ===============================
   FINANCE STATS (TOP CARDS)
=============================== */
export const getFinanceStats = async (req, res) => {
    try {
        // const db = await connectProductDb();
        const supplierId = req.supplier.id;

        // ✅ Total Earnings (PAID)
        const [[total]] = await db.query(
            `
      SELECT IFNULL(SUM(net_amount),0) AS total
      FROM supplier_orders
      WHERE supplier_id = ? AND payment_status = 'paid'
      `,
            [supplierId]
        );

        // ✅ Pending Payouts
        const [[pending]] = await db.query(
            `
      SELECT IFNULL(SUM(net_amount),0) AS pending
      FROM supplier_orders
      WHERE supplier_id = ? AND payment_status = 'pending'
      `,
            [supplierId]
        );

        // ✅ This Month Earnings
        const [[thisMonth]] = await db.query(
            `
      SELECT IFNULL(SUM(net_amount),0) AS total
      FROM supplier_orders
      WHERE supplier_id = ?
        AND payment_status = 'paid'
        AND YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
      `,
            [supplierId]
        );

        // ✅ Last Month Earnings
        const [[lastMonth]] = await db.query(
            `
      SELECT IFNULL(SUM(net_amount),0) AS total
      FROM supplier_orders
      WHERE supplier_id = ?
        AND payment_status = 'paid'
        AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
        AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)
      `,
            [supplierId]
        );

        // ✅ Growth %
        const monthlyGrowth =
            lastMonth.total === 0
                ? 100
                : Number(
                    (((thisMonth.total - lastMonth.total) / lastMonth.total) * 100).toFixed(1)
                );

        res.json({
            totalEarnings: Number(total.total),
            pendingPayouts: Number(pending.pending),
            monthlyGrowth,
        });

    } catch (err) {
        console.error("❌ Finance Stats Error:", err);
        res.status(500).json({ message: "Finance stats error" });
    }
};



/* ===============================
   EARNINGS TREND (MONTHLY GRAPH)
   ✅ ONLY_FULL_GROUP_BY SAFE
=============================== */
export const getSupplierEarningsTrend = async (req, res) => {
    try {
        // const db = await connectProductDb();
        const supplierId = req.supplier.id;

        const [rows] = await db.query(
            `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(net_amount) AS earnings
      FROM supplier_orders
      WHERE supplier_id = ?
        AND payment_status = 'paid'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
      LIMIT 6
      `,
            [supplierId]
        );

        res.json({
            success: true,
            trend: rows.map(r => ({
                month: r.month,               // e.g. 2024-12
                earnings: Number(r.earnings), // number for chart
            })),
        });

    } catch (err) {
        console.error("🔥 EARNINGS TREND ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch earnings trend",
        });
    }
};



/* ===============================
   PAYOUTS / TRANSACTIONS LIST
=============================== */
export const getSupplierPayouts = async (req, res) => {
    try {
        // const db = await connectProductDb();


        // 🔥 VERIFY DB
        const [[dbName]] = await db.query("SELECT DATABASE() AS db");
        console.log("🔥 CONNECTED DB:", dbName.db);

        const supplierId = Number(req.supplier.id);
        console.log("🔥 SUPPLIER ID:", supplierId);

        // 🔥 RAW CHECK
        const [check] = await db.query(
            "SELECT COUNT(*) AS c FROM supplier_orders WHERE supplier_id = ?",
            [supplierId]
        );
        console.log("🔥 MATCHING ROWS:", check[0].c);

        const [rows] = await db.query(`
      SELECT
        id,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
        net_amount AS amount,
        payment_status AS status
      FROM supplier_orders
      WHERE supplier_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [supplierId]);

        return res.json({ payouts: rows });

    } catch (err) {
        console.error("❌ PAYOUT ERROR:", err);
        res.status(500).json({ message: "Failed" });
    }
};



export const getSupplierWallet = async (req, res) => {
    try {
        const supplierId = req.supplier.id;

        const [rows] = await db.query(

            `SELECT 
        balance,
        withdrawable_balance,
        total_earnings,
        pending_payouts
       FROM supplier_wallet
       WHERE supplier_id = ?`,
            [supplierId]
        );

        if (!rows.length) {
            return res.json({
                wallet: {
                    balance: 0,
                    withdrawable_balance: 0,
                    total_earnings: 0,
                    pending_payouts: 0,
                },
            });
        }

        res.json({ wallet: rows[0] });
    } catch (err) {
        console.error("❌ Wallet Error:", err);
        res.status(500).json({ message: "Failed to fetch wallet" });
    }
};



export const createWithdrawRequest = async (req, res) => {
    let db;
    try {
        // db = await connectProductDb(); // ⭐ YAHI MAIN FIX HAI

        const supplier_id = req.supplier.id;
        const { amount, method } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: "Invalid withdraw amount" });
        }

        // 1️⃣ FETCH SUPPLIER PAYOUT SETTINGS
        const [rows] = await db.query(
            `SELECT 
                upi_id,
                bank_name,
                account_holder,
                account_number,
                ifsc_code,
                card_holder,
                card_last4,
                card_brand
             FROM supplier_settings
             WHERE supplier_id = ?`,
            [supplier_id]
        );

        if (!rows.length) {
            return res.status(400).json({
                message: "Please complete payout settings first",
            });
        }

        const s = rows[0];
        let details = {};

        if (method === "UPI") {
            if (!s.upi_id) {
                return res.status(400).json({ message: "UPI not configured" });
            }
            details = { upi_id: s.upi_id };
        }

        if (method === "Bank") {
            if (!s.account_number || !s.ifsc_code) {
                return res.status(400).json({ message: "Bank details not configured" });
            }
            details = {
                bank_name: s.bank_name,
                account_holder: s.account_holder,
                account_number: s.account_number,
                ifsc_code: s.ifsc_code,
            };
        }

        if (method === "Card") {
            if (!s.card_last4) {
                return res.status(400).json({ message: "Card not configured" });
            }
            details = {
                card_holder: s.card_holder,
                card_last4: s.card_last4,
                card_brand: s.card_brand,
            };
        }

        // 2️⃣ INSERT WITHDRAW REQUEST
        await db.query(
            `
            INSERT INTO supplier_withdrawal_requests
            (supplier_id, amount, method, details, status, created_at)
            VALUES (?, ?, ?, ?, 'Pending', NOW())
            `,
            [supplier_id, amount, method, JSON.stringify(details)]
        );

        res.json({
            success: true,
            message: "Withdraw request submitted successfully",
        });

    } catch (err) {
        console.error("❌ Withdraw Error:", err);
        res.status(500).json({ message: "Withdraw failed" });
    } finally {
        if (db) await db.end(); // ⭐ memory safe
    }
};



export const getWithdrawRequests = async (req, res) => {
    let db;
    try {
        // db = await connectProductDb();

        const supplierId = req.supplier.id;

        const [rows] = await db.query(
            `SELECT
                id,
                amount,
                method,
                status,
                admin_note,
                created_at
             FROM supplier_withdrawal_requests
             WHERE supplier_id = ?
             ORDER BY created_at DESC`,
            [supplierId]
        );

        res.json({ withdrawals: rows });
    } catch (err) {
        console.error("❌ Withdraw List Error:", err);
        res.status(500).json({ message: "Failed to fetch withdrawals" });
    } finally {
        if (db) await db.end();
    }
};





export const getMarketplaceInsights = async (req, res) => {
    try {
        const supplierId = req.supplier.id;
        // const productDB = await connectProductDb();

        /* =========================
           🔹 TOP CATEGORY
        ========================== */
        const [category] = await db.query(
            `
      SELECT
        sc.category_name AS name,
        ROUND(
          COUNT(*) / (SELECT COUNT(*) FROM supplier_orders WHERE supplier_id = ?) * 100
        ) AS growth
      FROM supplier_orders o
      JOIN supplier_product sp ON sp.product_id = o.product_id
      JOIN supplier_category sc ON sc.id = sp.category_id
      WHERE o.supplier_id = ?
      GROUP BY sc.id, sc.category_name
      ORDER BY growth DESC
      LIMIT 1
      `,
            [supplierId, supplierId]
        );

        /* =========================
           🔹 TOP REGION
        ========================== */
        const [region] = await db.query(
            `
      SELECT
        sp.country AS region,
        ROUND(
          COUNT(*) / (SELECT COUNT(*) FROM supplier_orders WHERE supplier_id = ?) * 100
        ) AS percentage
      FROM supplier_orders o
      JOIN supplier_product sp ON sp.product_id = o.product_id
      WHERE o.supplier_id = ?
      GROUP BY sp.country
      ORDER BY percentage DESC
      LIMIT 1
      `,
            [supplierId, supplierId]
        );

        /* =========================
           🔹 PRICE TREND
        ========================== */
        const [priceTrend] = await db.query(
            `
      SELECT
        ROUND(
          (
            (SELECT AVG(price)
             FROM supplier_orders
             WHERE supplier_id = ?
               AND MONTH(created_at) = MONTH(CURDATE())
               AND YEAR(created_at) = YEAR(CURDATE())
            ) -
            (SELECT AVG(price)
             FROM supplier_orders
             WHERE supplier_id = ?
               AND MONTH(created_at) = MONTH(CURDATE()) - 1
               AND YEAR(created_at) = YEAR(CURDATE())
            )
          ) /
          (SELECT AVG(price)
           FROM supplier_orders
           WHERE supplier_id = ?
             AND MONTH(created_at) = MONTH(CURDATE()) - 1
             AND YEAR(created_at) = YEAR(CURDATE())
          ) * 100
        ) AS growth
      `,
            [supplierId, supplierId, supplierId]
        );

        res.json({
            risingCategory: {
                name: category[0]?.name || "N/A",
                growth: category[0]?.growth || 0,
            },
            topRegion: {
                name: region[0]?.region || "N/A",
                percentage: region[0]?.percentage || 0,
            },
            priceTrend: {
                category: category[0]?.name || "N/A",
                growth: Math.round(priceTrend[0]?.growth || 0),
            },
            modalStats: {
                topCategoryGrowth: category[0]?.growth || 0,
                activeRegionPercent: region[0]?.percentage || 0,
                overallDemand: category[0]?.growth || 0,
            },
        });
    } catch (err) {
        console.error("Marketplace Insights Error:", err);
        res.status(500).json({
            message: "Marketplace insights error",
        });
    }
};




export const getSupplierDashboardStats = async (req, res) => {
    try {
        const supplierId = req.supplier?.id;
        if (!supplierId) {
            return res
                .status(401)
                .json({ success: false, message: "Supplier not authenticated" });
        }

        /* ================= TOTAL REVENUE ================= */
        const [[revenue]] = await db.query(
            `
  SELECT COALESCE(SUM(oi.subtotal), 0) AS totalRevenue
  FROM ecommerce_mojija_cart.buyer_orders bo
  JOIN ecommerce_mojija_cart.order_items oi
    ON oi.order_id = bo.order_id
  JOIN supplier_product sp
    ON sp.product_id = oi.product_id
  WHERE oi.owner_type = 'supplier'
    AND sp.supplier_id = ?
  `,
            [supplierId]
        );
        /* ================= TOTAL ORDERS (BUYER ORDERS) ================= */
        const [[orders]] = await db.query(
            `
  SELECT COUNT(DISTINCT bo.order_id) AS totalOrders
  FROM ecommerce_mojija_cart.buyer_orders bo
  JOIN ecommerce_mojija_cart.order_items oi
    ON oi.order_id = bo.order_id
  JOIN supplier_product sp
    ON sp.product_id = oi.product_id
  WHERE oi.owner_type = 'supplier'
    AND sp.supplier_id = ?
  `,
            [supplierId]
        );

        /* ================= TOTAL CUSTOMERS ================= */
        const [[customers]] = await db.query(
            `
      SELECT COUNT(DISTINCT bo.buyer_id) AS customers
      FROM ecommerce_mojija_cart.order_items oi
      JOIN supplier_product sp
        ON sp.product_id = oi.product_id
      JOIN ecommerce_mojija_cart.buyer_orders bo
        ON bo.order_id = oi.order_id
      WHERE oi.owner_type = 'supplier'
        AND sp.supplier_id = ?
      `,
            [supplierId]
        );

        /* ================= TOTAL PRODUCTS ================= */
        const [[products]] = await db.query(
            `
      SELECT COUNT(*) AS products
      FROM supplier_product
      WHERE supplier_id = ?
      `,
            [supplierId]
        );

        return res.json({
            success: true,
            totalRevenue: Number(revenue.totalRevenue),
            totalOrders: orders.totalOrders,
            customers: customers.customers,
            products: products.products,

            // 🔮 future-ready
            revenueGrowth: 0,
            ordersGrowth: 0,
            customerGrowth: 0,
            productGrowth: 0,
        });
    } catch (err) {
        console.error("SUPPLIER DASHBOARD STATS ERROR:", err);
        return res
            .status(500)
            .json({ success: false, message: "Dashboard stats error" });
    }
};




//     try {
//         if (!req.supplier?.id) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Unauthorized",
//             });
//         }

//         const supplierId = req.supplier.id;

//         const [rows] = await cartDb.query(
//             `
//       SELECT
//         oi.order_item_id,
//         oi.order_id,
//         oi.quantity,
//         oi.subtotal AS net_amount,

//         bo.order_status,
//         bo.created_at,

//         bo.buyer_id,
//         ba.full_name AS buyer_name,
//         ba.phone AS buyer_phone

//       FROM order_items oi

//       JOIN buyer_orders bo
//         ON bo.order_id = oi.order_id

//       LEFT JOIN buyer_addresses ba
//         ON ba.address_id = bo.address_id

//       -- 🔥 IMPORTANT JOIN (SUPPLIER MAPPING)
//       JOIN ecommerce_mojija_product.supplier_product sp
//         ON sp.product_id = oi.product_id

//       WHERE oi.owner_type = 'supplier'
//         AND sp.supplier_id = ?

//       ORDER BY bo.created_at DESC
//       LIMIT 5
//       `,
//             [supplierId]
//         );

//         return res.json({
//             success: true,
//             orders: rows,
//         });

//     } catch (err) {
//         console.error("GET SUPPLIER RECENT ORDERS ERROR:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch recent orders",
//         });
//     }
// };

export const getSupplierRecentOrders = async (req, res) => {
    try {
        if (!req.supplier?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const supplierId = req.supplier.id;
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        // ✅ Total count
        const [[{ total }]] = await cartDb.query(`
            SELECT COUNT(*) as total
            FROM order_items oi
            JOIN buyer_orders bo ON bo.order_id = oi.order_id
            JOIN ecommerce_mojija_product.supplier_product sp
                ON sp.product_id = oi.product_id
            WHERE oi.owner_type = 'supplier'
              AND sp.supplier_id = ?
        `, [supplierId]);

        // ✅ Paginated query
        const [rows] = await cartDb.query(`
            SELECT
                oi.order_item_id,
                oi.order_id,
                oi.quantity,
                oi.subtotal AS net_amount,
                bo.order_status,
                bo.created_at,
                bo.buyer_id,
                ba.full_name AS buyer_name,
                ba.phone    AS buyer_phone

            FROM order_items oi

            JOIN buyer_orders bo
                ON bo.order_id = oi.order_id

            LEFT JOIN buyer_addresses ba
                ON ba.address_id = bo.address_id

            JOIN ecommerce_mojija_product.supplier_product sp
                ON sp.product_id = oi.product_id

            WHERE oi.owner_type = 'supplier'
              AND sp.supplier_id = ?

            ORDER BY bo.created_at DESC
            LIMIT ? OFFSET ?
        `, [supplierId, limit, offset]);

        return res.json({
            success: true,
            orders: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (err) {
        console.error("GET SUPPLIER RECENT ORDERS ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch recent orders",
        });
    }
};


export async function supplierCreateCustomCategory(req, res) {
    try {
        const { id: supplier_id } = req.supplier;
        let { category_name, parent_id } = req.body;

        if (!category_name || !parent_id) {
            return res.status(400).json({
                message: "category_name and parent_id are required",
            });
        }

        category_name = category_name.trim();

        /* ===============================
           🔍 Validate parent category
        =============================== */
        const [[parent]] = await db.query(
            `SELECT id, level FROM category_master WHERE id = ? AND status = 1`,
            [parent_id]
        );

        if (!parent) {
            return res.status(400).json({
                message: "Invalid parent category",
            });
        }

        /* ===============================
           ❌ Supplier cannot exceed level 3
        =============================== */
        if (parent.level >= 3) {
            return res.status(400).json({
                message: "Only up to 3 levels allowed",
            });
        }

        const level = parent.level + 1;

        /* ===============================
           ❌ Duplicate under same parent
        =============================== */
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

        /* ===============================
           ✅ Insert category
        =============================== */
        const [result] = await db.query(
            `
      INSERT INTO category_master
      (category_name, parent_id, level, status, created_at)
      VALUES (?, ?, ?, 1, NOW())
      `,
            [category_name, parent_id, level]
        );

        res.status(201).json({
            success: true,
            message: "Custom category created successfully",
            data: {
                id: result.insertId,
                category_name,
                parent_id,
                level,
                status: 1,
            },
        });

    } catch (err) {
        console.error("SUPPLIER CUSTOM CATEGORY ERROR:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


