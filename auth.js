const jwt = require("jsonwebtoken");

// Verifica o token JWT enviado no cabeçalho Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sessão não encontrada. Inicia sessão novamente." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

// Confirma que o utilizador autenticado é o dono da loja pedida
async function requireStoreOwner(req, res, next) {
  const db = req.app.get("db");
  const { storeId } = req.params;
  const { rows } = await db.query("SELECT owner_id FROM stores WHERE id = $1", [storeId]);
  if (rows.length === 0) return res.status(404).json({ error: "Loja não encontrada." });
  if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: "Sem permissão para esta loja." });
  next();
}

module.exports = { requireAuth, requireStoreOwner };
