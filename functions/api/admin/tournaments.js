
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
      { success: false, error: "Unauthorized. Admin login required." },
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

function validText(value, maxLength) {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength;
}

function validOptionalMoney(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

async function addAuditLog(db, action, targetId, details) {
  try {
    await db.prepare(`
      INSERT INTO admin_audit_logs
        (action, target_type, target_id, details)
      VALUES (?, 'tournament', ?, ?)
    `).bind(action, targetId, JSON.stringify(details || {})).run();
  } catch {
    // Audit logging failure must not undo the main operation.
  }
}

// GET: Admin tournament list
export async function onRequestGet({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const result = await env.DB.prepare(`
      SELECT
        t.*,
        COUNT(
          CASE WHEN tp.registration_status != 'rejected'
          THEN tp.id END
        ) AS registered_players
      FROM tournaments t
      LEFT JOIN tournament_players tp
        ON tp.tournament_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 200
    `).all();

    return response({
      success: true,
      tournaments: result.results || []
    });
  } catch {
    return response(
      { success: false, error: "Could not load tournaments." },
      500
    );
  }
}

// POST: Create tournament
export async function onRequestPost({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const body = await request.json();

    const title = String(body.title || "").trim();
    const gameName = String(body.gameName || "").trim();
    const gameMode = String(body.gameMode || "solo").toLowerCase();
    const description = String(body.description || "").trim();

    const entryFeePaise = body.entryFeePaise ?? 0;
    const prizePoolPaise = body.prizePoolPaise ?? 0;
    const maxParticipants = body.maxParticipants ?? 100;

    const startsAt = body.startsAt
      ? String(body.startsAt).trim()
      : null;

    if (!validText(title, 120)) {
      return response(
        { success: false, error: "Tournament title is required (maximum 120 characters)." },
        400
      );
    }

    if (!validText(gameName, 80)) {
      return response(
        { success: false, error: "Game name is required (maximum 80 characters)." },
        400
      );
    }

    if (!["solo", "duo", "squad"].includes(gameMode)) {
      return response(
        { success: false, error: "Game mode must be solo, duo or squad." },
        400
      );
    }

    if (!validOptionalMoney(entryFeePaise) ||
        !validOptionalMoney(prizePoolPaise)) {
      return response(
        { success: false, error: "Entry fee and prize pool must be non-negative integer paise values." },
        400
      );
    }

    if (!Number.isSafeInteger(maxParticipants) ||
        maxParticipants < 1 ||
        maxParticipants > 10000) {
      return response(
        { success: false, error: "Maximum participants must be between 1 and 10000." },
        400
      );
    }

    if (description.length > 5000) {
      return response(
        { success: false, error: "Description is too long." },
        400
      );
    }

    if (startsAt && Number.isNaN(Date.parse(startsAt))) {
      return response(
        { success: false, error: "Invalid tournament start date." },
        400
      );
    }

    const result = await env.DB.prepare(`
      INSERT INTO tournaments (
        title,
        game_name,
        game_mode,
        description,
        entry_fee_paise,
        prize_pool_paise,
        max_participants,
        starts_at,
        registration_status,
        tournament_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', 'upcoming')
    `).bind(
      title,
      gameName,
      gameMode,
      description,
      entryFeePaise,
      prizePoolPaise,
      maxParticipants,
      startsAt
    ).run();

    const tournamentId = result.meta.last_row_id;

    await addAuditLog(
      env.DB,
      "tournament_created",
      tournamentId,
      { title, gameName, gameMode }
    );

    return response({
      success: true,
      message: "Tournament created successfully.",
      tournamentId
    }, 201);

  } catch {
    return response(
      { success: false, error: "Could not create tournament." },
      500
    );
  }
}

// PATCH: Update tournament
export async function onRequestPatch({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return response(
        { success: false, error: "Valid tournament ID is required." },
        400
      );
    }

    const fields = [];
    const values = [];

    const textFields = {
      title: { column: "title", max: 120 },
      gameName: { column: "game_name", max: 80 },
      description: { column: "description", max: 5000 }
    };

    for (const [key, config] of Object.entries(textFields)) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        const value = String(body[key] ?? "").trim();

        if (key !== "description" && !validText(value, config.max)) {
          return response(
            { success: false, error: `Invalid ${key}.` },
            400
          );
        }

        if (value.length > config.max) {
          return response(
            { success: false, error: `${key} is too long.` },
            400
          );
        }

        fields.push(`${config.column} = ?`);
        values.push(value);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "gameMode")) {
      const mode = String(body.gameMode).toLowerCase();

      if (!["solo", "duo", "squad"].includes(mode)) {
        return response(
          { success: false, error: "Invalid game mode." },
          400
        );
      }

      fields.push("game_mode = ?");
      values.push(mode);
    }

    const moneyFields = {
      entryFeePaise: "entry_fee_paise",
      prizePoolPaise: "prize_pool_paise"
    };

    for (const [key, column] of Object.entries(moneyFields)) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (!validOptionalMoney(body[key])) {
          return response(
            { success: false, error: `Invalid ${key}.` },
            400
          );
        }

        fields.push(`${column} = ?`);
        values.push(body[key]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "maxParticipants")) {
      const maximum = body.maxParticipants;

      if (!Number.isSafeInteger(maximum) ||
          maximum < 1 ||
          maximum > 10000) {
        return response(
          { success: false, error: "Invalid maximum participants." },
          400
        );
      }

      fields.push("max_participants = ?");
      values.push(maximum);
    }

    if (Object.prototype.hasOwnProperty.call(body, "startsAt")) {
      const date = body.startsAt
        ? String(body.startsAt).trim()
        : null;

      if (date && Number.isNaN(Date.parse(date))) {
        return response(
          { success: false, error: "Invalid start date." },
          400
        );
      }

      fields.push("starts_at = ?");
      values.push(date);
    }

    if (Object.prototype.hasOwnProperty.call(body, "registrationStatus")) {
      const status = String(body.registrationStatus);

      if (!["open", "closed"].includes(status)) {
        return response(
          { success: false, error: "Registration status must be open or closed." },
          400
        );
      }

      fields.push("registration_status = ?");
      values.push(status);
    }

    if (Object.prototype.hasOwnProperty.call(body, "tournamentStatus")) {
      const status = String(body.tournamentStatus);

      if (!["upcoming", "live", "completed", "cancelled"].includes(status)) {
        return response(
          { success: false, error: "Invalid tournament status." },
          400
        );
      }

      fields.push("tournament_status = ?");
      values.push(status);
    }

    if (fields.length === 0) {
      return response(
        { success: false, error: "No valid fields provided to update." },
        400
      );
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await env.DB.prepare(`
      UPDATE tournaments
      SET ${fields.join(", ")}
      WHERE id = ?
    `).bind(...values).run();

    if (!result.meta.changes) {
      return response(
        { success: false, error: "Tournament not found." },
        404
      );
    }

    await addAuditLog(
      env.DB,
      "tournament_updated",
      id,
      { updatedFields: Object.keys(body) }
    );

    return response({
      success: true,
      message: "Tournament updated successfully."
    });

  } catch {
    return response(
      { success: false, error: "Could not update tournament." },
      500
    );
  }
}

// DELETE: Permanently delete tournament
export async function onRequestDelete({ request, env }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return response(
        { success: false, error: "Valid tournament ID is required." },
        400
      );
    }

    const existing = await env.DB.prepare(`
      SELECT id, title
      FROM tournaments
      WHERE id = ?
      LIMIT 1
    `).bind(id).first();

    if (!existing) {
      return response(
        { success: false, error: "Tournament not found." },
        404
      );
    }

    await addAuditLog(
      env.DB,
      "tournament_deleted",
      id,
      { title: existing.title }
    );

    await env.DB.prepare(`
      DELETE FROM tournaments
      WHERE id = ?
    `).bind(id).run();

    return response({
      success: true,
      message: "Tournament deleted successfully."
    });

  } catch {
    return response(
      { success: false, error: "Could not delete tournament." },
      500
    );
  }
}
