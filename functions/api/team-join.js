
import { getPlayer, json } from "./player/_auth.js";

function teamLimit(mode) {
  if (mode === "duo") return 2;
  if (mode === "squad") return 4;
  return 1;
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
    const inviteCode = String(body.inviteCode || "").trim().toUpperCase();

    if (!/^[A-F0-9]{18}$/.test(inviteCode)) {
      return json({ success: false, error: "Invalid team invite code." }, 400);
    }

    const team = await env.DB.prepare(`
      SELECT
        t.id,
        t.tournament_id,
        t.team_name,
        tr.title AS tournament_title,
        tr.game_mode,
        tr.registration_status,
        tr.tournament_status
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE t.invite_code = ?
      LIMIT 1
    `).bind(inviteCode).first();

    if (!team) {
      return json({ success: false, error: "Team not found. Check the invite code." }, 404);
    }

    if (!["duo", "squad"].includes(team.game_mode)) {
      return json({ success: false, error: "This tournament does not support teams." }, 400);
    }

    if (team.registration_status !== "open" ||
        team.tournament_status !== "upcoming") {
      return json({ success: false, error: "This tournament is not accepting team members." }, 400);
    }

    const registration = await env.DB.prepare(`
      SELECT id
      FROM tournament_players
      WHERE tournament_id = ?
        AND player_id = ?
        AND registration_status != 'rejected'
      LIMIT 1
    `).bind(team.tournament_id, player.id).first();

    if (!registration) {
      return json({ success: false, error: "Join the tournament before joining a team." }, 400);
    }

    const existingMembership = await env.DB.prepare(`
      SELECT tm.id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.tournament_id = ?
        AND tm.player_id = ?
      LIMIT 1
    `).bind(team.tournament_id, player.id).first();

    if (existingMembership) {
      return json({ success: false, error: "You are already in a team for this tournament." }, 409);
    }

    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM team_members
      WHERE team_id = ?
    `).bind(team.id).first();

    const currentMembers = Number(countResult?.total || 0);
    const maximumMembers = teamLimit(team.game_mode);

    if (currentMembers >= maximumMembers) {
      return json({ success: false, error: "This team is already full." }, 409);
    }

    await env.DB.prepare(`
      INSERT INTO team_members (team_id, player_id, member_role)
      VALUES (?, ?, 'member')
    `).bind(team.id, player.id).run();

    return json({
      success: true,
      message: "You joined the team successfully.",
      team: {
        id: team.id,
        tournamentId: team.tournament_id,
        tournamentTitle: team.tournament_title,
        teamName: team.team_name,
        memberCount: currentMembers + 1,
        maximumMembers
      }
    });

  } catch {
    return json({
      success: false,
      error: "Could not join team. Please try again."
    }, 500);
  }
}
