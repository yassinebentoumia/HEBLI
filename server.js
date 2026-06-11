// ============================================================
// HEBLI – Backend Server (Express)
// Serves the React app + provides /api/state for multi-device sync
// ============================================================
//
// HOW IT WORKS:
// - All devices that visit the same URL hit the same server.
// - Server stores the full state of the café (orders, staff, etc).
// - GET /api/state  → returns current shared state
// - POST /api/state → merges incoming state with server state
// - Persists to data.json on disk
//
// NO café-codes. NO manual setup. Just open the site on any device.
// ============================================================

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Load persisted state on startup
let state = { _updatedAt: 0 };
try {
  if (fs.existsSync(DATA_FILE)) {
    state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log('Loaded state from data.json');
  }
} catch (e) {
  console.warn('Could not load state:', e?.message);
}

// Throttled file save
let saveTimer = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(state));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) {
      console.warn('Persist failed:', e?.message);
    }
  }, 500);
}

// Smart merge: union arrays by id, keeping the newest version of each item.
function mergeArrays(existing, incoming) {
  const map = new Map();
  const upsert = (item) => {
    if (!item || typeof item !== 'object') return;
    const id = item.id;
    if (id === undefined || id === null) return;
    const ex = map.get(id);
    if (!ex) { map.set(id, item); return; }
    const tA = new Date(ex.updatedAt || ex.timestamp || ex.createdAt || 0).getTime();
    const tB = new Date(item.updatedAt || item.timestamp || item.createdAt || 0).getTime();
    if (tB >= tA) map.set(id, item);
  };
  (existing || []).forEach(upsert);
  (incoming || []).forEach(upsert);
  const out = Array.from(map.values());
  out.sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tA - tB;
  });
  return out;
}

// ============================================================
// API ROUTES
// ============================================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, updatedAt: state._updatedAt || 0 });
});

// GET current shared state
app.get('/api/state', (_req, res) => {
  res.json(state);
});

// POST partial state → server merges with existing
app.post('/api/state', (req, res) => {
  const incoming = req.body || {};
  Object.keys(incoming).forEach((key) => {
    if (key === '_updatedAt') return;
    if (Array.isArray(incoming[key])) {
      state[key] = mergeArrays(state[key], incoming[key]);
    } else {
      state[key] = incoming[key];
    }
  });
  state._updatedAt = Date.now();
  persist();
  res.json({ ok: true, _updatedAt: state._updatedAt });
});

// ============================================================
// STATIC FILES (the React app)
// ============================================================

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — any non-API route serves index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`dist/ folder not found. Run 'npm run build' first.`);
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.status(404).send('App not built yet. Run npm run build.');
  });
}

// ============================================================
// START
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ HEBLI server running on port ${PORT}`);
  console.log(`  Open: http://localhost:${PORT}`);
});
