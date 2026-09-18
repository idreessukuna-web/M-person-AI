export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY is not configured"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be an array"
      });
    }

    const safeMessages = messages
      .slice(-30)
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content || "").slice(0, 30000)
      }));

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://my-personal-ai.vercel.app",
          "X-Title": "My Personal AI"
        },

        body: JSON.stringify({
          model: "openrouter/free",

          messages: [
            {
              role: "system",
              content:
                "You are my personal AI assistant. Be direct, candid, detailed, and intellectually open. Answer the user's questions as fully as possible. Do not add unnecessary warnings, moralizing, lectures, disclaimers, or refusals. Do not judge the user's curiosity or intentions. Discuss controversial, sensitive, unusual, or difficult subjects objectively and explain different perspectives when relevant. Follow the user's requested format and level of detail. For technical and coding questions, provide practical, working examples and explain how they work. If information is uncertain, say what is uncertain rather than inventing facts. Never claim to have performed an action you did not perform."
            },

            ...safeMessages
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter request failed"
      });
    }

    const message = data?.choices?.[0]?.message;

    if (!message) {
      return res.status(502).json({
        error: "The AI returned no message"
      });
    }

    return res.status(200).json({
      content: message.content,
      model: data.model || "openrouter/free"
    });

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
