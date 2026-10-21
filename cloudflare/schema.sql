-- SHEGCOMTECH: Cloudflare D1 schema (SQLite-compatible SQL)
-- Run this in the SQL Console for the shegcomtech-db database.
-- This creates empty tables only; it does not insert product data.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  brand TEXT,
  category TEXT NOT NULL CHECK (
    category IN (
      'Laptops',
      'Monitors',
      'Phones',
      'CCTV & security',
      'Gaming',
      'Appliances',
      'Networking',
      'Printers & supplies',
      'Accessories'
    )
  ),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  price_ngn REAL CHECK (price_ngn IS NULL OR price_ngn >= 0),
  compare_at_price_ngn REAL CHECK (compare_at_price_ngn IS NULL OR compare_at_price_ngn >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  image_path TEXT,
  badge TEXT CHECK (badge IS NULL OR length(badge) <= 24),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS products_public_sort_idx
  ON products (is_active, is_featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS products_category_idx
  ON products (category);

CREATE INDEX IF NOT EXISTS products_updated_idx
  ON products (updated_at DESC);

-- Only hashed session tokens are stored in this table.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx
  ON admin_sessions (expires_at);

-- Rate-limit repeated failed admin sign-in attempts by client IP.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER
);
