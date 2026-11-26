import {
  json,
  getPlayer,
  publicPlayer
} from "./_auth.js";

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return json({ success: false, error: "Database unavailable." }, 500);
    }

    const player = await getPlayer(request, env.DB);

    if (!player) {
      return json({
        success: false,
        error: "Please login first."
      }, 401);
    }

    return json({
      success: true,
      player: publicPlayer(player)
    });

  } catch {
    return json({
      success: false,
      error: "Could not load player profile."
    }, 500);
  }
}
