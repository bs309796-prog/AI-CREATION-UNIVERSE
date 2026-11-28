
const corsHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifyAdmin(request, password) {
  if (!password) return false;

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)acu_admin_session=([^;]+)/);
  if (!match) return false;

  const parts = match[1].split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signed = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload)
    );

    if (base64url(new Uint8Array(signed)) !== signature) return false;

    const decoded = atob(
      payload.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - payload.length % 4) % 4)
    );

    const session = JSON.parse(decoded);
    return Number(session.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function requireAdmin(request, env) {
  return verifyAdmin(request, env.ADMIN_PASSWORD);
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const matchId = new URL(request.url).searchParams.get("match_id");

    if (matchId) {
      const match = await env.DB.prepare(`
        SELECT m.id, m.tournament_id, m.round_name, m.match_number,
               m.match_status, t.title AS tournament_title, t.game_name
        FROM matches m
        JOIN tournaments t ON t.id = m.tournament_id
        WHERE m.id = ?
      `).bind(matchId).first();

      if (!match) return json({ success: false, error: "Match not found" }, 404);

      const results = await env.DB.prepare(`
        SELECT mr.id, mr.match_id, mr.player_id, mr.team_id,
               mr.placement, mr.kills, mr.points, mr.is_verified,
               mr.verified_at, mr.created_at,
               p.display_name, p.gaming_username, p.game_name,
               tm.team_name
        FROM match_results mr
        LEFT JOIN players p ON p.id = mr.player_id
        LEFT JOIN teams tm ON tm.id = mr.team_id
        WHERE mr.match_id = ?
        ORDER BY mr.placement IS NULL, mr.placement ASC, mr.points DESC
      `).bind(matchId).all();

      const participants = await env.DB.prepare(`
        SELECT p.id AS player_id, p.display_name, p.gaming_username,
               p.game_name, 'player' AS participant_type
        FROM tournament_players tp
        JOIN players p ON p.id = tp.player_id
        WHERE tp.tournament_id = ?
          AND LOWER(tp.registration_status) = 'approved'

        UNION

        SELECT tm.id AS player_id, tm.team_name AS display_name,
               tm.invite_code AS gaming_username,
               t.game_name, 'team' AS participant_type
        FROM teams tm
        JOIN tournaments t ON t.id = tm.tournament_id
        WHERE tm.tournament_id = ?
      `).bind(match.tournament_id, match.tournament_id).all();

      const teamMembers = await env.DB.prepare(`
        SELECT tm.team_id, tm.player_id, tm.member_role,
               p.display_name, p.gaming_username
        FROM team_members tm
        JOIN players p ON p.id = tm.player_id
        JOIN teams t ON t.id = tm.team_id
        WHERE t.tournament_id = ?
        ORDER BY tm.team_id, tm.id
      `).bind(match.tournament_id).all();

      return json({
        success: true,
        match,
        results: results.results || [],
        participants: participants.results || [],
        teamMembers: teamMembers.results || []
      });
    }

    const matches = await env.DB.prepare(`
      SELECT m.id, m.tournament_id, m.round_name, m.match_number,
             m.scheduled_at, m.match_status,
             t.title AS tournament_title, t.game_name,
             COUNT(mr.id) AS result_count,
             SUM(CASE WHEN mr.is_verified = 1 THEN 1 ELSE 0 END) AS verified_count
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN match_results mr ON mr.match_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `).all();

    return json({ success: true, matches: matches.results || [] });
  } catch (error) {
    return json({ success: false, error: "Unable to load match results." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json();
    const matchId = Number(body.matchId);
    const playerId = body.playerId == null || body.playerId === "" ? null : Number(body.playerId);
    const teamId = body.teamId == null || body.teamId === "" ? null : Number(body.teamId);
    const placement = body.placement == null || body.placement === "" ? null : Number(body.placement);
    const kills = Number(body.kills ?? 0);
    const points = Number(body.points ?? 0);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return json({ success: false, error: "Valid match is required." }, 400);
    }

    if ((playerId === null) === (teamId === null)) {
      return json({ success: false, error: "Select exactly one player or team." }, 400);
    }

    if (playerId !== null && (!Number.isInteger(playerId) || playerId <= 0)) {
      return json({ success: false, error: "Invalid player." }, 400);
    }

    if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) {
      return json({ success: false, error: "Invalid team." }, 400);
    }

    if (placement !== null && (!Number.isInteger(placement) || placement <= 0)) {
      return json({ success: false, error: "Placement must be a positive integer." }, 400);
    }

    if (!Number.isInteger(kills) || kills < 0 || !Number.isFinite(points) || points < 0) {
      return json({ success: false, error: "Kills and points must be non-negative numbers." }, 400);
    }

    const match = await env.DB.prepare(`
      SELECT id, tournament_id FROM matches WHERE id = ?
    `).bind(matchId).first();

    if (!match) return json({ success: false, error: "Match not found." }, 404);

    if (playerId !== null) {
      const participant = await env.DB.prepare(`
        SELECT p.id
        FROM players p
        JOIN tournament_players tp ON tp.player_id = p.id
        WHERE p.id = ? AND tp.tournament_id = ?
          AND LOWER(tp.registration_status) = 'approved'
      `).bind(playerId, match.tournament_id).first();

      if (!participant) {
        return json({ success: false, error: "Player is not an approved participant in this tournament." }, 400);
      }
    }

    if (teamId !== null) {
      const team = await env.DB.prepare(`
        SELECT id FROM teams WHERE id = ? AND tournament_id = ?
      `).bind(teamId, match.tournament_id).first();

      if (!team) return json({ success: false, error: "Team does not belong to this tournament." }, 400);
    }

    const duplicate = await env.DB.prepare(`
      SELECT id FROM match_results
      WHERE match_id = ?
        AND (
          (? IS NOT NULL AND player_id = ?)
          OR (? IS NOT NULL AND team_id = ?)
        )
    `).bind(matchId, playerId, playerId, teamId, teamId).first();

    if (duplicate) {
      return json({ success: false, error: "A result already exists for this participant in this match." }, 409);
    }

    const inserted = await env.DB.prepare(`
      INSERT INTO match_results
        (match_id, player_id, team_id, placement, kills, points, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(matchId, playerId, teamId, placement, kills, points).run();

    return json({
      success: true,
      message: "Match result saved and is awaiting verification.",
      resultId: inserted.meta?.last_row_id ?? null
    }, 201);
  } catch (error) {
    return json({ success: false, error: "Unable to save match result." }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const action = String(body.action || "").toLowerCase();

    if (!Number.isInteger(id) || id <= 0 || !["verify", "reject"].includes(action)) {
      return json({ success: false, error: "Valid result ID and action are required." }, 400);
    }

    const existing = await env.DB.prepare(`
      SELECT id FROM match_results WHERE id = ?
    `).bind(id).first();

    if (!existing) return json({ success: false, error: "Result not found." }, 404);

    if (action === "verify") {
      await env.DB.prepare(`
        UPDATE match_results
        SET is_verified = 1, verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id).run();
    } else {
      await env.DB.prepare(`
        UPDATE match_results
        SET is_verified = 0, verified_at = NULL
        WHERE id = ?
      `).bind(id).run();
    }

    return json({
      success: true,
      message: action === "verify" ? "Result verified." : "Result rejected."
    });
  } catch (error) {
    return json({ success: false, error: "Unable to update result." }, 500);
  }
}
