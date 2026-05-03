# Your checklist (print or keep open while you work)

Everything below requires **your** accounts or your **VPS**. The repo and `UBUNTU-DEPLOY.md` are ready on your side.

## One-time setup

- [ ] VPS running (Ubuntu 22.04 or 24.04 is fine)
- [ ] Domain purchased; **A record** points to VPS IP
- [ ] OpenAI API key created (platform.openai.com)
- [ ] `git pull` on VPS so you have **`deployment/UBUNTU-DEPLOY.md`**

## Server (follow `UBUNTU-DEPLOY.md` in order)

- [ ] UFW: only **22, 80, 443**
- [ ] Nginx installed; site root = repo folder with `index.html` + `api/`
- [ ] **Path A:** PHP-FPM + `api/config.local.php` with key **OR** **Path B:** Node + `server/.env` + systemd
- [ ] Certbot: HTTPS + padlock; HTTP redirects to HTTPS
- [ ] `curl` test to `POST https://YOURDOMAIN/api/chat` returns a real `reply`

## Submission

- [ ] Fill **README** tech stack table (exact versions)
- [ ] Screenshot: live site + chat working
- [ ] **Canvas:** HTTPS URL + anything else required
- [ ] **LinkedIn:** post or Project + link + `#Linux #Nginx #SSL #WebOps #AI #APIIntegration #PromptEngineering`
