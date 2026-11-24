
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API Key is missing in Cloudflare." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const prompt = String(body.prompt || body.idea || "").trim();

    if (!prompt) {
      return Response.json(
        { error: "Please enter your website idea." },
        { status: 400 }
      );
    }

    const aiPrompt = `You are an expert professional website designer.

Create a unique website design based on this idea:
${prompt}

Return ONLY valid JSON with these exact fields:
{
  "siteName": "Website name",
  "heading": "Main heading",
  "description": "Website description",
  "buttonText": "Button text",
  "bgColor": "#111827",
  "accent": "#7c3aed"
}

Use attractive original content. Colors must be valid hex colors.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: aiPrompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "Gemini API request failed." },
        { status: response.status }
      );
    }

    let text = data.output_text;

    if (!text) {
      return Response.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    text = text.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    const result = JSON.parse(text);

    return Response.json({
      success: true,
      ...result
    });

  } catch (error) {
    return Response.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
