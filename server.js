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
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Behind Render/other proxies, trust X-Forwarded-For so req.ip is the real
// client IP (needed for the café Wi-Fi lock).
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Normalize an IP (strip IPv6-mapped IPv4 prefix, take first XFF hop).
function clientIp(req) {
  let ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip;
}

// ============================================================
// PERSISTENCE — PostgreSQL first, data.json only as legacy fallback
// ============================================================
// Production: set DATABASE_URL (Neon/Supabase/Postgres connection string) and
// REQUIRE_DATABASE=true on Render. On the first SQL boot, an existing data.json
// is imported ONCE if the database is empty.
let state = { _updatedAt: 0 };
let sqlStore = null;
let persistenceMode = 'memory';
let saveTimer = null;
let pendingWrite = Promise.resolve();

function loadLegacyFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log('⚠ Loaded legacy state from data.json (move to DATABASE_URL for production)');
    }
  } catch (e) {
    console.warn('Could not load legacy data.json:', e?.message);
  }
}

async function bootstrapPersistence() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.REQUIRE_DATABASE === 'true') {
      throw new Error('DATABASE_URL is required (REQUIRE_DATABASE=true). Add Neon DATABASE_URL in Render Environment.');
    }
    // Safe local/demo fallback only. Render production should set REQUIRE_DATABASE=true.
    persistenceMode = 'legacy-file';
    loadLegacyFile();
    console.warn('⚠ DATABASE_URL is missing — using legacy data.json fallback. NOT SAFE for production.');
    return;
  }

  try {
    // Dynamic import means local frontend-only builds don't require pg until SQL is configured.
    const { PostgresStateStore } = await import('./db.js');
    sqlStore = new PostgresStateStore(url);
    await sqlStore.init();

    if (await sqlStore.isEmpty() && fs.existsSync(DATA_FILE)) {
      // One-time migration from the previous file backend.
      loadLegacyFile();
      await sqlStore.saveState(state);
      console.log('✓ Migrated legacy data.json → PostgreSQL');
    } else {
      state = await sqlStore.loadState();
      console.log('✓ Loaded HEBLI state from PostgreSQL');
    }
    persistenceMode = 'postgres';
  } catch (error) {
    console.error('✗ PostgreSQL startup failed:', error?.message || error);
    if (process.env.REQUIRE_DATABASE === 'true') throw error;
    // Do not lose the ability to run locally while configuring SQL.
    persistenceMode = 'legacy-file';
    loadLegacyFile();
    console.warn('⚠ Falling back to legacy data.json. Fix DATABASE_URL before production.');
  }
}

// Top-level await is supported because this project is ESM ("type": "module").
await bootstrapPersistence();

// Queue writes so rapid client updates cannot overlap/reorder database transactions.
async function persistNow() {
  if (sqlStore) {
    pendingWrite = pendingWrite
      .catch(() => {})
      .then(() => sqlStore.saveState(state));
    try {
      await pendingWrite;
    } catch (error) {
      console.error('PostgreSQL persist failed:', error?.message || error);
    }
    return;
  }

  // Legacy fallback for local demos ONLY. Do not depend on this on Render Free.
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.warn('Legacy persist failed:', e?.message);
  }
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void persistNow(); }, 350);
}

// Flush pending SQL writes on Render redeploy/restart.
async function flushAndExit() {
  if (saveTimer) clearTimeout(saveTimer);
  await persistNow();
  if (sqlStore) await sqlStore.close().catch(() => {});
  process.exit(0);
}
process.once('SIGTERM', () => { void flushAndExit(); });
process.once('SIGINT', () => { void flushAndExit(); });
process.once('beforeExit', () => { void persistNow(); });

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
    persistence: persistenceMode, // MUST be "postgres" before official opening
    databaseConfigured: !!process.env.DATABASE_URL,
    phase2: true,
    build: 'phase2-live-realtime-2026-10-21',
    realtimeClients: typeof sseClients === 'undefined' ? 0 : sseClients.size,
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
// Legacy compatibility endpoint. Phase 2 clients will progressively move to
// /api/v2/* endpoints below, avoiding full-state downloads.
app.get('/api/state', (_req, res) => {
  res.json(state);
});

// ============================================================
// PHASE 2A — Lightweight Orders / Tables / Payments REST API
// ============================================================
// These routes sit alongside legacy /api/state while screens are migrated
// gradually. They return only the data a screen needs, not the entire café.
const TABLE_COUNT = Math.min(100, Math.max(1, Number(process.env.TABLE_COUNT || 27)));
const ACTIVE_ORDER_STATUSES = new Set(['Pending', 'In Preparation', 'Ready']);
const BARISTA_ORDER_STATUSES = new Set(['Pending', 'In Preparation', 'Ready']);
const ORDER_STATUSES = new Set(['Pending', 'In Preparation', 'Ready', 'Paid', 'Cancelled']);

function collection(key) {
  if (!Array.isArray(state[key])) state[key] = [];
  return state[key];
}

function nowIso() { return new Date().toISOString(); }
function newId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

// ============================================================
// PHASE 2C — Server-side signed staff sessions (HTTP-only cookie)
// ============================================================
const AUTH_COOKIE = 'hebli_session';
const AUTH_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
// Add AUTH_SECRET in Render Environment for production. Fallback keeps existing
// dev installs running but sessions reset after a redeploy if no secret is set.
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.AUTH_SECRET) console.warn('⚠ AUTH_SECRET missing — sessions reset on deploy. Set it in Render Environment.');

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return raw.split(';').reduce((out, part) => {
    const index = part.indexOf('=');
    if (index > 0) out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return out;
  }, {});
}

function b64(data) { return Buffer.from(JSON.stringify(data)).toString('base64url'); }
function sign(data) { return crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url'); }
function pinStamp(pin) { return crypto.createHmac('sha256', AUTH_SECRET).update(String(pin)).digest('hex').slice(0, 24); }

function createSessionToken(staff) {
  const payload = b64({ id: staff.id, pin: pinStamp(staff.pin), exp: Date.now() + AUTH_TTL_MS });
  return `${payload}.${sign(payload)}`;
}

function getSessionStaff(req) {
  const token = parseCookies(req)[AUTH_COOKIE];
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  try {
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.id || !data?.exp || data.exp < Date.now()) return null;
    const staff = collection('hebli_staff').find((s) => s.id === data.id && s.active);
    if (!staff || data.pin !== pinStamp(staff.pin)) return null; // invalid after pin change/suspension
    return staff;
  } catch { return null; }
}

function sessionPublic(staff) {
  if (!staff) return null;
  return { id: staff.id, name: staff.name, role: staff.role, active: staff.active, rating: staff.rating };
}

const SECURE_COOKIE = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
function setSessionCookie(res, token) {
  const secure = SECURE_COOKIE ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(AUTH_TTL_MS / 1000)}${secure}`);
}
function clearSessionCookie(res) {
  const secure = SECURE_COOKIE ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function requireAuth(roles = []) {
  return (req, res, next) => {
    const staff = getSessionStaff(req);
    if (!staff) return res.status(401).json({ error: 'authentication_required' });
    if (roles.length && !roles.includes(staff.role)) return res.status(403).json({ error: 'insufficient_role' });
    req.staff = staff;
    next();
  };
}

// Basic in-memory brute-force protection. Good for one Render instance; a Redis
// rate limit is a later scale enhancement.
const loginAttempts = new Map();
function loginAllowed(ip) {
  const now = Date.now();
  const list = (loginAttempts.get(ip) || []).filter((t) => now - t < 60_000);
  loginAttempts.set(ip, list);
  return list.length < 8;
}
function failedLogin(ip) { loginAttempts.set(ip, [...(loginAttempts.get(ip) || []), Date.now()]); }

app.post('/api/v2/auth/login', (req, res) => {
  const ip = clientIp(req);
  if (!loginAllowed(ip)) return res.status(429).json({ error: 'too_many_attempts', retryAfterSeconds: 60 });
  const pin = String(req.body?.pin || '');
  const staff = collection('hebli_staff').find((s) => s.active && s.pin === pin);
  if (!staff) { failedLogin(ip); return res.status(401).json({ error: 'invalid_pin' }); }
  loginAttempts.delete(ip);
  setSessionCookie(res, createSessionToken(staff));
  res.json({ data: sessionPublic(staff) });
});

app.get('/api/v2/auth/me', (req, res) => {
  const staff = getSessionStaff(req);
  if (!staff) return res.status(401).json({ error: 'authentication_required' });
  res.json({ data: sessionPublic(staff) });
});

app.post('/api/v2/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ============================================================
// PHASE 2B — Server Sent Events (SSE) real-time event hub
// ============================================================
const sseClients = new Map();
let sseNextId = 1;

function broadcastEvent(type, payload = {}, audience = 'all') {
  const body = JSON.stringify({ type, updatedAt: state._updatedAt || Date.now(), ...payload });
  for (const [id, client] of sseClients) {
    if (audience === 'staff' && client.scope !== 'staff') continue;
    if (audience === 'client' && client.scope !== 'client') continue;
    try { client.res.write(`event: ${type}\ndata: ${body}\n\n`); }
    catch { sseClients.delete(id); }
  }
}

// Heartbeat keeps proxies from silently closing the event stream during service.
setInterval(() => {
  for (const [id, client] of sseClients) {
    try { client.res.write(': heartbeat\n\n'); } catch { sseClients.delete(id); }
  }
}, 25_000).unref();

app.get('/api/v2/events', (req, res) => {
  const scope = req.query.scope === 'staff' ? 'staff' : 'client';
  const staff = getSessionStaff(req);
  if (scope === 'staff' && !staff) return res.status(401).end();
  if (scope === 'client' && !staff && !isAccessAllowed(req)) return res.status(403).end();

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  const id = sseNextId++;
  sseClients.set(id, { res, scope, staff: sessionPublic(staff) });
  res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', scope, updatedAt: state._updatedAt || 0 })}\n\n`);
  req.on('close', () => sseClients.delete(id));
});

async function commitState(eventType = 'state.updated', payload = {}, audience = 'all') {
  state._updatedAt = Date.now();
  // Persist before broadcasting: an event always points to durable SQL state.
  await persistNow();
  broadcastEvent(eventType, payload, audience);
  return state._updatedAt;
}

function publicOrder(order) {
  // Current app order shape is already safe for client/barista/waiter views.
  // Keep this explicit so we can later remove sensitive fields by role.
  return order;
}

function appendAudit(action, details, user = 'System') {
  collection('hebli_audit_logs').push({
    id: newId('log'), action, details, user, timestamp: nowIso(),
  });
}

function appendNotification(target, title, body, type = 'info') {
  collection('hebli_notifications').push({
    id: newId('ntf'), target, title, body, type, read: false, createdAt: nowIso(),
  });
}

// Optional Wi-Fi access on public (customer) endpoints only.
function requireCafeAccess(req, res, next) {
  // Logged-in staff/owner may manage from anywhere; guests require café Wi-Fi.
  if (getSessionStaff(req) || isAccessAllowed(req)) return next();
  return res.status(403).json({ error: 'cafe_wifi_required' });
}

// ----- Products (customer menu only receives active products) -----
app.get('/api/v2/products', requireCafeAccess, (_req, res) => {
  const products = collection('hebli_products').filter((p) => p?.active !== false);
  res.json({ data: products, updatedAt: state._updatedAt || 0 });
});

app.get('/api/v2/categories', requireCafeAccess, (_req, res) => {
  res.json({ data: collection('hebli_categories'), updatedAt: state._updatedAt || 0 });
});

// ----- Tables (computed from active / paid-but-not-freed orders) -----
app.get('/api/v2/tables', requireCafeAccess, (_req, res) => {
  const orders = collection('hebli_orders');
  const map = new Map();
  for (const order of orders) {
    const number = Number(order?.tableNumber);
    if (!number || number < 1 || number > TABLE_COUNT || order.status === 'Cancelled') continue;
    const existing = map.get(number);
    // Prefer an active order over a paid one for a table with multiple orders.
    if (!existing || (ACTIVE_ORDER_STATUSES.has(order.status) && !ACTIVE_ORDER_STATUSES.has(existing.status))) {
      map.set(number, order);
    }
  }
  const tables = Array.from({ length: TABLE_COUNT }, (_, index) => {
    const number = index + 1;
    const order = map.get(number);
    return {
      number,
      state: !order ? 'free' : order.status === 'Paid' ? 'paid' : 'occupied',
      order: order ? publicOrder(order) : null,
    };
  });
  res.json({ data: tables, updatedAt: state._updatedAt || 0 });
});

// ----- Public order tracking (customer's chosen table only) -----
// Kept deliberately separate from staff orders: a guest never receives the
// whole kitchen queue, invoices, payments, staff, or other tables' data.
app.get('/api/v2/track/:tableNumber', requireCafeAccess, (req, res) => {
  const tableNumber = Number(req.params.tableNumber);
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > TABLE_COUNT) {
    return res.status(400).json({ error: 'invalid_table_number' });
  }
  const limit = Math.min(30, Math.max(1, Number(req.query.limit || 10)));
  const requestedOrderId = req.query.orderId ? String(req.query.orderId) : null;
  const orders = collection('hebli_orders')
    .filter((o) => o.id === requestedOrderId || Number(o.tableNumber) === tableNumber || (o.clientName === `Table ${tableNumber}` && o.status === 'Cancelled'))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, limit)
    .map(publicOrder);
  res.json({ data: orders, updatedAt: state._updatedAt || 0 });
});

// ----- Orders -----
app.get('/api/v2/orders', requireAuth(['Barista', 'Cashier', 'Administrator']), (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const view = String(req.query.view || (status ? 'all' : 'active')); // active | barista | all
  const table = req.query.table ? Number(req.query.table) : null;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));

  let orders = [...collection('hebli_orders')];
  if (view === 'active') orders = orders.filter((o) => ACTIVE_ORDER_STATUSES.has(o.status));
  if (view === 'barista') orders = orders.filter((o) => BARISTA_ORDER_STATUSES.has(o.status));
  if (table) orders = orders.filter((o) => Number(o.tableNumber) === table);
  if (status && ORDER_STATUSES.has(status)) orders = orders.filter((o) => o.status === status);

  orders.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  res.json({ data: orders.slice(0, limit).map(publicOrder), updatedAt: state._updatedAt || 0 });
});

app.post('/api/v2/orders', requireCafeAccess, async (req, res) => {
  const body = req.body || {};
  const tableNumber = Number(body.tableNumber);
  const items = Array.isArray(body.items) ? body.items : [];
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > TABLE_COUNT) {
    return res.status(400).json({ error: 'invalid_table_number', maxTables: TABLE_COUNT });
  }
  if (!items.length) return res.status(400).json({ error: 'order_items_required' });

  // Do not permit another customer device to overwrite an active table.
  const conflict = collection('hebli_orders').find(
    (o) => Number(o.tableNumber) === tableNumber && ACTIVE_ORDER_STATUSES.has(o.status),
  );
  if (conflict && !body.allowAddToExisting) {
    return res.status(409).json({ error: 'table_occupied', tableNumber, orderId: conflict.id });
  }

  // Never trust prices/names from the browser. Rebuild each item from the
  // owner-managed product catalog, including only valid paid supplements.
  const catalog = collection('hebli_products').filter((p) => p?.active !== false);
  const safeItems = items
    .filter((i) => i && typeof i === 'object' && i.productId && Number(i.quantity) > 0)
    .map((i) => {
      const product = catalog.find((p) => p.id === String(i.productId));
      if (!product) return null;
      const requestedSupps = Array.isArray(i.supplements) ? i.supplements : [];
      const supplements = requestedSupps
        .map((requested) => (product.supplements || []).find((s) => s.id === requested?.id))
        .filter(Boolean);
      const price = Number(product.price || 0) + supplements.reduce((sum, s) => sum + Number(s.price || 0), 0);
      return {
        productId: String(product.id),
        name: String(product.name).slice(0, 180),
        price: Math.max(0, price),
        quantity: Math.min(99, Math.max(1, Math.floor(Number(i.quantity)))),
        image: String(product.image || ''),
        supplements: supplements.length ? supplements : undefined,
      };
    })
    .filter(Boolean);
  if (!safeItems.length) return res.status(400).json({ error: 'valid_order_items_required' });

  const total = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = nowIso();

  // Optional loyalty member: server creates/finds it (client never writes loyalty
  // balances directly). Normalized id keeps future visits attached to one person.
  let loyaltyId;
  const loyaltyName = String(body.loyaltyName || '').trim().slice(0, 120);
  if (loyaltyName) {
    loyaltyId = `loy-${loyaltyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}`;
    const members = collection('hebli_loyalty');
    if (!members.some((m) => m.id === loyaltyId)) {
      members.push({ id: loyaltyId, name: loyaltyName, points: 0, totalSpent: 0, visits: 0, tier: 'Silver', createdAt: now, updatedAt: now });
    }
  }

  const order = {
    id: newId('ORD'),
    clientName: String(body.clientName || `Table ${tableNumber}`).slice(0, 120),
    items: safeItems,
    total: Math.round(total * 100) / 100,
    status: 'Pending',
    note: body.note ? String(body.note).slice(0, 500) : undefined,
    tableNumber,
    loyaltyId,
    createdAt: now,
    updatedAt: now,
  };
  collection('hebli_orders').push(order);
  appendAudit('Order Placed', `Order ${order.id} for Table ${tableNumber} • ${order.total.toFixed(2)}`, order.clientName);
  appendNotification('Barista', 'New Order', `${order.id} • Table ${tableNumber}`, 'order');
  appendNotification('Cashier', 'New Order', `${order.id} • Table ${tableNumber}`, 'order');
  const updatedAt = await commitState('order.created', { orderId: order.id, tableNumber, status: order.status });
  res.status(201).json({ data: publicOrder(order), updatedAt });
});

app.patch('/api/v2/orders/:id', requireAuth(['Barista', 'Administrator']), async (req, res) => {
  const order = collection('hebli_orders').find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  const body = req.body || {};

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.has(body.status)) return res.status(400).json({ error: 'invalid_status' });
    if (order.status === 'Cancelled' || order.status === 'Paid') {
      return res.status(409).json({ error: 'order_is_final', status: order.status });
    }
    // Baristas may only move kitchen flow forward; payment/cancel is separate.
    if (req.staff.role === 'Barista' && !['In Preparation', 'Ready'].includes(body.status)) {
      return res.status(403).json({ error: 'barista_status_not_allowed' });
    }
    order.status = body.status;
    if (body.status === 'Ready' && body.prepTimeSeconds !== undefined) {
      order.prepTimeSeconds = Math.max(0, Math.floor(Number(body.prepTimeSeconds) || 0));
    }
  }
  if (body.note !== undefined) order.note = String(body.note || '').slice(0, 500) || undefined;
  if (body.tableNumber !== undefined) {
    const n = Number(body.tableNumber);
    if (!Number.isInteger(n) || n < 1 || n > TABLE_COUNT) return res.status(400).json({ error: 'invalid_table_number' });
    order.tableNumber = n;
  }
  order.updatedAt = nowIso();
  appendAudit('Order Updated', `Order ${order.id} → ${order.status}`, req.staff.name);
  const updatedAt = await commitState('order.updated', { orderId: order.id, tableNumber: order.tableNumber, status: order.status });
  res.json({ data: publicOrder(order), updatedAt });
});

app.post('/api/v2/orders/:id/cancel', requireAuth(['Administrator']), async (req, res) => {
  const order = collection('hebli_orders').find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  if (order.status === 'Paid') return res.status(409).json({ error: 'paid_order_cannot_be_cancelled' });
  if (order.status === 'Cancelled') return res.json({ data: publicOrder(order), updatedAt: state._updatedAt || 0 });

  order.status = 'Cancelled';
  order.tableNumber = undefined;
  order.updatedAt = nowIso();
  const reason = req.body?.reason ? ` — ${String(req.body.reason).slice(0, 200)}` : '';
  appendAudit('Order Cancelled', `Order ${order.id} cancelled${reason}`, req.staff.name);
  appendNotification('all', 'Commande annulée', `La commande ${order.id} a été annulée.${reason}`, 'info');
  const updatedAt = await commitState('order.cancelled', { orderId: order.id, status: order.status });
  res.json({ data: publicOrder(order), updatedAt });
});

// ----- Payments (atomic order status + payment record) -----
app.get('/api/v2/payments', requireAuth(['Cashier', 'Administrator']), (req, res) => {
  const date = req.query.date ? String(req.query.date) : null;
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));
  let payments = [...collection('hebli_payments')];
  if (date) payments = payments.filter((p) => p.date === date);
  payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: payments.slice(0, limit), updatedAt: state._updatedAt || 0 });
});

app.post('/api/v2/orders/:id/pay', requireAuth(['Cashier', 'Administrator']), async (req, res) => {
  const order = collection('hebli_orders').find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  if (order.status === 'Cancelled') return res.status(409).json({ error: 'cancelled_order_cannot_be_paid' });
  if (order.status === 'Paid') return res.status(409).json({ error: 'order_already_paid' });
  if (order.status !== 'Ready') return res.status(409).json({ error: 'order_not_ready', status: order.status });

  const now = new Date();
  const payment = {
    id: newId('PAY'), orderId: order.id, amount: order.total,
    cashierName: req.staff.name,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 8),
    createdAt: now.toISOString(),
  };
  order.status = 'Paid';
  order.updatedAt = now.toISOString();
  collection('hebli_payments').push(payment);
  appendAudit('Payment Received', `${order.total.toFixed(2)} paid for ${order.id}`, payment.cashierName);

  // Loyalty points remain server-side/atomic (1 point per currency unit).
  if (order.loyaltyId && !order.loyaltyAwarded) {
    const member = collection('hebli_loyalty').find((m) => m.id === order.loyaltyId);
    if (member) {
      member.points = (Number(member.points) || 0) + Math.round(order.total);
      member.totalSpent = (Number(member.totalSpent) || 0) + order.total;
      member.visits = (Number(member.visits) || 0) + 1;
      member.tier = member.points >= 2000 ? 'Black' : member.points >= 500 ? 'Gold' : 'Silver';
      member.updatedAt = now.toISOString();
      order.loyaltyAwarded = true;
    }
  }

  const updatedAt = await commitState('order.paid', { orderId: order.id, tableNumber: order.tableNumber, status: order.status });
  res.status(201).json({ data: { order: publicOrder(order), payment }, updatedAt });
});

app.post('/api/v2/tables/:number/free', requireAuth(['Cashier', 'Administrator']), async (req, res) => {
  const number = Number(req.params.number);
  if (!Number.isInteger(number) || number < 1 || number > TABLE_COUNT) {
    return res.status(400).json({ error: 'invalid_table_number' });
  }
  const affected = collection('hebli_orders').filter((o) => Number(o.tableNumber) === number);
  // Only paid/cancelled orders can be freed, never an active customer order.
  if (affected.some((o) => ACTIVE_ORDER_STATUSES.has(o.status))) {
    return res.status(409).json({ error: 'active_order_on_table' });
  }
  affected.forEach((o) => { o.tableNumber = undefined; o.updatedAt = nowIso(); });
  appendAudit('Table Freed', `Table ${number} freed`, req.staff.name);
  const updatedAt = await commitState('table.freed', { tableNumber: number, freedOrders: affected.map((o) => o.id) });
  res.json({ data: { tableNumber: number, freedOrders: affected.map((o) => o.id) }, updatedAt });
});

// ============================================================
// CAFÉ WI-FI LOCK
// The client app only works for devices on the café's network.
// Because every device on the café Wi-Fi shares the same public IP
// (the router's WAN IP), we compare the requester IP to the stored café IP.
// The OWNER enables it while on the café Wi-Fi → we snapshot that IP.
// state.wifiLock = { enabled: boolean, cafeIp: string, updatedAt: number }
// ============================================================

// ------------------------------------------------------------------
// HOW TO CHANGE THE CAFÉ IP FROM CODE (3 ways):
//  1) EASIEST — set an env var on Render (no code change, no redeploy of code):
//        CAFE_IP=41.226.10.5
//     You can allow MULTIPLE networks with commas:
//        CAFE_IP=41.226.10.5, 197.2.3.4
//     When CAFE_IP is set, it ALWAYS wins over the stored/captured IP.
//
//  2) HARDCODE a default here (used only if no CAFE_IP env + none captured yet):
const DEFAULT_CAFE_IPS = [
  // '41.226.10.5',
  // '197.2.3.4',
];
//
//  3) API — POST /api/wifi-lock { enabled, cafeIp }  (the owner toggle uses this).
// ------------------------------------------------------------------

// Parse "1.2.3.4, 5.6.7.8" → ['1.2.3.4','5.6.7.8']
function parseIpList(str) {
  return String(str || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

// The list of café IPs currently allowed (env wins, then stored, then default).
function allowedCafeIps() {
  const fromEnv = parseIpList(process.env.CAFE_IP);
  if (fromEnv.length) return fromEnv;
  const lock = getWifiLock();
  const stored = parseIpList(lock.cafeIp);
  if (stored.length) return stored;
  return DEFAULT_CAFE_IPS;
}

function getWifiLock() {
  if (!state.wifiLock || typeof state.wifiLock !== 'object') {
    state.wifiLock = { enabled: false, cafeIp: '', updatedAt: 0 };
  }
  return state.wifiLock;
}

// Is a request allowed to use the CLIENT app right now?
function isAccessAllowed(req) {
  const lock = getWifiLock();
  if (!lock.enabled) return true;         // lock off → everyone allowed
  const list = allowedCafeIps();
  if (!list.length) return true;          // no café IP configured yet → don't lock people out
  return list.includes(clientIp(req));    // must be on one of the café's public IPs
}

// Client calls this on boot to know whether it may run.
app.get('/api/access', (req, res) => {
  const lock = getWifiLock();
  res.json({
    enabled: !!lock.enabled,
    allowed: isAccessAllowed(req),
    yourIp: clientIp(req),
    cafeIp: allowedCafeIps().join(', '),
    source: process.env.CAFE_IP ? 'env' : (lock.cafeIp ? 'stored' : (DEFAULT_CAFE_IPS.length ? 'default' : 'none')),
  });
});

// Owner toggles the lock / sets the café IP(s).
// Body: { enabled: boolean, cafeIp?: string }  (cafeIp may be comma-separated)
// When enabling with no cafeIp, we snapshot the OWNER's current IP.
app.post('/api/wifi-lock', (req, res) => {
  const lock = getWifiLock();
  const enabled = !!(req.body && req.body.enabled);
  lock.enabled = enabled;
  if (req.body && typeof req.body.cafeIp === 'string' && req.body.cafeIp.trim()) {
    // explicit IP(s) provided → store them (works whether enabling or not)
    lock.cafeIp = parseIpList(req.body.cafeIp).join(', ');
  } else if (enabled && !lock.cafeIp) {
    // enabling with nothing set → capture the caller's current public IP
    lock.cafeIp = clientIp(req);
  }
  lock.updatedAt = Date.now();
  state.wifiLock = lock;
  state._updatedAt = Date.now();
  persist();
  res.json({ ok: true, wifiLock: lock, allowed: allowedCafeIps(), yourIp: clientIp(req) });
});

// POST partial state → server merges with existing
app.post('/api/state', async (req, res) => {
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

  // Legacy compatibility write: persist durably then tell SSE clients to refresh
  // their small V2 resource endpoints. This keeps Owner/Invoices/Chat modules
  // working while they are migrated screen by screen.
  const updatedAt = await commitState('state.updated', {}, 'all');
  res.json({ ok: true, _updatedAt: updatedAt });
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
