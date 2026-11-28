
function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function verifyAdmin(request, secret) {
  if (!secret) return false;

  try {
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
  } catch {
    return false;
  }
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
      return response({ success: false, error: "Unauthorized." }, 401);
    }

    if (!env.DB) {
      return response({ success: false, error: "Database unavailable." }, 500);
    }

    const result = await env.DB.prepare(`
      SELECT *
      FROM (
        SELECT
          tp.id AS id,
          'tournament_players' AS source,
          tp.tournament_id AS tournament_id,
          p.display_name AS player_name,
          p.email AS email,
          p.gaming_username AS gaming_username,
          p.game_name AS game_name,
          p.mobile_number AS mobile_number,
          tp.registration_status AS registration_status,
          NULL AS created_at,
          COALESCE(t.title, 'Deleted Tournament') AS tournament_title
        FROM tournament_players tp
        JOIN players p ON p.id = tp.player_id
        LEFT JOIN tournaments t ON t.id = tp.tournament_id

        UNION ALL

        SELECT
          tr.id AS id,
          'legacy' AS source,
          NULL AS tournament_id,
          tr.player_name AS player_name,
          tr.email AS email,
          tr.gaming_username AS gaming_username,
          tr.game_name AS game_name,
          tr.mobile_number AS mobile_number,
          tr.registration_status AS registration_status,
          tr.created_at AS created_at,
          'Legacy Registration' AS tournament_title
        FROM tournament_registrations tr
      )
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
      return response({ success: false, error: "Unauthorized." }, 401);
    }

    if (!env.DB) {
      return response({ success: false, error: "Database unavailable." }, 500);
    }

    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || "");
    const source = String(body.source || "legacy");

    if (!Number.isSafeInteger(id) || id < 1) {
      return response({ success: false, error: "Invalid registration ID." }, 400);
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return response({ success: false, error: "Invalid registration status." }, 400);
    }

    if (!["legacy", "tournament_players"].includes(source)) {
      return response({ success: false, error: "Invalid registration source." }, 400);
    }

    const table = source === "tournament_players"
      ? "tournament_players"
      : "tournament_registrations";

    const result = await env.DB.prepare(`
      UPDATE ${table}
      SET registration_status = ?
      WHERE id = ?
    `).bind(status, id).run();

    if (!result.meta.changes) {
      return response({ success: false, error: "Registration not found." }, 404);
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
