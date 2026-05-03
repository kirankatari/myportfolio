/**
 * Portfolio assistant API — satisfies professor requirements:
 * - API key read only from environment / server-side file (.env), never exposed to HTML/JS source
 * - POST /api/chat proxied through Nginx on same domain (not a separate public API port)
 * - Custom system prompt (not default chat behavior)
 * - Errors return JSON with a safe { reply } string (no stack traces to the browser)
 */

const path = require("path");
const fs = require("fs");
const express = require("express");
const { generateAssistantReply } = require("../lib/portfolio-assistant");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(__dirname, ".env");

// Load .env without extra dependency (simple KEY=VAL lines)
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].replace(/^["']|["']$/g, "");
      process.env[m[1]] = v;
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const app = express();
app.use(express.json({ limit: "32kb" }));

function safeReply(text) {
  return { reply: String(text || "").slice(0, 8000) };
}

app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const message = req.body && typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    return res.status(200).json(safeReply("Please type a question about my background, skills, or projects."));
  }

  try {
    const result = await generateAssistantReply(message);
    if (result.missingKey) {
      return res.status(200).json(
        safeReply(
          "The assistant is not configured (add GEMINI_API_KEY or OPENAI_API_KEY to server/.env). kirankatari99@gmail.com"
        )
      );
    }
    if (!result.ok) {
      return res.status(200).json(safeReply(`${result.userHint} kirankatari99@gmail.com`));
    }
    return res.status(200).json(safeReply(result.reply));
  } catch (err) {
    console.error("api/chat exception:", err && err.message ? err.message : err);
    return res.status(200).json(
      safeReply(
        "The assistant is temporarily unavailable. Please try again later or email kirankatari99@gmail.com."
      )
    );
  }
});

// Static portfolio (index.html, images/, CV) — after API route
app.use(express.static(rootDir));

app.listen(PORT, HOST, () => {
  console.log(`Portfolio server http://${HOST}:${PORT} (static + POST /api/chat)`);
});
