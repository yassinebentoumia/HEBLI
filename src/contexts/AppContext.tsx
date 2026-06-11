// ============================================================
// HEBLI – Global App Context (Auto Cross-Device Cloud Sync)
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
} from '@/utils/store';
import { pullRemote, pushRemote, isSynced, getCafeCode, joinCafe } from '@/utils/sync';

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

  // Bootstrap auto-sync
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initializeData();
    setUser(getCurrentUser());
    setOrders(getOrders());
    createBackup();

    (async () => {
      // 1. Check if URL hash contains ?cafe=CODE — auto-join that café.
      try {
        const hash = window.location.hash || '';
        const queryStart = hash.indexOf('?');
        if (queryStart !== -1) {
          const params = new URLSearchParams(hash.substring(queryStart + 1));
          const urlCafe = params.get('cafe');
          if (urlCafe && urlCafe !== getCafeCode()) {
            const ok = await joinCafe(urlCafe);
            if (ok) {
              localStorage.setItem('hebli_shared_cafe_published', urlCafe);
            }
          }
        }
      } catch { /* ignore */ }

      // 2. Use the device's existing café code if present.
      const code = getCafeCode();
      if (code) {
        const ok = await pullRemote();
        setSyncStatus('online');
        if (ok) {
          setOrders(getOrders());
          setSyncTick((t) => t + 1);
        }
      } else {
        // No café connected yet — owner must create one and share the code.
        setSyncStatus('offline');
      }
    })();

    // Sync poll every 2 seconds
    const syncPoll = setInterval(async () => {
      if (isSynced()) {
        try {
          const changed = await pullRemote();
          setSyncStatus('online');
          if (changed) {
            setOrders(getOrders());
            setSyncTick((t) => t + 1);
          } else {
            setOrders(getOrders());
          }
        } catch {
          setSyncStatus('offline');
        }
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

  const login = useCallback((pin: string) => {
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
    <AppContext.Provider value={{ user, orders, syncTick, syncStatus, login, logoutUser, refreshOrders, addLog }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
