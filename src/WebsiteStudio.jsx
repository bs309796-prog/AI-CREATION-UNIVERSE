
import React, { useState } from "react";
import {
  Monitor, Smartphone, Type, Download, Sparkles,
  Eye, Globe, ArrowLeft, Image as ImageIcon, Layout,
  Layers, Plus, Palette, Upload, Trash2
} from "lucide-react";

export default function WebsiteStudio({ onBack }) {
  const [siteName, setSiteName] = useState("My Website");
  const [heading, setHeading] = useState("Build Something Amazing.");
  const [description, setDescription] = useState(
    "Create your future with our powerful digital solutions."
  );
  const [buttonText, setButtonText] = useState("Get Started");
  const [bgColor, setBgColor] = useState("#111827");
  const [accent, setAccent] = useState("#8b5cf6");

  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [aboutHeading, setAboutHeading] = useState("About Our Website");
  const [aboutText, setAboutText] = useState(
    "We create amazing experiences with creativity, technology and innovation."
  );

  const [features, setFeatures] = useState([
    { title: "Creative Design", text: "Beautiful designs made for your audience." },
    { title: "Powerful Features", text: "Everything you need in one place." },
    { title: "Built for Everyone", text: "Enjoy a smooth experience on every device." }
  ]);

  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [generating, setGenerating] = useState(false);

  const activeImage = uploadedImage || imageUrl.trim();

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
        throw new Error(data.error || "Gemini AI could not create the website.");
      }

      setSiteName(data.siteName || "My New Website");
      setHeading(data.heading || "Turn Your Ideas Into Reality.");
      setDescription(data.description || "Welcome to your new website.");
      setButtonText(data.buttonText || "Explore Now");
      setBgColor(data.bgColor || "#111827");
      setAccent(data.accent || "#7c3aed");

      setNotice("Gemini AI created your website successfully!");
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
    setFeatures((old) =>
      old.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addFeature() {
    setFeatures((old) => [
      ...old,
      { title: "New Feature", text: "Describe this feature here." }
    ]);
  }

  function removeFeature(index) {
    setFeatures((old) => old.filter((_, i) => i !== index));
  }

  function exportWebsite() {
    const esc = (value) =>
      String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

    const featureHTML = features.map((item) => `
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

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="${esc(bgColor)}">
<title>${esc(siteName)}</title>
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth;width:100%;overflow-x:hidden}
body{margin:0;width:100%;min-height:100vh;overflow-x:hidden;font-family:Arial,Helvetica,sans-serif;background:${bgColor};color:white}
nav{width:100%;padding:20px clamp(18px,6vw,80px);display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;border-bottom:1px solid #ffffff20}
.brand{font-size:22px;font-weight:bold;overflow-wrap:anywhere}
.nav-links{display:flex;gap:22px;flex-wrap:wrap}
.nav-links a{color:#d1d5db;text-decoration:none;font-size:14px}
.hero{width:100%;min-height:540px;padding:85px 22px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.hero h1{width:100%;max-width:950px;font-size:clamp(38px,7vw,76px);line-height:1.12;margin:0 auto 24px;overflow-wrap:anywhere}
.hero p{width:100%;max-width:720px;font-size:clamp(16px,2vw,20px);line-height:1.8;color:#d1d5db;margin:0 auto}
.cta{display:inline-block;margin-top:32px;padding:16px 32px;background:${accent};color:white;text-decoration:none;border-radius:10px;font-weight:bold}
.section{width:100%;padding:75px clamp(20px,7vw,90px);text-align:center}
.section h2{font-size:clamp(28px,4vw,42px);margin:0 0 18px}
.section-intro{color:#cbd5e1;line-height:1.7;max-width:700px;margin:0 auto 35px}
.features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1150px;margin:auto}
.feature-card{background:#ffffff0d;border:1px solid #ffffff20;border-radius:16px;padding:30px 22px;text-align:left}
.feature-icon{font-size:30px;color:${accent};margin-bottom:16px}
.feature-card h3{font-size:21px;margin:0 0 12px}
.feature-card p{color:#cbd5e1;line-height:1.7;margin:0}
.image-section{padding:10px 20px 65px;text-align:center}
.image-section img{display:block;width:100%;max-width:1000px;max-height:520px;object-fit:cover;border-radius:18px;margin:auto}
.about{background:#ffffff08}
.about p{max-width:750px;margin:auto;color:#d1d5db;font-size:17px;line-height:1.9}
footer{padding:30px 20px;text-align:center;border-top:1px solid #ffffff20;color:#9ca3af;font-size:14px}
@media(max-width:700px){
 nav{align-items:flex-start;flex-direction:column}
 .nav-links{gap:16px}
 .hero{min-height:470px;padding:65px 22px}
 .features{grid-template-columns:1fr}
 .section{padding:55px 20px}
}
</style>
</head>
<body>
<nav>
  <div class="brand">${esc(siteName)}</div>
  <div class="nav-links">
    <a href="#home">Home</a>
    <a href="#features">Features</a>
    <a href="#about">About</a>
  </div>
</nav>
<main>
<section class="hero" id="home">
  <h1>${esc(heading)}</h1>
  <p>${esc(description)}</p>
  <a class="cta" href="#features">${esc(buttonText)}</a>
</section>
${imageHTML}
<section class="section" id="features">
  <h2>Our Features</h2>
  <p class="section-intro">Discover what makes our experience special.</p>
  <div class="features">${featureHTML}</div>
</section>
<section class="section about" id="about">
  <h2>${esc(aboutHeading)}</h2>
  <p>${esc(aboutText)}</p>
</section>
</main>
<footer>© ${new Date().getFullYear()} ${esc(siteName)}. All rights reserved.</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-website.html";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice("Your complete website HTML is ready to download!");
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
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your website idea..."
            rows={4}
            style={fieldStyle}
          />
          <button
            onClick={generateLayout}
            disabled={generating}
            style={{ ...buttonStyle, width: "100%", opacity: generating ? 0.7 : 1 }}
          >
            <Sparkles size={16} />
            {generating ? "Generating with Gemini AI..." : "Generate with Gemini AI"}
          </button>

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          <h3><Type size={18} /> Main Website</h3>

          <label style={labelStyle}>Website Name</label>
          <input style={fieldStyle} value={siteName} onChange={(e) => setSiteName(e.target.value)} />

          <label style={labelStyle}>Main Heading</label>
          <textarea style={fieldStyle} rows={2} value={heading} onChange={(e) => setHeading(e.target.value)} />

          <label style={labelStyle}>Description</label>
          <textarea style={fieldStyle} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

          <label style={labelStyle}>Button Text</label>
          <input style={fieldStyle} value={buttonText} onChange={(e) => setButtonText(e.target.value)} />

          <h3><Palette size={18} /> Colors</h3>
          <label style={labelStyle}>Background Color</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ ...fieldStyle, height: "45px", padding: "4px" }} />

          <label style={labelStyle}>Accent Color</label>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ ...fieldStyle, height: "45px", padding: "4px" }} />

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

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
            onChange={(e) => {
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
                onChange={(e) => updateFeature(index, "title", e.target.value)}
              />
              <label style={labelStyle}>Card Description</label>
              <textarea
                style={fieldStyle}
                rows={2}
                value={feature.text}
                onChange={(e) => updateFeature(index, "text", e.target.value)}
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

          <h3><Layout size={18} /> About Section</h3>
          <label style={labelStyle}>About Heading</label>
          <input style={fieldStyle} value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)} />
          <label style={labelStyle}>About Description</label>
          <textarea style={fieldStyle} rows={4} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
        </section>

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
              <button onClick={() => setMobile(false)} style={{
                padding: "8px",
                borderRadius: "7px",
                border: "1px solid #475569",
                background: mobile ? "#111827" : "#7c3aed",
                color: "white"
              }}>
                <Monitor size={17} />
              </button>
              <button onClick={() => setMobile(true)} style={{
                padding: "8px",
                borderRadius: "7px",
                border: "1px solid #475569",
                background: mobile ? "#7c3aed" : "#111827",
                color: "white"
              }}>
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
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Home　 Features　 About</span>
              </div>

              <div style={{
                minHeight: "330px",
                padding: "55px 8%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}>
                <h1 style={{
                  width: "100%",
                  maxWidth: "900px",
                  fontSize: mobile ? "clamp(30px,8vw,42px)" : "clamp(34px,4vw,58px)",
                  lineHeight: 1.15,
                  overflowWrap: "anywhere",
                  margin: "0 0 20px"
                }}>{heading}</h1>
                <p style={{
                  width: "100%",
                  maxWidth: "600px",
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "#d1d5db",
                  margin: 0
                }}>{description}</p>
                <button style={{
                  background: accent,
                  color: "white",
                  border: 0,
                  borderRadius: "9px",
                  padding: "14px 25px",
                  marginTop: "22px",
                  fontWeight: "bold"
                }}>{buttonText}</button>
              </div>

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
                      <p style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "25px 18px", textAlign: "center", background: "#ffffff08" }}>
                <h2>{aboutHeading}</h2>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{aboutText}</p>
              </div>

              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "12px" }}>
                © {new Date().getFullYear()} {siteName}
              </div>
            </div>
          </div>

          {notice && (
            <p style={{ color: "#a5b4fc", fontSize: "13px", overflowWrap: "anywhere" }}>
              {notice}
            </p>
          )}
        </section>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media(max-width:760px) {
          .studio-grid { grid-template-columns: minmax(0,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
