// ============================================================
// HEBLI – Global App Context (Auto Cross-Device Sync)
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Staff, Order } from '@/types';
import {
  initializeData,
  getCurrentUser,
  getOrders,
  getStaff,
  loginStaff,
  logout,
  createBackup,
  addAuditLog,
  startSession,
  endSession,
  getActiveSessions,
} from '@/utils/store';
import { pullRemote, pushRemote, isOnline } from '@/utils/sync';
import { getServerSession, loginServer, logoutServer } from '@/utils/api';

interface AppContextType {
  user: Staff | null;
  orders: Order[];
  syncTick: number;
  syncStatus: 'connecting' | 'online' | 'offline';
  login: (pin: string) => Promise<Staff | null>;
  logoutUser: () => void;
  refreshOrders: () => void;
  addLog: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  orders: [],
  syncTick: 0,
  syncStatus: 'connecting',
  login: async () => null,
  logoutUser: () => {},
  refreshOrders: () => {},
  addLog: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [syncTick, setSyncTick] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      // 1) Pull remote FIRST so the server's data wins on a fresh device
      //    (prevents seeded defaults from "resurrecting" deleted items).
      const pulled = await pullRemote();
      setSyncStatus(isOnline() ? 'online' : 'offline');

      // 2) Only seed defaults if neither remote nor local has any data yet.
      initializeData();

      // Restore a server-validated session after refresh. A stale localStorage
      // user is never enough to unlock staff routes in Phase 2.
      let sessionUser: Staff | null = null;
      try {
        const session = await getServerSession();
        sessionUser = getStaff().find((s) => s.id === session.data.id && s.active) || null;
      } catch { /* no server session yet */ }
      setUser(sessionUser);
      setOrders(getOrders());
      createBackup();
      if (pulled) setSyncTick((t) => t + 1);

      // 3) Push our (possibly default-seeded) data — server will merge
      //    and tombstones will still suppress any deleted items.
      await pushRemote();
    })();

    // Poll for remote changes. Two optimizations to avoid needless "auto refresh":
    //  1) Only update `orders` state (and bump syncTick) when data ACTUALLY
    //     changed — otherwise we'd hand React a new array every tick and force
    //     re-renders across the whole app.
    //  2) Pause polling while the tab is hidden (saves battery/network); pull
    //     once immediately when it becomes visible again.
    const POLL_MS = 3000;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const changed = await pullRemote();
      setSyncStatus(isOnline() ? 'online' : 'offline');
      if (changed) {
        setOrders(getOrders());
        setSyncTick((t) => t + 1);
      }
    };
    const syncPoll = setInterval(tick, POLL_MS);

    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        tick(); // refresh right away when the user returns
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const backupInterval = setInterval(createBackup, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(syncPoll);
      clearInterval(backupInterval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const login = useCallback(async (pin: string) => {
    // Pull latest staff list first, then authenticate the PIN on the SERVER.
    // The server creates an HTTP-only signed cookie; local storage is only used
    // for UI convenience / legacy compatibility, never as the authority.
    await pullRemote();
    let session;
    try {
      session = await loginServer(pin);
    } catch {
      return null;
    }
    const serverStaff = session.data;
    const local = getStaff().find((s) => s.id === serverStaff.id && s.active && s.role === serverStaff.role);
    if (!local) return null;

    // Preserve existing local UI/session helpers after server authentication.
    const staff = loginStaff(pin);
    if (!staff || staff.id !== serverStaff.id) return null;
    setUser(staff);
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Login',
      details: `${staff.name} (${staff.role}) logged in`,
      user: staff.name,
      timestamp: new Date().toISOString(),
    });
    try {
      const existing = getActiveSessions().find((s) => s.staffId === staff.id);
      const sessionId = existing ? existing.id : startSession({ id: staff.id, name: staff.name, role: staff.role });
      localStorage.setItem('hebli_active_session_id', sessionId);
    } catch { /* ignore */ }
    pushRemote();
    return staff;
  }, []);

  const logoutUser = useCallback(() => {
    if (user) {
      addAuditLog({
        id: 'log-' + Date.now(),
        action: 'Logout',
        details: `${user.name} logged out`,
        user: user.name,
        timestamp: new Date().toISOString(),
      });
    }
    // 🕒 Auto-end the on-duty timer
    try {
      const sid = localStorage.getItem('hebli_active_session_id');
      if (sid) endSession(sid);
      localStorage.removeItem('hebli_active_session_id');
    } catch { /* ignore */ }
    logout();
    void logoutServer(); // clear the HTTP-only server session too
    setUser(null);
    pushRemote();
  }, [user]);

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  const addLog = useCallback((action: string, details: string) => {
    addAuditLog({
      id: 'log-' + Date.now(),
      action,
      details,
      user: user?.name || 'System',
      timestamp: new Date().toISOString(),
    });
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user, orders, syncTick, syncStatus,
        login,
        logoutUser, refreshOrders, addLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
