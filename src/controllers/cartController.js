



const { cartDB } = require("../db/db");

/* ===============================
   ADD TO CART
================================ */
async function addToCart(req, res) {
  let conn;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user_id = req.user.id;

    // 🔥 CHANGE 1 — owner_type bhi body se padho
    // PEHLE: const { product_id, quantity } = req.body;
    // AB: owner_type bhi lo — frontend se aayega
    const { product_id, quantity, owner_type } = req.body;
    const qty = quantity && quantity > 0 ? quantity : 1;

    conn = await cartDB.getConnection();
    await conn.beginTransaction();

    // 🔥 CHANGE 2 — owner_type ke basis pe sirf usi table me dhundo
    // PEHLE: dono tables UNION ALL se check hoti thi — galat row milti thi
    // AB: owner_type === "supplier" → sirf supplier table
    //     owner_type === "seller"   → sirf seller table
    let productQuery;
    let productParams;

    if (owner_type === "supplier") {
      productQuery = `
        SELECT 'supplier' AS owner_type, wholesale_moq AS moq, NULL AS remaining_stock
        FROM ecommerce_mojija_product.supplier_product
        WHERE product_id = ?
      `;
      productParams = [product_id];
    } else {
      // seller (default)
      productQuery = `
        SELECT 'seller' AS owner_type, 1 AS moq, remaining_stock
        FROM ecommerce_mojija_product.product
        WHERE product_id = ?
      `;
      productParams = [product_id];
    }

    const [productRows] = await conn.query(productQuery, productParams);

    if (!productRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const { owner_type: resolved_owner_type, moq, remaining_stock } = productRows[0];

    // 🔴 STOCK CHECK — seller product ka stock 0 hai toh block karo
    if (resolved_owner_type === "seller" && remaining_stock !== null && Number(remaining_stock) === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Product out of stock",
      });
    }

    // 🔴 STOCK CHECK — requested qty stock se zyada hai toh block karo
    if (resolved_owner_type === "seller" && remaining_stock !== null && qty > Number(remaining_stock)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Only ${remaining_stock} item(s) left in stock`,
        available_stock: remaining_stock,
      });
    }

    // 🟠 MOQ CHECK — supplier ke liye minimum order quantity
    if (resolved_owner_type === "supplier" && qty < moq) {
      await conn.rollback();
      return res.status(400).json({
        message: `Minimum order quantity is ${moq}`,
        moq,
      });
    }

    const [rows] = await conn.query(
      "CALL ecommerce_mojija_cart.AddToCart(?, ?, ?, ?)",
      [user_id, product_id, resolved_owner_type, qty]
    );

    await conn.commit();

    return res.status(200).json({
      message: rows?.[0]?.[0]?.message || "Item added to cart",
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("ADD TO CART ERROR:", err);
    return res.status(500).json({ message: "Cart crashed" });
  } finally {
    if (conn) conn.release();
  }
}

/* ===============================
   GET USER CART
================================ */
async function getUserCart(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await cartDB.query(
      "CALL ecommerce_mojija_cart.GetUserCart(?)",
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: rows?.[0] || [],
    });

  } catch (err) {
    console.error("GET CART ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch cart" });
  }
}

/* ===============================
   UPDATE CART QUANTITY
================================ */
async function updateCartQuantity(req, res) {
  try {
    const { cart_id } = req.params;
    const { quantity } = req.body;

    const [rows] = await cartDB.query(
      "CALL ecommerce_mojija_cart.UpdateCartQuantity(?, ?)",
      [cart_id, quantity]
    );

    return res.status(200).json({
      message: rows?.[0]?.[0]?.message || "Quantity updated",
    });

  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    return res.status(500).json({ message: "Failed to update quantity" });
  }
}

/* ===============================
   DELETE FROM CART
================================ */
async function deleteFromCart(req, res) {
  try {
    const { cart_id } = req.params;

    const [rows] = await cartDB.query(
      "CALL ecommerce_mojija_cart.DeleteFromCart(?, ?)",
      [cart_id, req.user.id]
    );

    return res.status(200).json({
      message: rows?.[0]?.[0]?.message || "Item removed from cart",
    });

  } catch (err) {
    console.error("DELETE CART ERROR:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
}

module.exports = {
  addToCart,
  getUserCart,
  updateCartQuantity,
  deleteFromCart,
};