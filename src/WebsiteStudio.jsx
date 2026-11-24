
import React, { useState } from "react";
import {
  Monitor, Smartphone, Type, Download,
  Sparkles, Eye, Globe, ArrowLeft
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
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [generating, setGenerating] = useState(false);

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Gemini AI could not create the website."
        );
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

  function exportWebsite() {
    const escapeHTML = (value) =>
      String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(siteName)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:${bgColor};color:white}
header{padding:25px 8%;font-size:22px;font-weight:bold}
main{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px}
h1{font-size:clamp(36px,7vw,68px);max-width:850px}
p{font-size:18px;line-height:1.7;color:#d1d5db;max-width:650px}
a{display:inline-block;margin-top:20px;padding:15px 30px;border-radius:9px;background:${accent};color:white;text-decoration:none;font-weight:bold}
</style>
</head>
<body>
<header>${escapeHTML(siteName)}</header>
<main>
<h1>${escapeHTML(heading)}</h1>
<p>${escapeHTML(description)}</p>
<a href="#">${escapeHTML(buttonText)}</a>
</main>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-website.html";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("HTML file export started!");
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "9px",
    border: "1px solid #374151",
    background: "#111827",
    color: "white",
    marginTop: "7px",
    marginBottom: "15px",
    fontSize: "14px"
  };

  const buttonStyle = {
    background: "#7c3aed",
    color: "white",
    border: 0,
    borderRadius: "9px",
    padding: "12px 18px",
    cursor: "pointer"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b18",
      color: "white",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
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
          <small style={{ color: "#9ca3af" }}>
            Powered by Gemini AI
          </small>
        </div>

        <button onClick={exportWebsite} style={buttonStyle}>
          <Download size={16} /> Export HTML
        </button>
      </div>

      <div className="studio-grid" style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
        gap: "20px"
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
            style={{
              ...buttonStyle,
              width: "100%",
              padding: "13px",
              fontWeight: "bold",
              opacity: generating ? 0.7 : 1,
              cursor: generating ? "wait" : "pointer"
            }}
          >
            <Sparkles size={16} />
            {generating ? "Generating with Gemini AI..." : "Generate with Gemini AI"}
          </button>

          <hr style={{ borderColor: "#374151", margin: "22px 0" }} />

          <h3><Type size={18} /> Edit Website</h3>

          <label>Website Name</label>
          <input
            style={fieldStyle}
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />

          <label>Main Heading</label>
          <textarea
            style={fieldStyle}
            rows={2}
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
          />

          <label>Description</label>
          <textarea
            style={fieldStyle}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>Button Text</label>
          <input
            style={fieldStyle}
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
          />

          <label>Background Color</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{ ...fieldStyle, height: "45px", padding: "4px" }}
          />

          <label>Accent Color</label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            style={{ ...fieldStyle, height: "45px", padding: "4px" }}
          />
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
            overflow: "auto"
          }}>
            <div style={{
              width: mobile ? "375px" : "100%",
              maxWidth: "100%",
              minHeight: "475px",
              background: bgColor,
              color: "white",
              borderRadius: mobile ? "18px" : "5px",
              overflow: "hidden",
              transition: "width .2s"
            }}>
              <div style={{
                padding: "22px 7%",
                fontSize: "20px",
                fontWeight: "bold",
                borderBottom: "1px solid #ffffff20"
              }}>
                <Globe size={18} /> {siteName}
              </div>

              <div style={{
                minHeight: "390px",
                padding: "45px 8%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}>
                <h1 style={{
                  fontSize: mobile ? "32px" : "clamp(30px, 4vw, 58px)",
                  lineHeight: 1.15,
                  margin: "0 0 20px"
                }}>
                  {heading}
                </h1>

                <p style={{
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "#d1d5db",
                  maxWidth: "600px"
                }}>
                  {description}
                </p>

                <button style={{
                  background: accent,
                  color: "white",
                  border: 0,
                  borderRadius: "9px",
                  padding: "14px 25px",
                  marginTop: "20px",
                  fontWeight: "bold"
                }}>
                  {buttonText}
                </button>
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
        @media(max-width:760px){
          .studio-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
