
const SESSION_DAYS = 7;
const PASSWORD_ITERATIONS = 210000;

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers });
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );

  return toBase64Url(new Uint8Array(bits));
}

export function createSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function createSession(db, playerId) {
  const token = randomToken();
  const tokenHash = await hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await db.prepare(`
    INSERT INTO player_sessions (player_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).bind(playerId, tokenHash, expiresAt).run();

  return {
    "Set-Cookie":
      `acu_player_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=${SESSION_DAYS * 86400}`
  };
}

export async function getPlayer(request, db) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)acu_player_session=([^;]+)/);

  if (!match) return null;

  const tokenHash = await hashToken(match[1]);

  const result = await db.prepare(`
    SELECT
      p.id,
      p.display_name,
      p.email,
      p.gaming_username,
      p.game_name,
      p.mobile_number,
      p.avatar_url,
      p.bio,
      p.account_status
    FROM player_sessions s
    JOIN players p ON p.id = s.player_id
    WHERE s.token_hash = ?
      AND s.expires_at > ?
      AND p.account_status = 'active'
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();

  return result || null;
}

export function clearSessionCookie() {
  return {
    "Set-Cookie":
      "acu_player_session=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0"
  };
}

export function publicPlayer(player) {
  return {
    id: player.id,
    displayName: player.display_name,
    email: player.email,
    gamingUsername: player.gaming_username,
    gameName: player.game_name,
    mobileNumber: player.mobile_number,
    avatarUrl: player.avatar_url,
    bio: player.bio
  };
}
