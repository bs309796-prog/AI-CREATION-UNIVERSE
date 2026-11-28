
export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return Response.json(
        { success: false, error: "Database connection unavailable" },
        { status: 500 }
      );
    }

    const result = await env.DB.prepare(`
      WITH player_results AS (
        SELECT
          mr.player_id,
          mr.match_id,
          mr.placement,
          mr.kills,
          mr.points
        FROM match_results mr
        WHERE mr.is_verified = 1
          AND mr.player_id IS NOT NULL

        UNION ALL

        SELECT
          tm.player_id,
          mr.match_id,
          mr.placement,
          mr.kills,
          mr.points
        FROM match_results mr
        INNER JOIN team_members tm
          ON tm.team_id = mr.team_id
        WHERE mr.is_verified = 1
          AND mr.team_id IS NOT NULL
      )

      SELECT
        p.id AS player_id,
        p.display_name,
        p.gaming_username,
        p.game_name,
        COALESCE(SUM(pr.points), 0) AS total_points,
        COALESCE(SUM(pr.kills), 0) AS total_kills,
        COUNT(DISTINCT pr.match_id) AS matches_played,
        SUM(
          CASE WHEN pr.placement = 1 THEN 1 ELSE 0 END
        ) AS wins
      FROM player_results pr
      INNER JOIN players p ON p.id = pr.player_id
      GROUP BY
        p.id,
        p.display_name,
        p.gaming_username,
        p.game_name
      ORDER BY total_points DESC, total_kills DESC
      LIMIT 100
    `).all();

    return Response.json({
      success: true,
      leaderboard: result.results || []
    });
  } catch (error) {
    return Response.json(
      { success: false, error: "Unable to load leaderboard" },
      { status: 500 }
    );
  }
}
