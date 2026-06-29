// ============================================================
// HEBLI – Global App Context (Auto Cross-Device Sync)
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Staff, Order } from '@/types';
import {
  initializeData,
  getCurrentUser,
  getOrders,
  loginStaff,
  logout,
  createBackup,
  addAuditLog,
  startSession,
  endSession,
  getActiveSessions,
} from '@/utils/store';
import { pullRemote, pushRemote, isOnline } from '@/utils/sync';

interface AppContextType {
  user: Staff | null;
  orders: Order[];
  syncTick: number;
  syncStatus: 'connecting' | 'online' | 'offline';
  login: (pin: string) => Staff | null;
  logoutUser: () => void;
  refreshOrders: () => void;
  addLog: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  orders: [],
  syncTick: 0,
  syncStatus: 'connecting',
  login: () => null,
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

      setUser(getCurrentUser());
      setOrders(getOrders());
      createBackup();
      if (pulled) setSyncTick((t) => t + 1);

      // 3) Push our (possibly default-seeded) data — server will merge
      //    and tombstones will still suppress any deleted items.
      await pushRemote();
    })();

    // Poll every 2s for remote changes
    const syncPoll = setInterval(async () => {
      const changed = await pullRemote();
      setSyncStatus(isOnline() ? 'online' : 'offline');
      if (changed) {
        setOrders(getOrders());
        setSyncTick((t) => t + 1);
      } else {
        setOrders(getOrders());
      }
    }, 2000);

    const backupInterval = setInterval(createBackup, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(syncPoll);
      clearInterval(backupInterval);
    };
  }, []);

  const login = useCallback(async (pin: string) => {
    // Pull latest staff list before validating PIN — fixes "account doesn't exist on phone"
    await pullRemote();
    const staff = loginStaff(pin);
    if (staff) {
      setUser(staff);
      addAuditLog({
        id: 'log-' + Date.now(),
        action: 'Login',
        details: `${staff.name} (${staff.role}) logged in`,
        user: staff.name,
        timestamp: new Date().toISOString(),
      });
      // 🕒 Auto-start the on-duty timer
      try {
        // Reuse any active session that already exists for this staff
        const existing = getActiveSessions().find((s) => s.staffId === staff.id);
        const sessionId = existing
          ? existing.id
          : startSession({ id: staff.id, name: staff.name, role: staff.role });
        localStorage.setItem('hebli_active_session_id', sessionId);
      } catch { /* ignore */ }
      pushRemote();
    }
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
        login: login as any, // async wrapper still typed as sync for back-compat
        logoutUser, refreshOrders, addLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
