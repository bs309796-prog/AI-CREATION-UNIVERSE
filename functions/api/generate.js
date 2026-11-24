
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

    const models = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash"
    ];

    let lastError = "All Gemini models are currently unavailable.";
    let generatedText = "";

    for (const model of models) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            model,
            input: aiPrompt
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        lastError = data.error?.message || `Gemini error: ${response.status}`;

        if (
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          continue;
        }

        return Response.json(
          { error: lastError },
          { status: response.status }
        );
      }

      generatedText = data.output_text ||
        (data.output || [])
          .filter(item => item.type === "text")
          .map(item => item.text || "")
          .join("\n");

      if (generatedText) break;

      lastError = "Gemini returned an empty response.";
    }

    if (!generatedText) {
      return Response.json(
        { error: lastError },
        { status: 503 }
      );
    }

    generatedText = generatedText.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    const result = JSON.parse(generatedText);

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
