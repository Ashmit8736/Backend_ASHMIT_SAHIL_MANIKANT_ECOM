const express = require("express");
const router = express.Router();
const publicController = require("../controllers/public.controller");


router.get("/features/partners", publicController.getFeaturedPartners);

// Naye routes jo errors fix karenge
router.get("/products", (req, res) => res.json({ success: true, products: [] }));
router.get("/categories", (req, res) => res.json({ success: true, categories: [] }));
router.get("/categories/tree", (req, res) => res.json({ success: true, tree: [] }));

module.exports = router;