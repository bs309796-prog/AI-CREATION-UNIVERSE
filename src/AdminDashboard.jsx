
import React from "react";
import {
  ShieldCheck, Users, Clock, CheckCircle, XCircle,
  LogOut, RefreshCw, Lock, Trophy, Plus, Trash2,
  CalendarDays, Gamepad2, IndianRupee, Settings
} from "lucide-react";

export default function AdminDashboard({ onBack }) {
  const [password, setPassword] = React.useState("");
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [tab, setTab] = React.useState("tournaments");
  const [tournaments, setTournaments] = React.useState([]);
  const [registrations, setRegistrations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const emptyForm = {
    title: "",
    gameName: "",
    gameMode: "solo",
    description: "",
    entryFee: "0",
    prizePool: "0",
    maxParticipants: "100",
    startsAt: ""
  };

  const [form, setForm] = React.useState(emptyForm);

  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "7px 0",
    borderRadius: "8px",
    border: "1px solid #38445f",
    background: "#0b1020",
    color: "white",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    padding: "11px 15px",
    border: 0,
    borderRadius: "8px",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    margin: "5px 5px 5px 0"
  };

  const cardStyle = {
    background: "#151b2e",
    border: "1px solid #293149",
    borderRadius: "13px",
    padding: "17px",
    marginBottom: "15px"
  };

  const muted = {
    color: "#a5b4c8",
    fontSize: "13px",
    lineHeight: 1.6
  };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [tournamentData, registrationData] = await Promise.all([
        api("/api/admin/tournaments"),
        api("/api/admin/registrations")
      ]);

      setTournaments(tournamentData.tournaments || []);
      setRegistrations(registrationData.registrations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      setPassword("");
      setLoggedIn(true);

      const [tournamentData, registrationData] = await Promise.all([
        api("/api/admin/tournaments"),
        api("/api/admin/registrations")
      ]);

      setTournaments(tournamentData.tournaments || []);
      setRegistrations(registrationData.registrations || []);
      setMessage("Admin login successful.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } finally {
      setLoggedIn(false);
      setTournaments([]);
      setRegistrations([]);
      setMessage("");
      setError("");
    }
  }

  async function createTournament(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const entryFee = Number(form.entryFee);
      const prizePool = Number(form.prizePool);
      const maximum = Number(form.maxParticipants);

      if (
        !Number.isFinite(entryFee) || entryFee < 0 ||
        !Number.isFinite(prizePool) || prizePool < 0 ||
        !Number.isSafeInteger(maximum) || maximum < 1 ||
        maximum > 10000
      ) {
        throw new Error("Entry Fee, Prize Pool और Participants की वैल्यू जाँचें।");
      }

      const data = await api("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          gameName: form.gameName,
          gameMode: form.gameMode,
          description: form.description,
          entryFeePaise: Math.round(entryFee * 100),
          prizePoolPaise: Math.round(prizePool * 100),
          maxParticipants: maximum,
          startsAt: form.startsAt
            ? new Date(form.startsAt).toISOString()
            : null
        })
      });

      setMessage(data.message || "Tournament created successfully.");
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateTournament(id, changes) {
    setError("");
    setMessage("");

    try {
      const data = await api("/api/admin/tournaments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes })
      });

      setMessage(data.message || "Tournament updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTournament(id, title) {
    if (!window.confirm(`क्या आप "${title}" टूर्नामेंट हटाना चाहते हैं?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const data = await api("/api/admin/tournaments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      setMessage(data.message || "Tournament deleted.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateRegistration(id, status) {
    setError("");
    setMessage("");

    try {
      const data = await api("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      setMessage(data.message || "Registration updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const money = value =>
    `₹${(Number(value || 0) / 100).toLocaleString("en-IN")}`;

  const pending = registrations.filter(
    item => item.registration_status === "pending"
  ).length;

  const approved = registrations.filter(
    item => item.registration_status === "approved"
  ).length;

  const rejected = registrations.filter(
    item => item.registration_status === "rejected"
  ).length;

  if (!loggedIn) {
    return (
      <section className="workspace-page">
        <button onClick={onBack}>← Back to Overview</button>

        <div className="workspace-placeholder">
          <ShieldCheck size={55} />
          <h2>Admin Login</h2>
          <p>Securely manage Nexus Esports.</p>

          <form onSubmit={login}>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loading}>
              <Lock size={17} />
              {loading ? "Signing in..." : "Secure Login"}
            </button>
          </form>

          {error && <p role="alert">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page" style={{ color: "#f8fafc" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div>
          <p style={muted}>NEXUS ESPORTS</p>
          <h1>Admin Control Panel</h1>
          <p style={muted}>Manage tournaments and player registrations.</p>
        </div>

        <div>
          <button
            style={buttonStyle}
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button style={buttonStyle} onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, color: "#fca5a5" }} role="alert">
          {error}
        </div>
      )}

      {message && (
        <div style={{ ...cardStyle, color: "#86efac" }}>
          {message}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
        gap: "12px",
        margin: "20px 0"
      }}>
        {[
          [Trophy, tournaments.length, "Tournaments"],
          [Users, registrations.length, "Registrations"],
          [Clock, pending, "Pending"],
          [CheckCircle, approved, "Approved"],
          [XCircle, rejected, "Rejected"]
        ].map(([Icon, count, label]) => (
          <div key={label} style={cardStyle}>
            <Icon size={23} />
            <h2>{count}</h2>
            <p style={muted}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        margin: "18px 0"
      }}>
        <button
          style={{
            ...buttonStyle,
            background: tab === "tournaments" ? "#7c3aed" : "#202a40"
          }}
          onClick={() => setTab("tournaments")}
        >
          <Trophy size={16} /> Tournaments
        </button>

        <button
          style={{
            ...buttonStyle,
            background: tab === "create" ? "#7c3aed" : "#202a40"
          }}
          onClick={() => setTab("create")}
        >
          <Plus size={16} /> Create Tournament
        </button>

        <button
          style={{
            ...buttonStyle,
            background: tab === "registrations" ? "#7c3aed" : "#202a40"
          }}
          onClick={() => setTab("registrations")}
        >
          <Users size={16} /> Player Registrations
        </button>
      </div>

      {tab === "create" && (
        <div style={cardStyle}>
          <h2><Plus size={21} /> Create New Tournament</h2>

          <form onSubmit={createTournament}>
            <label>Tournament Name</label>
            <input
              style={inputStyle}
              placeholder="Example: Nexus Championship"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              required
            />

            <label>Game Name</label>
            <input
              style={inputStyle}
              placeholder="Example: BGMI, Free Fire, Chess"
              value={form.gameName}
              onChange={e => setForm({ ...form, gameName: e.target.value })}
              maxLength={80}
              required
            />

            <label>Game Mode</label>
            <select
              style={inputStyle}
              value={form.gameMode}
              onChange={e => setForm({ ...form, gameMode: e.target.value })}
            >
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="squad">Squad</option>
            </select>

            <label>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px" }}
              placeholder="Tournament details and rules..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              maxLength={5000}
            />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
              gap: "10px"
            }}>
              <div>
                <label><IndianRupee size={14} /> Entry Fee (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.entryFee}
                  onChange={e => setForm({ ...form, entryFee: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Prize Pool (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prizePool}
                  onChange={e => setForm({ ...form, prizePool: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Maximum Participants</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={form.maxParticipants}
                  onChange={e => setForm({
                    ...form,
                    maxParticipants: e.target.value
                  })}
                  required
                />
              </div>
            </div>

            <label><CalendarDays size={14} /> Start Date and Time</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.startsAt}
              onChange={e => setForm({ ...form, startsAt: e.target.value })}
            />

            <p style={muted}>
              नया टूर्नामेंट बनते ही Registration Open और Status Upcoming होगा।
            </p>

            <button type="submit" style={buttonStyle} disabled={loading}>
              <Plus size={17} />
              {loading ? "Creating..." : "Create Tournament"}
            </button>
          </form>
        </div>
      )}

      {tab === "tournaments" && (
        <div style={cardStyle}>
          <h2><Trophy size={22} /> Tournament Manager</h2>

          {tournaments.map(t => (
            <article
              key={t.id}
              style={{
                ...cardStyle,
                background: "#0e1425"
              }}
            >
              <h3>{t.title}</h3>
              <p style={muted}>
                <Gamepad2 size={14} /> {t.game_name} · {t.game_mode}
              </p>
              <p style={muted}>{t.description}</p>
              <p style={muted}>
                Entry Fee: {money(t.entry_fee_paise)} ·
                Prize Pool: {money(t.prize_pool_paise)}
              </p>
              <p style={muted}>
                Players: {t.registered_players || 0}
                {t.max_participants ? ` / ${t.max_participants}` : ""}
              </p>
              <p style={muted}>
                Starts: {t.starts_at || "Not announced"}
              </p>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
                gap: "8px"
              }}>
                <div>
                  <label>Registration</label>
                  <select
                    style={inputStyle}
                    value={t.registration_status}
                    onChange={e => updateTournament(t.id, {
                      registrationStatus: e.target.value
                    })}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label>Tournament Status</label>
                  <select
                    style={inputStyle}
                    value={t.tournament_status}
                    onChange={e => updateTournament(t.id, {
                      tournamentStatus: e.target.value
                    })}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <button
                style={{ ...buttonStyle, background: "#991b1b" }}
                onClick={() => deleteTournament(t.id, t.title)}
              >
                <Trash2 size={16} /> Delete Tournament
              </button>
            </article>
          ))}

          {tournaments.length === 0 && !loading && (
            <p style={muted}>
              No tournaments found. Create your first tournament.
            </p>
          )}
        </div>
      )}

      {tab === "registrations" && (
        <div style={cardStyle}>
          <h2><Users size={22} /> Player Registrations</h2>

          {registrations.map(player => (
            <article key={player.id} style={{
              ...cardStyle,
              background: "#0e1425"
            }}>
              <h3>{player.player_name}</h3>
              <p style={muted}>Gaming ID: {player.gaming_username}</p>
              <p style={muted}>Game: {player.game_name}</p>
              <p style={muted}>Email: {player.email}</p>
              <p style={muted}>Mobile: {player.mobile_number}</p>
              <p>
                Status: <strong>{player.registration_status}</strong>
              </p>
              <p style={muted}>Registered: {player.created_at}</p>

              <button
                style={buttonStyle}
                onClick={() => updateRegistration(player.id, "approved")}
                disabled={player.registration_status === "approved"}
              >
                <CheckCircle size={15} /> Approve
              </button>

              <button
                style={{ ...buttonStyle, background: "#991b1b" }}
                onClick={() => updateRegistration(player.id, "rejected")}
                disabled={player.registration_status === "rejected"}
              >
                <XCircle size={15} /> Reject
              </button>

              <button
                style={{ ...buttonStyle, background: "#475569" }}
                onClick={() => updateRegistration(player.id, "pending")}
                disabled={player.registration_status === "pending"}
              >
                Pending
              </button>
            </article>
          ))}

          {registrations.length === 0 && !loading && (
            <p style={muted}>No player registrations found.</p>
          )}
        </div>
      )}

      <p style={{ ...muted, textAlign: "center", margin: "25px 0" }}>
        AI Creation Universe · Nexus Esports Admin
      </p>
    </section>
  );
}
