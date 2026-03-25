import {productDB} from "../db/db.js";
import XLSX from "xlsx";

/* =====================================================
   ✅ ADD CATEGORY (IMAGE REQUIRED)
===================================================== */



export async function adminAddCategory(req, res) {
    try {
        let { category_name, description, image_url } = req.body;

        if (!category_name ) {
            return res.status(400).json({
                message: "Category name & image required",
            });
        }

        category_name = category_name.trim();

        // 🔥 FORCE LEVEL 1
        const level = 1;
        const parentId = null;

        const [[exists]] = await productDB.query(
            `
            SELECT id FROM category_master
            WHERE LOWER(category_name)=LOWER(?)
              AND parent_id IS NULL
            `,
            [category_name]
        );

        if (exists) {
            return res.status(400).json({
                message: "Category already exists",
            });
        }

        await productDB.query(
            `
            INSERT INTO category_master
            (category_name, description, image_url, parent_id, level, status, created_at)
            VALUES (?, ?, ?, NULL, 1, 1, NOW())
            `,
            [category_name, description || null, image_url || null]
        );

        res.json({
            success: true,
            message: "Category created successfully (Level 1)",
        });

    }
     catch (err) {
    console.error("Add Category Error:", err);

    // ✅ Duplicate category (DB constraint)
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
            message: "Category already exists"
        });
    }

    res.status(500).json({
        message: err.message || "Internal server error"
    });
}

}




/* =====================================================
   🆕 ADD CATEGORY (LEVEL 1 / 2 / 3) – HIERARCHY
===================================================== */
export async function adminAddCategoryV2(req, res) {
    try {
        let { category_name, description, image_url, parent_id } = req.body;

        if (!category_name) {
            return res.status(400).json({
                message: "Category name & image required",
            });
        }

        // ✅ normalize name
        category_name = category_name.trim();

        let level = 1;
        let parentId = null;

        /* ================= PARENT VALIDATION ================= */
        if (parent_id) {
            const [[parent]] = await productDB.query(
                `SELECT id, level FROM category_master WHERE id = ?`,
                [parent_id]
            );

            if (!parent) {
                return res.status(400).json({
                    message: "Invalid parent category",
                });
            }

            level = parent.level + 1;
            parentId = parent_id;

            if (level > 3) {
                return res.status(400).json({
                    message: "Only 3 levels allowed",
                });
            }
        }

        /* ================= DUPLICATE CHECK (PARENT-WISE) ================= */
        const [[exists]] = await productDB.query(
            `
            SELECT id
            FROM category_master
            WHERE LOWER(category_name) = LOWER(?)
              AND (parent_id <=> ?)
            LIMIT 1
            `,
            [category_name, parentId]
        );

        if (exists) {
            return res.status(400).json({
                message: "Category already exists under this parent",
            });
        }

        /* ================= INSERT ================= */
        const [result] = await productDB.query(
            `
            INSERT INTO category_master
            (category_name, description, image_url, parent_id, level, status, created_at)
            VALUES (?, ?, ?, ?, ?, 1, NOW())
            `,
            [
                category_name,
                description || null,
                image_url || null,
                parentId,
                level,
            ]
        );

        /* ================= RESPONSE ================= */
        res.json({
            success: true,
            message: `Category added successfully (Level ${level})`,
            data: {
                id: result.insertId,
                category_name,
                level,
                parent_id: parentId,
            },
        });

    } 
    catch (err) {
    console.error("Add Category Error:", err);

    // ✅ Duplicate category (DB constraint)
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
            message: "Category already exists"
        });
    }

    res.status(500).json({
        message: err.message || "Internal server error"
    });
}

}




/* =====================================================
   🆕 GET CATEGORY TREE (BUYER / SELLER / SUPPLIER)
===================================================== */

// export async function adminGetCategoryTree(req, res) {
//     try {
//         const [rows] = await productDB.query(`
//             SELECT 
//                 id,
//                 category_name,
//                 parent_id,
//                 level,
//                 image_url,
//                 status
//             FROM category_master
//             ORDER BY parent_id, level, category_name
//         `);

//         const map = {};
//         const tree = [];

//         rows.forEach((cat) => {
//             cat.children = [];
//             map[cat.id] = cat;
//         });

//         rows.forEach((cat) => {
//             if (cat.parent_id) {
//                 map[cat.parent_id]?.children.push(cat);
//             } else {
//                 tree.push(cat);
//             }
//         });

//         res.json({ success: true, categories: tree });

//     } catch (err) {
//         console.error("Category Tree Error:", err);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }

export async function adminGetCategoryTree(req, res) {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // ✅ Sirf Level 1 ka total count
        const [[{ total }]] = await productDB.query(`
            SELECT COUNT(*) as total 
            FROM category_master 
            WHERE parent_id IS NULL
        `);

        // ✅ Sirf Level 1 paginated fetch karo
        const [level1Rows] = await productDB.query(`
            SELECT id, category_name, parent_id, level, image_url, status
            FROM category_master
            WHERE parent_id IS NULL
            ORDER BY category_name
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // ✅ Inke children alag se fetch karo (sab — unpaginated)
        const level1Ids = level1Rows.map(r => r.id);

        let children = [];
        if (level1Ids.length > 0) {
            const placeholders = level1Ids.map(() => "?").join(",");
            const [childRows] = await productDB.query(`
                SELECT id, category_name, parent_id, level, image_url, status
                FROM category_master
                WHERE parent_id IN (${placeholders})
                ORDER BY parent_id, category_name
            `, level1Ids);
            children = childRows;
        }

        // ✅ Tree banana — level1 + unke children
        const map = {};
        level1Rows.forEach(cat => {
            cat.children = [];
            map[cat.id] = cat;
        });

        children.forEach(cat => {
            cat.children = [];
            map[cat.id] = cat;
            if (map[cat.parent_id]) {
                map[cat.parent_id].children.push(cat);
            }
        });

        res.json({
            success: true,
            categories: level1Rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        });

    } catch (err) {
        console.error("Category Tree Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}



/* =====================================================
   2️⃣ GET ALL CATEGORIES (ADMIN VIEW)
===================================================== */
export async function adminGetCategories(req, res) {
    try {
        const [rows] = await productDB.query(`
            SELECT 
                c.id,
                c.category_name,
                c.description,
                c.image_url,
                c.status,
                c.created_at,
                COUNT(p.product_id) AS product_count
            FROM category_master c
            LEFT JOIN supplier_product p 
                ON p.category_master_id = c.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        res.json({
            success: true,
            categories: rows
        });

    } catch (err) {
        console.error("Admin Get Categories Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}






/* =====================================================
   4️⃣ ENABLE CATEGORY
===================================================== */
export async function adminEnableCategory(req, res) {
    try {
        const id = Number(req.params.id);

        await productDB.query(
            `UPDATE category_master SET status=1 WHERE id=?`,
            [id]
        );

        res.json({ success: true, message: "Category enabled" });

    } catch (err) {
        console.error("Admin Enable Category Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

/* =====================================================
   5️⃣ DISABLE CATEGORY (SOFT DELETE)
===================================================== */
export async function adminDisableCategory(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        await productDB.query(
            `UPDATE category_master SET status=0 WHERE id=?`,
            [id]
        );

        res.json({ success: true, message: "Category disabled" });

    } catch (err) {
        console.error("Admin Disable Category Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}



/* =====================================================
   3️⃣ UPDATE CATEGORY (IMAGE + DESCRIPTION)
===================================================== */
export async function adminUpdateCategory(req, res) {
    try {
        const id = Number(req.params.id);
        const { description, image_url } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        if (!description && !image_url) {
            return res.status(400).json({
                message: "Nothing to update"
            });
        }

        const fields = [];
        const values = [];

        if (description) {
            fields.push("description=?");
            values.push(description);
        }

        if (image_url) {
            fields.push("image_url=?");
            values.push(image_url);
        }

        values.push(id);

        await productDB.query(
            `UPDATE category_master SET ${fields.join(", ")} WHERE id=?`,
            values
        );

        res.json({ success: true, message: "Category updated successfully" });

    } catch (err) {
        console.error("Admin Update Category Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


/* =====================================================
   ❌ PERMANENT DELETE CATEGORY (ADMIN ONLY)
   ❗ Only if no products linked
===================================================== */


// // export async function adminDeleteCategory(req, res) {
// //     try {
// //         const id = Number(req.params.id);

// //         if (isNaN(id)) {
// //             return res.status(400).json({ message: "Invalid category id" });
// //         }

// //         // 🔒 safety: check products
// //         const [[count]] = await productDB.query(
// //             `SELECT COUNT(*) AS total FROM product WHERE category_id = ?`,
// //             [id]
// //         );

// //         if (count.total > 0) {
// //             return res.status(400).json({
// //                 message: "Cannot delete category. Products exist in this category."
// //             });
// //         }

// //         const [result] = await productDB.query(
// //             `DELETE FROM category_master WHERE id = ?`,
// //             [id]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({ message: "Category not found" });
// //         }

// //         res.json({
// //             success: true,
// //             message: "Category permanently deleted"
// //         });

// //     } catch (err) {
// //         console.error("Admin Delete Category Error:", err);
// //         res.status(500).json({ message: "Internal server error" });
// //     }
// // }



async function getAllCategoryIds(id) {
    let ids = [id];

    const [children] = await productDB.query(
        `SELECT id FROM category_master WHERE parent_id = ?`,
        [id]
    );

    for (let child of children) {
        const childIds = await getAllCategoryIds(child.id);
        ids = ids.concat(childIds);
    }

    return ids;
}
async function deleteCategoryWithChildren(id) {
    const [children] = await productDB.query(
        `SELECT id FROM category_master WHERE parent_id = ?`,
        [id]
    );

    for (let child of children) {
        await deleteCategoryWithChildren(child.id);
    }

    await productDB.query(
        `DELETE FROM category_master WHERE id = ?`,
        [id]
    );
}
export async function adminDeleteCategory(req, res) {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        // 🔥 Step 1: get ALL category ids (parent + children)
        const allIds = await getAllCategoryIds(id);

        const placeholders = allIds.map(() => "?").join(",");

        // 🔥 Step 2: check supplier products
        const [supplierProducts] = await productDB.query(
            `SELECT COUNT(*) AS total 
             FROM supplier_product 
             WHERE category_master_id IN (${placeholders})`,
            allIds
        );

        // 🔥 Step 3: check seller products
        const [sellerProducts] = await productDB.query(
            `SELECT COUNT(*) AS total 
             FROM product 
             WHERE category_master_id IN (${placeholders})`,
            allIds
        );

        const totalProducts =
            supplierProducts[0].total + sellerProducts[0].total;

        // 🔒 Step 4: block delete if products exist
        if (totalProducts > 0) {
            return res.status(400).json({
                message: "Cannot delete. Products exist in categories."
            });
        }

        // 🔥 Step 5: safe delete
        await deleteCategoryWithChildren(id);

        res.json({
            success: true,
            message: "Category and all subcategories deleted"
        });

    } catch (err) {
        console.error("Admin Delete Category Error:", err);

        res.status(400).json({
            message: err.message || "Delete failed"
        });
    }
}






export async function adminBulkUploadCategories(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Excel file required"
            });
        }

        // 1️⃣ Read Excel
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { defval: "" }
        );

        if (!rows.length) {
            return res.status(400).json({
                message: "Excel sheet is empty"
            });
        }

        // 2️⃣ Excel → Option-1 JSON
        const payload = rows.map((row, index) => ({
            main_category: row.main_category?.trim(),
            sub_category: row.sub_category?.trim(),
            child_category: row.child_category?.trim(),
            row_no: index + 2
        }));

        // 3️⃣ BASIC VALIDATION
        for (let i = 0; i < payload.length; i++) {
            const r = payload[i];

            if (!r.main_category) {
                return res.status(400).json({
                    message: `Main Category missing at Excel row ${r.row_no}`
                });
            }

            if (r.child_category && !r.sub_category) {
                return res.status(400).json({
                    message: `Sub Category required for Child Category at row ${r.row_no}`
                });
            }
        }

        // 4️⃣ CALL OPTION-1 PROCEDURE ✅
        await productDB.query(
            "CALL sp_bulk_insert_categories_option1(?)",
            [JSON.stringify(payload)]
        );

        res.json({
            success: true,
            message: "Categories uploaded successfully. Duplicate entries were skipped."
        });

    } catch (err) {
        console.error("Bulk Category Upload Error:", err);
        res.status(400).json({
            message: err.sqlMessage || err.message || "Bulk upload failed"
        });
    }
}
