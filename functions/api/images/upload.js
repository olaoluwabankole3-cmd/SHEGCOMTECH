import { json, requireAdmin } from "../_lib.js";
const TYPES = new Set(["image/jpeg","image/png","image/webp","image/avif"]);
export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "Authentication required." }, 401);
  if (!env.PRODUCT_IMAGES) return json({ error: "R2 binding PRODUCT_IMAGES is missing." }, 503);
  const type = request.headers.get("Content-Type") || "";
  if (!TYPES.has(type)) return json({ error: "Use a JPG, PNG, WebP or AVIF image." }, 415);
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > 5 * 1024 * 1024) return json({ error: "Image must be 5 MB or smaller." }, 413);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) return json({ error: "Image must be between 1 byte and 5 MB." }, 413);
  const ext = ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/avif":"avif" })[type];
  const key = crypto.randomUUID() + "." + ext;
  await env.PRODUCT_IMAGES.put(key, bytes, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ key, url: "/api/images/" + key }, 201, { "Cache-Control": "no-store" });
}
