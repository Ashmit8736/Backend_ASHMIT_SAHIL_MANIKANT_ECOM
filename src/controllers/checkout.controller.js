

const { cartDB } = require("../db/db");

// ==============================
// STOCK VALIDATION HELPER
// ==============================
const validateStock = async (pool, items) => {
  for (const item of items) {
    if (item.owner_type === "seller") {
      const [[product]] = await pool.query(
        `SELECT remaining_stock, product_name 
         FROM ecommerce_mojija_product.product 
         WHERE product_id = ?`,
        [item.product_id]
      );
      if (!product) throw { statusCode: 404, message: `Product not found` };
      if (Number(product.remaining_stock) < Number(item.quantity)) {
        throw {
          statusCode: 400,
          message: `Only ${product.remaining_stock} item(s) left for "${product.product_name}". You requested ${item.quantity}.`
        };
      }
    } else if (item.owner_type === "supplier") {
      const [[product]] = await pool.query(
        `SELECT remaining_stock, product_name 
         FROM ecommerce_mojija_product.supplier_product 
         WHERE product_id = ?`,
        [item.product_id]
      );
      if (!product) throw { statusCode: 404, message: `Product not found` };
      if (Number(product.remaining_stock) < Number(item.quantity)) {
        throw {
          statusCode: 400,
          message: `Only ${product.remaining_stock} item(s) left for "${product.product_name}". You requested ${item.quantity}.`
        };
      }
    }
  }
};


async function placeOrder(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const buyerId = req.user.id;

    // ✅ CHANGE 1 — selected_cart_ids ab req.body se lo
    // PEHLE: selected_cart_ids nahi tha, poora cart order ho jata tha
    // AB: frontend selected IDs bhejta hai, backend sirf unhi ko process karta hai
    const { address_id, order_type, buy_now, buy_now_item, selected_cart_ids } = req.body;

    const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
    const paymentMode = "COD";

    if (fulfillmentType === "delivery" && !address_id) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const pool = cartDB;
    let order;

    // ==============================
    // BUY NOW FLOW — unchanged
    // ==============================
    if (buy_now && buy_now_item) {

      const itemPrice = Number(buy_now_item.price);
      const itemQty   = Number(buy_now_item.quantity);

      await validateStock(pool, [buy_now_item]);

      const itemSubtotal = itemPrice * itemQty;
      const gstPercent   = 18.00;
      const gstAmount    = parseFloat(((itemSubtotal * 18) / 100).toFixed(2));
      const itemTotal    = itemSubtotal + gstAmount;

      const [orderResult] = await pool.query(
        `INSERT INTO ecommerce_mojija_cart.buyer_orders 
         (buyer_id, address_id, payment_mode, fulfillment_type, order_status, 
          total_amount, seller_subtotal, seller_gst)
         VALUES (?, ?, ?, ?, 'placed', ?, ?, ?)`,
        [
          buyerId,
          fulfillmentType === "pickup" ? null : address_id,
          paymentMode,
          fulfillmentType,
          itemTotal,
          buy_now_item.owner_type === "seller" ? itemSubtotal : 0,
          buy_now_item.owner_type === "seller" ? gstAmount : 0,
        ]
      );

      const orderId = orderResult.insertId;

      // Generate and save Invoice Number
      const invoiceNo = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(orderId).padStart(6, '0')}`;
      await pool.query(
        `UPDATE ecommerce_mojija_cart.buyer_orders SET invoice_no = ? WHERE order_id = ?`,
        [invoiceNo, orderId]
      );

      const [itemResult] = await pool.query(
        `INSERT INTO ecommerce_mojija_cart.order_items 
         (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
      );

      await pool.query(
        `INSERT INTO ecommerce_mojija_cart.order_tracking (order_item_id, status, message)
         VALUES (?, 'placed', 'Order placed successfully')`,
        [itemResult.insertId]
      );

      if (buy_now_item.owner_type === "seller") {
        await pool.query(
          `UPDATE ecommerce_mojija_product.product
           SET remaining_stock = remaining_stock - ?
           WHERE product_id = ? AND remaining_stock >= ?`,
          [itemQty, buy_now_item.product_id, itemQty]
        );
      } else if (buy_now_item.owner_type === "supplier") {
        await pool.query(
          `UPDATE ecommerce_mojija_product.supplier_product
           SET remaining_stock = remaining_stock - ?
           WHERE product_id = ? AND remaining_stock >= ?`,
          [itemQty, buy_now_item.product_id, itemQty]
        );
      }

      const [orderRows] = await pool.query(
        `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
        [orderId]
      );
      order = orderRows?.[0];

    } else {
      // ==============================
      // ✅ CHANGE 2 — NORMAL CART FLOW
      // PEHLE: CALL PlaceOrderFromCart_Split() — poora cart order ho jata tha
      // AB: Manual query with selected_cart_ids filter — sirf selected items
      // ==============================

      // ✅ CHANGE 3 — Correct table & column names (SP se confirm kiya)
      // PEHLE: cart_items table, cart_id column, buyer_id column — GALAT tha
      // AB:
      //   Table  : ecommerce_mojija_cart.cart   (AddToCart SP: FROM cart)
      //   PK     : c.id                          (AddToCart SP: SELECT id FROM cart)
      //   User   : c.user_id                     (AddToCart SP: WHERE user_id = p_user_id)
      //   Price  : cart table mein nahi — product JOIN se lo
      let cartQuery = `
        SELECT
          c.id          AS cart_id,
          c.product_id,
          c.quantity,
          c.owner_type,
          CASE
            WHEN c.owner_type = 'seller'   THEN p.product_price
            WHEN c.owner_type = 'supplier' THEN sp.wholesale_price
          END AS unit_price
        FROM ecommerce_mojija_cart.cart c
        LEFT JOIN ecommerce_mojija_product.product p
          ON p.product_id = c.product_id
         AND c.owner_type = 'seller'
        LEFT JOIN ecommerce_mojija_product.supplier_product sp
          ON sp.product_id = c.product_id
         AND c.owner_type = 'supplier'
        WHERE c.user_id = ?
      `;
      let cartParams = [buyerId];

      // ✅ c.id se filter — yahi cart table ka PK hai
      if (selected_cart_ids && selected_cart_ids.length > 0) {
        cartQuery += ` AND c.id IN (?)`;
        cartParams.push(selected_cart_ids);
      }

      const [cartItemsRows] = await pool.query(cartQuery, cartParams);

      if (!cartItemsRows.length) {
        return res.status(400).json({ success: false, message: "No items to order" });
      }

      // ✅ Sirf selected items ka stock validate karo
      await validateStock(pool, cartItemsRows);

      // ✅ CHANGE 4 — Totals calculate karo
      // PEHLE: stored procedure calculate karta tha
      // AB: loop mein subtotal + GST
      let newTotal = 0, sellerSubtotal = 0, sellerGst = 0;

      for (const item of cartItemsRows) {
        const subtotal  = Number(item.unit_price) * Number(item.quantity);
        const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));
        newTotal       += subtotal + gstAmount;
        if (item.owner_type === "seller") {
          sellerSubtotal += subtotal;
          sellerGst      += gstAmount;
        }
      }

      // ✅ CHANGE 5 — buyer_orders manually insert karo
      const [orderResult] = await pool.query(
        `INSERT INTO ecommerce_mojija_cart.buyer_orders 
         (buyer_id, address_id, payment_mode, fulfillment_type, order_status,
          total_amount, seller_subtotal, seller_gst)
         VALUES (?, ?, ?, ?, 'placed', ?, ?, ?)`,
        [
          buyerId,
          fulfillmentType === "pickup" ? null : address_id,
          paymentMode,
          fulfillmentType,
          parseFloat(newTotal.toFixed(2)),
          parseFloat(sellerSubtotal.toFixed(2)),
          parseFloat(sellerGst.toFixed(2)),
        ]
      );

      const orderId = orderResult.insertId;

      // Generate and save Invoice Number
      const invoiceNo = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(orderId).padStart(6, '0')}`;
      await pool.query(
        `UPDATE ecommerce_mojija_cart.buyer_orders SET invoice_no = ? WHERE order_id = ?`,
        [invoiceNo, orderId]
      );

      // ✅ CHANGE 6 — order_items insert karo har selected item ke liye
      for (const item of cartItemsRows) {
        const subtotal  = Number(item.unit_price) * Number(item.quantity);
        const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));

        const [itemResult] = await pool.query(
          `INSERT INTO ecommerce_mojija_cart.order_items 
           (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
           VALUES (?, ?, ?, ?, 18.00, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.unit_price, gstAmount, subtotal, item.owner_type]
        );

        await pool.query(
          `INSERT INTO ecommerce_mojija_cart.order_tracking (order_item_id, status, message)
           VALUES (?, 'placed', 'Order placed successfully')`,
          [itemResult.insertId]
        );
      }

      // ✅ CHANGE 7 — Sirf selected items ka stock deduct karo
      for (const item of cartItemsRows) {
        if (item.owner_type === "seller") {
          await pool.query(
            `UPDATE ecommerce_mojija_product.product
             SET remaining_stock = remaining_stock - ?
             WHERE product_id = ? AND remaining_stock >= ?`,
            [item.quantity, item.product_id, item.quantity]
          );
        } else if (item.owner_type === "supplier") {
          await pool.query(
            `UPDATE ecommerce_mojija_product.supplier_product
             SET remaining_stock = remaining_stock - ?
             WHERE product_id = ? AND remaining_stock >= ?`,
            [item.quantity, item.product_id, item.quantity]
          );
        }
      }

      // ✅ CHANGE 8 — Sirf selected items cart se delete karo
      // PEHLE: stored procedure DELETE FROM cart WHERE user_id = ? — poora cart saaf
      // AB: sirf selected id wale rows delete — baaki items cart mein safe rehte hain
      // Table: ecommerce_mojija_cart.cart  |  PK: id  |  user: user_id
      const idsToDelete = selected_cart_ids && selected_cart_ids.length > 0
        ? selected_cart_ids
        : cartItemsRows.map(i => i.cart_id);

      await pool.query(
        `DELETE FROM ecommerce_mojija_cart.cart
         WHERE user_id = ? AND id IN (?)`,
        [buyerId, idsToDelete]
      );

      const [updatedOrder] = await pool.query(
        `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
        [orderId]
      );
      order = updatedOrder?.[0];
    }

    return res.json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }
    console.error("PLACE ORDER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
}


async function getMyOrders(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const buyerId = req.user.id;
    const pool = cartDB;
    const [rows] = await pool.query("CALL GetBuyerOrders(?)", [buyerId]);
    const orderItems = rows[0] || [];

    if (orderItems.length > 0) {
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];
      const [invoiceRows] = await pool.query(
        "SELECT order_id, invoice_no FROM buyer_orders WHERE order_id IN (?)",
        [orderIds]
      );

      const invoiceMap = {};
      invoiceRows.forEach(row => {
        invoiceMap[row.order_id] = row.invoice_no;
      });

      const enrichedItems = orderItems.map(item => ({
        ...item,
        invoice_no: invoiceMap[item.order_id] || null
      }));

      return res.status(200).json({ success: true, data: enrichedItems });
    }

    return res.status(200).json({ success: true, data: [] });
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}

async function getMyAddresses(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
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
}

async function addAddress(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { full_name, phone, address_line, city, state, pincode } = req.body;
    if (!full_name || !phone || !address_line || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "All address fields are required" });
    }
    const pool = cartDB;
    await pool.query(
      `INSERT INTO buyer_addresses (buyer_id, full_name, phone, address_line, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, full_name, phone, address_line, city, state, pincode]
    );
    return res.json({ success: true, message: "Address added successfully" });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to add address" });
  }
}

async function updateAddress(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { address_id } = req.params;
    const { full_name, phone, address_line, city, state, pincode } = req.body;
    if (!address_id) {
      return res.status(400).json({ success: false, message: "address_id required" });
    }
    const pool = cartDB;
    const [result] = await pool.query(
      `UPDATE buyer_addresses
       SET full_name=?, phone=?, address_line=?, city=?, state=?, pincode=?
       WHERE address_id=? AND buyer_id=?`,
      [full_name, phone, address_line, city, state, pincode, address_id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    return res.json({ success: true, message: "Address updated successfully" });
  } catch (err) {
    console.error("UPDATE ADDRESS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to update address" });
  }
}

async function deleteAddress(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { address_id } = req.params;
    const pool = cartDB;
    const [result] = await pool.query(
      `DELETE FROM buyer_addresses WHERE address_id=? AND buyer_id=?`,
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
}

async function cancelOrder(req, res) {
  try {
    if (!req.user?.id) { 
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    const buyerId = req.user.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    const [[order]] = await cartDB.query(
      `SELECT order_status FROM ecommerce_mojija_cart.buyer_orders 
       WHERE order_id = ? AND buyer_id = ?`,
      [id, buyerId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["delivered", "shipped", "cancelled"].includes(order.order_status)) {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    const [result] = await cartDB.query(
      `UPDATE ecommerce_mojija_cart.buyer_orders 
       SET order_status = 'cancelled', cancel_reason = ?
       WHERE order_id = ? AND buyer_id = ?`,
      [reason.trim(), id, buyerId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    const [orderItems] = await cartDB.query(
      `SELECT order_item_id, product_id, quantity, owner_type
       FROM ecommerce_mojija_cart.order_items
       WHERE order_id = ?`,
      [id]
    );

    for (const item of orderItems) {
      if (item.owner_type === "seller") {
        await cartDB.query(
          `UPDATE ecommerce_mojija_product.product
           SET remaining_stock = remaining_stock + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      } else if (item.owner_type === "supplier") {
        await cartDB.query(
          `UPDATE ecommerce_mojija_product.supplier_product
           SET remaining_stock = remaining_stock + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }

      await cartDB.query(
        `INSERT INTO ecommerce_mojija_cart.order_tracking (order_item_id, status, message)
         VALUES (?, ?, ?)`,
        [item.order_item_id, 'cancelled', reason.trim()]
      );
    }
// ✅ YAHAN ADD KARO — item_status bhi cancelled karo and reason
await cartDB.query(
  `UPDATE ecommerce_mojija_cart.order_items
   SET item_status = 'cancelled', cancel_reason = ?
   WHERE order_id = ? AND item_status IN ('placed', 'confirmed')`,
  [reason.trim(), id]
);

    return res.json({ success: true, message: "Order cancelled successfully" });

  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    return res.status(500).json({ message: "Cancel failed" });
  }
}

async function cancelOrderItem(req, res) {
  try {
    if (!req.user?.id) { 
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { orderId, itemId } = req.params;
    const buyerId = req.user.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    // Verify order belongs to buyer
    const [[order]] = await cartDB.query(
      `SELECT order_status FROM ecommerce_mojija_cart.buyer_orders 
       WHERE order_id = ? AND buyer_id = ?`,
      [orderId, buyerId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch the specific item
    const [[item]] = await cartDB.query(
      `SELECT order_item_id, product_id, quantity, owner_type, item_status
       FROM ecommerce_mojija_cart.order_items
       WHERE order_item_id = ? AND order_id = ?`,
      [itemId, orderId]
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (["delivered", "shipped", "cancelled"].includes(item.item_status)) {
      return res.status(400).json({ message: "Item cannot be cancelled" });
    }

    // Update item_status to 'cancelled' and save reason
    const [result] = await cartDB.query(
      `UPDATE ecommerce_mojija_cart.order_items 
       SET item_status = 'cancelled', cancel_reason = ?
       WHERE order_item_id = ?`,
      [reason.trim(), itemId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Item cannot be cancelled" });
    }

    // Restock
    if (item.owner_type === "seller") {
      await cartDB.query(
        `UPDATE ecommerce_mojija_product.product
         SET remaining_stock = remaining_stock + ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    } else if (item.owner_type === "supplier") {
      await cartDB.query(
        `UPDATE ecommerce_mojija_product.supplier_product
         SET remaining_stock = remaining_stock + ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Tracking
    await cartDB.query(
      `INSERT INTO ecommerce_mojija_cart.order_tracking (order_item_id, status, message)
       VALUES (?, 'cancelled', ?)`,
      [itemId, reason.trim()]
    );

    // Auto-update order_status
    const [items] = await cartDB.query(
      `SELECT item_status FROM ecommerce_mojija_cart.order_items WHERE order_id = ?`,
      [orderId]
    );

    const allMatch = (s) => items.every(i => i.item_status === s);
    const anyMatch = (s) => items.some(i => i.item_status === s);

    let newOrderStatus = null;
    if (allMatch('cancelled')) newOrderStatus = 'cancelled';
    else if (allMatch('delivered')) newOrderStatus = 'delivered';
    else if (anyMatch('shipped')) newOrderStatus = 'shipped';
    else if (anyMatch('confirmed')) newOrderStatus = 'confirmed';

    if (newOrderStatus) {
      await cartDB.query(
        `UPDATE ecommerce_mojija_cart.buyer_orders
         SET order_status = ?
         WHERE order_id = ?`,
        [newOrderStatus, orderId]
      );
    }

    return res.json({ success: true, message: "Item cancelled successfully" });

  } catch (err) {
    console.error("CANCEL ITEM ERROR:", err);
    return res.status(500).json({ message: "Item Cancel failed" });
  }
}

async function updateItemStatus(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const validStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // ✅ Item status update
    const [result] = await cartDB.query(
      `UPDATE ecommerce_mojija_cart.order_items
       SET item_status = ?
       WHERE order_item_id = ? AND order_id = ?`,
      [status, itemId, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // ✅ Insert into order_tracking
    await cartDB.query(
      `INSERT INTO ecommerce_mojija_cart.order_tracking (order_item_id, status, message)
       VALUES (?, ?, ?)`,
      [itemId, status, `Order item status updated to ${status} by Buyer`]
    );

    // ✅ Order ka overall status auto-update
    const [items] = await cartDB.query(
      `SELECT item_status FROM ecommerce_mojija_cart.order_items WHERE order_id = ?`,
      [orderId]
    );

    const allMatch = (s) => items.every(i => i.item_status === s);
    const anyMatch = (s) => items.some(i => i.item_status === s);

    let newOrderStatus = null;
    if (allMatch('delivered'))   newOrderStatus = 'delivered';
    else if (allMatch('cancelled'))  newOrderStatus = 'cancelled';
    else if (anyMatch('shipped'))    newOrderStatus = 'shipped';
    else if (anyMatch('confirmed'))  newOrderStatus = 'confirmed';

    if (newOrderStatus) {
      await cartDB.query(
        `UPDATE ecommerce_mojija_cart.buyer_orders
         SET order_status = ?
         WHERE order_id = ?`,
        [newOrderStatus, orderId]
      );
    }

    return res.json({ success: true, message: "Item status updated" });

  } catch (err) {
    console.error("UPDATE ITEM STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
}

const getBuyerOrderTracking = async (req, res) => {
  try {
    const buyerId = req.user.id; // authMiddleware jo set karta hai
    const { itemId } = req.params;

    // Verify — yeh item is buyer ka hai
    const [check] = await cartDB.query(
      `SELECT oi.order_item_id 
       FROM ecommerce_mojija_cart.order_items oi
       JOIN ecommerce_mojija_cart.buyer_orders bo 
         ON bo.order_id = oi.order_id
       WHERE oi.order_item_id = ? AND bo.buyer_id = ?`,
      [itemId, buyerId]
    );

    if (!check.length) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const [rows] = await cartDB.query(
      `SELECT 
         tracking_id, 
         order_item_id, 
         status, 
         message,
         DATE_FORMAT(
           CONVERT_TZ(created_at, '+00:00', '+05:30'), 
           '%Y-%m-%d %H:%i:%s'
         ) AS created_at
       FROM ecommerce_mojija_cart.order_tracking
       WHERE order_item_id = ?
       ORDER BY created_at ASC`,
      [itemId]
    );

    return res.json({ success: true, data: rows });

  } catch (err) {
    console.error("BUYER TRACKING ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch tracking" });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  cancelOrder,
  cancelOrderItem,
  updateItemStatus,
  getBuyerOrderTracking  // ✅ export karo
};

