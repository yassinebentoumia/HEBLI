// ============================================================
// HEBLI – Cross-Device Cloud Sync (Automatic)
// Talks to the same-origin /api/state endpoint (Node server)
// ============================================================
//
// HOW IT WORKS:
// - All devices that open the same URL share the same backend.
// - On boot we pull /api/state.
// - On every local write we push (debounced) to /api/state.
// - Every 2s we poll for remote changes.
// - No setup. No codes. No third-party services.
// ============================================================

// All localStorage keys that should be synced across devices.
const ARRAY_KEYS = [
  'hebli_products',
  'hebli_orders',
  'hebli_staff',
  'hebli_payments',
  'hebli_inventory',
  'hebli_inventory_transactions',
  'hebli_audit_logs',
  'hebli_categories',
  'hebli_chat_messages',
  'hebli_tickets',
  'hebli_staff_sessions',
  'hebli_notifications',
];

// Tombstone log — records ids that were deleted, so merging won't resurrect them.
const TOMBSTONE_KEY = 'hebli_tombstones';

export const SYNC_KEYS = [...ARRAY_KEYS, TOMBSTONE_KEY];

interface Tombstone { key: string; id: string; deletedAt: number; }

function getTombstones(): Tombstone[] {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Public: record that `id` was deleted from `key`.
export function recordDeletion(key: string, id: string): void {
  const ts = getTombstones();
  // Replace if exists, else add
  const idx = ts.findIndex((t) => t.key === key && t.id === id);
  const entry: Tombstone = { key, id, deletedAt: Date.now() };
  if (idx === -1) ts.push(entry);
  else ts[idx] = entry;
  // Trim: drop tombstones older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const kept = ts.filter((t) => t.deletedAt >= cutoff);
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(kept));
}

function tombstoneIdsFor(key: string, all: Tombstone[]): Map<string, number> {
  const m = new Map<string, number>();
  all.forEach((t) => { if (t.key === key) m.set(t.id, t.deletedAt); });
  return m;
}

function mergeTombstones(local: Tombstone[], remote: Tombstone[]): Tombstone[] {
  const map = new Map<string, Tombstone>();
  const upsert = (t: Tombstone) => {
    const k = `${t.key}|${t.id}`;
    const ex = map.get(k);
    if (!ex || t.deletedAt > ex.deletedAt) map.set(k, t);
  };
  local.forEach(upsert);
  remote.forEach(upsert);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return Array.from(map.values()).filter((t) => t.deletedAt >= cutoff);
}

function api(path: string): string {
  return path; // same-origin
}

function readLocalArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSnapshot(): Record<string, any> {
  const snap: Record<string, any> = { _updatedAt: Date.now() };
  ARRAY_KEYS.forEach((k) => {
    snap[k] = readLocalArray(k);
  });
  snap[TOMBSTONE_KEY] = getTombstones();
  return snap;
}

// Merge two arrays of objects by `id`, keeping the most recent version.
// Items whose id is in `deletedIds` (tombstones) are skipped (or removed if their
// last-update timestamp is older than the deletion timestamp).
function mergeArrays(
  local: any[],
  remote: any[],
  deletedIds: Map<string, number>
): { merged: any[]; changed: boolean } {
  const map = new Map<string, any>();
  const upsert = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const id = item.id;
    if (id === undefined || id === null) return;
    // Skip if this id was deleted AFTER the item's last update.
    const delAt = deletedIds.get(String(id));
    const itemTime = new Date(item.updatedAt || item.timestamp || item.createdAt || 0).getTime();
    if (delAt !== undefined && delAt >= itemTime) return; // tombstoned
    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
      return;
    }
    const tA = new Date(existing.updatedAt || existing.timestamp || existing.createdAt || 0).getTime();
    if (itemTime >= tA) map.set(id, item);
  };
  local.forEach(upsert);
  remote.forEach(upsert);
  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tA - tB;
  });
  const changed = JSON.stringify(merged) !== JSON.stringify(local);
  return { merged, changed };
}

function applyRemote(remote: Record<string, any>): boolean {
  if (!remote || typeof remote !== 'object') return false;
  let anyChanged = false;

  // 1) Merge tombstones first
  const localTomb = getTombstones();
  const remoteTomb: Tombstone[] = Array.isArray(remote[TOMBSTONE_KEY]) ? remote[TOMBSTONE_KEY] : [];
  const mergedTomb = mergeTombstones(localTomb, remoteTomb);
  if (JSON.stringify(mergedTomb) !== JSON.stringify(localTomb)) {
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(mergedTomb));
    anyChanged = true;
  }

  // 2) Merge each array using tombstones
  ARRAY_KEYS.forEach((k) => {
    if (Array.isArray(remote[k])) {
      const local = readLocalArray(k);
      const deletedIds = tombstoneIdsFor(k, mergedTomb);
      const { merged, changed } = mergeArrays(local, remote[k], deletedIds);
      if (changed) {
        localStorage.setItem(k, JSON.stringify(merged));
        anyChanged = true;
      }
    }
  });
  return anyChanged;
}

let lastUpdatedAt = 0;
let online = true;

// Pull from server → returns true if local changed
export async function pullRemote(): Promise<boolean> {
  try {
    const res = await fetch(api('/api/state'), { cache: 'no-store' });
    if (!res.ok) { online = false; return false; }
    const data = await res.json();
    online = true;
    if (data && data._updatedAt && data._updatedAt === lastUpdatedAt) return false;
    if (data && data._updatedAt) lastUpdatedAt = data._updatedAt;
    return applyRemote(data);
  } catch {
    online = false;
    return false;
  }
}

let pushing = false;
let pendingPush = false;

// Push local data → server (debounced & coalesced)
export async function pushRemote(): Promise<boolean> {
  if (pushing) { pendingPush = true; return false; }
  pushing = true;
  try {
    const snap = buildSnapshot();
    const res = await fetch(api('/api/state'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snap),
    });
    if (!res.ok) { online = false; pushing = false; return false; }
    const data = await res.json();
    if (data && data._updatedAt) lastUpdatedAt = data._updatedAt;
    online = true;
    pushing = false;
    if (pendingPush) {
      pendingPush = false;
      setTimeout(() => pushRemote(), 200);
    }
    return true;
  } catch {
    online = false;
    pushing = false;
    return false;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushRemote(), 400);
}

export function isOnline(): boolean {
  return online;
}

// Legacy stubs (kept so older code that imports them still compiles)
export function isSynced(): boolean { return true; }
export function getCafeCode(): string | null { return 'auto'; }
export function setCafeCode(_code: string): void {}
export function clearCafeCode(): void {}
export async function createCafe(): Promise<string | null> { return 'auto'; }
export async function joinCafe(_code: string): Promise<boolean> { return true; }
