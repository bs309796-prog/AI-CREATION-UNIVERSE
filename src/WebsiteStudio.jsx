
import React, { useState } from "react";
import {
  Monitor, Smartphone, Type, Download, Sparkles,
  Eye, Globe, ArrowLeft, Image as ImageIcon, Layout,
  Layers, Plus, Palette, Upload, Trash2, Gamepad2
} from "lucide-react";

export default function WebsiteStudio({ onBack }) {
  const [siteName, setSiteName] = useState("Nexus Esports");
  const [heading, setHeading] = useState("ENTER THE BATTLE. CLAIM THE GLORY.");
  const [description, setDescription] = useState(
    "Compete with the best players. Join tournaments, build your squad and become a champion."
  );
  const [buttonText, setButtonText] = useState("JOIN TOURNAMENT");
  const [bgColor, setBgColor] = useState("#080b18");
  const [accent, setAccent] = useState("#8b5cf6");

  // Gaming Hero Background
  const [heroBackgroundImage, setHeroBackgroundImage] = useState("");
  const [heroOverlay, setHeroOverlay] = useState(0.65);

  // Normal Website Image
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [aboutHeading, setAboutHeading] = useState("About Nexus Esports");
  const [aboutText, setAboutText] = useState(
    "We create amazing gaming experiences with competition, technology and innovation."
  );

  const [features, setFeatures] = useState([
    { title: "Epic Tournaments", text: "Compete in exciting esports tournaments." },
    { title: "Pro Gaming Community", text: "Connect with passionate gamers." },
    { title: "Amazing Rewards", text: "Play hard and earn exciting rewards." }
  ]);

  const [showRegistration, setShowRegistration] = useState(true);
  const [registration, setRegistration] = useState({
    playerName: "",
    email: "",
    gamingUsername: "",
    gameName: "",
    mobileNumber: ""
  });

  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [generating, setGenerating] = useState(false);

  const activeImage = uploadedImage || imageUrl.trim();

  // Gaming Background Upload
  function handleHeroBackgroundUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select a valid gaming background image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Please select an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setHeroBackgroundImage(String(reader.result));
      setNotice("Gaming Hero background added successfully!");
    };

    reader.onerror = () => {
      setNotice("Background upload failed. Please try again.");
    };

    reader.readAsDataURL(file);
  }

  async function generateLayout() {
    if (!prompt.trim()) {
      setNotice("Please enter your website idea first.");
      return;
    }

    setGenerating(true);
    setNotice("Gemini AI is creating your website...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI could not create the website.");
      }

      setSiteName(data.siteName || "My New Website");
      setHeading(data.heading || "Turn Your Ideas Into Reality.");
      setDescription(data.description || "Welcome to your new website.");
      setButtonText(data.buttonText || "Explore Now");
      setBgColor(data.bgColor || "#111827");
      setAccent(data.accent || "#7c3aed");

      if (data.heroBackgroundImage) {
        setHeroBackgroundImage(data.heroBackgroundImage);
      }

      if (/tournament|esports|e-sports|gaming|game competition/i.test(prompt)) {
        setShowRegistration(true);
      }

      setNotice("AI created your website successfully!");
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedImage(String(reader.result));
      setImageUrl("");
      setNotice("Your image has been added successfully!");
    };

    reader.onerror = () => {
      setNotice("Image upload failed. Please try again.");
    };

    reader.readAsDataURL(file);
  }

  function updateFeature(index, field, value) {
    setFeatures(old =>
      old.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addFeature() {
    setFeatures(old => [
      ...old,
      { title: "New Feature", text: "Describe this feature here." }
    ]);
  }

  function removeFeature(index) {
    setFeatures(old => old.filter((_, i) => i !== index));
  }

  function updateRegistration(field, value) {
    setRegistration(old => ({ ...old, [field]: value }));
  }

  async function submitRegistration(event) {
    event.preventDefault();
    if (registering) return;

    setRegistering(true);
    setRegistrationMessage("Submitting your registration...");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed.");
      }

      setRegistrationMessage(
        data.message || "Registration submitted successfully!"
      );

      setRegistration({
        playerName: "",
        email: "",
        gamingUsername: "",
        gameName: "",
        mobileNumber: ""
      });
    } catch (error) {
      setRegistrationMessage(error.message || "Registration failed.");
    } finally {
      setRegistering(false);
    }
  }

  // Export Website
  function exportWebsite() {
    const esc = value =>
      String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

    const cssUrl = value =>
      String(value).replace(/[\\"'\n\r]/g, char => "\\" + char);

    const featuresHTML = features.map(item => `
      <article class="feature-card">
        <div class="feature-icon">✦</div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </article>
    `).join("");

    const imageHTML = activeImage
      ? `<section class="image-section">
          <img src="${esc(activeImage)}" alt="${esc(siteName)}">
        </section>`
      : "";

    const registrationHTML = showRegistration ? `
      <section class="section registration" id="register">
        <h2>Tournament Registration</h2>
        <p class="section-intro">Complete the form to register.</p>
        <form id="registration-form">
          <label>Player Name
            <input name="playerName" required maxlength="100" placeholder="Enter your name">
          </label>
          <label>Email Address
            <input name="email" type="email" required maxlength="254" placeholder="Enter your email">
          </label>
          <label>Gaming Username
            <input name="gamingUsername" required maxlength="50" placeholder="Gaming username">
          </label>
          <label>Game Name
            <input name="gameName" required maxlength="80" placeholder="Enter game name">
          </label>
          <label>Mobile Number
            <input name="mobileNumber" type="tel" required maxlength="20" placeholder="Enter mobile number">
          </label>
          <button class="cta" type="submit">Submit Registration</button>
          <p id="registration-message" role="status"></p>
        </form>
      </section>
    ` : "";

    const registrationScript = showRegistration ? `
      document.getElementById("registration-form").addEventListener("submit", async function(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const message = document.getElementById("registration-message");
        const button = form.querySelector("button[type='submit']");
        const payload = Object.fromEntries(new FormData(form).entries());

        button.disabled = true;
        message.textContent = "Submitting registration...";

        try {
          const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Registration failed.");
          }

          message.textContent = data.message || "Registration successful!";
          form.reset();
        } catch (error) {
          message.textContent = error.message || "Registration failed.";
        } finally {
          button.disabled = false;
        }
      });
    ` : "";

    const heroBackground = heroBackgroundImage
      ? `background-image:linear-gradient(rgba(5,8,20,${heroOverlay}),rgba(5,8,20,${heroOverlay})),url("${cssUrl(heroBackgroundImage)}");`
      : `background:linear-gradient(135deg,#080b18,#20104a,#080b18);`;

    const ctaTarget = showRegistration ? "#register" : "#features";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="${esc(bgColor)}">
<title>${esc(siteName)}</title>

<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:hidden}
body{margin:0;min-height:100vh;overflow-x:hidden;font-family:Arial,Helvetica,sans-serif;background:${esc(bgColor)};color:white}

nav{padding:20px clamp(18px,6vw,80px);display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;border-bottom:1px solid #ffffff20}
.brand{font-size:24px;font-weight:bold;color:white}
.nav-links{display:flex;gap:22px;flex-wrap:wrap}
.nav-links a{color:#d1d5db;text-decoration:none;font-size:14px}

.hero{
width:100%;
min-height:650px;
padding:90px 22px;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
text-align:center;
background-size:cover;
background-position:center;
background-repeat:no-repeat;
position:relative;
isolation:isolate;
${heroBackground}
}

.hero h1{
width:100%;
max-width:1000px;
font-size:clamp(38px,7vw,78px);
line-height:1.12;
margin:0 auto 25px;
overflow-wrap:anywhere;
text-shadow:0 4px 25px #000;
}

.hero p{
width:100%;
max-width:750px;
font-size:clamp(16px,2vw,20px);
line-height:1.8;
color:#e5e7eb;
margin:0 auto;
text-shadow:0 2px 12px #000;
}

.cta{
display:inline-block;
margin-top:32px;
padding:16px 32px;
background:${esc(accent)};
color:white;
text-decoration:none;
border:0;
border-radius:10px;
font-weight:bold;
cursor:pointer;
transition:transform .2s,filter .2s;
}
.cta:hover{transform:translateY(-3px);filter:brightness(1.15)}

.section{width:100%;padding:75px clamp(20px,7vw,90px);text-align:center}
.section h2{font-size:clamp(28px,4vw,42px);margin:0 0 18px}
.section-intro{color:#cbd5e1;line-height:1.7;max-width:700px;margin:0 auto 35px}

.features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1150px;margin:auto}
.feature-card{background:#ffffff0d;border:1px solid #ffffff20;border-radius:16px;padding:30px 22px;text-align:left}
.feature-icon{font-size:30px;color:${esc(accent)};margin-bottom:16px}
.feature-card h3{font-size:21px;margin:0 0 12px}
.feature-card p{color:#cbd5e1;line-height:1.7;margin:0}

.image-section{padding:10px 20px 65px;text-align:center}
.image-section img{display:block;width:100%;max-width:1000px;max-height:520px;object-fit:cover;border-radius:18px;margin:auto}

.about,.registration{background:#ffffff08}
.about p{max-width:750px;margin:auto;color:#d1d5db;font-size:17px;line-height:1.9}

.registration form{max-width:520px;margin:auto;text-align:left}
.registration label{display:block;color:#e5e7eb;margin:14px 0;font-size:14px}
.registration input{display:block;width:100%;padding:14px;margin-top:7px;border:1px solid #475569;border-radius:9px;background:#111827;color:white;font-size:16px}
.registration button{width:100%}
#registration-message{color:#c4b5fd;line-height:1.6}

footer{padding:30px 20px;text-align:center;border-top:1px solid #ffffff20;color:#9ca3af;font-size:14px}

@media(max-width:700px){
 nav{align-items:flex-start;flex-direction:column}
 .nav-links{gap:16px}
 .hero{min-height:520px;padding:65px 22px}
 .features{grid-template-columns:1fr}
 .section{padding:55px 20px}
}
</style>
</head>

<body>
<nav>
  <div class="brand">🎮 ${esc(siteName)}</div>
  <div class="nav-links">
    <a href="#home">Home</a>
    <a href="#features">Features</a>
    ${showRegistration ? '<a href="#register">Register</a>' : ""}
    <a href="#about">About</a>
  </div>
</nav>

<main>
<section class="hero" id="home">
  <h1>${esc(heading)}</h1>
  <p>${esc(description)}</p>
  <a class="cta" href="${ctaTarget}">${esc(buttonText)}</a>
</section>

${imageHTML}

<section class="section" id="features">
  <h2>Our Features</h2>
  <p class="section-intro">Discover what makes our gaming experience special.</p>
  <div class="features">${featuresHTML}</div>
</section>

${registrationHTML}

<section class="section about" id="about">
  <h2>${esc(aboutHeading)}</h2>
  <p>${esc(aboutText)}</p>
</section>
</main>

<footer>© ${new Date().getFullYear()} ${esc(siteName)}. All rights reserved.</footer>

<script>
${registrationScript}
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "nexus-esports-website.html";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);

    setNotice(
      showRegistration
        ? "Website exported. Registration API requires hosting on the same Cloudflare project."
        : "Your website HTML is ready to download!"
    );
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "9px",
    border: "1px solid #374151",
    background: "#111827",
    color: "white",
    marginTop: "7px",
    marginBottom: "14px",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    background: "#7c3aed",
    color: "white",
    border: 0,
    borderRadius: "9px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "bold"
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    color: "#cbd5e1",
    marginTop: "5px"
  };

  const previewHeroBackground = heroBackgroundImage
    ? `linear-gradient(rgba(5,8,20,${heroOverlay}),rgba(5,8,20,${heroOverlay})),url("${heroBackgroundImage}")`
    : "linear-gradient(135deg,#080b18,#20104a,#080b18)";

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      overflowX: "hidden",
      background: "#080b18",
      color: "white",
      padding: "20px",
      fontFamily: "Arial,sans-serif",
      boxSizing: "border-box"
    }}>

      {/* Studio Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div>
          <button onClick={onBack} style={{
            background: "transparent",
            border: "none",
            color: "#a5b4fc",
            cursor: "pointer",
            marginBottom: "12px"
          }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h2 style={{ margin: 0 }}>AI Website Studio</h2>
          <small style={{ color: "#9ca3af" }}>Powered by Gemini AI</small>
        </div>

        <button onClick={exportWebsite} style={buttonStyle}>
          <Download size={16} /> Export Full Website
        </button>
      </div>

      <div className="studio-grid" style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 350px) minmax(0, 1fr)",
        gap: "20px",
        width: "100%"
      }}>

        {/* LEFT EDITOR */}
        <section style={{
          background: "#151b2e",
          padding: "18px",
          borderRadius: "15px",
          border: "1px solid #293149",
          minWidth: 0
        }}>

          <h3><Sparkles size={18} /> Website AI Assistant</h3>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your website idea..."
            rows={4}
            style={fieldStyle}
          />

          <button
            onClick={generateLayout}
            disabled={generating}
            style={{
              ...buttonStyle,
              width: "100%",
              opacity: generating ? 0.7 : 1
            }}
          >
            <Sparkles size={16} />
            {generating ? "Generating with Gemini AI..." : "Generate with Gemini AI"}
          </button>

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* MAIN WEBSITE */}
          <h3><Type size={18} /> Main Website</h3>

          <label style={labelStyle}>Website Name</label>
          <input style={fieldStyle} value={siteName} onChange={e => setSiteName(e.target.value)} />

          <label style={labelStyle}>Main Heading</label>
          <textarea style={fieldStyle} rows={2} value={heading} onChange={e => setHeading(e.target.value)} />

          <label style={labelStyle}>Description</label>
          <textarea style={fieldStyle} rows={3} value={description} onChange={e => setDescription(e.target.value)} />

          <label style={labelStyle}>Button Text</label>
          <input style={fieldStyle} value={buttonText} onChange={e => setButtonText(e.target.value)} />

          {/* COLORS */}
          <h3><Palette size={18} /> Colors</h3>

          <label style={labelStyle}>Background Color</label>
          <input
            type="color"
            value={bgColor}
            onChange={e => setBgColor(e.target.value)}
            style={{ ...fieldStyle, height: "45px", padding: "4px" }}
          />

          <label style={labelStyle}>Accent Color</label>
          <input
            type="color"
            value={accent}
            onChange={e => setAccent(e.target.value)}
            style={{ ...fieldStyle, height: "45px", padding: "4px" }}
          />

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* NEXUS GAMING HERO BACKGROUND */}
          <h3><Gamepad2 size={18} /> Nexus Gaming Hero Background</h3>

          <p style={{
            color: "#9ca3af",
            fontSize: "12px",
            lineHeight: 1.6
          }}>
            Add an esports gaming background image to your main hero section.
          </p>

          <label style={labelStyle}>Upload Gaming Background</label>

          <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            width: "100%",
            padding: "14px",
            marginTop: "9px",
            marginBottom: "14px",
            borderRadius: "9px",
            border: "1px dashed #8b5cf6",
            background: "#211b3b",
            color: "white",
            cursor: "pointer"
          }}>
            <Upload size={18} /> Choose Gaming Image

            <input
              type="file"
              accept="image/*"
              onChange={handleHeroBackgroundUpload}
              style={{ display: "none" }}
            />
          </label>

          <label style={labelStyle}>Or Enter Gaming Image URL</label>

          <input
            style={fieldStyle}
            value={heroBackgroundImage.startsWith("data:") ? "" : heroBackgroundImage}
            onChange={e => setHeroBackgroundImage(e.target.value)}
            placeholder="https://example.com/gaming.jpg"
          />

          <label style={labelStyle}>
            Dark Overlay: {Math.round(heroOverlay * 100)}%
          </label>

          <input
            type="range"
            min="0"
            max="0.95"
            step="0.05"
            value={heroOverlay}
            onChange={e => setHeroOverlay(Number(e.target.value))}
            style={{ width: "100%", margin: "12px 0 18px" }}
          />

          {heroBackgroundImage && (
            <div style={{
              background: "#0e1425",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "15px"
            }}>
              <img
                src={heroBackgroundImage}
                alt="Gaming Hero Background"
                style={{
                  display: "block",
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />

              <button
                onClick={() => {
                  setHeroBackgroundImage("");
                  setNotice("Gaming background removed.");
                }}
                style={{
                  ...buttonStyle,
                  background: "#991b1b",
                  marginTop: "10px",
                  width: "100%"
                }}
              >
                <Trash2 size={15} /> Remove Gaming Background
              </button>
            </div>
          )}

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* NORMAL IMAGE SECTION */}
          <h3><ImageIcon size={18} /> Image Section</h3>

          <label style={labelStyle}>Upload Image From Phone</label>

          <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            width: "100%",
            padding: "14px",
            marginTop: "9px",
            marginBottom: "14px",
            borderRadius: "9px",
            border: "1px dashed #8b5cf6",
            background: "#211b3b",
            color: "white",
            cursor: "pointer"
          }}>
            <Upload size={18} /> Choose Image

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>

          <label style={labelStyle}>Or Enter Image URL</label>

          <input
            style={fieldStyle}
            value={imageUrl}
            onChange={e => {
              setImageUrl(e.target.value);
              setUploadedImage("");
            }}
            placeholder="https://example.com/image.jpg"
          />

          {activeImage && (
            <div style={{
              background: "#0e1425",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "15px"
            }}>
              <img
                src={activeImage}
                alt="Selected website"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "180px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />

              <button
                onClick={() => {
                  setUploadedImage("");
                  setImageUrl("");
                  setNotice("Image removed.");
                }}
                style={{
                  ...buttonStyle,
                  background: "#991b1b",
                  marginTop: "10px",
                  width: "100%"
                }}
              >
                <Trash2 size={15} /> Remove Image
              </button>
            </div>
          )}

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* FEATURE CARDS */}
          <h3><Layers size={18} /> Feature Cards</h3>

          {features.map((feature, index) => (
            <div key={index} style={{
              background: "#0e1425",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "12px"
            }}>
              <label style={labelStyle}>Card {index + 1} Title</label>

              <input
                style={fieldStyle}
                value={feature.title}
                onChange={e => updateFeature(index, "title", e.target.value)}
              />

              <label style={labelStyle}>Card Description</label>

              <textarea
                style={fieldStyle}
                rows={2}
                value={feature.text}
                onChange={e => updateFeature(index, "text", e.target.value)}
              />

              <button
                onClick={() => removeFeature(index)}
                style={{
                  ...buttonStyle,
                  background: "#991b1b",
                  padding: "8px 12px"
                }}
              >
                <Trash2 size={14} /> Remove Card
              </button>
            </div>
          ))}

          <button onClick={addFeature} style={{ ...buttonStyle, width: "100%" }}>
            <Plus size={16} /> Add Feature Card
          </button>

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* REGISTRATION */}
          <h3>🏆 Tournament Registration</h3>

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            borderRadius: "9px",
            background: "#0e1425",
            marginBottom: "15px"
          }}>
            <input
              type="checkbox"
              checked={showRegistration}
              onChange={e => setShowRegistration(e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
            <span>Enable Tournament Registration Form</span>
          </label>

          <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: 1.6 }}>
            Visitors can submit their details through the Cloudflare registration API.
          </p>

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          {/* ABOUT */}
          <h3><Layout size={18} /> About Section</h3>

          <label style={labelStyle}>About Heading</label>
          <input
            style={fieldStyle}
            value={aboutHeading}
            onChange={e => setAboutHeading(e.target.value)}
          />

          <label style={labelStyle}>About Description</label>
          <textarea
            style={fieldStyle}
            rows={4}
            value={aboutText}
            onChange={e => setAboutText(e.target.value)}
          />
        </section>

        {/* RIGHT LIVE PREVIEW */}
        <section style={{
          background: "#151b2e",
          padding: "15px",
          borderRadius: "15px",
          border: "1px solid #293149",
          minWidth: 0
        }}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "15px"
          }}>
            <strong><Eye size={17} /> Live Website Preview</strong>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setMobile(false)}
                style={{
                  padding: "8px",
                  borderRadius: "7px",
                  border: "1px solid #475569",
                  background: mobile ? "#111827" : "#7c3aed",
                  color: "white"
                }}
              >
                <Monitor size={17} />
              </button>

              <button
                onClick={() => setMobile(true)}
                style={{
                  padding: "8px",
                  borderRadius: "7px",
                  border: "1px solid #475569",
                  background: mobile ? "#7c3aed" : "#111827",
                  color: "white"
                }}
              >
                <Smartphone size={17} />
              </button>
            </div>
          </div>

          <div style={{
            background: "#e5e7eb",
            borderRadius: "10px",
            padding: "12px",
            minHeight: "500px",
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
            minWidth: 0
          }}>

            <div style={{
              width: mobile ? "375px" : "100%",
              maxWidth: "100%",
              minHeight: "475px",
              background: bgColor,
              color: "white",
              borderRadius: mobile ? "18px" : "5px",
              overflow: "hidden",
              boxSizing: "border-box"
            }}>

              {/* PREVIEW NAVBAR */}
              <div style={{
                padding: "18px 6%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                borderBottom: "1px solid #ffffff20"
              }}>
                <strong><Globe size={17} /> {siteName}</strong>

                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                  Home　 Features　 {showRegistration ? "Register　" : ""}About
                </span>
              </div>

              {/* GAMING HERO PREVIEW */}
              <div style={{
                minHeight: "400px",
                padding: "55px 8%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                backgroundImage: previewHeroBackground,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}>

                <div style={{
                  color: "#c4b5fd",
                  fontSize: "12px",
                  letterSpacing: "4px",
                  fontWeight: "bold",
                  marginBottom: "18px"
                }}>
                  ⚡ NEXUS ESPORTS ⚡
                </div>

                <h1 style={{
                  width: "100%",
                  maxWidth: "900px",
                  fontSize: mobile
                    ? "clamp(30px,8vw,42px)"
                    : "clamp(34px,4vw,58px)",
                  lineHeight: 1.15,
                  overflowWrap: "anywhere",
                  margin: "0 0 20px",
                  textShadow: "0 3px 15px #000"
                }}>
                  {heading}
                </h1>

                <p style={{
                  width: "100%",
                  maxWidth: "600px",
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "#e5e7eb",
                  margin: 0
                }}>
                  {description}
                </p>

                <button
                  onClick={() => {
                    if (showRegistration) {
                      document.getElementById("preview-registration")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                    } else {
                      setNotice("Preview button selected.");
                    }
                  }}
                  style={{
                    background: accent,
                    color: "white",
                    border: 0,
                    borderRadius: "9px",
                    padding: "14px 25px",
                    marginTop: "22px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  {buttonText}
                </button>
              </div>

              {/* NORMAL IMAGE */}
              {activeImage && (
                <div style={{ padding: "10px 18px" }}>
                  <img
                    src={activeImage}
                    alt="Website"
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "12px"
                    }}
                  />
                </div>
              )}

              {/* FEATURES */}
              <div style={{ padding: "25px 18px", textAlign: "center" }}>
                <h2>Our Features</h2>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: mobile ? "1fr" : "repeat(3,minmax(0,1fr))",
                  gap: "10px"
                }}>
                  {features.map((item, index) => (
                    <div key={index} style={{
                      background: "#ffffff10",
                      border: "1px solid #ffffff20",
                      borderRadius: "10px",
                      padding: "15px",
                      textAlign: "left"
                    }}>
                      <h3 style={{ fontSize: "16px" }}>{item.title}</h3>
                      <p style={{
                        color: "#cbd5e1",
                        fontSize: "13px",
                        lineHeight: 1.5
                      }}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGISTRATION PREVIEW */}
              {showRegistration && (
                <div id="preview-registration" style={{
                  padding: "25px 18px",
                  textAlign: "center",
                  background: "#ffffff08"
                }}>
                  <h2>Tournament Registration</h2>

                  <p style={{ color: "#cbd5e1", fontSize: "13px" }}>
                    Fill in your details to register.
                  </p>

                  <form
                    onSubmit={submitRegistration}
                    style={{
                      maxWidth: "440px",
                      margin: "auto",
                      textAlign: "left"
                    }}
                  >
                    <label style={labelStyle}>Player Name</label>
                    <input
                      style={fieldStyle}
                      required
                      maxLength={100}
                      value={registration.playerName}
                      onChange={e => updateRegistration("playerName", e.target.value)}
                      placeholder="Enter your name"
                    />

                    <label style={labelStyle}>Email Address</label>
                    <input
                      style={fieldStyle}
                      type="email"
                      required
                      maxLength={254}
                      value={registration.email}
                      onChange={e => updateRegistration("email", e.target.value)}
                      placeholder="Enter your email"
                    />

                    <label style={labelStyle}>Gaming Username</label>
                    <input
                      style={fieldStyle}
                      required
                      maxLength={50}
                      value={registration.gamingUsername}
                      onChange={e => updateRegistration("gamingUsername", e.target.value)}
                      placeholder="Enter gaming username"
                    />

                    <label style={labelStyle}>Game Name</label>
                    <input
                      style={fieldStyle}
                      required
                      maxLength={80}
                      value={registration.gameName}
                      onChange={e => updateRegistration("gameName", e.target.value)}
                      placeholder="Enter game name"
                    />

                    <label style={labelStyle}>Mobile Number</label>
                    <input
                      style={fieldStyle}
                      type="tel"
                      required
                      maxLength={20}
                      value={registration.mobileNumber}
                      onChange={e => updateRegistration("mobileNumber", e.target.value)}
                      placeholder="Enter mobile number"
                    />

                    <button
                      type="submit"
                      disabled={registering}
                      style={{
                        ...buttonStyle,
                        width: "100%",
                        opacity: registering ? 0.7 : 1
                      }}
                    >
                      {registering ? "Submitting..." : "Submit Registration"}
                    </button>

                    {registrationMessage && (
                      <p role="status" style={{
                        color: "#c4b5fd",
                        fontSize: "13px",
                        lineHeight: 1.6
                      }}>
                        {registrationMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}

              {/* ABOUT */}
              <div style={{
                padding: "25px 18px",
                textAlign: "center",
                background: "#ffffff08"
              }}>
                <h2>{aboutHeading}</h2>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
                  {aboutText}
                </p>
              </div>

              <div style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "12px"
              }}>
                © {new Date().getFullYear()} {siteName}
              </div>
            </div>
          </div>

          {notice && (
            <p style={{
              color: "#a5b4fc",
              fontSize: "13px",
              overflowWrap: "anywhere"
            }}>
              {notice}
            </p>
          )}
        </section>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        @media(max-width:760px) {
          .studio-grid {
            grid-template-columns: minmax(0,1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
