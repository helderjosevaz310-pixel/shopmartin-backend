const express = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth, requireStoreOwner } = require("../middleware/auth");
const { PLAN_LIMITS } = require("./plans");

const router = express.Router({ mergeParams: true });

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Listar lojas de exemplo (públicas) + as do utilizador autenticado, se houver token
router.get("/", async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const { rows } = await db.query("SELECT * FROM stores WHERE is_demo = true ORDER BY id");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const { rows } = await db.query("SELECT * FROM stores WHERE owner_id = $1 ORDER BY id DESC", [req.userId]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireAuth,
  [
    body("name").trim().isLength({ min: 1, max: 120 }),
    body("niche").trim().isLength({ min: 1, max: 40 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Dados inválidos." });

    const db = req.app.get("db");
    const { name, niche } = req.body;

    try {
      // Aplica o limite de lojas do plano do utilizador — validado no servidor, não confia no cliente
      const userRes = await db.query("SELECT plan FROM users WHERE id = $1", [req.userId]);
      const plan = userRes.rows[0].plan;
      const countRes = await db.query("SELECT COUNT(*)::int AS n FROM stores WHERE owner_id = $1", [req.userId]);

      if (countRes.rows[0].n >= PLAN_LIMITS[plan].maxStores) {
        return res.status(403).json({ error: `Limite de lojas do plano ${plan} atingido. Faz upgrade para continuar.` });
      }

      const slug = slugify(name) + "-" + Math.floor(Math.random() * 9000 + 1000);
      const { rows } = await db.query(
        `INSERT INTO stores (owner_id, name, slug, niche) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.userId, name, slug, niche]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:storeId", requireAuth, requireStoreOwner, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    await db.query("DELETE FROM stores WHERE id = $1", [req.params.storeId]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
