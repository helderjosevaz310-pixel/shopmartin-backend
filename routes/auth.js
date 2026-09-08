
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 1, max: 120 }).withMessage("Nome obrigatório"),
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 8 }).withMessage("A password precisa de pelo menos 8 caracteres"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const db = req.app.get("db");
    const { name, email, password, ref } = req.body;

    try {
      const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Já existe uma conta com este email." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const affiliateCode = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + crypto.randomBytes(3).toString("hex");

      let referredBy = null;
      if (ref) {
        const refUser = await db.query("SELECT affiliate_code FROM users WHERE affiliate_code = $1", [ref]);
        if (refUser.rows.length > 0) referredBy = ref;
      }

      const { rows } = await db.query(
        `INSERT INTO users (name, email, password_hash, affiliate_code, referred_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, plan, affiliate_code, trial_ends_at`,
        [name, email, passwordHash, affiliateCode, referredBy]
      );

      const user = rows[0];
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      res.status(201).json({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Credenciais inválidas." });

    const db = req.app.get("db");
    const { email, password } = req.body;

    try {
      const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "Email ou password incorretos." });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Email ou password incorretos." });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      delete user.password_hash;
      res.json({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;