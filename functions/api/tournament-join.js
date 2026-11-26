import { getPlayer, json } from "./player/_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable."
      }, 500);
    }

    const player = await getPlayer(request, env.DB);

    if (!player) {
      return json({
        success: false,
        error: "Please login first."
      }, 401);
    }

    const body = await request.json();
    const tournamentId = Number(body.tournamentId);

    if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
      return json({
        success: false,
        error: "Invalid tournament ID."
      }, 400);
    }

    const tournament = await env.DB.prepare(`
      SELECT id, title, registration_status,
             tournament_status, max_participants
      FROM tournaments
      WHERE id = ?
      LIMIT 1
    `).bind(tournamentId).first();

    if (!tournament) {
      return json({
        success: false,
        error: "Tournament not found."
      }, 404);
    }

    if (
      tournament.registration_status !== "open" ||
      tournament.tournament_status !== "upcoming"
    ) {
      return json({
        success: false,
        error: "Tournament registration is closed."
      }, 400);
    }

    const existing = await env.DB.prepare(`
      SELECT id FROM tournament_players
      WHERE tournament_id = ? AND player_id = ?
      LIMIT 1
    `).bind(tournamentId, player.id).first();

    if (existing) {
      return json({
        success: false,
        error: "You have already joined this tournament."
      }, 409);
    }

    const result = await env.DB.prepare(`
      INSERT INTO tournament_players
        (tournament_id, player_id, registration_status)
      SELECT ?, ?, 'pending'
      WHERE EXISTS (
        SELECT 1 FROM tournaments
        WHERE id = ?
          AND registration_status = 'open'
          AND tournament_status = 'upcoming'
      )
      AND (
        SELECT COUNT(*) FROM tournament_players
        WHERE tournament_id = ?
          AND registration_status != 'rejected'
      ) < (
        SELECT max_participants FROM tournaments WHERE id = ?
      )
      ON CONFLICT(tournament_id, player_id) DO NOTHING
    `).bind(
      tournamentId,
      player.id,
      tournamentId,
      tournamentId,
      tournamentId
    ).run();

    if (!result.meta || result.meta.changes !== 1) {
      return json({
        success: false,
        error: "Registration failed. The tournament may be full or closed."
      }, 400);
    }

    return json({
      success: true,
      message: "Tournament registration submitted.",
      tournamentId,
      registrationStatus: "pending"
    }, 201);

  } catch {
    return json({
      success: false,
      error: "Could not join tournament."
    }, 500);
  }
}
