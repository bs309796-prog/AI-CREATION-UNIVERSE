
import React from "react";
import { createRoot } from "react-dom/client";
import {
  Sparkles,
  Globe,
  Gamepad2,
  Smartphone,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Rocket,
  WandSparkles,
  Code2,
  Menu,
  Plus,
  ArrowRight,
  Crown,
  Monitor,
  Play
} from "lucide-react";
import "./style.css";

function App() {
  const [active, setActive] = React.useState("Overview");
  const [prompt, setPrompt] = React.useState("");

  const menu = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Website Studio", icon: Globe },
    { name: "Game Studio", icon: Gamepad2 },
    { name: "App Studio", icon: Smartphone },
    { name: "My Projects", icon: FolderOpen },
    { name: "AI Assistant", icon: Sparkles },
    { name: "Settings", icon: Settings }
  ];

  const studios = [
    {
      name: "AI Website Builder",
      description: "Create professional websites without coding.",
      icon: Globe,
      color: "blue",
      action: "Website Studio"
    },
    {
      name: "AI Game Builder",
      description: "Design and create your own 2D and 3D games.",
      icon: Gamepad2,
      color: "purple",
      action: "Game Studio"
    },
    {
      name: "AI App Builder",
      description: "Build your own mobile application.",
      icon: Smartphone,
      color: "green",
      action: "App Studio"
    }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Sparkles /></div>
          <div>
            <h2>AI CREATION</h2>
            <span>UNIVERSE</span>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={active === item.name ? "nav-item active" : "nav-item"}
                onClick={() => setActive(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Crown size={22} />
            <h3>Unlock your creativity</h3>
            <p>Explore advanced creation tools.</p>
            <button onClick={() => setActive("Settings")}>Explore Plans <ArrowRight size={15}/></button>
          </div>
          <div className="user-profile">
            <div className="avatar">AU</div>
            <div><strong>Creator</strong><span>Free Workspace</span></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><Sparkles size={22}/> AI CREATION UNIVERSE</div>
          <div className="breadcrumb">Workspace <span>/</span> {active}</div>
          <div className="top-actions">
            <span className="credits"><Sparkles size={15}/> Free Credits</span>
            <button className="avatar small">AU</button>
          </div>
        </header>

        <div className="content">
          {active === "Overview" ? (
            <>
              <section className="welcome">
                <div>
                  <span className="eyebrow"><Sparkles size={14}/> YOUR CREATIVE UNIVERSE</span>
                  <h1>Turn your ideas into <span>reality.</span></h1>
                  <p>Create websites, games and apps with the power of AI.</p>
                </div>
                <div className="welcome-art"><WandSparkles size={75}/></div>
              </section>

              <section className="prompt-box">
                <div className="prompt-heading">
                  <Sparkles size={20}/>
                  <strong>What do you want to create today?</strong>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your dream website, game or app..."
                />
                <div className="prompt-footer">
                  <span>AI-powered creation starts with an idea.</span>
                  <button onClick={() => setActive("AI Assistant")} disabled={!prompt.trim()}>
                    Generate with AI <ArrowRight size={17}/>
                  </button>
                </div>
              </section>

              <div className="section-heading">
                <div><h2>Creation Studios</h2><p>Choose your creative workspace</p></div>
              </div>

              <section className="studio-grid">
                {studios.map((studio) => {
                  const Icon = studio.icon;
                  return (
                    <article className="studio-card" key={studio.name}>
                      <div className={"studio-icon " + studio.color}><Icon size={26}/></div>
                      <h3>{studio.name}</h3>
                      <p>{studio.description}</p>
                      <button onClick={() => setActive(studio.action)}>
                        Open Studio <ArrowRight size={16}/>
                      </button>
                    </article>
                  );
                })}
              </section>

              <section className="bottom-grid">
                <div className="panel">
                  <div className="panel-heading"><h2>Recent Projects</h2><button onClick={() => setActive("My Projects")}>View all</button></div>
                  <div className="empty-state"><FolderOpen size={35}/><strong>No projects yet</strong><span>Your creations will appear here.</span></div>
                </div>
                <div className="panel quick-panel">
                  <h2>Quick Start</h2>
                  <button onClick={() => setActive("Website Studio")}><Globe/> Create a Website <ArrowRight/></button>
                  <button onClick={() => setActive("Game Studio")}><Gamepad2/> Create a Game <ArrowRight/></button>
                  <button onClick={() => setActive("App Studio")}><Smartphone/> Create an App <ArrowRight/></button>
                </div>
              </section>
            </>
          ) : (
            <section className="workspace-page">
              <span className="eyebrow"><Sparkles size={14}/> AI CREATION UNIVERSE</span>
              <h1>{active}</h1>
              <p className="workspace-description">
                Welcome to your {active}. Your creative workspace is ready.
              </p>
              <div className="workspace-placeholder">
                {active === "Website Studio" ? <Globe size={55}/> :
                 active === "Game Studio" ? <Gamepad2 size={55}/> :
                 active === "App Studio" ? <Smartphone size={55}/> :
                 active === "AI Assistant" ? <WandSparkles size={55}/> :
                 active === "My Projects" ? <FolderOpen size={55}/> : <Settings size={55}/>}
                <h2>{active === "AI Assistant" ? "Your AI creative assistant" : "Your workspace"}</h2>
                <p>Advanced tools and project features will be connected in upcoming development steps.</p>
                <button onClick={() => setActive("Overview")}>Back to Overview <ArrowRight size={16}/></button>
              </div>
            </section>
          )}

          <footer>© 2026 AI Creation Universe. Create Anything. Build Everything.</footer>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
