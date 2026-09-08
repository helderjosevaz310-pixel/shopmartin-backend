require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");

const authRoutes = require("./routes/auth");
const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const planRoutes = require("./routes/plans");
const affiliateRoutes = require("./routes/affiliates");
const adRoutes = require("./routes/ads");
const userRoutes = require("./routes/users");

const app = express();

// --- Segurança básica ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "2mb" })); // limite de tamanho do corpo do pedido

// Limita pedidos por IP para evitar abuso/força-bruta
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(globalLimiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // mais apertado no login/registo
app.use("/api/auth", authLimiter);

// --- Base de dados ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.set("db", pool);

// --- Rotas ---
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/stores/:storeId/products", productRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/affiliates", affiliateRoutes);
app.use("/api/users", userRoutes);
app.use("/api", adRoutes); // define as próprias rotas /api/stores/:id/ad-events e /api/ads/stats

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Handler de erro genérico — nunca devolve detalhes internos ao cliente
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: "Ocorreu um erro. Tenta novamente." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShopMartin API a correr na porta ${PORT}`));
