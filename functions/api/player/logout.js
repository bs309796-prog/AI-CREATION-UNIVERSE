import {
  json,
  hashToken,
  clearSessionCookie
} from "./_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    if (env.DB) {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/(?:^|;\s*)acu_player_session=([^;]+)/);

      if (match) {
        const tokenHash = await hashToken(match[1]);

        await env.DB.prepare(`
          DELETE FROM player_sessions WHERE token_hash = ?
        `).bind(tokenHash).run();
      }
    }

    return json({
      success: true,
      message: "Logged out successfully."
    }, 200, clearSessionCookie());

  } catch {
    return json({
      success: false,
      error: "Logout failed."
    }, 500);
  }
}
