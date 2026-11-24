
function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signSession(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = new TextEncoder().encode(payload);
  const signature = await crypto.subtle.sign("HMAC", key, data);

  return toBase64Url(new Uint8Array(signature));
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ADMIN_PASSWORD) {
      return Response.json(
        { success: false, error: "Admin password is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const suppliedPassword = String(body.password || "");
    const expected = new TextEncoder().encode(env.ADMIN_PASSWORD);
    const supplied = new TextEncoder().encode(suppliedPassword);

    let difference = expected.length ^ supplied.length;
    const length = Math.max(expected.length, supplied.length);

    for (let i = 0; i < length; i++) {
      difference |= (expected[i] || 0) ^ (supplied[i] || 0);
    }

    if (difference !== 0) {
      return Response.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const payload = toBase64Url(
      new TextEncoder().encode(JSON.stringify({ exp: expiresAt }))
    );

    const signature = await signSession(payload, env.ADMIN_PASSWORD);
    const token = `${payload}.${signature}`;

    return Response.json(
      { success: true, message: "Admin login successful." },
      {
        headers: {
          "Set-Cookie": `acu_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=3600`
        }
      }
    );
  } catch {
    return Response.json(
      { success: false, error: "Login request failed." },
      { status: 400 }
    );
  }
}
