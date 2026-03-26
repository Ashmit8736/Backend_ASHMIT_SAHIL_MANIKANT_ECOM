import pool from "../db/productDB.js"; // ✅ YAHAN ADD KARO
import {
  createQuestion,
  getQuestionsWithAnswers,
  createAnswer,
  getQuestionById,
} from "../db/productQA.db.js";

export const askQuestion = async (req, res) => {
  try {
    console.log("REQ.BUYER 👉", req.buyer); // ✅ user → buyer
    console.log("REQ.BODY 👉", req.body);

    const user_id = req.buyer.id; // ✅ user → buyer
    const { product_id, question } = req.body;

    await createQuestion({
      product_id,
      user_id,
      question,
    });

    res.json({ success: true, message: "Question submitted" });
  } catch (err) {
    console.error("ASK QUESTION ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* Public */
export const getQA = async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await getQuestionsWithAnswers(productId);

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

/* Seller / Supplier */

export const answerQuestion = async (req, res) => {
  try {
    // ✅ seller ya supplier dono handle karo
    const user_id = req.seller?.id || req.supplier?.id || req.user?.id;
    const user_type = req.seller
      ? "seller"
      : req.supplier
        ? "supplier"
        : req.user?.role;

    const { question_id, answer } = req.body;

    const question = await getQuestionById(question_id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await createAnswer({
      question_id,
      product_id: question.product_id,
      user_id,
      user_type,
      answer,
    });

    res.json({ success: true, message: "Answer added" });
  } catch (err) {
    console.error("ANSWER ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};


export const getSellerQuestions = async (req, res) => {
  try {
    const sellerId = req.seller?.id;

    const [rows] = await pool.execute(
      `SELECT 
        q.id AS question_id,
        q.question,
        q.product_id,
        p.product_name,
        p.sku,
        a.id AS answer_id,
        a.answer,
        a.user_type AS answered_by,
        (
          SELECT JSON_ARRAYAGG(JSON_EXTRACT(pu.url, '$[0]'))
          FROM ecommerce_mojija_product.product_url pu
          WHERE pu.product_id = p.product_id
          LIMIT 1
        ) AS image_urls
       FROM product_questions q
       JOIN ecommerce_mojija_product.product p 
         ON p.product_id = q.product_id
       LEFT JOIN product_answers a 
         ON a.question_id = q.id
       WHERE p.seller_id = ?
       ORDER BY q.created_at DESC`,
      [sellerId],
    );

    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.question_id]) {
        grouped[row.question_id] = {
          question_id: row.question_id,
          question: row.question,
          product_id: row.product_id,
          product_name: row.product_name,
          sku: row.sku,
          image_urls: (() => {
            try {
              const parsed = JSON.parse(row.image_urls);
              return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch { return []; }
          })(),
          answers: [],
        };
      }
      if (row.answer_id) {
        grouped[row.question_id].answers.push({
          answer: row.answer,
          answered_by: row.answered_by,
        });
      }
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error("GET SELLER QUESTIONS ERROR:", err);
    res.status(500).json({ success: false });
  }
};

export const getSupplierQuestions = async (req, res) => {
  try {
    const supplierId = req.supplier?.id;

    const [rows] = await pool.execute(
      `SELECT 
        q.id AS question_id,
        q.question,
        q.product_id,
        p.product_name,
        p.sku,
        a.id AS answer_id,
        a.answer,
        a.user_type AS answered_by,
        (
          SELECT JSON_ARRAYAGG(spu.url)
          FROM ecommerce_mojija_product.supplier_product_url spu
          WHERE spu.product_id = p.product_id
          LIMIT 1
        ) AS image_urls
       FROM product_questions q
       JOIN ecommerce_mojija_product.supplier_product p 
         ON p.product_id = q.product_id
       LEFT JOIN product_answers a 
         ON a.question_id = q.id
       WHERE p.supplier_id = ?
       ORDER BY q.created_at DESC`,
      [supplierId],
    );

    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.question_id]) {
        grouped[row.question_id] = {
          question_id: row.question_id,
          question: row.question,
          product_id: row.product_id,
          product_name: row.product_name,
          sku: row.sku,
          image_urls: (() => {
            try {
              if (!row.image_urls) return [];
              const parsed = JSON.parse(row.image_urls);
              const first = parsed[0];
              try {
                const inner = JSON.parse(first);
                return Array.isArray(inner) ? inner.filter(Boolean) : [first].filter(Boolean);
              } catch {
                return [first].filter(Boolean);
              }
            } catch { return []; }
          })(),
          answers: [],
        };
      }
      if (row.answer_id) {
        grouped[row.question_id].answers.push({
          answer: row.answer,
          answered_by: row.answered_by,
        });
      }
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error("GET SUPPLIER QUESTIONS ERROR:", err);
    res.status(500).json({ success: false });
  }
};