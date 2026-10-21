import { json, requireAdmin, validateProduct } from "./_lib.js";

const columns = "id,name,slug,sku,brand,category,description,price_ngn,compare_at_price_ngn,stock_quantity,image_url,image_path,badge,is_featured,is_active,created_at,updated_at";

export async function onRequestGet({ request, env }) {
  if (!env.SHEGCOMTECH_DB) return json({ error: "Database binding SHEGCOMTECH_DB is missing." }, 503);
  const admin = await requireAdmin(request, env);
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get("all") === "1";
  if (includeDrafts && !admin) return json({ error: "Authentication required." }, 401);
  const query = includeDrafts
    ? `SELECT ${columns} FROM products ORDER BY updated_at DESC`
    : `SELECT ${columns} FROM products WHERE is_active = 1 ORDER BY is_featured DESC, created_at DESC`;
  const result = await env.SHEGCOMTECH_DB.prepare(query).all();
  return json(result.results || [], 200, { "Cache-Control": admin ? "no-store" : "public, max-age=60" });
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "Authentication required." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const product = validateProduct(body);
  if (!product) return json({ error: "Please check the product fields and try again." }, 400);
  const id = crypto.randomUUID();
  try {
    await env.SHEGCOMTECH_DB.prepare(`INSERT INTO products (id,name,slug,sku,brand,category,description,price_ngn,compare_at_price_ngn,stock_quantity,image_url,image_path,badge,is_featured,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id, product.name, product.slug, product.sku, product.brand, product.category, product.description, product.price_ngn, product.compare_at_price_ngn, product.stock_quantity, product.image_url, product.image_path, product.badge, product.is_featured, product.is_active).run();
    const row = await env.SHEGCOMTECH_DB.prepare(`SELECT ${columns} FROM products WHERE id = ?`).bind(id).first();
    return json(row, 201, { "Cache-Control": "no-store" });
  } catch (error) {
    return json({ error: error.message?.includes("UNIQUE") ? "That product slug or SKU already exists." : "Could not create product." }, 400);
  }
}
