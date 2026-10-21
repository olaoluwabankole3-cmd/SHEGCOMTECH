import { json, requireAdmin } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ authenticated: false }, 401);
  return json({ authenticated: true, email: String(env.ADMIN_EMAIL || "") }, 200, { "Cache-Control": "no-store" });
}

export async function onRequestDelete({ request, env }) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.match(/(?:^|;\\s*)shegcomtech_admin=([^;]+)/)?.[1];
  if (token && env.SHEGCOMTECH_DB) {
    const { hashToken } = await import("../_lib.js");
    await env.SHEGCOMTECH_DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "shegcomtech_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    }
  });
}
