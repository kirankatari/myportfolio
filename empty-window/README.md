# Venkata Naga Kiran Katari — Cybersecurity Portfolio

**Your site is this repository’s own `index.html`** (your layout, theme, sections, and **floating AI chat only**). Do **not** replace it with anyone else’s HTML/CSS/JS.

**Blueprint (deployment only):** For the class rubric, the backend follows the same *kind* of setup many portfolios use: the browser calls **`POST /api/chat`** on your domain, **Nginx** forwards that to **`api/chat.php`**, and the **OpenAI key lives only on the server** (`api/config.local.php`), never in the browser or on GitHub. That pattern is a structural reference—not a copy of another student’s page design.

## Tech stack manifest (fill versions after deploy)

| Layer | Your deployment |
|--------|------------------|
| **OS** | e.g. Ubuntu 24.04 LTS |
| **Web server** | Nginx |
| **SSL** | Let’s Encrypt (Certbot), HTTP → HTTPS 301 |
| **Firewall** | UFW (or equivalent): ports **22, 80, 443** |
| **Runtime** | **PHP 8.x** + **php-fpm** + **cURL** |
| **AI** | OpenAI **gpt-4o-mini** (or other approved provider if you adapt `api/chat.php`) |
| **Frontend** | HTML5, CSS, JS (single `index.html`) |

## AI feature (for class write-up)

Visitors use the **floating chat** to ask about your **skills, projects, education, and certifications**. The page sends JSON to the **same origin**:

```http
POST /api/chat
Content-Type: application/json

{"message":"What skills do you have with Splunk?"}
```

The PHP script owns a **custom system prompt** (grounded in your portfolio), calls OpenAI, and returns JSON. On failure it returns a **friendly message**, not a PHP error page.

Supported payloads (either works):

- `{ "message": "..." }` — used by this `index.html`
- `{ "messages": [ { "role": "user", "content": "..." } ] }` — OpenAI-style history

## Setup on the VPS

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

## GitHub checklist

- [ ] Repo includes `index.html`, `images/`, resume PDF, `api/chat.php`, `api/config.example.php`, `nginx-portfolio.conf`, `README.md`
- [ ] **No** real API key in git (only `config.local.php` on server)
- [ ] Live **HTTPS** URL for grading + screenshot + LinkedIn post with `#Linux #Nginx #SSL #WebOps #AI #APIIntegration #PromptEngineering`
