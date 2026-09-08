-- ShopMartin - esquema da base de dados (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'starter', -- starter | growth | pro
  stripe_customer_id VARCHAR(120),
  affiliate_code VARCHAR(40) UNIQUE,
  referred_by VARCHAR(40), -- affiliate_code de quem os trouxe
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) UNIQUE NOT NULL,
  niche VARCHAR(40) NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL,
  stripe_subscription_id VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | canceled | past_due
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_events (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  impressions INTEGER NOT NULL DEFAULT 1,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_store ON ad_events(store_id);
