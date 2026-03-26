
import db from "../db/productDB.js";

/* ======================================================
   1️⃣ ADD / UPDATE PRODUCT RATING (BUYER)
====================================================== */
export const addOrUpdateProductRating = async (req, res) => {
    try {
        // 🔥 req.user use karo — req.buyer nahi (middleware req.user set karta hai)
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Buyer not authenticated",
            });
        }

        const buyerId = req.user.id;
        const { product_id, owner_type, rating, review } = req.body;

        if (!product_id || !owner_type || !rating) {
            return res.status(400).json({
                message: "product_id, owner_type and rating are required",
            });
        }

        await db.query(
            "CALL AddOrUpdateProductRating(?,?,?,?,?)",
            [product_id, buyerId, owner_type, rating, review || null]
        );

        await db.query(
            "CALL RecalculateProductRating(?,?)",
            [product_id, owner_type]
        );

        return res.json({
            success: true,
            message: "Rating submitted successfully",
        });

    } catch (err) {
        console.error("ADD RATING ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/* ======================================================
   2️⃣ GET PRODUCT RATINGS (PUBLIC)
====================================================== */
export async function getProductRatings(req, res) {
    try {
        const { product_id, owner_type } = req.params;

        if (!product_id || !owner_type) {
            return res.status(400).json({ message: "Invalid request" });
        }

        if (!["seller", "supplier"].includes(owner_type)) {
            return res.status(400).json({ message: "Invalid owner_type" });
        }

        const [rows] = await db.query(
            "CALL GetProductRatings(?,?)",
            [product_id, owner_type]
        );

        // MySQL CALL — rows[0] = first result set (ratings list)
        const ratings = rows[0] || [];

        // 🔥 CHANGE — avg_rating aur rating_count calculate karo ratings array se
        // PEHLE: sirf ratings array return hota tha — frontend ko avg_rating nahi milta tha
        // AB: avg_rating, rating_count, aur my_rating bhi return karo
        const totalRatings = ratings.length;

        const avgRating = totalRatings > 0
            ? ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalRatings
            : 0;

        // my_rating — agar stored procedure buyer_id ke basis pe my_rating return karta hai
        // ratings array mein is_mine ya buyer_id field ho sakta hai
        const myRating = ratings.find((r) => r.is_mine === 1 || r.is_mine === true) || null;

        return res.json({
            success: true,
            avg_rating: parseFloat(avgRating.toFixed(2)),
            rating_count: totalRatings,
            my_rating: myRating
                ? { rating: myRating.rating, review: myRating.review || "" }
                : null,
            ratings,
        });

    } catch (err) {
        console.error("GET PRODUCT RATINGS ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}