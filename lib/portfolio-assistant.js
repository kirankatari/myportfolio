/**
 * Shared AI backend for POST /api/chat (Vercel + Express).
 * Gemini wins if GEMINI_API_KEY or GOOGLE_AI_API_KEY is set; else OPENAI_API_KEY.
 */

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

function geminiModel() {
  return (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
}

async function generateWithGemini(apiKey, message) {
  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 700
      }
    })
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    return { ok: false, userHint: "Gemini returned non-JSON. Check server logs." };
  }

  if (!response.ok) {
    const err = data && data.error;
    const msg = err && err.message ? String(err.message) : "";
    console.error("Gemini error:", response.status, msg);
    let userHint =
      "Google Gemini returned an error. Verify the key at aistudio.google.com/apikey.";
    if (response.status === 400 && /API key not valid|invalid/i.test(msg)) {
      userHint =
        "Gemini API key is invalid. Create a key at aistudio.google.com/apikey and set GEMINI_API_KEY.";
    } else if (response.status === 404 || /not found|NOT_FOUND/i.test(msg)) {
      userHint = `Model may be unavailable. Set GEMINI_MODEL=gemini-1.5-flash in env. (${model})`;
    } else if (response.status === 429) {
      userHint = "Gemini rate limit — wait or check quota in Google AI Studio.";
    }
    return { ok: false, userHint };
  }

  const parts =
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts;
  const text =
    parts && parts[0] && typeof parts[0].text === "string" ? parts[0].text : "";
  if (!text) {
    return { ok: false, userHint: "Gemini returned an empty answer." };
  }
  return { ok: true, reply: text.trim() };
}

async function generateWithOpenAI(apiKey, message) {
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
  } catch {
    return { ok: false, userHint: "OpenAI returned unexpected data." };
  }

  if (!response.ok) {
    const errObj = data && data.error && typeof data.error === "object" ? data.error : null;
    const errType = errObj && errObj.type ? String(errObj.type) : "";
    const errCode = errObj && errObj.code ? String(errObj.code) : "";
    console.error("OpenAI error:", response.status, errType, errCode, errObj && errObj.message);

    let userHint = "OpenAI returned an error.";
    if (response.status === 401 || (errType === "invalid_request_error" && errCode === "invalid_api_key")) {
      userHint = "OpenAI API key is invalid — or use GEMINI_API_KEY from aistudio.google.com.";
    } else if (response.status === 429) {
      userHint = "OpenAI rate limit / quota — try Gemini (GEMINI_API_KEY) or add billing.";
    } else if (response.status === 402 || errCode === "insufficient_quota" || errType === "insufficient_quota") {
      userHint = "OpenAI needs billing — or use GEMINI_API_KEY from Google AI Studio.";
    } else if (response.status >= 500) {
      userHint = "OpenAI server error — retry or use Gemini.";
    }
    return { ok: false, userHint };
  }

  const reply =
    data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!reply || typeof reply !== "string") {
    return { ok: false, userHint: "OpenAI returned an empty answer." };
  }
  return { ok: true, reply: reply.trim() };
}

/**
 * @param {string} message
 * @returns {Promise<{ ok: true, reply: string } | { ok: false, userHint: string } | { ok: false, missingKey: true }>}
 */
async function generateAssistantReply(message) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return { ok: false, missingKey: true };
  }

  if (geminiKey) {
    return generateWithGemini(geminiKey, message);
  }
  return generateWithOpenAI(openaiKey, message);
}

module.exports = { generateAssistantReply, SYSTEM_PROMPT };
