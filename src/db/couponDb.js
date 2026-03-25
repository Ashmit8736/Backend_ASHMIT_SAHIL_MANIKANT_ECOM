import db from "./productDB.js"; 

// coupon find
export const getCouponByCode = async (code) => {
  const [rows] = await db.query(
    "SELECT * FROM coupons WHERE code = ? AND is_active = 1",
    [code]
  );
  return rows;
};

// slab find
export const getMatchingSlab = async (couponId, cartTotal) => {
  const [rows] = await db.query(
    `SELECT * FROM coupon_slabs 
     WHERE coupon_id = ? 
     AND ? BETWEEN min_amount AND max_amount`,
    [couponId, cartTotal]
  );
  return rows;
};

// usage update
export const incrementCouponUsage = async (couponId) => {
  await db.query(
    "UPDATE coupons SET used_count = used_count + 1 WHERE id = ?",
    [couponId]
  );
};
