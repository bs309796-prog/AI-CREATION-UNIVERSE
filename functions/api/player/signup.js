import {
  json,
  createSalt,
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

    const displayName = String(body.displayName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const gamingUsername = String(body.gamingUsername || "").trim();
    const gameName = String(body.gameName || "").trim();
    const mobileNumber = String(body.mobileNumber || "").trim();

    if (!displayName || !email || !password) {
      return json({
        success: false,
        error: "Name, email and password are required."
      }, 400);
    }

    if (displayName.length > 100 || email.length > 254 ||
        gamingUsername.length > 50 || gameName.length > 80 ||
        mobileNumber.length > 20) {
      return json({ success: false, error: "Input is too long." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: "Invalid email address." }, 400);
    }

    if (password.length < 8 || password.length > 128) {
      return json({
        success: false,
        error: "Password must be 8 to 128 characters."
      }, 400);
    }

    const salt = createSalt();
    const passwordSalt = btoa(String.fromCharCode(...salt));
    const passwordHash = await hashPassword(password, salt);

    const result = await env.DB.prepare(`
      INSERT INTO players
      (display_name, email, password_hash, password_salt,
       gaming_username, game_name, mobile_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      displayName,
      email,
      passwordHash,
      passwordSalt,
      gamingUsername || null,
      gameName || null,
      mobileNumber || null
    ).run();

    const playerId = result.meta.last_row_id;
    const cookie = await createSession(env.DB, playerId);

    const player = await env.DB.prepare(`
      SELECT * FROM players WHERE id = ?
    `).bind(playerId).first();

    return json({
      success: true,
      message: "Account created successfully.",
      player: publicPlayer(player)
    }, 201, cookie);

  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("unique")) {
      return json({
        success: false,
        error: "This email is already registered."
      }, 409);
    }

    return json({
      success: false,
      error: "Signup failed. Please try again."
    }, 500);
  }
}
