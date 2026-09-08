const express = require("express");
const router = express.Router();

// Fonte única da verdade para os limites de cada plano — usada por stores.js e products.js
// para validar no servidor (nunca confiar apenas no que o cliente envia).
const PLAN_LIMITS = {
  starter: { maxStores: 1, maxProducts: 5, priceCents: 900, hasAds: true },
  growth: { maxStores: 1, maxProducts: Infinity, priceCents: 2900, hasAds: false },
  pro: { maxStores: Infinity, maxProducts: Infinity, priceCents: 5900, hasAds: false },
};

router.get("/", (req, res) => {
  res.json(
    Object.entries(PLAN_LIMITS).map(([id, limits]) => ({
      id,
      priceCents: limits.priceCents,
      maxStores: limits.maxStores === Infinity ? null : limits.maxStores,
      maxProducts: limits.maxProducts === Infinity ? null : limits.maxProducts,
      hasAds: limits.hasAds,
    }))
  );
});

module.exports = router;
module.exports.PLAN_LIMITS = PLAN_LIMITS;
