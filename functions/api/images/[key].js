import { json } from "../_lib.js";
export async function onRequestGet({ params, env }) {
  if (!env.PRODUCT_IMAGES) return json({ error: "Image storage is not configured." }, 503);
  const key = String(params.key || "");
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(key)) return json({ error: "Image not found." }, 404);
  const object = await env.PRODUCT_IMAGES.get(key);
  if (!object) return json({ error: "Image not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
