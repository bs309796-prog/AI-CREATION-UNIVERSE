import {
  json,
  hashPassword,
  createSession,
  publicPlayer
} from "./_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({ success: false, error: "Database unavailable." }, 500);
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json({
        success: false,
        error: "Email and password are required."
      }, 400);
    }

    const player = await env.DB.prepare(`
      SELECT * FROM players WHERE email = ? LIMIT 1
    `).bind(email).first();

    if (!player || player.account_status !== "active") {
      return json({ success: false, error: "Invalid email or password." }, 401);
    }

    const salt = Uint8Array.from(
      atob(player.password_salt),
      character => character.charCodeAt(0)
    );

    const calculatedHash = await hashPassword(password, salt);

    if (calculatedHash !== player.password_hash) {
      return json({ success: false, error: "Invalid email or password." }, 401);
    }

    const cookie = await createSession(env.DB, player.id);

    return json({
      success: true,
      message: "Login successful.",
      player: publicPlayer(player)
    }, 200, cookie);

  } catch {
    return json({
      success: false,
      error: "Login failed. Please try again."
    }, 500);
  }
}
