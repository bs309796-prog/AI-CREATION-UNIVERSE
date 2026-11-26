export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return Response.json(
        { success: false, error: "Database unavailable." },
        { status: 500 }
      );
    }

    const result = await env.DB.prepare(`
      SELECT
        t.id,
        t.title,
        t.game_name,
        t.game_mode,
        t.description,
        t.entry_fee_paise,
        t.prize_pool_paise,
        t.max_participants,
        t.starts_at,
        t.registration_status,
        t.tournament_status,
        t.created_at,
        COUNT(tp.id) AS registered_players
      FROM tournaments t
      LEFT JOIN tournament_players tp
        ON tp.tournament_id = t.id
        AND tp.registration_status != 'rejected'
      GROUP BY t.id
      ORDER BY
        CASE t.tournament_status
          WHEN 'upcoming' THEN 1
          WHEN 'live' THEN 2
          ELSE 3
        END,
        t.starts_at ASC
      LIMIT 100
    `).all();

    return Response.json({
      success: true,
      tournaments: result.results || []
    });

  } catch {
    return Response.json({
      success: false,
      error: "Could not load tournaments."
    }, { status: 500 });
  }
}
