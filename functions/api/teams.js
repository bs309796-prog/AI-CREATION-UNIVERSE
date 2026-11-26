
import { getPlayer, json } from "./player/_auth.js";

function makeInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function teamLimit(mode) {
  if (mode === "duo") return 2;
  if (mode === "squad") return 4;
  return 1;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return json({ success: false, error: "Database unavailable." }, 500);
    }

    const player = await getPlayer(request, env.DB);

    if (!player) {
      return json({ success: false, error: "Player login required." }, 401);
    }

    const result = await env.DB.prepare(`
      SELECT
        t.id AS team_id,
        t.tournament_id,
        t.team_name,
        t.captain_player_id,
        t.invite_code,
        t.created_at,
        tr.title AS tournament_title,
        tr.game_name,
        tr.game_mode,
        COUNT(tm.id) AS member_count
      FROM team_members mine
      JOIN teams t ON t.id = mine.team_id
      JOIN tournaments tr ON tr.id = t.tournament_id
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE mine.player_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `).bind(player.id).all();

    return json({
      success: true,
      teams: result.results || []
    });
  } catch {
    return json({ success: false, error: "Could not load teams." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({ success: false, error: "Database unavailable." }, 500);
    }

    const player = await getPlayer(request, env.DB);

    if (!player) {
      return json({ success: false, error: "Player login required." }, 401);
    }

    const body = await request.json();
    const tournamentId = Number(body.tournamentId);
    const teamName = String(body.teamName || "").trim();

    if (!Number.isSafeInteger(tournamentId) || tournamentId < 1) {
      return json({ success: false, error: "Invalid tournament ID." }, 400);
    }

    if (!teamName || teamName.length > 60) {
      return json({ success: false, error: "Team name is required (maximum 60 characters)." }, 400);
    }

    const tournament = await env.DB.prepare(`
      SELECT id, title, game_mode, registration_status, tournament_status
      FROM tournaments
      WHERE id = ?
      LIMIT 1
    `).bind(tournamentId).first();

    if (!tournament) {
      return json({ success: false, error: "Tournament not found." }, 404);
    }

    if (!["duo", "squad"].includes(tournament.game_mode)) {
      return json({ success: false, error: "Teams are only available for Duo and Squad tournaments." }, 400);
    }

    if (tournament.registration_status !== "open" ||
        tournament.tournament_status !== "upcoming") {
      return json({ success: false, error: "This tournament is not accepting team registrations." }, 400);
    }

    const registration = await env.DB.prepare(`
      SELECT id
      FROM tournament_players
      WHERE tournament_id = ?
        AND player_id = ?
        AND registration_status != 'rejected'
      LIMIT 1
    `).bind(tournamentId, player.id).first();

    if (!registration) {
      return json({ success: false, error: "Join the tournament before creating a team." }, 400);
    }

    const existingMembership = await env.DB.prepare(`
      SELECT tm.id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.tournament_id = ?
        AND tm.player_id = ?
      LIMIT 1
    `).bind(tournamentId, player.id).first();

    if (existingMembership) {
      return json({ success: false, error: "You are already a member of a team in this tournament." }, 409);
    }

    const duplicateName = await env.DB.prepare(`
      SELECT id FROM teams
      WHERE tournament_id = ?
        AND LOWER(team_name) = LOWER(?)
      LIMIT 1
    `).bind(tournamentId, teamName).first();

    if (duplicateName) {
      return json({ success: false, error: "This team name is already taken in this tournament." }, 409);
    }

    const inviteCode = makeInviteCode();

    const created = await env.DB.prepare(`
      INSERT INTO teams (
        tournament_id,
        team_name,
        captain_player_id,
        invite_code
      )
      VALUES (?, ?, ?, ?)
    `).bind(
      tournamentId,
      teamName,
      player.id,
      inviteCode
    ).run();

    const teamId = created.meta.last_row_id;

    await env.DB.prepare(`
      INSERT INTO team_members (team_id, player_id, member_role)
      VALUES (?, ?, 'captain')
    `).bind(teamId, player.id).run();

    return json({
      success: true,
      message: "Team created successfully.",
      team: {
        id: teamId,
        tournamentId,
        tournamentTitle: tournament.title,
        teamName,
        inviteCode,
        memberCount: 1,
        maximumMembers: teamLimit(tournament.game_mode)
      }
    }, 201);

  } catch (error) {
    return json({
      success: false,
      error: "Could not create team. The team name may already be in use."
    }, 500);
  }
}
