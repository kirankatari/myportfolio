# Portfolio assignment — professor rubric alignment

Use this for documentation points and your own checklist before submission.

## Tier 1 — Infrastructure (verify on your VPS)

| Requirement | What you must show / do |
|-------------|-------------------------|
| Live public URL | Site loads over the internet (not only localhost). |
| Custom domain + DNS | `A` record (and `AAAA` if used) points to your server. |
| SSL / Let’s Encrypt | Browser shows valid HTTPS (padlock). |
| HTTP → HTTPS | `http://` requests **301** to `https://`. |
| Firewall | UFW (or equivalent): only **22, 80, 443** (adjust if your host requires another admin port). |
| Web server | Nginx or Apache with proper server blocks / virtual host. |

## Tier 2 — AI integration

| Requirement | How this project satisfies it |
|-------------|-------------------------------|
| Server-side API | `server/server.js` handles `POST /api/chat`. The **OpenAI key is only in `.env` on the server**, never in HTML or browser JavaScript. |
| Contextual feature | Assistant answers questions **about your portfolio** (education, skills, projects, certs)—not a generic unrelated chatbot. |
| Custom system prompt | Defined in `server/server.js` as `SYSTEM_PROMPT` (grounded facts + behavior rules). |
| Error handling | Failures return **JSON** with a polite `reply` string—no stack traces or blank responses. |
| Nginx proxy | `deployment/nginx-site-example.conf` shows `/api/` proxied to `127.0.0.1:3000` so the Node port is not the public entry point. |

**Approved providers:** This example uses **OpenAI** (`gpt-4o-mini`). You may adapt the fetch URL and payload for **Anthropic**, **Gemini**, or **Cohere** while keeping the key server-side only.

## Tier 3 — Documentation & LinkedIn

1. **Tech stack manifest** (fill in your actual versions after deploy):

   - **OS:** e.g. Ubuntu 24.04 LTS  
   - **Web server:** Nginx (version from `nginx -v`)  
   - **SSL:** Let’s Encrypt (Certbot)  
   - **Firewall:** UFW  
   - **Runtime:** Node.js (e.g. 20.x) for `server/server.js`  
   - **AI provider:** OpenAI API, model `gpt-4o-mini`  
   - **Site:** Static HTML + Express for `/api/chat` behind Nginx  

2. **Written explanation (short paragraph):**  
   The AI feature is a portfolio Q&amp;A assistant. Visitors ask about your background; the browser sends only the question to **`POST /api/chat`** on the same domain. Nginx forwards that path to a small Node process that adds a **custom system prompt** with your public facts and calls the provider. The **API key never leaves the server**.

3. **Screenshot:** Your live HTTPS URL with the **floating chat** or **Ask About My Background** section showing a real answer.

4. **LinkedIn:** Post or Project entry with screenshot, link to the live site, tags such as `#Linux #Nginx #SSL #WebOps #AI #APIIntegration #PromptEngineering`.

## Deploy steps (summary)

1. Copy the whole project (including `index.html`, `images/`, `CV-KIRAN.pdf`, `server/`) to the VPS.  
2. On the server: `cd server && npm install && cp .env.example .env` then edit `.env` with your real key.  
3. Run with systemd or PM2: `node server.js` (listens on `127.0.0.1:3000` by default).  
4. Point Nginx `root` at the folder that contains `index.html` (repo root), and use the `/api/` `proxy_pass` block.  
5. `sudo ufw allow 22,80,443/tcp` and enable UFW after SSH is confirmed.  
6. Obtain certificates with Certbot and enable the HTTPS server block.

## Files to submit / push to GitHub

- `index.html` and assets (`images/`, resume PDF).  
- `server/` (especially `server.js`, `package.json`, `.env.example` — **not** `.env`).  
- `deployment/nginx-site-example.conf` and this `SUBMISSION.md` for graders.
