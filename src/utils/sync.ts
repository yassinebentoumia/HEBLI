// ============================================================
// HEBLI – Cross-Device Cloud Sync Engine (Smart Merge)
// Uses jsonblob.com (free, no-auth, CORS-enabled REST API)
// ============================================================
//
// HOW IT WORKS:
// - One shared "Café Code" (a jsonblob ID) holds ALL data for the café.
// - Every device with the same Café Code reads/writes the same blob.
// - Data is MERGED (union by id) so two devices never overwrite each other.
// - Pull every 2s; push (debounced) on every local write.
// ============================================================

const API_BASE = 'https://jsonblob.com/api/jsonBlob';
const CAFE_CODE_KEY = 'hebli_cafe_code';

// Keys that are ARRAYS of objects with an `id` (merge by id)
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

export const SYNC_KEYS = ARRAY_KEYS;

export function getCafeCode(): string | null {
  return localStorage.getItem(CAFE_CODE_KEY);
}

export function setCafeCode(code: string): void {
  localStorage.setItem(CAFE_CODE_KEY, code.trim());
}

export function clearCafeCode(): void {
  localStorage.removeItem(CAFE_CODE_KEY);
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

// Build a snapshot of all local data
function buildSnapshot(): Record<string, any> {
  const snap: Record<string, any> = { _updatedAt: Date.now() };
  ARRAY_KEYS.forEach((k) => {
    snap[k] = readLocalArray(k);
  });
  return snap;
}

// Merge two arrays of objects by `id`, keeping the most recently updated version.
function mergeArrays(local: any[], remote: any[]): { merged: any[]; changed: boolean } {
  const map = new Map<string, any>();

  const upsert = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const id = item.id;
    if (id === undefined) {
      // No id: use a content hash key
      map.set('__noid_' + JSON.stringify(item), item);
      return;
    }
    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
    } else {
      // Keep the newer one based on updatedAt/timestamp/createdAt
      const tA = new Date(existing.updatedAt || existing.timestamp || existing.createdAt || 0).getTime();
      const tB = new Date(item.updatedAt || item.timestamp || item.createdAt || 0).getTime();
      if (tB >= tA) map.set(id, item);
    }
  };

  local.forEach(upsert);
  remote.forEach(upsert);

  const merged = Array.from(map.values());
  // Sort by createdAt/timestamp if available for stable ordering
  merged.sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tA - tB;
  });

  const changed = JSON.stringify(merged) !== JSON.stringify(local);
  return { merged, changed };
}

// Merge a remote snapshot into localStorage. Returns true if local changed.
function mergeSnapshot(remote: Record<string, any>): boolean {
  if (!remote) return false;
  let anyChanged = false;
  ARRAY_KEYS.forEach((k) => {
    if (Array.isArray(remote[k])) {
      const local = readLocalArray(k);
      const { merged, changed } = mergeArrays(local, remote[k]);
      if (changed) {
        localStorage.setItem(k, JSON.stringify(merged));
        anyChanged = true;
      }
    }
  });
  return anyChanged;
}

// Create a brand new café blob and return its code
export async function createCafe(): Promise<string | null> {
  try {
    const snapshot = buildSnapshot();
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!res.ok) return null;
    const location = res.headers.get('Location') || res.headers.get('location');
    if (location) {
      const code = location.split('/').pop() || null;
      if (code) {
        setCafeCode(code);
        return code;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Join an existing café: pull + merge, then push merged back up
export async function joinCafe(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${code.trim()}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setCafeCode(code.trim());
    mergeSnapshot(data);
    await pushRemote(); // push merged result so remote also has our data
    return true;
  } catch {
    return false;
  }
}

let isPushing = false;

// Pull remote → merge into local. Returns true if local changed.
export async function pullRemote(): Promise<boolean> {
  const code = getCafeCode();
  if (!code) return false;
  try {
    const res = await fetch(`${API_BASE}/${code}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return mergeSnapshot(data);
  } catch {
    return false;
  }
}

// Push: pull+merge first (to not lose other devices' data), then PUT merged snapshot
export async function pushRemote(): Promise<boolean> {
  const code = getCafeCode();
  if (!code || isPushing) return false;
  isPushing = true;
  try {
    // First merge in remote so we don't overwrite others
    try {
      const getRes = await fetch(`${API_BASE}/${code}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (getRes.ok) {
        const remote = await getRes.json();
        mergeSnapshot(remote);
      }
    } catch { /* ignore */ }

    const snapshot = buildSnapshot();
    const res = await fetch(`${API_BASE}/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    isPushing = false;
    return res.ok;
  } catch {
    isPushing = false;
    return false;
  }
}

// Debounced push so rapid writes don't spam the API
let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(): void {
  if (!getCafeCode()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushRemote();
  }, 600);
}

export function isSynced(): boolean {
  return !!getCafeCode();
}
