import { json, requireAdmin, validateProduct } from "../_lib.js";

const columns = "id,name,slug,sku,brand,category,description,price_ngn,compare_at_price_ngn,stock_quantity,image_url,image_path,badge,is_featured,is_active,created_at,updated_at";

export async function onRequestPatch({ request, env, params }) {
  if (!await requireAdmin(request, env)) return json({ error: "Authentication required." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const current = await env.SHEGCOMTECH_DB.prepare(`SELECT ${columns} FROM products WHERE id = ?`).bind(params.id).first();
  if (!current) return json({ error: "Product not found." }, 404);
  const product = validateProduct({ ...current, ...body });
  if (!product) return json({ error: "Please check the product fields and try again." }, 400);
  try {
    await env.SHEGCOMTECH_DB.prepare("UPDATE products SET name=?,slug=?,sku=?,brand=?,category=?,description=?,price_ngn=?,compare_at_price_ngn=?,stock_quantity=?,image_url=?,image_path=?,badge=?,is_featured=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(product.name, product.slug, product.sku, product.brand, product.category, product.description, product.price_ngn, product.compare_at_price_ngn, product.stock_quantity, product.image_url, product.image_path, product.badge, product.is_featured, product.is_active, params.id).run();
    return json(await env.SHEGCOMTECH_DB.prepare(`SELECT ${columns} FROM products WHERE id = ?`).bind(params.id).first(), 200, { "Cache-Control": "no-store" });
  } catch (error) {
    return json({ error: error.message?.includes("UNIQUE") ? "That product slug or SKU already exists." : "Could not update product." }, 400);
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return json({ error: "Authentication required." }, 401);
  const product = await env.SHEGCOMTECH_DB.prepare("SELECT image_path FROM products WHERE id = ?").bind(params.id).first();
  if (!product) return json({ error: "Product not found." }, 404);
  await env.SHEGCOMTECH_DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  if (product.image_path && env.PRODUCT_IMAGES) await env.PRODUCT_IMAGES.delete(product.image_path);
  return json({ ok: true }, 200, { "Cache-Control": "no-store" });
}
