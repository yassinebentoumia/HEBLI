// ============================================================
// HEBLI – Global App Context
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

interface AppContextType {
  user: Staff | null;
  orders: Order[];
  login: (pin: string) => Staff | null;
  logoutUser: () => void;
  refreshOrders: () => void;
  addLog: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  orders: [],
  login: () => null,
  logoutUser: () => {},
  refreshOrders: () => {},
  addLog: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    initializeData();
    setUser(getCurrentUser());
    setOrders(getOrders());

    // Auto backup every 6 hours
    const backupInterval = setInterval(createBackup, 6 * 60 * 60 * 1000);
    // Also backup on first load
    createBackup();

    // Poll orders every 5 seconds for "realtime"
    const poll = setInterval(() => {
      setOrders(getOrders());
    }, 5000);

    return () => {
      clearInterval(backupInterval);
      clearInterval(poll);
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
    <AppContext.Provider value={{ user, orders, login, logoutUser, refreshOrders, addLog }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
