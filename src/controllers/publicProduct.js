


// //today 19,

import db from "../db/productDB.js";
import authDb from "../db/authDb.js";

export async function getPublicProducts(req, res) {
    try {
        
        console.log("1");
        const [dbName] = await db.query("SELECT DATABASE() as db");
        console.log("CONNECTED DB:", dbName[0].db);

        const [products] = await db.query(`
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.product_price,
                p.short_description,
                p.gst_verified,
                p.rating_avg,
                p.remaining_stock,
                cm.category_name,
                (
                    SELECT JSON_ARRAYAGG(url)
                    FROM product_url
                    WHERE product_id = p.product_id
                ) AS images
            FROM product p
            LEFT JOIN category_master cm 
                ON p.category_master_id = cm.id
            ORDER BY p.product_id DESC
        `);

        console.log("TOTAL PRODUCTS:", products.length);

        res.json({ success: true, products });

    } catch (err) {
        console.error("Public Products Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function getPublicProductById(req, res) {
    try {
        
        console.log("2");
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
                p.*,
                p.remaining_stock,
                cm.category_name,
                (
                    SELECT JSON_ARRAYAGG(url)
                    FROM product_url
                    WHERE product_id = p.product_id
                ) AS images
            FROM product p
            LEFT JOIN category_master cm 
                ON p.category_master_id = cm.id
            WHERE p.product_id = ?
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ success: true, product: rows[0] });

    } catch (err) {
        console.error("Public Product By ID Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function getPublicProductsByCategory(req, res) {
    try {
        const { id } = req.params;
        
        console.log("3");

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        const categoryId = Number(id);

        const [categories] = await db.query(
            "SELECT id, parent_id FROM category_master WHERE status = 1"
        );

        const ids = [];
        const findChildren = (cid) => {
            ids.push(cid);
            categories
                .filter((c) => c.parent_id === cid)
                .forEach((c) => findChildren(c.id));
        };

        findChildren(categoryId);

        const [products] = await db.query(
            `
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.product_price,
                p.short_description,
                p.gst_verified,
                p.rating_avg,
                p.remaining_stock,
                cm.category_name,
                (
                    SELECT JSON_ARRAYAGG(url)
                    FROM product_url
                    WHERE product_id = p.product_id
                ) AS images
            FROM product p
            JOIN category_master cm 
                ON p.category_master_id = cm.id
            WHERE p.category_master_id IN (?)
            ORDER BY p.created_at DESC
            `,
            [ids]
        );

        res.json({
            success: true,
            count: products.length,
            products,
        });

    } catch (err) {
        console.error("Public Products By Category Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function getPublicProductDetails(req, res) {
    try {
        const { id } = req.params;

        console.log("4");
        console.log("Product ID from params:", id);
        console.log("Type of ID:", typeof id);

        // 🔥 CHANGE 1 — URL se ?type padho
        // PEHLE: type check nahi hota tha, seedha seller table check hoti thi
        // AB: ?type=seller → sirf seller, ?type=supplier → sirf supplier, kuch nahi → pehle seller phir supplier
        const type = req.query.type; // "seller" | "supplier" | undefined

        // 🔥 CHANGE 2 — seller check ab if ke andar hai
        // PEHLE: hamesha seller table check hoti thi
        // AB: sirf tab check hoga jab type=seller ho ya type nahi diya
        if (type === "seller" || !type) {

            const [sellerProducts] = await db.query(
                `
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.product_price,
                    p.short_description,
                    p.long_description,
                    p.rating_avg,
                    p.seller_id,
                    p.remaining_stock,
                    (
                        SELECT JSON_ARRAYAGG(url)
                        FROM product_url
                        WHERE product_id = p.product_id
                    ) AS images
                FROM product p
                WHERE p.product_id = ?
                LIMIT 1
                `,
                [id]
            );

            if (sellerProducts.length) {
                const product = sellerProducts[0];

                const [sellerRows] = await authDb.query(
                    `
                    SELECT 
                        id,
                        fullname,
                        company_name,
                        approval_status,
                        branch_city,
                        branch_state
                    FROM seller
                    WHERE id = ?
                    `,
                    [product.seller_id]
                );

                return res.json({
                    success: true,
                    product: {
                        ...product,
                        owner_type: "seller",
                        seller_name: sellerRows[0]?.fullname || null,
                        company_name: sellerRows[0]?.company_name || null,
                        approval_status: sellerRows[0]?.approval_status || null,
                        branch_city: sellerRows[0]?.branch_city || null,
                        branch_state: sellerRows[0]?.branch_state || null,
                    },
                });
            }

            // 🔥 CHANGE 3 — agar type=seller tha aur seller me nahi mila toh 404 do
            // PEHLE: nahi tha — supplier me dhundhta rehta tha
            // AB: type=seller pe seedha 404
            if (type === "seller") {
                return res.status(404).json({ message: "Seller product not found" });
            }

        } // seller if block end

        // 🔥 CHANGE 4 — supplier check ab if ke andar hai
        // PEHLE: hamesha supplier table check hoti thi seller ke baad
        // AB: sirf tab check hoga jab type=supplier ho ya type nahi diya
        if (type === "supplier" || !type) {

            const [supplierProducts] = await db.query(
                `
                SELECT 
                    sp.product_id,
                    sp.product_name,
                    sp.brand,
                    sp.wholesale_price AS product_price,
                    sp.wholesale_moq,
                    sp.short_description,
                    sp.long_description,
                    sp.supplier_id,
                    sp.remaining_stock,
                    sp.rating_avg,
                    (
                        SELECT JSON_ARRAYAGG(JSON_UNQUOTE(url))
                        FROM supplier_product_url
                        WHERE product_id = sp.product_id
                    ) AS images
                FROM supplier_product sp
                WHERE sp.product_id = ?
                AND sp.status = 'active'
                LIMIT 1
                `,
                [id]
            );

            if (supplierProducts.length) {
                const product = supplierProducts[0];

                const [supplierRows] = await authDb.query(
                    `
                    SELECT 
                        id,
                        fullname,
                        company_name,
                        approval_status,
                        city,
                        state
                    FROM supplier
                    WHERE id = ?
                    `,
                    [product.supplier_id]
                );

                return res.json({
                    success: true,
                    product: {
                        ...product,
                        owner_type: "supplier",
                        seller_name: supplierRows[0]?.fullname || null,
                        company_name: supplierRows[0]?.company_name || null,
                        approval_status: supplierRows[0]?.approval_status || null,
                        branch_city: supplierRows[0]?.city || null,
                        branch_state: supplierRows[0]?.state || null,
                    },
                });
            }

        } // supplier if block end

        return res.status(404).json({ message: "Product not found" });

    } catch (err) {
        console.error("PUBLIC PRODUCT DETAILS ERROR:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

//today 19,

