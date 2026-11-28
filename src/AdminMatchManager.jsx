
import React from "react";
import {
  CalendarDays, Gamepad2, Plus, RefreshCw, Swords
} from "lucide-react";

export default function AdminMatchManager() {
  const [tournaments, setTournaments] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [form, setForm] = React.useState({
    tournamentId: "",
    roundName: "Round 1",
    matchNumber: "1",
    scheduledAt: "",
    roomId: "",
    matchStatus: "scheduled"
  });

  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "7px 0 14px",
    borderRadius: "8px",
    border: "1px solid #38445f",
    background: "#0b1020",
    color: "white",
    boxSizing: "border-box"
  };

  const cardStyle = {
    background: "#151b2e",
    border: "1px solid #293149",
    borderRadius: "13px",
    padding: "17px",
    marginBottom: "14px"
  };

  const muted = {
    color: "#a5b4c8",
    fontSize: "13px",
    lineHeight: 1.6
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
    gap: "7px"
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
      const [tournamentData, matchData] = await Promise.all([
        api("/api/admin/tournaments"),
        api("/api/admin/matches")
      ]);

      setTournaments(tournamentData.tournaments || []);
      setMatches(matchData.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  async function createMatch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await api("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: Number(form.tournamentId),
          roundName: form.roundName,
          matchNumber: Number(form.matchNumber),
          scheduledAt: form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : null,
          roomId: form.roomId,
          matchStatus: form.matchStatus
        })
      });

      setMessage(
        `Match successfully created. Match ID: ${data.matchId}`
      );

      setForm({
        tournamentId: "",
        roundName: "Round 1",
        matchNumber: "1",
        scheduledAt: "",
        roomId: "",
        matchStatus: "scheduled"
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h2><Swords size={22} /> Match Manager</h2>

          <button
            style={buttonStyle}
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <p style={muted}>
          Tournament के लिए नए मैच बनाएँ और उनके शेड्यूल तथा Room ID
          मैनेज करें।
        </p>

        <form onSubmit={createMatch}>
          <label>Select Tournament</label>
          <select
            style={inputStyle}
            value={form.tournamentId}
            onChange={e => setForm({
              ...form,
              tournamentId: e.target.value
            })}
            required
          >
            <option value="">Choose a tournament</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.game_name}
              </option>
            ))}
          </select>

          <label>Round Name</label>
          <input
            style={inputStyle}
            value={form.roundName}
            onChange={e => setForm({
              ...form,
              roundName: e.target.value
            })}
            placeholder="Example: Semi Final"
            maxLength={100}
          />

          <label>Match Number</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            max="100000"
            step="1"
            value={form.matchNumber}
            onChange={e => setForm({
              ...form,
              matchNumber: e.target.value
            })}
            required
          />

          <label><CalendarDays size={14} /> Match Date and Time</label>
          <input
            style={inputStyle}
            type="datetime-local"
            value={form.scheduledAt}
            onChange={e => setForm({
              ...form,
              scheduledAt: e.target.value
            })}
          />

          <label>Room ID (Optional)</label>
          <input
            style={inputStyle}
            value={form.roomId}
            onChange={e => setForm({
              ...form,
              roomId: e.target.value
            })}
            placeholder="Enter game room ID"
            maxLength={150}
          />

          <label>Match Status</label>
          <select
            style={inputStyle}
            value={form.matchStatus}
            onChange={e => setForm({
              ...form,
              matchStatus: e.target.value
            })}
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            style={buttonStyle}
            disabled={loading || tournaments.length === 0}
          >
            <Plus size={17} />
            {loading ? "Please wait..." : "Create Match"}
          </button>

          {tournaments.length === 0 && (
            <p style={muted}>
              पहले Tournament Manager में एक Tournament बनाएँ।
            </p>
          )}
        </form>
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

      <div style={cardStyle}>
        <h2> <Gamepad2 size={21} /> All Matches ({matches.length})</h2>

        {matches.map(match => (
          <article
            key={match.id}
            style={{
              ...cardStyle,
              background: "#0e1425"
            }}
          >
            <h3>
              {match.tournament_title || "Tournament"} — Match #{match.match_number}
            </h3>

            <p style={muted}>
              Game: {match.game_name || "Not available"}
            </p>

            <p style={muted}>
              Round: {match.round_name || "Not specified"}
            </p>

            <p style={muted}>
              Match ID: {match.id}
            </p>

            <p style={muted}>
              Schedule: {match.scheduled_at || "Not scheduled"}
            </p>

            <p style={muted}>
              Room ID: {match.room_id || "Not assigned"}
            </p>

            <p>
              Status: <strong>{match.match_status}</strong>
            </p>

            <p style={muted}>
              Results: {match.results_count || 0} ·
              Verified: {match.verified_results_count || 0}
            </p>
          </article>
        ))}

        {matches.length === 0 && !loading && (
          <p style={muted}>
            अभी कोई Match नहीं है। ऊपर से पहला Match बनाएँ।
          </p>
        )}
      </div>
    </div>
  );
}
