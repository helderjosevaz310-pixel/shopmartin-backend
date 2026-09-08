const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { PLAN_LIMITS } = require("./plans");

const router = express.Router();

const RATE_CENTS_PER_IMPRESSION = 0.4; // ≈ €0.004 por impressão, valor de exemplo

// Chamado pela página pública da loja sempre que alguém a visita.
// Só regista receita se o dono da loja estiver num plano com anúncios (Starter).
router.post("/stores/:storeId/ad-events", async (req, res, next) => {
  const db = req.app.get("db");
  const { storeId } = req.params;

  try {
    const ownerRes = await db.query(
      `SELECT u.plan FROM users u JOIN stores s ON s.owner_id = u.id WHERE s.id = $1`,
      [storeId]
    );
    if (ownerRes.rows.length === 0) return res.status(404).json({ error: "Loja não encontrada." });

    const plan = ownerRes.rows[0].plan;
    if (!PLAN_LIMITS[plan].hasAds) {
      return res.json({ tracked: false, reason: "Este plano não mostra anúncios." });
    }

    const revenueCents = Math.round(RATE_CENTS_PER_IMPRESSION);
    await db.query(
      "INSERT INTO ad_events (store_id, impressions, revenue_cents) VALUES ($1, 1, $2)",
      [storeId, revenueCents]
    );
    res.json({ tracked: true });
  } catch (e) {
    next(e);
  }
});

// Estatísticas agregadas de todas as lojas do utilizador autenticado
router.get("/ads/stats", requireAuth, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(ae.impressions), 0)::int AS impressions,
              COALESCE(SUM(ae.revenue_cents), 0)::int AS revenue_cents
       FROM ad_events ae
       JOIN stores s ON s.id = ae.store_id
       WHERE s.owner_id = $1`,
      [req.userId]
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
