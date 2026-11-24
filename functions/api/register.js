
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return Response.json(
        { success: false, error: "Database binding DB is missing." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const playerName = String(body.playerName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const gamingUsername = String(body.gamingUsername || "").trim();
    const gameName = String(body.gameName || "").trim();
    const mobileNumber = String(body.mobileNumber || "").trim();

    if (!playerName || !email || !gamingUsername || !gameName || !mobileNumber) {
      return Response.json(
        { success: false, error: "Please fill in all registration fields." },
        { status: 400 }
      );
    }

    if (playerName.length > 100 || gamingUsername.length > 50 ||
        gameName.length > 80 || email.length > 254 ||
        mobileNumber.length > 20) {
      return Response.json(
        { success: false, error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const result = await env.DB.prepare(`
      INSERT INTO tournament_registrations
      (player_name, email, gaming_username, game_name, mobile_number)
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(playerName, email, gamingUsername, gameName, mobileNumber)
      .run();

    return Response.json({
      success: true,
      message: "Tournament registration submitted successfully!",
      registrationId: result.meta.last_row_id
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Registration could not be completed."
      },
      { status: 500 }
    );
  }
}
