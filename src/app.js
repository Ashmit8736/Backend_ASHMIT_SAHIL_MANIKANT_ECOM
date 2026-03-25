  require("dotenv").config();

  const express = require("express");
  const cors = require("cors");
  const cookieParser = require("cookie-parser");

  // const swaggerDocs = require("./config/swagger");
  const swaggerDocs = require("./swagger/swagger");


  /* ROUTES */
  const authRoute = require("./routes/auth.route");
  const sellerRoute = require("./routes/seller.route");
  const supplierRoute = require("./routes/supplier.route");
  const publicRoute = require("./routes/public.route");
  const adminRoute = require("./routes/admin.route");
  const cartRoutes = require("./routes/cartRoutes");
  const checkoutRoutes = require("./routes/checkoutRoute");


  // const sellerProductRoute = require("./routes/seller.product");
  const sellerProductRoute = require("./routes/seller.product").default;
  // const publicProductRoute = require("./routes/public.product");
  // const supplierProductRoute = require("./routes/supplier.product");
  // const publicSupplierProductRoute = require("./routes/public.supplier.product");
  // const publicBuyerProductRoute = require("./routes/public.buyer.product");
  // const publicCategoryRoute = require("./routes/public.category");
  // const productRating = require("./routes/productRating");
  // const productQA = require("./routes/productQA");
  // const relatedProductRoute = require("./routes/relatedProduct");
  // const couponRoutes = require("./routes/couponRoutes");
  // const recentProductRoutes = require("./routes/recentProductRoutes");

  const publicProductRoute = require("./routes/public.product").default;
const supplierProductRoute = require("./routes/supplier.product").default;
const publicSupplierProductRoute = require("./routes/public.supplier.product").default;
const publicBuyerProductRoute = require("./routes/public.buyer.product").default;
const publicCategoryRoute = require("./routes/public.category").default;
const productRating = require("./routes/productRating").default;
const productQA = require("./routes/productQA").default;
const relatedProductRoute = require("./routes/relatedProduct").default;
const couponRoutes = require("./routes/couponRoutes").default;
const recentProductRoutes = require("./routes/recentProductRoutes").default;

  const app = express();

  /* ------------------ MIDDLEWARE ------------------ */

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  /* ------------------ CORS ------------------ */

  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.48:5173",
        "http://192.168.1.49:5173",
        "http://192.168.1.51:5173",
        "http://172.31.0.1:5173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  /* Preflight */
  // app.options("*", cors());


  /* ------------------ ROUTES ------------------ */

  app.use("/api/auth", authRoute);
  app.use("/api/auth/seller", sellerRoute);
  app.use("/api/auth/supplier", supplierRoute);
  app.use("/api/public", publicRoute);
  app.use("/api/admin", adminRoute);


  // ✅ CART MOUNT
  app.use("/api/cart", cartRoutes);
  app.use("/api/checkout", checkoutRoutes);


  app.use("/api/seller", sellerProductRoute);
  app.use("/api/publics", publicProductRoute);
  app.use("/api/public", publicBuyerProductRoute);
  app.use("/api/publices", publicCategoryRoute);
  app.use("/api/supplier", supplierProductRoute);
  app.use("/api/public-supplier", publicSupplierProductRoute);
  app.use("/api/product", productRating);
  app.use("/api/product/qa", productQA);
  app.use("/api/public", relatedProductRoute);
  app.use("/api/coupon", couponRoutes);
  app.use("/api", recentProductRoutes);

  /* ------------------ SWAGGER ------------------ */

  swaggerDocs(app);

  /* ------------------ ROOT ------------------ */

  app.get("/", (req, res) => {
    res.send("🚀 MojiJa Unified Backend Running");
  });

  module.exports = app;