import db from "../db/productDB.js";

export async function getPublicCategories(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT 
                c.id,
                c.category_name AS name,
                c.image_url,
                (
                    SELECT COUNT(*)
                    FROM supplier_product sp
                    WHERE sp.category_master_id = c.id
                      AND sp.status = 'active'
                ) AS total_products
            FROM category_master c
            WHERE c.status = 1
              AND c.level = 1
            ORDER BY c.category_name
        `);

        res.json({
            success: true,
            categories: rows
        });

    } catch (err) {
        console.error("Public Category Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}



/* =====================================================
   🌍 PUBLIC CATEGORY TREE (BUYERS / NAVBAR)
===================================================== */
export async function publicGetCategoryTree(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                category_name,
                parent_id,
                level,
                image_url
            FROM category_master
            WHERE status = 1
            ORDER BY level, category_name
        `);

        const map = {};
        const tree = [];

        // STEP 1: MAP
        rows.forEach(cat => {
            cat.children = [];
            map[cat.id] = cat;
        });

        // STEP 2: BUILD TREE
        rows.forEach(cat => {
            if (cat.parent_id) {
                map[cat.parent_id]?.children.push(cat);
            } else {
                tree.push(cat); // LEVEL 1
            }
        });

        res.json({
            success: true,
            categories: tree
        });

    } catch (err) {
        console.error("Public Category Tree Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getProductsByCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id",
            });
        }

        const categoryId = Number(id);

        // 1️⃣ Fetch all categories
        const [categories] = await db.query(
            "SELECT id, parent_id FROM category_master WHERE status = 1"
        );

        // 2️⃣ Recursive child finder
        const ids = [];
        const findChildren = (currentId) => {
            ids.push(currentId);
            categories
                .filter((c) => c.parent_id === currentId)
                .forEach((c) => findChildren(c.id));
        };

        findChildren(categoryId);

        // 3️⃣ 🔥 FINAL QUERY (WITH IMAGES)
        const [rows] = await db.query(
            `
            SELECT 
                sp.product_id,
                sp.product_name,
                sp.brand,
                sp.product_price,
                sp.description,
                sp.gst_verified,
                sp.rating_avg,
                'supplier' AS product_source,
                (
                    SELECT JSON_ARRAYAGG(spu.url)
                    FROM supplier_product_url spu
                    WHERE spu.product_id = sp.product_id
                ) AS images,
                sp.created_at
            FROM supplier_product sp
            WHERE sp.category_master_id IN (?)
              AND sp.status = 'active'
            ORDER BY sp.created_at DESC
            `,
            [ids]
        );

        // 4️⃣ 🧠 Normalize images (ALWAYS ARRAY)
        const normalizeImages = (images) => {
            if (!images) return [];
            if (Array.isArray(images)) return images;
            try {
                return JSON.parse(images);
            } catch {
                return [];
            }
        };

        const products = rows.map(p => ({
            ...p,
            images: normalizeImages(p.images),
        }));

        res.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (err) {
        console.error("getProductsByCategory error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
