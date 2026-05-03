# Launch on Vercel (no VPS)

Your domain **`venkatangakirantech.xyz`** can stay on Vercel. This repo includes **`api/chat.js`** so **`POST /api/chat`** runs as a **serverless function**. Your **OpenAI key** is stored only in **Vercel Environment Variables**, never in the browser.

## 1. Connect the GitHub repo (if not already)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New…** → **Project** → **Import** your GitHub repo **`kirankatari/myportfolio`** (or your fork).
3. **Framework Preset:** *Other* (or leave default; static `index.html` + `api/` is fine).
4. Click **Deploy**.

## 2. Add the API key

1. Open the project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** your secret key from OpenAI (starts with `sk-…`)
   - **Environments:** Production (and Preview if you want the chat on preview URLs too).
3. Save, then **Deployments** → open the latest deployment → **⋯** → **Redeploy** (so the new variable is picked up).

## 3. Custom domain

1. **Settings** → **Domains** → add **`venkatangakirantech.xyz`** and **`www.venkatangakirantech.xyz`** if needed.
2. Vercel already manages DNS if the domain is registered there; otherwise point DNS as Vercel instructs.

## 4. Check that it works

- Open **`https://your-domain`** — portfolio loads.
- Open the **chat** widget and ask a question.
- Or run (replace the domain):

```bash
curl -sS -X POST https://venkatangakirantech.xyz/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What certifications do you list?"}'
```

You should see JSON with a **`reply`** field.

## Notes

- **`api/chat.php`** is for traditional **PHP + Nginx** hosting. On Vercel, **`api/chat.js`** is what runs.
- Do **not** commit real API keys; only set them in the Vercel dashboard.
