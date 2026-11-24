
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

Create a unique, modern, professional website design based on this idea:

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

Use attractive original content. Colors must be valid hex colors.
Do not include Markdown or explanations.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: aiPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: data.error?.message || "Gemini API request failed.",
          status: response.status
        },
        { status: response.status }
      );
    }

    const generatedText = (
      data.candidates?.[0]?.content?.parts || []
    )
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!generatedText) {
      return Response.json(
        {
          error: "Gemini returned an empty response.",
          details: data.candidates?.[0]?.finishReason || "No text returned."
        },
        { status: 502 }
      );
    }

    const cleanedText = generatedText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const result = JSON.parse(cleanedText);

    const requiredFields = [
      "siteName",
      "heading",
      "description",
      "buttonText",
      "bgColor",
      "accent"
    ];

    for (const field of requiredFields) {
      if (typeof result[field] !== "string" || !result[field].trim()) {
        throw new Error(`Invalid or missing field: ${field}`);
      }
    }

    const colorPattern = /^#[0-9a-fA-F]{6}$/;

    if (
      !colorPattern.test(result.bgColor) ||
      !colorPattern.test(result.accent)
    ) {
      throw new Error("Gemini returned invalid color values.");
    }

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
