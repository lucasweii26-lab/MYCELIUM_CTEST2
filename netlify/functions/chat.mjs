const MAX_PROMPT_LENGTH = 12000;
const MAX_OUTPUT_TOKENS = 500;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function getTextContent(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not configured in the Netlify runtime.");
    return jsonResponse(503, { error: "AI service is not configured" });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON request" });
  }

  if (typeof payload?.prompt !== "string" || !payload.prompt.trim()) {
    return jsonResponse(400, { error: "A prompt is required" });
  }
  if (payload.prompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse(413, { error: "Prompt is too long" });
  }

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://myceliumresidence.netlify.app",
        "X-Title": "MYCELIUM Smart Community",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: payload.prompt }],
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerStatus = String(data?.error?.code || `HTTP_${upstream.status}`);
      // Log only status metadata. Never log the key, prompt, or raw provider response.
      console.error("OpenRouter rejected request", {
        httpStatus: upstream.status,
        providerStatus,
      });
      return jsonResponse(502, {
        error: "AI provider request failed",
        providerStatus,
      });
    }

    const text = getTextContent(data?.choices?.[0]?.message?.content);
    if (!text) {
      console.error("OpenRouter returned no text content.", {
        model: data?.model || MODEL,
      });
      return jsonResponse(502, { error: "AI provider returned no answer" });
    }

    return jsonResponse(200, { text });
  } catch {
    console.error("OpenRouter network request failed.");
    return jsonResponse(502, {
      error: "AI provider is unavailable",
      providerStatus: "NETWORK_ERROR",
    });
  }
};
