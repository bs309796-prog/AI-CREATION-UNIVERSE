
function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function signSession(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.ADMIN_PASSWORD) {
      return Response.json({ success: false }, { status: 500 });
    }

    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)acu_admin_session=([^;]+)/);

    if (!match) {
      return Response.json({ success: false, error: "Not logged in." }, { status: 401 });
    }

    const parts = match[1].split(".");
    if (parts.length !== 2) {
      return Response.json({ success: false }, { status: 401 });
    }

    const [payload, signature] = parts;
    const expected = await signSession(payload, env.ADMIN_PASSWORD);

    if (signature !== expected) {
      return Response.json({ success: false }, { status: 401 });
    }

    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));

    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) {
      return Response.json({ success: false, error: "Session expired." }, { status: 401 });
    }

    return Response.json({ success: true, message: "Admin session valid." });
  } catch {
    return Response.json({ success: false, error: "Verification failed." }, { status: 401 });
  }
}
