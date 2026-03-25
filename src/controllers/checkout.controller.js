// import connectDb from "../db/db.js";
const { cartDB } = require("../db/db");

// export const placeOrder = async (req, res) => {
    async function placeOrder(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const buyerId = req.user.id;
        const { address_id, order_type } = req.body;

        const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
        const paymentMode = "COD"; // 🔒 FIXED (future me ONLINE add kar sakte)

        // 🔥 Delivery case me address mandatory
        if (fulfillmentType === "delivery" && !address_id) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // const pool = await connectDb();
        const pool = cartDB;

        const [rows] = await pool.query(
            "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
            [
                buyerId,
                fulfillmentType === "pickup" ? null : address_id,
                paymentMode,
                fulfillmentType,
            ]
        );
//stock update on seller dashboard
        const order = rows?.[0]?.[0];

        if (order?.order_id) {
      const [orderItems] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.owner_type
         FROM ecommerce_mojija_cart.order_items oi
         WHERE oi.order_id = ?
           AND oi.owner_type IN ('seller', 'supplier')`,
        [order.order_id],
      );

      for (const item of orderItems) {
        if (item.owner_type === "seller") {
          // ✅ SELLER stock deduct
          await pool.query(
            `UPDATE ecommerce_mojija_product.product
             SET remaining_stock = remaining_stock - ?
             WHERE product_id = ?
               AND remaining_stock >= ?`,
            [item.quantity, item.product_id, item.quantity],
          );
        } else if (item.owner_type === "supplier") {
          // ✅ SUPPLIER stock deduct
          await pool.query(
            `UPDATE ecommerce_mojija_product.supplier_product
             SET remaining_stock = remaining_stock - ?
             WHERE product_id = ?
               AND remaining_stock >= ?`,
            [item.quantity, item.product_id, item.quantity],
          );
        }
      }
    }

        return res.json({
            success: true,
            message: "Order placed successfully",
            data: order,
        });

    } catch (err) {
        console.error("PLACE ORDER ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to place order",
        });
    }
};



// export const getMyOrders = async (req, res) => {
    async function getMyOrders(req, res) {
    try {
        /* 🔐 AUTH CHECK */
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const buyerId = req.user.id;
        // const pool = await connectDb();
        const pool = cartDB;

        /* 🔥 CALL STORED PROCEDURE */
        const [rows] = await pool.query(
            "CALL GetBuyerOrders(?)",
            [buyerId]
        );

        return res.status(200).json({
            success: true,
            data: rows[0] || [],
        });

    } catch (err) {
        console.error("GET MY ORDERS ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};

/* ================================
   GET MY ADDRESSES
================================ */
// export const getMyAddresses = async (req, res) => {
    async function getMyAddresses(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // const pool = await connectDb();
        const pool = cartDB;

        const [rows] = await pool.query(
            `SELECT address_id, full_name, phone, address_line, city, state, pincode
       FROM buyer_addresses
       WHERE buyer_id = ?
       ORDER BY created_at DESC`,
            [req.user.id]
        );

        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error("GET ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
};


/* ================================
   ADD ADDRESS
================================ */
// export const addAddress = async (req, res) => {
    async function addAddress(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const {
            full_name,
            phone,
            address_line,
            city,
            state,
            pincode,
        } = req.body;

        if (!full_name || !phone || !address_line || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: "All address fields are required",
            });
        }

        // const pool = await connectDb();
        const pool = cartDB;

        await pool.query(
            `INSERT INTO buyer_addresses
       (buyer_id, full_name, phone, address_line, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, full_name, phone, address_line, city, state, pincode]
        );

        return res.json({ success: true, message: "Address added successfully" });
    } catch (err) {
        console.error("ADD ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to add address" });
    }
};


/* ================================
   UPDATE ADDRESS
================================ */
// export const updateAddress = async (req, res) => {
    async function updateAddress(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { address_id } = req.params;
        const {
            full_name,
            phone,
            address_line,
            city,
            state,
            pincode,
        } = req.body;

        if (!address_id) {
            return res.status(400).json({ success: false, message: "address_id required" });
        }

        // const pool = await connectDb();
        const pool = cartDB;

        const [result] = await pool.query(
            `UPDATE buyer_addresses
       SET full_name=?, phone=?, address_line=?, city=?, state=?, pincode=?
       WHERE address_id=? AND buyer_id=?`,
            [
                full_name,
                phone,
                address_line,
                city,
                state,
                pincode,
                address_id,
                req.user.id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        return res.json({ success: true, message: "Address updated successfully" });
    } catch (err) {
        console.error("UPDATE ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to update address" });
    }
};


/* ================================
   DELETE ADDRESS
================================ */
// export const deleteAddress = async (req, res) => {
    async function deleteAddress(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { address_id } = req.params;

        // const pool = await connectDb();
        const pool = cartDB;

        const [result] = await pool.query(
            `DELETE FROM buyer_addresses
       WHERE address_id=? AND buyer_id=?`,
            [address_id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        return res.json({ success: true, message: "Address deleted successfully" });
    } catch (err) {
        console.error("DELETE ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Failed to delete address" });
    }
};

async function cancelOrder(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const buyerId = req.user.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ message: "Cancellation reason is required" });
    }

    const [result] = await cartDB.query(
      `UPDATE ecommerce_mojija_cart.buyer_orders 
       SET order_status = 'cancelled',
           cancel_reason = ?
       WHERE order_id = ? 
         AND buyer_id = ?
         AND order_status NOT IN ('delivered', 'shipped', 'cancelled')`,
      [reason.trim(), id, buyerId],
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Order cannot be cancelled",
      });
    }

    return res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    return res.status(500).json({ message: "Cancel failed" });
  }
}

module.exports = {
  placeOrder,
  getMyOrders,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  cancelOrder,
};