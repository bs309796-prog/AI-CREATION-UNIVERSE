
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

  try {
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

async function authorize(request, env) {
  if (!(await verifyAdmin(request, env.ADMIN_PASSWORD))) {
    return response(
      { success: false, error: "Admin login required." },
      401
    );
  }

  if (!env.DB) {
    return response(
      { success: false, error: "Database unavailable." },
      500
    );
  }

  return null;
}

const validStatuses = [
  "scheduled",
  "live",
  "completed",
  "cancelled"
];

// GET: List all matches
export async function onRequestGet({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const result = await env.DB.prepare(`
      SELECT
        m.*,
        t.title AS tournament_title,
        t.game_name,
        COUNT(mr.id) AS results_count,
        SUM(
          CASE WHEN mr.is_verified = 1 THEN 1 ELSE 0 END
        ) AS verified_results_count
      FROM matches m
      INNER JOIN tournaments t
        ON t.id = m.tournament_id
      LEFT JOIN match_results mr
        ON mr.match_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT 300
    `).all();

    return response({
      success: true,
      matches: result.results || []
    });
  } catch {
    return response(
      { success: false, error: "Could not load matches." },
      500
    );
  }
}

// POST: Create a match
export async function onRequestPost({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const body = await request.json();

    const tournamentId = Number(body.tournamentId);
    const matchNumber = Number(body.matchNumber ?? 1);

    const roundName = body.roundName
      ? String(body.roundName).trim()
      : null;

    const scheduledAt = body.scheduledAt
      ? String(body.scheduledAt).trim()
      : null;

    const roomId = body.roomId
      ? String(body.roomId).trim()
      : null;

    const matchStatus = String(
      body.matchStatus || "scheduled"
    ).toLowerCase();

    if (!Number.isSafeInteger(tournamentId) || tournamentId < 1) {
      return response(
        { success: false, error: "Valid tournament is required." },
        400
      );
    }

    if (
      !Number.isSafeInteger(matchNumber) ||
      matchNumber < 1 ||
      matchNumber > 100000
    ) {
      return response(
        { success: false, error: "Invalid match number." },
        400
      );
    }

    if (roundName && roundName.length > 100) {
      return response(
        { success: false, error: "Round name is too long." },
        400
      );
    }

    if (roomId && roomId.length > 150) {
      return response(
        { success: false, error: "Room ID is too long." },
        400
      );
    }

    if (scheduledAt && Number.isNaN(Date.parse(scheduledAt))) {
      return response(
        { success: false, error: "Invalid scheduled date." },
        400
      );
    }

    if (!validStatuses.includes(matchStatus)) {
      return response(
        { success: false, error: "Invalid match status." },
        400
      );
    }

    const tournament = await env.DB.prepare(`
      SELECT id, title
      FROM tournaments
      WHERE id = ?
      LIMIT 1
    `).bind(tournamentId).first();

    if (!tournament) {
      return response(
        { success: false, error: "Tournament not found." },
        404
      );
    }

    const result = await env.DB.prepare(`
      INSERT INTO matches (
        tournament_id,
        round_name,
        match_number,
        scheduled_at,
        match_status,
        room_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tournamentId,
      roundName,
      matchNumber,
      scheduledAt,
      matchStatus,
      roomId
    ).run();

    const matchId = result.meta.last_row_id;

    try {
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (
          action,
          target_type,
          target_id,
          details
        )
        VALUES (?, 'match', ?, ?)
      `).bind(
        "match_created",
        matchId,
        JSON.stringify({
          tournamentId,
          tournamentTitle: tournament.title,
          roundName,
          matchNumber
        })
      ).run();
    } catch {
      // Audit failure does not undo match creation.
    }

    return response({
      success: true,
      message: "Match created successfully.",
      matchId
    }, 201);

  } catch {
    return response(
      { success: false, error: "Could not create match." },
      500
    );
  }
}
