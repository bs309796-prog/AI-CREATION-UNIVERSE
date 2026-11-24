
function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function verifyAdmin(request, secret) {
  if (!secret) return false;

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)acu_admin_session=([^;]+)/);

  if (!match) return false;

  const parts = match[1].split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const expected = btoa(
    String.fromCharCode(...new Uint8Array(signed))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  if (signature !== expected) return false;

  const session = JSON.parse(
    new TextDecoder().decode(decodeBase64Url(payload))
  );

  return Boolean(
    session.exp &&
    session.exp >= Math.floor(Date.now() / 1000)
  );
}

function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!(await verifyAdmin(request, env.ADMIN_PASSWORD))) {
      return response(
        { success: false, error: "Unauthorized." },
        401
      );
    }

    if (!env.DB) {
      return response(
        { success: false, error: "Database unavailable." },
        500
      );
    }

    const result = await env.DB.prepare(`
      SELECT id, player_name, email, gaming_username,
             game_name, mobile_number, registration_status, created_at
      FROM tournament_registrations
      ORDER BY id DESC
      LIMIT 500
    `).all();

    return response({
      success: true,
      registrations: result.results || []
    });
  } catch {
    return response(
      { success: false, error: "Could not load registrations." },
      500
    );
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    if (!(await verifyAdmin(request, env.ADMIN_PASSWORD))) {
      return response(
        { success: false, error: "Unauthorized." },
        401
      );
    }

    if (!env.DB) {
      return response(
        { success: false, error: "Database unavailable." },
        500
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || "");

    if (!Number.isSafeInteger(id) || id < 1) {
      return response(
        { success: false, error: "Invalid registration ID." },
        400
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return response(
        { success: false, error: "Invalid registration status." },
        400
      );
    }

    const result = await env.DB.prepare(`
      UPDATE tournament_registrations
      SET registration_status = ?
      WHERE id = ?
    `).bind(status, id).run();

    if (!result.meta.changes) {
      return response(
        { success: false, error: "Registration not found." },
        404
      );
    }

    return response({
      success: true,
      message: "Registration status updated."
    });
  } catch {
    return response(
      { success: false, error: "Could not update registration." },
      500
    );
  }
}
