/**
 * Vercel serverless: POST /api/chat
 * Logic: ../lib/portfolio-assistant.js (GOOGLE_AI_API_KEY, else OpenAI).
 */

const { generateAssistantReply } = require("../lib/portfolio-assistant");

function safeReply(text) {
  return { reply: String(text || "").slice(0, 8000) };
}

async function handleChat(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ...safeReply('Use POST with JSON body { "message": "..." }.'), ok: false });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") {
    body = {};
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return res.status(200).json(safeReply("Please type a question about my background, skills, or projects."));
  }

  try {
    const result = await generateAssistantReply(message);
    if (result.missingKey) {
      return res.status(200).json(
        safeReply(
          "The assistant is not configured. Add OPENAI_API_KEY in Vercel, then Redeploy. kirankatari99@gmail.com"
        )
      );
    }
    if (!result.ok) {
      return res.status(200).json(safeReply(`${result.userHint} You can also email kirankatari99@gmail.com.`));
    }
    return res.status(200).json(safeReply(result.reply));
  } catch (err) {
    console.error("api/chat:", err && err.message ? err.message : err);
    return res.status(200).json(
      safeReply(
        "The assistant is temporarily unavailable. Please try again later or email kirankatari99@gmail.com."
      )
    );
  }
}

module.exports = handleChat;
module.exports.default = handleChat;
