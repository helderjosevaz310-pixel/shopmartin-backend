const express = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { PLAN_LIMITS } = require("./plans");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const { rows } = await db.query(
      "SELECT id, name, email, plan, affiliate_code FROM users WHERE id = $1",
      [req.userId]
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ⚠️ ATENÇÃO: esta rota muda o plano diretamente, sem cobrar nada.
// É só para testares o fluxo enquanto não ligas a Stripe. Antes de publicares
// a app a sério, substitui isto por um Checkout da Stripe + webhook que só
// atualiza o plano depois de um pagamento confirmado — caso contrário
// qualquer pessoa pode "mudar de plano" de graça chamando este endpoint.
router.post(
  "/me/plan",
  requireAuth,
  [body("plan").isIn(Object.keys(PLAN_LIMITS)).withMessage("Plano inválido")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const db = req.app.get("db");
    try {
      const { rows } = await db.query(
        "UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, name, email, plan",
        [req.body.plan, req.userId]
      );
      res.json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
