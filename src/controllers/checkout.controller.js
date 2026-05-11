// // import connectDb from "../db/db.js";
// const { cartDB } = require("../db/db");

// // export const placeOrder = async (req, res) => {
// //     async function placeOrder(req, res) {
// //     try {
// //         if (!req.user?.id) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Unauthorized",
// //             });
// //         }

// //         const buyerId = req.user.id;
// //         const { address_id, order_type } = req.body;

// //         const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
// //         const paymentMode = "COD"; // 🔒 FIXED (future me ONLINE add kar sakte)

// //         // 🔥 Delivery case me address mandatory
// //         if (fulfillmentType === "delivery" && !address_id) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "Delivery address is required",
// //             });
// //         }

// //         // const pool = await connectDb();
// //         const pool = cartDB;

// //         const [rows] = await pool.query(
// //             "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
// //             [
// //                 buyerId,
// //                 fulfillmentType === "pickup" ? null : address_id,
// //                 paymentMode,
// //                 fulfillmentType,
// //             ]
// //         );
// // //stock update on seller dashboard
// //         const order = rows?.[0]?.[0];

// //         if (order?.order_id) {
// //       const [orderItems] = await pool.query(
// //         `SELECT oi.product_id, oi.quantity, oi.owner_type
// //          FROM ecommerce_mojija_cart.order_items oi
// //          WHERE oi.order_id = ?
// //            AND oi.owner_type IN ('seller', 'supplier')`,
// //         [order.order_id],
// //       );

// //       for (const item of orderItems) {
// //         if (item.owner_type === "seller") {
// //           // ✅ SELLER stock deduct
// //           await pool.query(
// //             `UPDATE ecommerce_mojija_product.product
// //              SET remaining_stock = remaining_stock - ?
// //              WHERE product_id = ?
// //                AND remaining_stock >= ?`,
// //             [item.quantity, item.product_id, item.quantity],
// //           );
// //         } else if (item.owner_type === "supplier") {
// //           // ✅ SUPPLIER stock deduct
// //           await pool.query(
// //             `UPDATE ecommerce_mojija_product.supplier_product
// //              SET remaining_stock = remaining_stock - ?
// //              WHERE product_id = ?
// //                AND remaining_stock >= ?`,
// //             [item.quantity, item.product_id, item.quantity],
// //           );
// //         }
// //       }
// //     }

// //         return res.json({
// //             success: true,
// //             message: "Order placed successfully",
// //             data: order,
// //         });

// //     } catch (err) {
// //         console.error("PLACE ORDER ERROR:", err);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Failed to place order",
// //         });
// //     }
// // };

// // async function placeOrder(req, res) {
// //     try {
// //         if (!req.user?.id) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Unauthorized",
// //             });
// //         }

// //         const buyerId = req.user.id;
// //         const { address_id, order_type, buy_now, buy_now_item } = req.body; // 🔥 buy_now add kiya

// //         const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
// //         const paymentMode = "COD";

// //         if (fulfillmentType === "delivery" && !address_id) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "Delivery address is required",
// //             });
// //         }

// //         const pool = cartDB;
// //         let order;

// //         // ==============================
// //         // 🔥 BUY NOW FLOW
// //         // ==============================
// //         if (buy_now && buy_now_item) {

// //             // const itemPrice = Number(buy_now_item.price);
// //             // const itemQty = Number(buy_now_item.quantity);
// //             // const itemTotal = itemPrice * itemQty;

// //             const itemPrice = Number(buy_now_item.price);
// // const itemQty = Number(buy_now_item.quantity);
// // const itemSubtotal = itemPrice * itemQty;
// // const gstPercent = 18.00;
// // const gstAmount = parseFloat(((itemSubtotal * 18) / 100).toFixed(2));
// // const itemTotal = itemSubtotal + gstAmount;  // ✅ GST included

// //     // 🔥 YE ADD KARO
// //     console.log("itemPrice:", itemPrice);
// //     console.log("itemSubtotal:", itemSubtotal);
// //     console.log("gstAmount:", gstAmount);
// //     console.log("itemTotal (GST included):", itemTotal);

// //             // Step 1: buyer_orders me insert
// //             const [orderResult] = await pool.query(
// //                 `INSERT INTO ecommerce_mojija_cart.buyer_orders 
// //                  (buyer_id, address_id, payment_mode, fulfillment_type, order_status, total_amount)
// //                  VALUES (?, ?, ?, ?, 'placed', ?)`,
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                     itemTotal,
// //                 ]
// //             );

// //             const orderId = orderResult.insertId;

// //             // Step 2: order_items me insert
// //             // await pool.query(
// //             //     `INSERT INTO ecommerce_mojija_cart.order_items 
// //             //      (order_id, product_id, quantity, unit_price, subtotal, owner_type)
// //             //      VALUES (?, ?, ?, ?, ?, ?)`,
// //             //     [
// //             //         orderId,
// //             //         buy_now_item.product_id,
// //             //         itemQty,
// //             //         itemPrice,
// //             //         itemTotal,
// //             //         buy_now_item.owner_type,
// //             //     ]
// //             // );

// //             await pool.query(
// //     `INSERT INTO ecommerce_mojija_cart.order_items 
// //      (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
// //      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
// //     [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
// // );

// //             // Step 3: stock deduct
// //             if (buy_now_item.owner_type === "seller") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             } else if (buy_now_item.owner_type === "supplier") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.supplier_product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             }

// //             // Step 4: response ke liye order fetch
// //             const [orderRows] = await pool.query(
// //                 `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
// //                 [orderId]
// //             );
// //             order = orderRows?.[0];

// //         } else {
// //             // ==============================
// //             // 🔥 NORMAL CART FLOW — same as before
// //             // ==============================
// //             const [rows] = await pool.query(
// //                 "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                 ]
// //             );

// //             order = rows?.[0]?.[0];

// //             if (order?.order_id) {
// //                 const [orderItems] = await pool.query(
// //                     `SELECT oi.product_id, oi.quantity, oi.owner_type
// //                      FROM ecommerce_mojija_cart.order_items oi
// //                      WHERE oi.order_id = ?
// //                        AND oi.owner_type IN ('seller', 'supplier')`,
// //                     [order.order_id]
// //                 );

// //                 for (const item of orderItems) {
// //                     if (item.owner_type === "seller") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     } else if (item.owner_type === "supplier") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.supplier_product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     }
// //                 }
// //             }
// //         }

// //         return res.json({
// //             success: true,
// //             message: "Order placed successfully",
// //             data: order,
// //         });

// //     } catch (err) {
// //         console.error("PLACE ORDER ERROR:", err);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Failed to place order",
// //         });
// //     }
// // }



// // async function placeOrder(req, res) {
// //     try {
// //         if (!req.user?.id) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Unauthorized",
// //             });
// //         }
 
// //         const buyerId = req.user.id;
// //         const { address_id, order_type, buy_now, buy_now_item } = req.body;
 
// //         const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
// //         const paymentMode = "COD";
 
// //         if (fulfillmentType === "delivery" && !address_id) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "Delivery address is required",
// //             });
// //         }
 
// //         const pool = cartDB;
// //         let order;
 
// //         // ==============================
// //         // 🔥 BUY NOW FLOW
// //         // ==============================
// //         if (buy_now && buy_now_item) {
 
// //             const itemPrice = Number(buy_now_item.price);
// //             const itemQty = Number(buy_now_item.quantity);
// //             const itemSubtotal = itemPrice * itemQty;
// //             const gstPercent = 18.00;
// //             const gstAmount = parseFloat(((itemSubtotal * 18) / 100).toFixed(2));
// //             const itemTotal = itemSubtotal + gstAmount; // ✅ GST included
 
// //             // Step 1: buyer_orders me insert
// //             const [orderResult] = await pool.query(
// //                 `INSERT INTO ecommerce_mojija_cart.buyer_orders 
// //                  (buyer_id, address_id, payment_mode, fulfillment_type, order_status, total_amount)
// //                  VALUES (?, ?, ?, ?, 'placed', ?)`,
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                     itemTotal,
// //                 ]
// //             );
 
// //             const orderId = orderResult.insertId;
 
// //             // Step 2: order_items me insert with GST
// //             await pool.query(
// //                 `INSERT INTO ecommerce_mojija_cart.order_items 
// //                  (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
// //                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
// //                 [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
// //             );
 
// //             // Step 3: stock deduct
// //             if (buy_now_item.owner_type === "seller") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             } else if (buy_now_item.owner_type === "supplier") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.supplier_product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             }
 
// //             // Step 4: response ke liye order fetch
// //             const [orderRows] = await pool.query(
// //                 `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
// //                 [orderId]
// //             );
// //             order = orderRows?.[0];
 
// //         } else {
// //             // ==============================
// //             // 🔥 NORMAL CART FLOW
// //             // ==============================
// //             const [rows] = await pool.query(
// //                 "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                 ]
// //             );
 
// //             order = rows?.[0]?.[0];
 
// //             if (order?.order_id) {
 
// //                 // 🔥 CHANGE 1: Cart items fetch karo GST calculate karne ke liye
// //                 const [cartItemsRows] = await pool.query(
// //                     `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.owner_type
// //                      FROM ecommerce_mojija_cart.order_items oi
// //                      WHERE oi.order_id = ?`,
// //                     [order.order_id]
// //                 );
 
// //                 // 🔥 CHANGE 2: Har item pe GST calculate karo aur total banao
// //                 let newTotal = 0;
// //                         let sellerSubtotal = 0;  // ✅ NEW
// //         let sellerGst = 0;       // ✅ NEW
// //                 for (const item of cartItemsRows) {
// //                     const subtotal = Number(item.unit_price) * Number(item.quantity);
// //                     const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));
// //                     const itemTotal = subtotal + gstAmount;
// //                     newTotal += itemTotal;
 
// //                     // 🔥 CHANGE 3: order_items mein gst_percent, gst_amount update karo
// //                     await pool.query(
// //                         `UPDATE ecommerce_mojija_cart.order_items
// //                          SET gst_percent = 18.00,
// //                              gst_amount = ?,
// //                              subtotal = ?
// //                          WHERE order_id = ? AND product_id = ?`,
// //                         [gstAmount, subtotal, order.order_id, item.product_id]
// //                     );
// //                 }
 
// //                 // 🔥 CHANGE 4: buyer_orders mein total_amount GST ke saath update karo
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_cart.buyer_orders
// //                      SET total_amount = ?
// //                                       seller_subtotal = ?,
// //                  seller_gst = ?
// //                      WHERE order_id = ?`,
// //                     [parseFloat(newTotal.toFixed(2)), order.order_id]
// //                 );
 
// //                 // Stock deduct — same as before
// //                 const [orderItems] = await pool.query(
// //                     `SELECT oi.product_id, oi.quantity, oi.owner_type
// //                      FROM ecommerce_mojija_cart.order_items oi
// //                      WHERE oi.order_id = ?
// //                        AND oi.owner_type IN ('seller', 'supplier')`,
// //                     [order.order_id]
// //                 );
 
// //                 for (const item of orderItems) {
// //                     if (item.owner_type === "seller") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     } else if (item.owner_type === "supplier") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.supplier_product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     }
// //                 }
 
// //                 // 🔥 CHANGE 5: GST updated order dobara fetch karo
// //                 const [updatedOrder] = await pool.query(
// //                     `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
// //                     [order.order_id]
// //                 );
// //                 order = updatedOrder?.[0];
// //             }
// //         }
 
// //         return res.json({
// //             success: true,
// //             message: "Order placed successfully",
// //             data: order,
// //         });
 
// //     } catch (err) {
// //         console.error("PLACE ORDER ERROR:", err);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Failed to place order",
// //         });
// //     }
// // }
// //today 31
// // async function placeOrder(req, res) {
// //     try {
// //         if (!req.user?.id) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Unauthorized",
// //             });
// //         }

// //         const buyerId = req.user.id;
// //         const { address_id, order_type, buy_now, buy_now_item } = req.body;

// //         const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
// //         const paymentMode = "COD";

// //         if (fulfillmentType === "delivery" && !address_id) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "Delivery address is required",
// //             });
// //         }

// //         const pool = cartDB;
// //         let order;

// //         // ==============================
// //         // 🔥 BUY NOW FLOW
// //         // ==============================
// //         if (buy_now && buy_now_item) {

// //             const itemPrice = Number(buy_now_item.price);
// //             const itemQty = Number(buy_now_item.quantity);
// //             const itemSubtotal = itemPrice * itemQty;
// //             const gstPercent = 18.00;
// //             const gstAmount = parseFloat(((itemSubtotal * 18) / 100).toFixed(2));
// //             const itemTotal = itemSubtotal + gstAmount;

// //             // ✅ seller_subtotal aur seller_gst bhi insert karo
// //             const [orderResult] = await pool.query(
// //                 `INSERT INTO ecommerce_mojija_cart.buyer_orders 
// //                  (buyer_id, address_id, payment_mode, fulfillment_type, order_status, 
// //                   total_amount, seller_subtotal, seller_gst)
// //                  VALUES (?, ?, ?, ?, 'placed', ?, ?, ?)`,
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                     itemTotal,
// //                     buy_now_item.owner_type === "seller" ? itemSubtotal : 0,
// //                     buy_now_item.owner_type === "seller" ? gstAmount : 0,
// //                 ]
// //             );

// //             const orderId = orderResult.insertId;

// //             // order_items insert with GST
// //             await pool.query(
// //                 `INSERT INTO ecommerce_mojija_cart.order_items 
// //                  (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
// //                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
// //                 [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
// //             );

// //             // Stock deduct
// //             if (buy_now_item.owner_type === "seller") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             } else if (buy_now_item.owner_type === "supplier") {
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_product.supplier_product
// //                      SET remaining_stock = remaining_stock - ?
// //                      WHERE product_id = ? AND remaining_stock >= ?`,
// //                     [itemQty, buy_now_item.product_id, itemQty]
// //                 );
// //             }

// //             const [orderRows] = await pool.query(
// //                 `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
// //                 [orderId]
// //             );
// //             order = orderRows?.[0];

// //         } else {
// //             // ==============================
// //             // 🔥 NORMAL CART FLOW
// //             // ==============================
// //             const [rows] = await pool.query(
// //                 "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
// //                 [
// //                     buyerId,
// //                     fulfillmentType === "pickup" ? null : address_id,
// //                     paymentMode,
// //                     fulfillmentType,
// //                 ]
// //             );

// //             order = rows?.[0]?.[0];

// //             if (order?.order_id) {

// //                 // Cart items fetch karo GST calculate karne ke liye
// //                 const [cartItemsRows] = await pool.query(
// //                     `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.owner_type
// //                      FROM ecommerce_mojija_cart.order_items oi
// //                      WHERE oi.order_id = ?`,
// //                     [order.order_id]
// //                 );

// //                 let newTotal = 0;
// //                 let sellerSubtotal = 0;  // ✅ NEW
// //                 let sellerGst = 0;       // ✅ NEW

// //                 for (const item of cartItemsRows) {
// //                     const subtotal = Number(item.unit_price) * Number(item.quantity);
// //                     const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));
// //                     const itemTotal = subtotal + gstAmount;
// //                     newTotal += itemTotal;

// //                     // ✅ Seller items ka alag track karo
// //                     if (item.owner_type === "seller") {
// //                         sellerSubtotal += subtotal;
// //                         sellerGst += gstAmount;
// //                     }

// //                     // order_items mein gst update karo
// //                     await pool.query(
// //                         `UPDATE ecommerce_mojija_cart.order_items
// //                          SET gst_percent = 18.00,
// //                              gst_amount = ?,
// //                              subtotal = ?
// //                          WHERE order_id = ? AND product_id = ?`,
// //                         [gstAmount, subtotal, order.order_id, item.product_id]
// //                     );
// //                 }

// //                 // ✅ buyer_orders — total_amount + seller_subtotal + seller_gst update
// //                 await pool.query(
// //                     `UPDATE ecommerce_mojija_cart.buyer_orders
// //                      SET total_amount = ?,
// //                          seller_subtotal = ?,
// //                          seller_gst = ?
// //                      WHERE order_id = ?`,
// //                     [
// //                         parseFloat(newTotal.toFixed(2)),
// //                         parseFloat(sellerSubtotal.toFixed(2)),
// //                         parseFloat(sellerGst.toFixed(2)),
// //                         order.order_id
// //                     ]
// //                 );

// //                 // Stock deduct
// //                 const [orderItems] = await pool.query(
// //                     `SELECT oi.product_id, oi.quantity, oi.owner_type
// //                      FROM ecommerce_mojija_cart.order_items oi
// //                      WHERE oi.order_id = ?
// //                        AND oi.owner_type IN ('seller', 'supplier')`,
// //                     [order.order_id]
// //                 );

// //                 for (const item of orderItems) {
// //                     if (item.owner_type === "seller") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     } else if (item.owner_type === "supplier") {
// //                         await pool.query(
// //                             `UPDATE ecommerce_mojija_product.supplier_product
// //                              SET remaining_stock = remaining_stock - ?
// //                              WHERE product_id = ? AND remaining_stock >= ?`,
// //                             [item.quantity, item.product_id, item.quantity]
// //                         );
// //                     }
// //                 }

// //                 // ✅ Updated order dobara fetch karo
// //                 const [updatedOrder] = await pool.query(
// //                     `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
// //                     [order.order_id]
// //                 );
// //                 order = updatedOrder?.[0];
// //             }
// //         }

// //         return res.json({
// //             success: true,
// //             message: "Order placed successfully",
// //             data: order,
// //         });

// //     } catch (err) {
// //         console.error("PLACE ORDER ERROR:", err);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Failed to place order",
// //         });
// //     }
// // }

// // ==============================
// // STOCK VALIDATION HELPER
// // ==============================
// const validateStock = async (pool, items) => {
//   for (const item of items) {
//     if (item.owner_type === "seller") {
//       const [[product]] = await pool.query(
//         `SELECT remaining_stock, product_name 
//          FROM ecommerce_mojija_product.product 
//          WHERE product_id = ?`,
//         [item.product_id]
//       );

//       if (!product) {
//         throw { statusCode: 404, message: `Product not found` };
//       }

//       if (Number(product.remaining_stock) < Number(item.quantity)) {
//         throw {
//           statusCode: 400,
//           message: `Only ${product.remaining_stock} item(s) left for "${product.product_name}". You requested ${item.quantity}.`
//         };
//       }

//     } else if (item.owner_type === "supplier") {
//       const [[product]] = await pool.query(
//         `SELECT remaining_stock, product_name 
//          FROM ecommerce_mojija_product.supplier_product 
//          WHERE product_id = ?`,
//         [item.product_id]
//       );

//       if (!product) {
//         throw { statusCode: 404, message: `Product not found` };
//       }

//       if (Number(product.remaining_stock) < Number(item.quantity)) {
//         throw {
//           statusCode: 400,
//           message: `Only ${product.remaining_stock} item(s) left for "${product.product_name}". You requested ${item.quantity}.`
//         };
//       }
//     }
//   }
// };


// async function placeOrder(req, res) {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const buyerId = req.user.id;
//     const { address_id, order_type, buy_now, buy_now_item } = req.body;

//     const fulfillmentType = order_type === "pickup" ? "pickup" : "delivery";
//     const paymentMode = "COD";

//     if (fulfillmentType === "delivery" && !address_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Delivery address is required",
//       });
//     }

//     const pool = cartDB;
//     let order;

//     // ==============================
//     // 🔥 BUY NOW FLOW
//     // ==============================
//     if (buy_now && buy_now_item) {

//       const itemPrice = Number(buy_now_item.price);
//       const itemQty   = Number(buy_now_item.quantity);

//       // ✅ STOCK VALIDATION — Buy Now
//       await validateStock(pool, [buy_now_item]);

//       const itemSubtotal = itemPrice * itemQty;
//       const gstPercent   = 18.00;
//       const gstAmount    = parseFloat(((itemSubtotal * 18) / 100).toFixed(2));
//       const itemTotal    = itemSubtotal + gstAmount;

//       const [orderResult] = await pool.query(
//         `INSERT INTO ecommerce_mojija_cart.buyer_orders 
//          (buyer_id, address_id, payment_mode, fulfillment_type, order_status, 
//           total_amount, seller_subtotal, seller_gst)
//          VALUES (?, ?, ?, ?, 'placed', ?, ?, ?)`,
//         [
//           buyerId,
//           fulfillmentType === "pickup" ? null : address_id,
//           paymentMode,
//           fulfillmentType,
//           itemTotal,
//           buy_now_item.owner_type === "seller" ? itemSubtotal : 0,
//           buy_now_item.owner_type === "seller" ? gstAmount : 0,
//         ]
//       );

//       const orderId = orderResult.insertId;

//       await pool.query(
//         `INSERT INTO ecommerce_mojija_cart.order_items 
//          (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
//       );

//       // ✅ Stock deduct
//       if (buy_now_item.owner_type === "seller") {
//         await pool.query(
//           `UPDATE ecommerce_mojija_product.product
//            SET remaining_stock = remaining_stock - ?
//            WHERE product_id = ? AND remaining_stock >= ?`,
//           [itemQty, buy_now_item.product_id, itemQty]
//         );
//       } else if (buy_now_item.owner_type === "supplier") {
//         await pool.query(
//           `UPDATE ecommerce_mojija_product.supplier_product
//            SET remaining_stock = remaining_stock - ?
//            WHERE product_id = ? AND remaining_stock >= ?`,
//           [itemQty, buy_now_item.product_id, itemQty]
//         );
//       }

//       const [orderRows] = await pool.query(
//         `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
//         [orderId]
//       );
//       order = orderRows?.[0];

//     } else {
//       // ==============================
//       // 🔥 NORMAL CART FLOW
//       // ==============================
//       const [rows] = await pool.query(
//         "CALL PlaceOrderFromCart_Split(?, ?, ?, ?)",
//         [
//           buyerId,
//           fulfillmentType === "pickup" ? null : address_id,
//           paymentMode,
//           fulfillmentType,
//         ]
//       );

//       order = rows?.[0]?.[0];

//       if (order?.order_id) {

//         const [cartItemsRows] = await pool.query(
//           `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.owner_type
//            FROM ecommerce_mojija_cart.order_items oi
//            WHERE oi.order_id = ?`,
//           [order.order_id]
//         );

//         // ✅ STOCK VALIDATION — Cart flow
//         await validateStock(pool, cartItemsRows);

//         let newTotal = 0;
//         let sellerSubtotal = 0;
//         let sellerGst = 0;

//         for (const item of cartItemsRows) {
//           const subtotal  = Number(item.unit_price) * Number(item.quantity);
//           const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));
//           const itemTotal = subtotal + gstAmount;
//           newTotal += itemTotal;

//           if (item.owner_type === "seller") {
//             sellerSubtotal += subtotal;
//             sellerGst      += gstAmount;
//           }

//           await pool.query(
//             `UPDATE ecommerce_mojija_cart.order_items
//              SET gst_percent = 18.00,
//                  gst_amount = ?,
//                  subtotal = ?
//              WHERE order_id = ? AND product_id = ?`,
//             [gstAmount, subtotal, order.order_id, item.product_id]
//           );
//         }

//         await pool.query(
//           `UPDATE ecommerce_mojija_cart.buyer_orders
//            SET total_amount = ?,
//                seller_subtotal = ?,
//                seller_gst = ?
//            WHERE order_id = ?`,
//           [
//             parseFloat(newTotal.toFixed(2)),
//             parseFloat(sellerSubtotal.toFixed(2)),
//             parseFloat(sellerGst.toFixed(2)),
//             order.order_id
//           ]
//         );

//         // Stock deduct
//         for (const item of cartItemsRows) {
//           if (item.owner_type === "seller") {
//             await pool.query(
//               `UPDATE ecommerce_mojija_product.product
//                SET remaining_stock = remaining_stock - ?
//                WHERE product_id = ? AND remaining_stock >= ?`,
//               [item.quantity, item.product_id, item.quantity]
//             );
//           } else if (item.owner_type === "supplier") {
//             await pool.query(
//               `UPDATE ecommerce_mojija_product.supplier_product
//                SET remaining_stock = remaining_stock - ?
//                WHERE product_id = ? AND remaining_stock >= ?`,
//               [item.quantity, item.product_id, item.quantity]
//             );
//           }
//         }

//         const [updatedOrder] = await pool.query(
//           `SELECT * FROM ecommerce_mojija_cart.buyer_orders WHERE order_id = ?`,
//           [order.order_id]
//         );
//         order = updatedOrder?.[0];
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Order placed successfully",
//       data: order,
//     });

//   } catch (err) {
//     // ✅ Stock validation error handle karo
//     if (err.statusCode) {
//       return res.status(err.statusCode).json({
//         success: false,
//         message: err.message
//       });
//     }

//     console.error("PLACE ORDER ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to place order",
//     });
//   }
// }
// // export const getMyOrders = async (req, res) => {
//     async function getMyOrders(req, res) {
//     try {
//         /* 🔐 AUTH CHECK */
//         if (!req.user?.id) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Unauthorized",
//             });
//         }

//         const buyerId = req.user.id;
//         // const pool = await connectDb();
//         const pool = cartDB;

//         /* 🔥 CALL STORED PROCEDURE */
//         const [rows] = await pool.query(
//             "CALL GetBuyerOrders(?)",
//             [buyerId]
//         );

//         return res.status(200).json({
//             success: true,
//             data: rows[0] || [],
//         });

//     } catch (err) {
//         console.error("GET MY ORDERS ERROR:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch orders",
//         });
//     }
// };

// /* ================================
//    GET MY ADDRESSES
// ================================ */
// // export const getMyAddresses = async (req, res) => {
//     async function getMyAddresses(req, res) {
//     try {
//         if (!req.user?.id) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }

//         // const pool = await connectDb();
//         const pool = cartDB;

//         const [rows] = await pool.query(
//             `SELECT address_id, full_name, phone, address_line, city, state, pincode
//        FROM buyer_addresses
//        WHERE buyer_id = ?
//        ORDER BY created_at DESC`,
//             [req.user.id]
//         );

//         return res.json({ success: true, data: rows });
//     } catch (err) {
//         console.error("GET ADDRESS ERROR:", err);
//         return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
//     }
// };


// /* ================================
//    ADD ADDRESS
// ================================ */
// // export const addAddress = async (req, res) => {
//     async function addAddress(req, res) {
//     try {
//         if (!req.user?.id) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }

//         const {
//             full_name,
//             phone,
//             address_line,
//             city,
//             state,
//             pincode,
//         } = req.body;

//         if (!full_name || !phone || !address_line || !city || !state || !pincode) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All address fields are required",
//             });
//         }

//         // const pool = await connectDb();
//         const pool = cartDB;

//         await pool.query(
//             `INSERT INTO buyer_addresses
//        (buyer_id, full_name, phone, address_line, city, state, pincode)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [req.user.id, full_name, phone, address_line, city, state, pincode]
//         );

//         return res.json({ success: true, message: "Address added successfully" });
//     } catch (err) {
//         console.error("ADD ADDRESS ERROR:", err);
//         return res.status(500).json({ success: false, message: "Failed to add address" });
//     }
// };


// /* ================================
//    UPDATE ADDRESS
// ================================ */
// // export const updateAddress = async (req, res) => {
//     async function updateAddress(req, res) {
//     try {
//         if (!req.user?.id) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }

//         const { address_id } = req.params;
//         const {
//             full_name,
//             phone,
//             address_line,
//             city,
//             state,
//             pincode,
//         } = req.body;

//         if (!address_id) {
//             return res.status(400).json({ success: false, message: "address_id required" });
//         }

//         // const pool = await connectDb();
//         const pool = cartDB;

//         const [result] = await pool.query(
//             `UPDATE buyer_addresses
//        SET full_name=?, phone=?, address_line=?, city=?, state=?, pincode=?
//        WHERE address_id=? AND buyer_id=?`,
//             [
//                 full_name,
//                 phone,
//                 address_line,
//                 city,
//                 state,
//                 pincode,
//                 address_id,
//                 req.user.id,
//             ]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: "Address not found" });
//         }

//         return res.json({ success: true, message: "Address updated successfully" });
//     } catch (err) {
//         console.error("UPDATE ADDRESS ERROR:", err);
//         return res.status(500).json({ success: false, message: "Failed to update address" });
//     }
// };


// /* ================================
//    DELETE ADDRESS
// ================================ */
// // export const deleteAddress = async (req, res) => {
//     async function deleteAddress(req, res) {
//     try {
//         if (!req.user?.id) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }

//         const { address_id } = req.params;

//         // const pool = await connectDb();
//         const pool = cartDB;

//         const [result] = await pool.query(
//             `DELETE FROM buyer_addresses
//        WHERE address_id=? AND buyer_id=?`,
//             [address_id, req.user.id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: "Address not found" });
//         }

//         return res.json({ success: true, message: "Address deleted successfully" });
//     } catch (err) {
//         console.error("DELETE ADDRESS ERROR:", err);
//         return res.status(500).json({ success: false, message: "Failed to delete address" });
//     }
// };

// // async function cancelOrder(req, res) {
// //   try {
// //     if (!req.user?.id) {
// //       return res.status(401).json({ message: "Unauthorized" });
// //     }

// //     const { id } = req.params;
// //     const buyerId = req.user.id;
// //     const { reason } = req.body;

// //     if (!reason || !reason.trim()) {
// //       return res
// //         .status(400)
// //         .json({ message: "Cancellation reason is required" });
// //     }

// //     const [result] = await cartDB.query(
// //       `UPDATE ecommerce_mojija_cart.buyer_orders 
// //        SET order_status = 'cancelled',
// //            cancel_reason = ?
// //        WHERE order_id = ? 
// //          AND buyer_id = ?
// //          AND order_status NOT IN ('delivered', 'shipped', 'cancelled')`,
// //       [reason.trim(), id, buyerId],
// //     );

// //     if (result.affectedRows === 0) {
// //       return res.status(400).json({
// //         message: "Order cannot be cancelled",
// //       });
// //     }

// //     return res.json({
// //       success: true,
// //       message: "Order cancelled successfully",
// //     });
// //   } catch (err) {
// //     console.error("CANCEL ORDER ERROR:", err);
// //     return res.status(500).json({ message: "Cancel failed" });
// //   }
// // }
// async function cancelOrder(req, res) {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const { id } = req.params;
//     const buyerId = req.user.id;
//     const { reason } = req.body;

//     if (!reason || !reason.trim()) {
//       return res.status(400).json({ message: "Cancellation reason is required" });
//     }

//     // ✅ Pehle order check karo — cancel ho sakta hai ya nahi
//     const [[order]] = await cartDB.query(
//       `SELECT order_status FROM ecommerce_mojija_cart.buyer_orders 
//        WHERE order_id = ? AND buyer_id = ?`,
//       [id, buyerId]
//     );

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // ✅ Shipped ya delivered — cancel nahi ho sakta
//     if (["delivered", "shipped", "cancelled"].includes(order.order_status)) {
//       return res.status(400).json({
//         message: "Order cannot be cancelled",
//       });
//     }

//     // ✅ Cancel karo
//     const [result] = await cartDB.query(
//       `UPDATE ecommerce_mojija_cart.buyer_orders 
//        SET order_status = 'cancelled',
//            cancel_reason = ?
//        WHERE order_id = ? AND buyer_id = ?`,
//       [reason.trim(), id, buyerId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(400).json({ message: "Order cannot be cancelled" });
//     }

//     // ✅ STOCK RESTORE — cancelled order ke items ka stock wapas karo
//     const [orderItems] = await cartDB.query(
//       `SELECT product_id, quantity, owner_type
//        FROM ecommerce_mojija_cart.order_items
//        WHERE order_id = ?`,
//       [id]
//     );

//     for (const item of orderItems) {
//       if (item.owner_type === "seller") {
//         await cartDB.query(
//           `UPDATE ecommerce_mojija_product.product
//            SET remaining_stock = remaining_stock + ?
//            WHERE product_id = ?`,
//           [item.quantity, item.product_id]
//         );
//       } else if (item.owner_type === "supplier") {
//         await cartDB.query(
//           `UPDATE ecommerce_mojija_product.supplier_product
//            SET remaining_stock = remaining_stock + ?
//            WHERE product_id = ?`,
//           [item.quantity, item.product_id]
//         );
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Order cancelled successfully",
//     });

//   } catch (err) {
//     console.error("CANCEL ORDER ERROR:", err);
//     return res.status(500).json({ message: "Cancel failed" });
//   } 
// }
// module.exports = {
//   placeOrder,
//   getMyOrders,
//   getMyAddresses,
//   addAddress,
//   updateAddress,
//   deleteAddress,
//   cancelOrder,
// };



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

      await pool.query(
        `INSERT INTO ecommerce_mojija_cart.order_items 
         (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, buy_now_item.product_id, itemQty, itemPrice, gstPercent, gstAmount, itemSubtotal, buy_now_item.owner_type]
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

      // ✅ CHANGE 6 — order_items insert karo har selected item ke liye
      for (const item of cartItemsRows) {
        const subtotal  = Number(item.unit_price) * Number(item.quantity);
        const gstAmount = parseFloat(((subtotal * 18) / 100).toFixed(2));

        await pool.query(
          `INSERT INTO ecommerce_mojija_cart.order_items 
           (order_id, product_id, quantity, unit_price, gst_percent, gst_amount, subtotal, owner_type)
           VALUES (?, ?, ?, ?, 18.00, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.unit_price, gstAmount, subtotal, item.owner_type]
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
    return res.status(200).json({ success: true, data: rows[0] || [] });
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
      `SELECT product_id, quantity, owner_type
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
    }

    return res.json({ success: true, message: "Order cancelled successfully" });

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