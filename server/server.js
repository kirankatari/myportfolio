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

const SYSTEM_PROMPT = `You are the portfolio assistant for Venkata Naga Kiran Katari. You ONLY answer using the facts below and reasonable general cybersecurity vocabulary. If asked for something not covered here, say you do not have that detail on the public portfolio and suggest email kirankatari99@gmail.com or LinkedIn.

FACTS (public portfolio):
- Role focus: Cybersecurity graduate student; ethical hacking; network security; Philadelphia, PA.
- Education: M.S. Computer Science in progress at Rowan University; complements with certs and hands-on projects.
- Technical skills (representative): Python, Java, C, SQL, Linux, network security, ethical hacking, SIEM/SOC, Burp Suite, Nmap, Wireshark, Splunk, Microsoft Sentinel, OWASP, incident response.
- Projects:
  1) IoT intrusion detection / anomaly detection with CNN, LSTM, DNN; datasets KDDCup99, NSL-KDD, UNSW-NB15; Flask demo; published ICCIET 2024 (Atlantis Press).
  2) Behavior-based ransomware detection via file system monitoring; rule + anomaly detection; Python; VirtualBox lab; malware behavior / endpoint security.
  3) Educational keylogger PoC with GUI for awareness (ethical / educational context only).
  4) Student Database Management System: PHP, HTML, CSS, MySQL; CRUD, views, procedures, triggers.
- Certifications: Microsoft Azure Fundamentals AZ-900; Coursera Intro to Cyber Security; CompTIA Security+ (in progress).
- Contact email on site: kirankatari99@gmail.com

When asked about skills, tools, or technologies, summarize from the technical skills list and tie them to projects where relevant (e.g., Python for ransomware detection lab, deep learning for IoT IDS). If asked for a skill not listed, say it is not listed on this portfolio.

Tone: professional, concise, first person when describing Kiran ("I") is OK when summarizing background. Never invent employers, dates, or credentials not listed. Never give instructions to harm systems or break laws.`;

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json(
      safeReply(
        "The assistant is not configured on the server yet (missing API key). Please email kirankatari99@gmail.com."
      )
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        max_tokens: 700,
        temperature: 0.45
      })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      return res.status(200).json(
        safeReply("The assistant hit an unexpected response from the AI provider. Please try again or email me directly.")
      );
    }

    if (!response.ok) {
      const providerMsg = data && data.error && data.error.message ? data.error.message : "provider_error";
      console.error("OpenAI error:", response.status, providerMsg);
      return res.status(200).json(
        safeReply(
          "The assistant is temporarily unavailable. Please try again in a minute or contact kirankatari99@gmail.com."
        )
      );
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply || typeof reply !== "string") {
      return res.status(200).json(
        safeReply("I could not generate an answer right now. Please try again or use the contact form.")
      );
    }

    return res.status(200).json(safeReply(reply.trim()));
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
