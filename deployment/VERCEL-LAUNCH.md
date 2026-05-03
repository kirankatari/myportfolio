# Launch on Vercel (no VPS)

Your domain **`venkatangakirantech.xyz`** can stay on Vercel. This repo includes **`api/chat.js`** so **`POST /api/chat`** runs as a **serverless function**. Your **OpenAI key** is stored only in **Vercel Environment Variables**, never in the browser.

## 1. Connect the GitHub repo (if not already)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New…** → **Project** → **Import** your GitHub repo **`kirankatari/myportfolio`** (or your fork).
3. **Framework Preset:** *Other* (or leave default; static `index.html` + `api/chat.js` is fine).
4. Click **Deploy**.

After the first deploy, **pull the latest `main` from GitHub** (repo includes `api/chat.js`, `vercel.json`, `.vercelignore`) and let Vercel redeploy — otherwise **`POST /api/chat`** can 404 and the chat will show an error.

## 2. Add the API key (Gemini or OpenAI)

**Option A — Google Gemini (often easier free tier)**  
1. Open **[Google AI Studio](https://aistudio.google.com/apikey)** → **Create API key**.  
2. Vercel → **Settings** → **Environment Variables** → add:
   - **Name:** `GEMINI_API_KEY` (or `GOOGLE_AI_API_KEY`)
   - **Value:** the key from AI Studio  
   - **Environments:** Production (+ Preview if you want).  
3. If the model errors, add **`GEMINI_MODEL`** = `gemini-1.5-flash` and redeploy.

**Option B — OpenAI**  
- **Name:** `OPENAI_API_KEY` — value from [platform.openai.com](https://platform.openai.com/api-keys).

If **both** are set, **Gemini is used first**.

Save, then **Deployments** → latest → **⋯** → **Redeploy**.

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

## Chat says “OpenAI returned an error” or billing / quota

1. Open **platform.openai.com** → **Billing** — add payment method or credits if the account has no balance (API calls are not always free).
2. **API keys** — create a **new secret key**, copy it exactly into Vercel **`OPENAI_API_KEY`**, then **Redeploy**.
3. On Vercel: **Deployments** → latest → **Functions** / **Logs** — look for `OpenAI error:` lines (no need to share your key when asking for help).
