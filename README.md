# Venkata Naga Kiran Katari — Cybersecurity Portfolio

**Your site is this repository’s own `index.html`** (your layout, theme, sections, and **floating AI chat only**). Do **not** replace it with anyone else’s HTML/CSS/JS.

This README doubles as **documentation for CS 07695 / CS 10342 — Web Server Platforms** (Professor Steven Singer): how this repo satisfies the **Final Practical** rubric (infrastructure, AI integration, polish).

---

## How this project maps to the rubric (150 pts)

### Tier 1 — Infrastructure (50 pts)

| Requirement | How you satisfy it (what to show / configure) |
|-------------|-----------------------------------------------|
| Live hosting + public URL | Deploy this repo to a VPS or host; submit the **HTTPS** URL on Canvas. |
| Custom domain + DNS | Point your domain’s **A/AAAA** (or CNAME) records to the server’s IP / load balancer. |
| SSL/TLS (Let’s Encrypt) | Use **Certbot** with Nginx; browser shows a valid certificate (padlock). |
| HTTP → HTTPS **301** | First `server` block listens on **80** and returns `301` to `https://$host$request_uri`. See `nginx-portfolio.conf`. |
| Firewall (UFW or equivalent) | Allow only **22, 80, 443** (SSH, HTTP for challenge/redirect, HTTPS). |
| Web server (Nginx) | Nginx serves `index.html` and routes **`POST /api/chat`** to PHP **or** proxies to Node — not a raw public app port for the API. |

**Files in this repo:** `nginx-portfolio.conf` (PHP-FPM path), `deployment/nginx-site-example.conf` (Node proxy path).

### Tier 2 — AI integration (70 pts)

| Requirement | How this repo implements it |
|-------------|-----------------------------|
| Server-side API call; **key never in browser** | OpenAI is called from **`api/chat.php`** (key in `api/config.local.php` on server only) **or** from **`server/server.js`** (key in `server/.env`). Frontend only calls **`POST /api/chat`** on the **same origin**. |
| Contextual feature (not generic) | **Portfolio assistant:** answers questions about **your** skills, projects, education, and certs, grounded in a **custom system prompt** — the pattern the slides describe for a portfolio site. |
| Custom system prompt | Defined in **`api/chat.php`** and **`server/server.js`** (tuned instructions + FACTS block). |
| Graceful errors | Missing key, network failures, and bad API responses return **JSON** with a friendly `reply` string — not a PHP stack trace or blank page. |
| Nginx proxy / routing | Browser hits **`/api/chat`** on your domain; Nginx forwards to PHP-FPM or to **127.0.0.1:3000** — the API is not meant to be a separate public port for grading. |

**Approved providers (per syllabus):** This project uses **OpenAI `gpt-4o-mini`** by default; you may adapt `api/chat.php` for Anthropic, Gemini, or Cohere if you keep the same security pattern.

### Tier 3 — Professional polish (30 pts)

| Requirement | What to submit / publish |
|-------------|---------------------------|
| **Tech stack manifest** | Fill the table below after deploy (exact OS and PHP/Node versions). |
| **Written explanation of AI feature** | Use the subsection **“AI feature — paragraph for Canvas”** below (copy or expand). |
| **Screenshot** | Capture your **live** site with the chat open and a visible answer (include URL bar if possible). |
| **LinkedIn** | Post or Project entry with screenshot, **link to live URL**, tags: `#Linux` `#Nginx` `#SSL` `#WebOps` `#AI` `#APIIntegration` `#PromptEngineering` |

**Course deadlines (from syllabus materials):** confirm exact Canvas time on your course page; slides reference **May 3, 2026** and **April 28** in different places — use whatever your Canvas assignment states.

---

## Tech stack manifest (fill versions after deploy)

| Layer | Your deployment |
|--------|------------------|
| **OS** | e.g. Ubuntu 24.04 LTS |
| **Web server** | Nginx |
| **SSL** | Let’s Encrypt (Certbot), HTTP → HTTPS 301 |
| **Firewall** | UFW (or equivalent): ports **22, 80, 443** |
| **Runtime** | **PHP 8.x** + **php-fpm** + **php-curl** *or* **Node.js** + Express (`server/`) |
| **AI** | OpenAI **gpt-4o-mini** (or other approved provider if you adapt `api/chat.php`) |
| **Frontend** | HTML5, CSS, JS (single `index.html`) |

---

## AI feature — paragraph for Canvas (documentation)

Visitors use a **floating chat widget** on the portfolio. They ask questions about my **background, skills, projects, education, and certifications**. The browser sends a JSON **`POST`** to **`/api/chat`** on the same domain (no API key in HTML or JavaScript). **Nginx** routes that request to a **server-side** script (**PHP** or **Node**), which applies a **custom system prompt** that only uses facts from my public portfolio, calls the **OpenAI** API, and returns JSON. If the provider is down, the key is missing, or the request fails, the user still sees a **polite message** instead of an error page or stack trace. I built it this way to meet the course requirement for a **contextual**, **secure** AI feature and to give recruiters a quick way to learn about my profile.

---

## AI feature (technical)

Visitors use the **floating chat** to ask about your **skills, projects, education, and certifications**. The page sends JSON to the **same origin**:

```http
POST /api/chat
Content-Type: application/json

{"message":"What skills do you have with Splunk?"}
```

The PHP script (or Node server) owns a **custom system prompt** (grounded in your portfolio), calls OpenAI, and returns JSON. On failure it returns a **friendly message**, not a PHP error page.

Supported payloads (either works):

- `{ "message": "..." }` — used by this `index.html`
- `{ "messages": [ { "role": "user", "content": "..." } ] }` — OpenAI-style history

---

## Setup on the VPS (PHP path — matches `nginx-portfolio.conf`)

1. Clone or upload this repo to e.g. **`/var/www/portfolio`** (same folder must contain `index.html` and **`api/`**).
2. Install **Nginx**, **PHP-FPM**, **php-curl** (e.g. `sudo apt install nginx php-fpm php-curl`).
3. Copy **`nginx-portfolio.conf`**, edit **`server_name`**, **`root`**, **SSL paths**, and **`fastcgi_pass`** socket (`/run/php/php8.x-fpm.sock`).
4. In **`api/`**:
   ```bash
   cp config.example.php config.local.php
   nano config.local.php   # set openai_api_key => 'sk-...'
   ```
5. **Never commit `api/config.local.php`.** It is listed in `.gitignore`.
6. Reload Nginx: `sudo nginx -t && sudo systemctl reload nginx`

## Alternative: Node backend

If you prefer **Express** instead of PHP, use the **`server/`** folder (`npm install`, `server/.env` with `OPENAI_API_KEY`), and point Nginx `location /api/` to `http://127.0.0.1:3000` (see `deployment/nginx-site-example.conf`). Use **either** PHP **or** Node on production, not both, unless you use different paths.

---

## GitHub checklist (before you submit)

- [ ] Repo includes `index.html`, resume PDF (`CV-KIRAN.pdf`), `api/chat.php`, `api/config.example.php`, `nginx-portfolio.conf`, `README.md`
- [ ] **No** real API key in git (only `config.local.php` or `.env` on server)
- [ ] Live **HTTPS** URL for grading + **screenshot** + **LinkedIn** post with `#Linux #Nginx #SSL #WebOps #AI #APIIntegration #PromptEngineering`

**Note:** Optional hero photo: you may add `images/cyber-bg.jpg` later; the current `index.html` hero uses CSS gradients so the page looks correct without that file.
