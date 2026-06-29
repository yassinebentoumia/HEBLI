# HEBLI – Multi-Device Coffee Shop Platform

## ✅ Multi-Device Sync — How it Works Now

The app now has a real **Node.js backend** (`server.js`) that:
- Serves the React app
- Provides `/api/state` for live data sync across **all devices** (PC, phone, tablet)
- **Zero configuration** — open the URL on any device and you instantly see the same orders, staff, etc.

When you create a staff account on PC → it appears on your phone within ~2 seconds. Orders placed by clients show up on the barista's phone in real time. Everything just works.

---

## 🚀 Deploying to Render

You need to deploy as a **Web Service** (not a Static Site).

### Step-by-step:

1. **Push the code to GitHub** (the code includes `server.js`).
2. On Render, click **New → Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (or any)
5. Click **Create Web Service**.

That's it! The same URL works on every device — orders sync automatically.

### If you already had a Static Site on Render:
- Delete it.
- Create a new **Web Service** as above. Same URL works (point your domain again if needed).

---

## 💻 Running locally

```bash
npm install
npm run build       # builds the React app into ./dist
node server.js      # serves at http://localhost:3000
```

---

## 📝 Notes

- Data persists in `data.json` on the server.
- On Render's **free tier**, the server spins down after 15 min of inactivity. When it wakes up, your data is still there (saved to disk).
- For permanent persistence at scale, attach a Render persistent disk (paid).

---

## 🤖 AI Assistant — Activate the Real Agent

The Owner Dashboard has an **AI Assistant tab** that becomes a real GPT/Claude/Gemini agent the moment you add an API key. The agent reads your live dashboard (sales, staff, invoices, inventory…) and answers any question in any language.

### Choose one provider and set the env var on Render:

| Provider  | Env var to add        | Default model           | Where to get a key                                              |
|-----------|-----------------------|-------------------------|-----------------------------------------------------------------|
| OpenAI    | `OPENAI_API_KEY`      | `gpt-4o-mini`           | https://platform.openai.com/api-keys                            |
| Anthropic | `ANTHROPIC_API_KEY`   | `claude-3-5-haiku-20241022` | https://console.anthropic.com/settings/keys                |
| Google    | `GEMINI_API_KEY`      | `gemini-2.0-flash`      | https://aistudio.google.com/apikey                              |

Optionally override the model name with `OPENAI_MODEL`, `ANTHROPIC_MODEL`, or `GEMINI_MODEL`.

### On Render:
1. Go to your Web Service → **Environment**
2. Add a key (e.g. `OPENAI_API_KEY` = `sk-...`)
3. Save — Render redeploys automatically
4. Open the **Owner Dashboard → AI Assistant** — the model name + green dot appear when active

Without any key, the AI tab still works and tells the user to configure one.
