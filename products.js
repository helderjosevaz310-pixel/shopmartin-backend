const express = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth, requireStoreOwner } = require("../middleware/auth");
const { PLAN_LIMITS } = require("./plans");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res, next) => {
  const db = req.app.get("db");
  try {
    const { rows } = await db.query("SELECT * FROM products WHERE store_id = $1 ORDER BY id", [req.params.storeId]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireAuth,
  requireStoreOwner,
  [
    body("name").trim().isLength({ min: 1, max: 160 }),
    body("price_cents").isInt({ min: 0, max: 100_000_000 }),
    body("image_url").optional({ nullable: true }).isURL().withMessage("URL de imagem inválida"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const db = req.app.get("db");
    const { storeId } = req.params;
    const { name, price_cents, image_url } = req.body;

    try {
      const userRes = await db.query(
        `SELECT u.plan FROM users u JOIN stores s ON s.owner_id = u.id WHERE s.id = $1`,
        [storeId]
      );
      const plan = userRes.rows[0].plan;
      const countRes = await db.query("SELECT COUNT(*)::int AS n FROM products WHERE store_id = $1", [storeId]);

      if (countRes.rows[0].n >= PLAN_LIMITS[plan].maxProducts) {
        return res.status(403).json({ error: `Limite de produtos do plano ${plan} atingido. Faz upgrade para continuar.` });
      }

      const { rows } = await db.query(
        `INSERT INTO products (store_id, name, price_cents, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
        [storeId, name, price_cents, image_url || null]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:productId", requireAuth, requireStoreOwner, async (req, res, next) => {
  const db = req.app.get("db");
  try {
    await db.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [req.params.productId, req.params.storeId]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
