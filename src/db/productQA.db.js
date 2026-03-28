import pool from "./productDB.js";

/* ================= QUESTIONS ================= */

export const createQuestion = async ({ product_id, user_id, question }) => {
  const [result] = await pool.execute(
    `INSERT INTO product_questions 
     (product_id, user_id, question, created_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 330 MINUTE))`,
    [product_id, user_id, question],
  );
  return result;
};

export const getQuestionsWithAnswers = async (product_id) => {
  const [rows] = await pool.execute(
    `SELECT 
        q.id AS question_id,
        q.question,
        q.created_at,
        a.id AS answer_id,
        a.answer,
        a.user_type AS answered_by
     FROM product_questions q
     LEFT JOIN product_answers a ON a.question_id = q.id
     WHERE q.product_id = ?
     ORDER BY q.created_at DESC`,
    [product_id],
  );
  return rows;
};

/* ================= ANSWERS ================= */

export const createAnswer = async ({
  question_id,
  product_id,
  user_id,
  user_type,
  answer,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO product_answers
     (question_id, product_id, user_id, user_type, answer, created_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 330 MINUTE))`,
    [question_id, product_id, user_id, user_type, answer],
  );
  return result;
};

export const getQuestionById = async (question_id) => {
  const [rows] = await pool.execute(
    "SELECT product_id FROM product_questions WHERE id = ?",
    [question_id],
  );
  return rows[0];
};
