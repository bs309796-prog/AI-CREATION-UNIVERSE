
import React from "react";
import { Trophy, RefreshCw, CheckCircle, XCircle, Plus } from "lucide-react";

export default function AdminResultsManager() {
  const [matches, setMatches] = React.useState([]);
  const [selectedMatch, setSelectedMatch] = React.useState("");
  const [participants, setParticipants] = React.useState([]);
  const [results, setResults] = React.useState([]);
  const [participantType, setParticipantType] = React.useState("player");
  const [participantId, setParticipantId] = React.useState("");
  const [placement, setPlacement] = React.useState("");
  const [kills, setKills] = React.useState("0");
  const [points, setPoints] = React.useState("0");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const card = {
    background: "#151b2e",
    border: "1px solid #293149",
    borderRadius: "13px",
    padding: "17px",
    marginBottom: "14px"
  };

  const input = {
    width: "100%",
    padding: "12px",
    margin: "7px 0 14px",
    borderRadius: "8px",
    border: "1px solid #38445f",
    background: "#0b1020",
    color: "white",
    boxSizing: "border-box"
  };

  const button = {
    padding: "10px 14px",
    border: 0,
    borderRadius: "8px",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer",
    margin: "4px"
  };

  const muted = { color: "#a5b4c8", fontSize: "13px", lineHeight: 1.6 };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: { ...(options.headers || {}) }
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  async function loadMatches() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/admin/results");
      setMatches(data.matches || []);
      if (!selectedMatch && data.matches?.length) {
        setSelectedMatch(String(data.matches[0].id));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedMatch(matchId) {
    if (!matchId) {
      setParticipants([]);
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/admin/results?match_id=${encodeURIComponent(matchId)}`);
      setParticipants(data.participants || []);
      setResults(data.results || []);
      setParticipantId("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadMatches();
  }, []);

  React.useEffect(() => {
    if (selectedMatch) loadSelectedMatch(selectedMatch);
  }, [selectedMatch]);

  async function saveResult(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!participantId) throw new Error("पहले खिलाड़ी या टीम चुनें।");

      const body = {
        matchId: Number(selectedMatch),
        playerId: participantType === "player" ? Number(participantId) : null,
        teamId: participantType === "team" ? Number(participantId) : null,
        placement: placement === "" ? null : Number(placement),
        kills: Number(kills),
        points: Number(points)
      };

      const data = await api("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      setMessage(data.message || "Result saved.");
      setParticipantId("");
      setPlacement("");
      setKills("0");
      setPoints("0");
      await loadSelectedMatch(selectedMatch);
      await loadMatches();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateResult(id, action) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await api("/api/admin/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      setMessage(data.message || "Result updated.");
      await loadSelectedMatch(selectedMatch);
      await loadMatches();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const availableParticipants = participants.filter(
    p => p.participant_type === participantType
  );

  return (
    <div>
      <div style={card}>
        <h2><Trophy size={22} /> Match Results Manager</h2>
        <p style={muted}>मैच चुनें, खिलाड़ी या टीम का प्रदर्शन दर्ज करें और परिणाम Verify करें।</p>

        <button style={button} onClick={loadMatches} disabled={loading}>
          <RefreshCw size={15} /> Refresh Matches
        </button>

        <label>Select Match</label>
        <select
          style={input}
          value={selectedMatch}
          onChange={e => setSelectedMatch(e.target.value)}
        >
          <option value="">Choose a match</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.tournament_title} — Match #{m.match_number} (ID: {m.id})
            </option>
          ))}
        </select>

        {matches.length === 0 && <p style={muted}>अभी कोई मैच उपलब्ध नहीं है।</p>}
      </div>

      {selectedMatch && (
        <>
          <div style={card}>
            <h3><Plus size={19} /> Add Match Result</h3>

            <form onSubmit={saveResult}>
              <label>Participant Type</label>
              <select
                style={input}
                value={participantType}
                onChange={e => {
                  setParticipantType(e.target.value);
                  setParticipantId("");
                }}
              >
                <option value="player">Individual Player</option>
                <option value="team">Team</option>
              </select>

              <label>Select {participantType === "player" ? "Player" : "Team"}</label>
              <select
                style={input}
                value={participantId}
                onChange={e => setParticipantId(e.target.value)}
                required
              >
                <option value="">Choose participant</option>
                {availableParticipants.map(p => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.display_name}
                    {p.gaming_username ? ` — ${p.gaming_username}` : ""}
                  </option>
                ))}
              </select>

              {availableParticipants.length === 0 && (
                <p style={muted}>
                  इस प्रकार का कोई participant उपलब्ध नहीं है। पहले tournament registration या team membership जाँचें।
                </p>
              )}

              <label>Placement / Rank</label>
              <input
                style={input}
                type="number"
                min="1"
                step="1"
                value={placement}
                onChange={e => setPlacement(e.target.value)}
                placeholder="Example: 1"
              />

              <label>Kills</label>
              <input
                style={input}
                type="number"
                min="0"
                step="1"
                value={kills}
                onChange={e => setKills(e.target.value)}
                required
              />

              <label>Points</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.1"
                value={points}
                onChange={e => setPoints(e.target.value)}
                required
              />

              <button
                type="submit"
                style={button}
                disabled={loading || !participantId}
              >
                <Plus size={16} /> {loading ? "Saving..." : "Save Result"}
              </button>
            </form>
          </div>

          <div style={card}>
            <h3>Recorded Results ({results.length})</h3>

            {results.map(r => (
              <article key={r.id} style={{ ...card, background: "#0e1425" }}>
                <h4>{r.team_name || r.display_name || r.gaming_username || "Participant"}</h4>
                <p style={muted}>
                  Placement: {r.placement ?? "Not set"} ·
                  Kills: {r.kills} · Points: {r.points}
                </p>
                <p>
                  Status: <strong>{Number(r.is_verified) === 1 ? "Verified" : "Pending Verification"}</strong>
                </p>

                {Number(r.is_verified) !== 1 ? (
                  <button
                    style={{ ...button, background: "#15803d" }}
                    onClick={() => updateResult(r.id, "verify")}
                    disabled={loading}
                  >
                    <CheckCircle size={15} /> Verify
                  </button>
                ) : (
                  <button
                    style={{ ...button, background: "#991b1b" }}
                    onClick={() => updateResult(r.id, "reject")}
                    disabled={loading}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                )}
              </article>
            ))}

            {results.length === 0 && (
              <p style={muted}>इस मैच के लिए अभी कोई परिणाम दर्ज नहीं हुआ है।</p>
            )}
          </div>
        </>
      )}

      {error && <div style={{ ...card, color: "#fca5a5" }}>{error}</div>}
      {message && <div style={{ ...card, color: "#86efac" }}>{message}</div>}
    </div>
  );
}
