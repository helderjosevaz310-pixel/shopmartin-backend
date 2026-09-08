const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Devolve o código de afiliado do utilizador e quantas pessoas já trouxe
router.get("/me", requireAuth, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const userRes = await db.query("SELECT affiliate_code FROM users WHERE id = $1", [req.userId]);
    const code = userRes.rows[0].affiliate_code;

    const referred = await db.query(
      `SELECT u.id, u.name, u.plan, u.created_at,
              EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active') AS is_paying
       FROM users u WHERE u.referred_by = $1 ORDER BY u.created_at DESC`,
      [code]
    );

    const payingCount = referred.rows.filter((r) => r.is_paying).length;

    res.json({
      code,
      referralLink: `https://shopmartin.app/registar?ref=${code}`,
      totalReferred: referred.rows.length,
      payingReferred: payingCount,
      // Comissão simulada: 30% no 1º mês, 10% recorrente — o cálculo real acontece
      // no webhook da Stripe quando um pagamento é confirmado (ver billing.js)
      referred: referred.rows.map((r) => ({ name: r.name, plan: r.plan, isPaying: r.is_paying, since: r.created_at })),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
