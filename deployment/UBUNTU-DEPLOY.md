# Ubuntu VPS deploy — copy-paste checklist

Use this on a fresh **Ubuntu 22.04 or 24.04** VPS. Replace placeholders:

- `YOURDOMAIN.COM` — your domain  
- `xxx.xxx.xxx.xxx` — your VPS public IPv4  
- `/var/www/portfolio` — site root (must contain `index.html` and `api/`)

Pick **one** backend: **Path A (PHP)** or **Path B (Node)**. The professor rubric is satisfied by either.

---

## 0 — What you must have before starting

- [ ] VPS from DigitalOcean, Linode, AWS Lightsail, etc.  
- [ ] Domain from Namecheap, Google Domains, etc.  
- [ ] **A record** (and **AAAA** if you use IPv6) pointing to the VPS — wait until DNS propagates (often 5–30 minutes; check with `dig YOURDOMAIN.COM +short`).  
- [ ] OpenAI API key (server-side only; never paste into GitHub or `index.html`).

---

## 1 — SSH in and update

```bash
ssh youruser@xxx.xxx.xxx.xxx
sudo apt update && sudo apt upgrade -y
```

---

## 2 — Firewall (UFW) — Tier 1

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

You should see **22, 80, 443** allowed.

---

## 3 — Install web stack

### Path A — Nginx + PHP (recommended if you want fewer moving parts)

```bash
sudo apt install -y nginx php-fpm php-curl php-cli
php -v
ls /run/php/
```

Note the FPM socket name, e.g. `php8.3-fpm.sock` — use it in Nginx.

### Path B — Nginx + Node (if you use `server/server.js`)

```bash
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

---

## 4 — Site files

```bash
sudo mkdir -p /var/www/portfolio
sudo chown -R $USER:$USER /var/www/portfolio
cd /var/www/portfolio
git clone https://github.com/kirankatari/myportfolio.git .
# or: git pull if already cloned
```

---

## 5a — Path A: API key + Nginx (PHP)

```bash
cd /var/www/portfolio/api
cp config.example.php config.local.php
nano config.local.php   # set openai_api_key => 'sk-...'
chmod 600 config.local.php
```

Copy the repo’s `nginx-portfolio.conf` to the server and edit it:

```bash
sudo cp /var/www/portfolio/nginx-portfolio.conf /etc/nginx/sites-available/portfolio
sudo nano /etc/nginx/sites-available/portfolio
```

- Replace every `YOURDOMAIN.COM` with your domain.  
- Set `root /var/www/portfolio;`  
- Set `fastcgi_pass` to your real socket: `unix:/run/php/php8.3-fpm.sock;`  
- SSL lines: after Certbot (step 7), Certbot usually patches these — or paste the paths Certbot prints.

Enable site:

```bash
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

**Do not run `nginx -t` with SSL paths until Certbot has created the certs** (or temporarily comment SSL `listen 443` blocks and only use port 80 for the first test). Easiest flow: use Certbot’s **nginx** plugin (step 7); it adds HTTPS for you.

---

## 5b — Path B: Node app + systemd + Nginx proxy

```bash
cd /var/www/portfolio/server
npm install
cp .env.example .env
nano .env   # OPENAI_API_KEY=sk-...
chmod 600 .env
```

Install systemd unit (edit `User=` and paths first):

```bash
sudo cp /var/www/portfolio/deployment/portfolio-node.service /etc/systemd/system/portfolio-node.service
sudo nano /etc/systemd/system/portfolio-node.service
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-node
sudo systemctl status portfolio-node
```

Copy `deployment/nginx-site-example.conf` to the server, rename to `portfolio`, set `server_name`, `root`, uncomment **ssl_certificate** lines after Certbot, then:

```bash
sudo cp /var/www/portfolio/deployment/nginx-site-example.conf /etc/nginx/sites-available/portfolio
sudo nano /etc/nginx/sites-available/portfolio
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

---

## 6 — First Nginx test (HTTP only, optional)

If you need a quick test before SSL, ensure a **port 80** server block serves `index.html` and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I http://YOURDOMAIN.COM
```

---

## 7 — SSL with Let’s Encrypt (Tier 1)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOURDOMAIN.COM -d www.YOURDOMAIN.COM
```

Choose redirect when asked (HTTP → HTTPS). Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Verify: browser shows a **padlock** on `https://YOURDOMAIN.COM`.

---

## 8 — Test the AI endpoint (Tier 2)

```bash
curl -sS -X POST https://YOURDOMAIN.COM/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What certifications are listed on your portfolio?"}'
```

You should see JSON with a `reply` field and real text (not “missing API key” if `config.local.php` or `.env` is set).

---

## 9 — Tier 3 (you only)

1. Update **`README.md`** tech stack table with your exact OS, PHP or Node version, and domain.  
2. Screenshot: site + chat + answer (URL bar visible if possible).  
3. Canvas: submit **HTTPS** URL + anything else the assignment asks.  
4. LinkedIn: post with live link and `#Linux #Nginx #SSL #WebOps #AI #APIIntegration #PromptEngineering`.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| 502 on `/api/chat` (Node) | `sudo systemctl status portfolio-node`, `journalctl -u portfolio-node -e` |
| 502 (PHP) | `fastcgi_pass` socket path, `sudo systemctl status php*-fpm` |
| Certbot fails | DNS must point to this server; port 80 open |
| Chat says not configured | `config.local.php` or `server/.env` missing or wrong key |
