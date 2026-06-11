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

    initializeData();
    setUser(getCurrentUser());
    setOrders(getOrders());
    createBackup();

    // Initial pull from server
    (async () => {
      const changed = await pullRemote();
      setSyncStatus(isOnline() ? 'online' : 'offline');
      if (changed) {
        setOrders(getOrders());
        setSyncTick((t) => t + 1);
        // Refresh current user too (in case staff list was updated remotely)
        setUser(getCurrentUser());
      }
      // Push local data up so the server has anything we created offline.
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
