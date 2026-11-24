
import React from "react";
import {
  ShieldCheck, Users, Clock, CheckCircle,
  XCircle, LogOut, RefreshCw, Lock
} from "lucide-react";

export default function AdminDashboard({ onBack }) {
  const [password, setPassword] = React.useState("");
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [registrations, setRegistrations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const loadRegistrations = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/registrations", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not load registrations.");
      }

      setRegistrations(data.registrations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed.");
      }

      setPassword("");
      setLoggedIn(true);
      await loadRegistrations();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Status update failed.");
      }

      setMessage("Registration status updated.");
      await loadRegistrations();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } finally {
      setLoggedIn(false);
      setRegistrations([]);
      setMessage("");
      setError("");
    }
  };

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
          <p>Sign in to manage tournament registrations.</p>

          <form onSubmit={login}>
            <input
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
    <section className="workspace-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={15} /> ADMIN CONTROL PANEL
          </span>
          <h1>Registration Dashboard</h1>
          <p>Manage tournament player registrations.</p>
        </div>

        <button onClick={logout}>
          <LogOut size={17} /> Logout
        </button>
      </div>

      <div className="studio-grid">
        <article className="studio-card">
          <Users size={28} />
          <h2>{registrations.length}</h2>
          <p>Total Registrations</p>
        </article>

        <article className="studio-card">
          <Clock size={28} />
          <h2>{pending}</h2>
          <p>Pending</p>
        </article>

        <article className="studio-card">
          <CheckCircle size={28} />
          <h2>{approved}</h2>
          <p>Approved</p>
        </article>

        <article className="studio-card">
          <XCircle size={28} />
          <h2>{rejected}</h2>
          <p>Rejected</p>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Player Registrations</h2>
          <button onClick={loadRegistrations} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading && <p>Loading registrations...</p>}
        {error && <p role="alert">{error}</p>}
        {message && <p>{message}</p>}

        {!loading && registrations.length === 0 && (
          <p>No registrations found.</p>
        )}

        {registrations.map(player => (
          <article
            key={player.id}
            className="panel"
            style={{ margin: "12px 0", padding: "16px" }}
          >
            <h3>{player.player_name}</h3>
            <p>Gaming ID: {player.gaming_username}</p>
            <p>Game: {player.game_name}</p>
            <p>Email: {player.email}</p>
            <p>Mobile: {player.mobile_number}</p>
            <p>Status: <strong>{player.registration_status}</strong></p>
            <p>Registered: {player.created_at}</p>

            <button
              onClick={() => updateStatus(player.id, "approved")}
              disabled={player.registration_status === "approved"}
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(player.id, "rejected")}
              disabled={player.registration_status === "rejected"}
            >
              Reject
            </button>

            <button
              onClick={() => updateStatus(player.id, "pending")}
              disabled={player.registration_status === "pending"}
            >
              Pending
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
