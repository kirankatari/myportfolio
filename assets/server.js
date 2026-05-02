import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a professional AI assistant for Venkata Naga Kiran Katari.

Only answer using this portfolio information:

- Cybersecurity graduate student at Rowan University
- Skills: Python, Java, C, SQL, Linux, Network Security, Ethical Hacking, SIEM, Splunk
- Tools: Burp Suite, Nmap, Wireshark
- Projects:
  1. IoT Intrusion Detection using CNN, LSTM, DNN (published ICCIET 2024)
  2. Keylogger project (educational purpose)
  3. Student Database Management System (PHP + MySQL)

Rules:
- Keep answers short (2–5 lines)
- Be professional
- If question is unrelated, say: "Please ask about my skills, projects, or experience."
`
          },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response available."
    });

  } catch (error) {
    res.json({
      reply: "Sorry, something went wrong. Please try again later."
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
