import { json, getClientIp, hashToken, secureCompare } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SHEGCOMTECH_DB) {
    return json({ error: "Admin authentication is not configured yet." }, 503);
  }
  const ip = getClientIp(request);
  const now = Math.floor(Date.now() / 1000);
  const attempt = await env.SHEGCOMTECH_DB.prepare(
    "SELECT attempts, window_started_at, blocked_until FROM admin_login_attempts WHERE ip = ?"
  ).bind(ip).first();
  if (attempt?.blocked_until && attempt.blocked_until > now) {
    return json({ error: "Too many attempts. Please wait before trying again." }, 429);
  }
  const windowStart = attempt && now - attempt.window_started_at < 900 ? attempt.window_started_at : now;
  const attempts = attempt && windowStart === attempt.window_started_at ? attempt.attempts : 0;
  const valid = secureCompare(email, String(env.ADMIN_EMAIL).trim().toLowerCase()) &&
    secureCompare(password, String(env.ADMIN_PASSWORD));
  if (!valid) {
    const nextAttempts = attempts + 1;
    const blockedUntil = nextAttempts >= 5 ? now + 900 : null;
    await env.SHEGCOMTECH_DB.prepare(
      "INSERT INTO admin_login_attempts (ip, attempts, window_started_at, blocked_until) VALUES (?, ?, ?, ?) ON CONFLICT(ip) DO UPDATE SET attempts=excluded.attempts, window_started_at=excluded.window_started_at, blocked_until=excluded.blocked_until"
    ).bind(ip, nextAttempts, windowStart, blockedUntil).run();
    return json({ error: "Email or password is incorrect." }, 401);
  }
  await env.SHEGCOMTECH_DB.prepare("DELETE FROM admin_login_attempts WHERE ip = ?").bind(ip).run();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const tokenHash = await hashToken(token);
  const expiresAt = now + 60 * 60 * 24 * 7;
  await env.SHEGCOMTECH_DB.prepare(
    "INSERT INTO admin_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)"
  ).bind(tokenHash, expiresAt, now).run();
  return new Response(JSON.stringify({ ok: true, email: String(env.ADMIN_EMAIL).trim() }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": `shegcomtech_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 7}`
    }
  });
}
