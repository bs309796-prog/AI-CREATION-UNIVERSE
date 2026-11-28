
import React from "react";
import {
  UserCircle, LogIn, UserPlus, LogOut, RefreshCw,
  Trophy, Users, Gamepad2, Copy, CalendarDays,
  ShieldCheck, ArrowRight, Plus, Swords
} from "lucide-react";

export default function PlayerAuth({ onBack }) {
  const [mode, setMode] = React.useState("login");
  const [tab, setTab] = React.useState("overview");
  const [player, setPlayer] = React.useState(null);
  const [tournaments, setTournaments] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [form, setForm] = React.useState({
    displayName: "",
    email: "",
    password: "",
    gamingUsername: "",
    gameName: "",
    mobileNumber: ""
  });
  const [teamName, setTeamName] = React.useState({});
  const [inviteCode, setInviteCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/player/me", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPlayer(null);
        return;
      }

      setPlayer(data.player);

      const [tournamentResponse, teamResponse] = await Promise.all([
        fetch("/api/tournaments", { cache: "no-store" }),
        fetch("/api/teams", {
          credentials: "same-origin",
          cache: "no-store"
        })
      ]);

      const tournamentData = await tournamentResponse.json();
      const teamData = await teamResponse.json();

      if (tournamentData.success) {
        setTournaments(tournamentData.tournaments || []);
      }

      if (teamData.success) {
        setTeams(teamData.teams || []);
      }
    } catch {
      setError("Dashboard load नहीं हो पाया। दोबारा कोशिश करें।");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadDashboard();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = mode === "signup"
        ? "/api/player/signup"
        : "/api/player/login";

      const body = mode === "signup"
        ? form
        : { email: form.email, password: form.password };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Request failed.");
      }

      setPlayer(data.player);
      setForm({
        displayName: "",
        email: "",
        password: "",
        gamingUsername: "",
        gameName: "",
        mobileNumber: ""
      });
      setMessage(data.message || "Account ready.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/player/logout", {
        method: "POST",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setPlayer(null);
      setTeams([]);
      setTournaments([]);
      setMode("login");
      setMessage("You have logged out.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinTournament(tournamentId) {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/tournament-join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not join tournament.");
      }

      setMessage(data.message || "Registration submitted.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTeam(tournamentId) {
    const name = (teamName[tournamentId] || "").trim();

    if (!name) {
      setError("पहले Team Name लिखें।");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          teamName: name
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Team could not be created.");
      }

      setMessage(
        `Team ${data.team.teamName} created. Invite Code: ${data.team.inviteCode}`
      );
      setTeamName({ ...teamName, [tournamentId]: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinTeam(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/team-join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not join team.");
      }

      setMessage(data.message || "Team joined successfully.");
      setInviteCode("");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyCode(code) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(code);
      setMessage("Invite Code copied.");
    } catch {
      setMessage(`Invite Code: ${code}`);
    }
  }

  const styles = {
    page: {
      color: "#f8fafc",
      padding: "12px",
      maxWidth: "1150px",
      margin: "auto"
    },
    card: {
      background: "#151b2e",
      border: "1px solid #293149",
      borderRadius: "14px",
      padding: "18px",
      marginBottom: "15px",
      minWidth: 0
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "7px 0",
      borderRadius: "8px",
      border: "1px solid #38445f",
      background: "#0b1020",
      color: "white",
      boxSizing: "border-box"
    },
    button: {
      padding: "11px 15px",
      border: 0,
      borderRadius: "8px",
      background: "#7c3aed",
      color: "white",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      margin: "5px 5px 5px 0"
    },
    muted: {
      color: "#a5b4c8",
      fontSize: "13px",
      lineHeight: 1.6
    }
  };

  const buttonStyle = (active) => ({
    ...styles.button,
    background: active ? "#7c3aed" : "#202a40"
  });

  const formatMoney = (paise) => {
    const amount = Number(paise || 0) / 100;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Date not announced";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString("en-IN");
  };

  const registered = tournaments.filter(t =>
    ["open", "upcoming"].includes(t.tournament_status)
  );

  if (!player) {
    return (
      <section style={styles.page}>
        <button style={buttonStyle(false)} onClick={onBack}>
          ← Back to Overview
        </button>

        <div style={{
          ...styles.card,
          maxWidth: "480px",
          margin: "30px auto"
        }}>
          <div style={{ textAlign: "center" }}>
            {mode === "signup"
              ? <UserPlus size={42} />
              : <LogIn size={42} />}
            <h2>
              {mode === "signup"
                ? "Create Player Account"
                : "Player Login"}
            </h2>
            <p style={styles.muted}>
              Access your Nexus Esports player dashboard.
            </p>
          </div>

          <form onSubmit={submit}>
            {mode === "signup" && (
              <>
                <input
                  style={styles.input}
                  name="displayName"
                  placeholder="Full Name"
                  value={form.displayName}
                  onChange={update}
                  required
                />
                <input
                  style={styles.input}
                  name="gamingUsername"
                  placeholder="Gaming Username (optional)"
                  value={form.gamingUsername}
                  onChange={update}
                />
                <input
                  style={styles.input}
                  name="gameName"
                  placeholder="Favourite Game (optional)"
                  value={form.gameName}
                  onChange={update}
                />
                <input
                  style={styles.input}
                  name="mobileNumber"
                  placeholder="Mobile Number (optional)"
                  value={form.mobileNumber}
                  onChange={update}
                />
              </>
            )}

            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={update}
              required
            />

            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Password (8–128 characters)"
              value={form.password}
              onChange={update}
              minLength={8}
              maxLength={128}
              required
            />

            {error && <p style={{ color: "#f87171" }}>{error}</p>}
            {message && <p style={{ color: "#4ade80" }}>{message}</p>}

            <button
              style={{ ...styles.button, width: "100%" }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Please wait..." :
                mode === "signup" ? "Create Account" : "Login"}
            </button>
          </form>

          <button
            style={buttonStyle(false)}
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
              setMessage("");
            }}
          >
            {mode === "signup"
              ? "Already registered? Login"
              : "New Player? Create Account"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div>
          <p style={styles.muted}>NEXUS ESPORTS</p>
          <h1 style={{ margin: "5px 0" }}>Player Dashboard</h1>
          <p style={styles.muted}>
            Welcome, {player.displayName}
          </p>
        </div>

        <div>
          <button
            style={buttonStyle(false)}
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button style={buttonStyle(false)} onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        margin: "18px 0"
      }}>
        {[
          ["overview", "Overview"],
          ["tournaments", "Tournaments"],
          ["teams", "My Teams"],
          ["profile", "My Profile"]
        ].map(([value, label]) => (
          <button
            key={value}
            style={buttonStyle(tab === value)}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          ...styles.card,
          color: "#fca5a5",
          borderColor: "#7f1d1d"
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          ...styles.card,
          color: "#86efac",
          overflowWrap: "anywhere"
        }}>
          {message}
        </div>
      )}

      {tab === "overview" && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "12px"
          }}>
            <div style={styles.card}>
              <Trophy color="#c4b5fd" />
              <h2>{registered.length}</h2>
              <p style={styles.muted}>Open / Upcoming Tournaments</p>
            </div>
            <div style={styles.card}>
              <Users color="#60a5fa" />
              <h2>{teams.length}</h2>
              <p style={styles.muted}>My Teams</p>
            </div>
            <div style={styles.card}>
              <Gamepad2 color="#4ade80" />
              <h2>{tournaments.length}</h2>
              <p style={styles.muted}>Listed Tournaments</p>
            </div>
          </div>

          <div style={styles.card}>
            <h2><ShieldCheck size={20} /> Account Overview</h2>
            <p><strong>{player.displayName}</strong></p>
            <p style={styles.muted}>{player.email}</p>
            <button
              style={buttonStyle(false)}
              onClick={() => setTab("profile")}
            >
              View Profile <ArrowRight size={16} />
            </button>
          </div>

          <div style={styles.card}>
            <h2><CalendarDays size={20} /> Upcoming Tournaments</h2>
            {registered.slice(0, 4).map(t => (
              <div key={t.id} style={{
                borderTop: "1px solid #303951",
                padding: "12px 0"
              }}>
                <strong>{t.title}</strong>
                <p style={styles.muted}>
                  {t.game_name} · {t.game_mode}
                </p>
                <button
                  style={buttonStyle(false)}
                  onClick={() => setTab("tournaments")}
                >
                  View Tournament
                </button>
              </div>
            ))}
            {registered.length === 0 && (
              <p style={styles.muted}>No upcoming tournaments listed yet.</p>
            )}
          </div>
        </>
      )}

      {tab === "tournaments" && (
        <div style={styles.card}>
          <h2><Trophy size={22} /> Tournaments</h2>
          {tournaments.map(t => {
            const open =
              t.registration_status === "open" &&
              t.tournament_status === "upcoming";

            const teamMode = ["duo", "squad"].includes(t.game_mode);

            return (
              <div key={t.id} style={{
                background: "#0e1425",
                border: "1px solid #303951",
                borderRadius: "12px",
                padding: "15px",
                margin: "12px 0"
              }}>
                <h3>{t.title}</h3>
                <p style={styles.muted}>
                  <Gamepad2 size={14} /> {t.game_name} · {t.game_mode}
                </p>
                <p style={styles.muted}>{t.description}</p>
                <p style={styles.muted}>
                  Entry: {formatMoney(t.entry_fee_paise)} ·
                  Prize: {formatMoney(t.prize_pool_paise)}
                </p>
                <p style={styles.muted}>
                  Players: {t.registered_players || 0}
                  {t.max_participants
                    ? ` / ${t.max_participants}`
                    : ""}
                </p>
                <p style={styles.muted}>
                  Starts: {formatDate(t.starts_at)}
                </p>
                <p style={styles.muted}>
                  Status: {t.tournament_status} ·
                  Registration: {t.registration_status}
                </p>

                {open && (
                  <button
                    style={styles.button}
                    onClick={() => joinTournament(t.id)}
                  >
                    <Trophy size={16} /> Join Tournament
                  </button>
                )}

                {teamMode && open && (
                  <div style={{ marginTop: "12px" }}>
                    <input
                      style={styles.input}
                      placeholder="New Team Name"
                      value={teamName[t.id] || ""}
                      onChange={e =>
                        setTeamName({
                          ...teamName,
                          [t.id]: e.target.value
                        })
                      }
                    />
                    <button
                      style={buttonStyle(false)}
                      onClick={() => createTeam(t.id)}
                    >
                      <Plus size={16} /> Create Team
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {tournaments.length === 0 && (
            <p style={styles.muted}>No tournaments available right now.</p>
          )}
        </div>
      )}

      {tab === "teams" && (
        <>
          <div style={styles.card}>
            <h2><Users size={22} /> My Teams</h2>

            {teams.map(team => (
              <div key={team.team_id} style={{
                background: "#0e1425",
                padding: "15px",
                borderRadius: "10px",
                margin: "12px 0"
              }}>
                <h3>{team.team_name}</h3>
                <p style={styles.muted}>
                  Tournament: {team.tournament_title}
                </p>
                <p style={styles.muted}>
                  Game: {team.game_name} · Mode: {team.game_mode}
                </p>
                <p style={styles.muted}>
                  Members: {team.member_count}
                </p>
                <p style={styles.muted}>
                  Invite Code: <strong>{team.invite_code}</strong>
                </p>
                <button
                  style={buttonStyle(false)}
                  onClick={() => copyCode(team.invite_code)}
                >
                  <Copy size={15} /> Copy Invite Code
                </button>
              </div>
            ))}

            {teams.length === 0 && (
              <p style={styles.muted}>
                You have not joined any team yet.
              </p>
            )}
          </div>

          <div style={styles.card}>
            <h2><Swords size={22} /> Join a Team</h2>
            <form onSubmit={joinTeam}>
              <input
                style={styles.input}
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter 18-character invite code"
                maxLength={18}
                required
              />
              <button style={styles.button} type="submit">
                <Users size={16} /> Join Team
              </button>
            </form>
            <p style={styles.muted}>
              You must join that tournament before joining its team.
            </p>
          </div>
        </>
      )}

      {tab === "profile" && (
        <div style={styles.card}>
          <UserCircle size={45} />
          <h2>My Player Profile</h2>
          <p><strong>Name:</strong> {player.displayName}</p>
          <p><strong>Email:</strong> {player.email}</p>
          <p><strong>Gaming Username:</strong> {player.gamingUsername || "Not added"}</p>
          <p><strong>Favourite Game:</strong> {player.gameName || "Not added"}</p>
          <p><strong>Mobile:</strong> {player.mobileNumber || "Not added"}</p>
          <p style={styles.muted}>
            Profile information is currently displayed from your registered account.
          </p>
          <button style={buttonStyle(false)} onClick={onBack}>
            Back to Overview
          </button>
        </div>
      )}

      <p style={{
        ...styles.muted,
        textAlign: "center",
        margin: "25px 0"
      }}>
        AI Creation Universe · Nexus Esports Player Area
      </p>
    </section>
  );
}
