import { json, requireAdmin } from "../_lib.js";
export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "Authentication required." }, 401);
  if (!env.PRODUCT_IMAGES) return json({ error: "R2 binding PRODUCT_IMAGES is missing." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const keys = Array.isArray(body.keys) ? body.keys : [];
  if (keys.length > 20 || keys.some(key => typeof key !== "string" || !/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(key))) return json({ error: "Invalid image key." }, 400);
  await Promise.all(keys.map(key => env.PRODUCT_IMAGES.delete(key)));
  return json({ ok: true }, 200, { "Cache-Control": "no-store" });
}
