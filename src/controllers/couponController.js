import {
  getCouponByCode,
  getMatchingSlab,
  incrementCouponUsage
} from "../db/couponDb.js";

export const applyCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || !cartTotal) {
    return res.status(400).json({ message: "Code and cart total required" });
  }

  try {
    // 1️⃣ Coupon check
    const couponRows = await getCouponByCode(code);

    if (couponRows.length === 0) {
      return res.status(400).json({ message: "Invalid Coupon Code" });
    }

    const coupon = couponRows[0];

    // 2️⃣ Expiry check
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ message: "Coupon Expired" });
    }

    // 3️⃣ Usage limit check
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: "Coupon Limit Reached" });
    }

    // 4️⃣ Slab match
    const slabRows = await getMatchingSlab(coupon.id, cartTotal);

    if (slabRows.length === 0) {
      return res.status(400).json({
        message: "Cart amount not eligible for this coupon",
      });
    }

    const slab = slabRows[0];
    const discount = slab.discount_amount;
    const finalTotal = cartTotal - discount;

    // 5️⃣ Usage increment
    await incrementCouponUsage(coupon.id);

    return res.json({
      success: true,
      discount,
      finalTotal,
      message: "Coupon Applied Successfully",
    });

  } catch (error) {
    console.error("Coupon Apply Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
