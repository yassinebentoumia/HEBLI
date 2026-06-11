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
