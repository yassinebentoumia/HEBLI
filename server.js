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

const TOMBSTONE_KEY = 'hebli_tombstones';

// Merge tombstones — keep the newest deletedAt per (key,id)
function mergeTombstones(existing, incoming) {
  const map = new Map();
  const upsert = (t) => {
    if (!t || typeof t !== 'object') return;
    const k = `${t.key}|${t.id}`;
    const ex = map.get(k);
    if (!ex || t.deletedAt > ex.deletedAt) map.set(k, t);
  };
  (existing || []).forEach(upsert);
  (incoming || []).forEach(upsert);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return Array.from(map.values()).filter((t) => t.deletedAt >= cutoff);
}

function tombstoneIdsFor(key, list) {
  const m = new Map();
  (list || []).forEach((t) => { if (t.key === key) m.set(String(t.id), t.deletedAt); });
  return m;
}

// Smart merge: union arrays by id, keeping the newest version, but
// skipping any id present in the tombstone map (with a newer deletedAt).
function mergeArrays(existing, incoming, deletedIds) {
  const map = new Map();
  const upsert = (item) => {
    if (!item || typeof item !== 'object') return;
    const id = item.id;
    if (id === undefined || id === null) return;
    const delAt = deletedIds ? deletedIds.get(String(id)) : undefined;
    const itemTime = new Date(item.updatedAt || item.timestamp || item.createdAt || 0).getTime();
    if (delAt !== undefined && delAt >= itemTime) return; // tombstoned
    const ex = map.get(id);
    if (!ex) { map.set(id, item); return; }
    const tA = new Date(ex.updatedAt || ex.timestamp || ex.createdAt || 0).getTime();
    if (itemTime >= tA) map.set(id, item);
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
  res.json({
    ok: true,
    updatedAt: state._updatedAt || 0,
    aiProvider: aiProvider(),
  });
});

// ============================================================
// AI AGENT — calls a real LLM (OpenAI / Anthropic / Gemini)
// User sets ONE of these env vars on Render:
//   OPENAI_API_KEY     (default model: gpt-4o-mini)
//   ANTHROPIC_API_KEY  (default model: claude-3-5-haiku-20241022)
//   GEMINI_API_KEY     (default model: gemini-2.0-flash)
// ============================================================

function aiProvider() {
  // Order = priority. The free providers (Groq, OpenRouter, Gemini) are first.
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

// Generic OpenAI-compatible caller — works for OpenAI, Groq, OpenRouter, DeepSeek, etc.
async function callOpenAICompatible({ endpoint, apiKey, model, systemPrompt, history, extraHeaders }) {
  const messages = [{ role: 'system', content: systemPrompt }, ...history];
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders || {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${r.status}: ${text.slice(0, 300)}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || '(no response)';
}

async function callOpenAI(systemPrompt, history) {
  return callOpenAICompatible({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    systemPrompt, history,
  });
}

// Groq — FREE & FAST (Llama 3.3 70B, DeepSeek, Qwen, etc.)
// Sign up: https://console.groq.com/keys
async function callGroq(systemPrompt, history) {
  return callOpenAICompatible({
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    systemPrompt, history,
  });
}

// OpenRouter — FREE models like Llama 3.3 70B, DeepSeek V3, Qwen, Mistral
// Sign up: https://openrouter.ai/settings/keys
async function callOpenRouter(systemPrompt, history) {
  return callOpenAICompatible({
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    systemPrompt, history,
    extraHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://hebli.app',
      'X-Title': 'HEBLI Coffee',
    },
  });
}

async function callAnthropic(systemPrompt, history) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: history,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Anthropic ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.content?.[0]?.text || '(no response)';
}

async function callGemini(systemPrompt, history) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4 },
      }),
    }
  );
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Gemini ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '(no response)';
}

// POST /api/ai
// Body: { messages: [{role, content}], context: { ... } }
// Returns: { reply: string, provider: string }
app.post('/api/ai', async (req, res) => {
  const provider = aiProvider();
  if (!provider) {
    return res.status(503).json({
      error: 'No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY on the server.',
    });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const context = req.body?.context || {};
  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Trim history to last 10 turns to keep tokens reasonable
  const history = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10);

  // Build a rich system prompt with the live dashboard snapshot.
  const systemPrompt = [
    'You are HEBLI AI — the personal business agent for the owner of a premium coffee shop called HEBLI.',
    'You are knowledgeable, friendly, and concise. Answer in the SAME LANGUAGE the user used (English, Italian, Spanish, Arabic/Tunisian dialect, French, etc).',
    'You have full access to the live coffee-shop data below — use it to give real, specific, accurate answers (real numbers, real names, real dates).',
    'When the user asks about a person ("best staff today", "most productive cashier"), analyze the data and name the actual person.',
    'When asked about coffee knowledge (brewing, beans, drinks, recipes), share your expertise like a senior barista.',
    'Use short paragraphs, bullets, and bold key numbers with **markdown** for emphasis.',
    'If the data is empty for the question, say so honestly — never make up data.',
    '',
    '======== LIVE DASHBOARD CONTEXT (JSON, refreshed every request) ========',
    JSON.stringify(context).slice(0, 60000),
    '======== END CONTEXT ========',
  ].join('\n');

  try {
    let reply;
    if (provider === 'groq') reply = await callGroq(systemPrompt, history);
    else if (provider === 'openrouter') reply = await callOpenRouter(systemPrompt, history);
    else if (provider === 'gemini') reply = await callGemini(systemPrompt, history);
    else if (provider === 'openai') reply = await callOpenAI(systemPrompt, history);
    else if (provider === 'anthropic') reply = await callAnthropic(systemPrompt, history);
    res.json({ reply, provider });
  } catch (e) {
    console.error('AI error:', e);
    res.status(500).json({ error: String(e?.message || e), provider });
  }
});

// GET current shared state
app.get('/api/state', (_req, res) => {
  res.json(state);
});

// POST partial state → server merges with existing
app.post('/api/state', (req, res) => {
  const incoming = req.body || {};

  // 1) Merge tombstones FIRST so subsequent array merges respect them.
  if (Array.isArray(incoming[TOMBSTONE_KEY])) {
    state[TOMBSTONE_KEY] = mergeTombstones(state[TOMBSTONE_KEY], incoming[TOMBSTONE_KEY]);
  }
  const allTombstones = Array.isArray(state[TOMBSTONE_KEY]) ? state[TOMBSTONE_KEY] : [];

  // 2) Merge each array using its tombstones
  Object.keys(incoming).forEach((key) => {
    if (key === '_updatedAt' || key === TOMBSTONE_KEY) return;
    if (Array.isArray(incoming[key])) {
      const deletedIds = tombstoneIdsFor(key, allTombstones);
      state[key] = mergeArrays(state[key], incoming[key], deletedIds);
    } else {
      state[key] = incoming[key];
    }
  });

  // 3) Also prune existing server arrays against tombstones (in case a server
  //    array still has an item that was deleted on another device long ago).
  Object.keys(state).forEach((key) => {
    if (key === '_updatedAt' || key === TOMBSTONE_KEY) return;
    if (Array.isArray(state[key])) {
      const deletedIds = tombstoneIdsFor(key, allTombstones);
      if (deletedIds.size > 0) {
        state[key] = state[key].filter((item) => {
          if (!item || item.id === undefined) return true;
          const delAt = deletedIds.get(String(item.id));
          if (delAt === undefined) return true;
          const itemTime = new Date(item.updatedAt || item.timestamp || item.createdAt || 0).getTime();
          return delAt < itemTime;
        });
      }
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
