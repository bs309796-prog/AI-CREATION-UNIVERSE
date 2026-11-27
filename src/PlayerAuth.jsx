
import React from "react";
import { UserCircle, LogIn, UserPlus, LogOut, RefreshCw } from "lucide-react";

export default function PlayerAuth({ onBack }) {
  const [mode, setMode] = React.useState("login");
  const [player, setPlayer] = React.useState(null);
  const [form, setForm] = React.useState({
    displayName: "",
    email: "",
    password: "",
    gamingUsername: "",
    gameName: "",
    mobileNumber: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const checkSession = async () => {
    try {
      const res = await fetch("/api/player/me", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await res.json();
      if (res.ok && data.success) setPlayer(data.player);
    } catch {
      setError("Could not check login session.");
    }
  };

  React.useEffect(() => {
    checkSession();
  }, []);

  const submit = async (e) => {
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

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
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
      setMessage(data.message || "Success.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/player/logout", {
        method: "POST",
        credentials: "same-origin"
      });
      setPlayer(null);
      setMessage("Logged out successfully.");
      setMode("login");
    } catch {
      setError("Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "13px",
    margin: "7px 0",
    borderRadius: "9px",
    border: "1px solid #303951",
    background: "#0b1020",
    color: "white"
  };

  if (player) {
    return (
      <section className="workspace-page">
        <button onClick={onBack}>← Back to Overview</button>
        <div className="workspace-placeholder">
          <UserCircle size={55} />
          <h2>Player Profile</h2>
          <p><strong>{player.displayName}</strong></p>
          <p>{player.email}</p>
          <p>Gaming Username: {player.gamingUsername || "Not added"}</p>
          <p>Game: {player.gameName || "Not added"}</p>
          <p>Mobile: {player.mobileNumber || "Not added"}</p>
          {message && <p>{message}</p>}
          {error && <p role="alert">{error}</p>}
          <button onClick={logout} disabled={loading}>
            <LogOut size={17} /> {loading ? "Please wait..." : "Logout"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <button onClick={onBack}>← Back to Overview</button>
      <div className="workspace-placeholder">
        {mode === "signup" ? <UserPlus size={45} /> : <LogIn size={45} />}
        <h2>{mode === "signup" ? "Create Player Account" : "Player Login"}</h2>
        <p>Access your AI Creation Universe player account.</p>

        <form onSubmit={submit} style={{ width: "100%", maxWidth: "430px" }}>
          {mode === "signup" && (
            <>
              <input style={fieldStyle} name="displayName" placeholder="Full Name" value={form.displayName} onChange={update} required />
              <input style={fieldStyle} name="gamingUsername" placeholder="Gaming Username (optional)" value={form.gamingUsername} onChange={update} />
              <input style={fieldStyle} name="gameName" placeholder="Game Name (optional)" value={form.gameName} onChange={update} />
              <input style={fieldStyle} name="mobileNumber" placeholder="Mobile Number (optional)" value={form.mobileNumber} onChange={update} />
            </>
          )}

          <input style={fieldStyle} type="email" name="email" placeholder="Email Address" value={form.email} onChange={update} required />
          <input style={fieldStyle} type="password" name="password" placeholder="Password (8–128 characters)" value={form.password} onChange={update} minLength={8} maxLength={128} required />

          {error && <p role="alert" style={{ color: "#f87171" }}>{error}</p>}
          {message && <p style={{ color: "#4ade80" }}>{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? <RefreshCw size={17} /> : mode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError("");
            setMessage("");
          }}
        >
          {mode === "signup" ? "Already have an account? Login" : "New player? Create an account"}
        </button>
      </div>
    </section>
  );
}
