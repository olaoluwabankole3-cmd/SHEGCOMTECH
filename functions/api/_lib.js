const CATEGORIES = new Set(["Laptops","Monitors","Phones","CCTV & security","Gaming","Appliances","Networking","Printers & supplies","Accessories"]);
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", ...extra } });
}
export function getClientIp(request) { return request.headers.get("CF-Connecting-IP") || "unknown"; }
export async function hashToken(token) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function secureCompare(a, b) {
  const left = new TextEncoder().encode(String(a));
  const right = new TextEncoder().encode(String(b));
  let diff = left.length ^ right.length;
  const size = Math.max(left.length, right.length);
  for (let i = 0; i < size; i++) diff |= (left[i % (left.length || 1)] || 0) ^ (right[i % (right.length || 1)] || 0);
  return diff === 0;
}
export async function requireAdmin(request, env) {
  if (!env.SHEGCOMTECH_DB) return null;
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.match(/(?:^|;\s*)shegcomtech_admin=([^;]+)/)?.[1];
  if (!token) return null;
  const hash = await hashToken(token);
  const now = Math.floor(Date.now() / 1000);
  const session = await env.SHEGCOMTECH_DB.prepare("SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ?").bind(hash).first();
  if (!session || session.expires_at <= now) {
    if (session) await env.SHEGCOMTECH_DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  return { email: String(env.ADMIN_EMAIL || "") };
}
export function validateProduct(input) {
  if (!input || typeof input !== "object") return null;
  const name = String(input.name || "").trim();
  const category = String(input.category || "");
  const slug = String(input.slug || name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  const price = input.price_ngn == null || input.price_ngn === "" ? null : Number(input.price_ngn);
  const compare = input.compare_at_price_ngn == null || input.compare_at_price_ngn === "" ? null : Number(input.compare_at_price_ngn);
  const stock = Number(input.stock_quantity ?? 0);
  if (name.length < 2 || name.length > 160 || !slug || slug.length > 160 || !CATEGORIES.has(category)) return null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) return null;
  if (compare !== null && (!Number.isFinite(compare) || compare < 0)) return null;
  if (!Number.isInteger(stock) || stock < 0) return null;
  const textOrNull = (v, max) => { if (v == null || v === "") return null; const s = String(v).trim(); return s.length <= max ? s : null; };
  const sku = textOrNull(input.sku, 100), brand = textOrNull(input.brand, 120), description = textOrNull(input.description, 500), badge = textOrNull(input.badge, 24);
  if (input.sku && sku === null || input.brand && brand === null || input.description && description === null || input.badge && badge === null) return null;
  return { name, slug, sku, brand, category, description, price_ngn: price, compare_at_price_ngn: compare, stock_quantity: stock, image_url: textOrNull(input.image_url, 2000), image_path: textOrNull(input.image_path, 500), badge, is_featured: input.is_featured ? 1 : 0, is_active: input.is_active ? 1 : 0 };
}
