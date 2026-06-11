// ============================================================
// HEBLI – Shared Staff Top Bar Controls
// (On-Duty timer, Notifications, Team Chat, Sync, Logout)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, LogOut, Power, X, Clock, Cloud, CloudOff, Loader2 } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import { useApp } from '@/contexts/AppContext';
import {
  startSession, endSession, getActiveSessions, getStaffDayDuration,
  getNotificationsFor, markAllNotificationsRead,
} from '@/utils/store';
import type { AppNotification } from '@/types';

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface StaffTopBarProps {
  onLogout: () => void;
}

export default function StaffTopBar({ onLogout }: StaffTopBarProps) {
  const { user, syncTick, syncStatus } = useApp();
  const [onDuty, setOnDuty] = useState(false);
  const [dutySeconds, setDutySeconds] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const sessionId = useRef<string | null>(null);
  const prevNotifCount = useRef(0);

  // Restore duty state for this user (in case of refresh)
  useEffect(() => {
    if (!user) return;
    const active = getActiveSessions().find((s) => s.staffId === user.id);
    if (active) {
      sessionId.current = active.id;
      setOnDuty(true);
    }
  }, [user]);

  // Live duty timer
  useEffect(() => {
    if (!user) return;
    const update = () => {
      const today = new Date().toISOString().split('T')[0];
      setDutySeconds(getStaffDayDuration(user.id, today));
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [user, onDuty]);

  // Load notifications + sound on new
  const loadNotifs = useCallback(() => {
    if (!user) return;
    const list = getNotificationsFor(user.name, user.role);
    setNotifs(list);
    const unread = list.filter((n) => !n.read).length;
    if (unread > prevNotifCount.current && prevNotifCount.current >= 0) {
      // play a soft sound for new notification
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 760;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } catch { /* ignore */ }
    }
    prevNotifCount.current = unread;
  }, [user]);

  useEffect(() => {
    loadNotifs();
    const int = setInterval(loadNotifs, 2000);
    return () => clearInterval(int);
  }, [loadNotifs, syncTick]);

  const toggleDuty = () => {
    if (!user) return;
    if (onDuty) {
      if (sessionId.current) endSession(sessionId.current);
      sessionId.current = null;
      setOnDuty(false);
    } else {
      const sid = startSession({ id: user.id, name: user.name, role: user.role });
      sessionId.current = sid;
      setOnDuty(true);
    }
  };

  const handleLogout = () => {
    if (onDuty && sessionId.current) endSession(sessionId.current);
    onLogout();
  };

  const openNotifs = () => {
    setNotifOpen(true);
    if (user) markAllNotificationsRead(user.name, user.role);
    setTimeout(loadNotifs, 100);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
        {/* On-Duty Toggle */}
        <button
          onClick={toggleDuty}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition-colors ${
            onDuty
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white'
          }`}
          title={onDuty ? 'On duty — tap to clock out' : 'Off duty — tap to clock in'}
        >
          <Power className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {onDuty ? (
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> {fmtDuration(dutySeconds)}
            </span>
          ) : (
            <span className="hidden sm:inline">Off Duty</span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={openNotifs}
          className="relative rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Team Chat */}
        <button
          onClick={() => setChatOpen(true)}
          className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          title="Team chat"
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Sync status indicator (auto, no setup) */}
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 py-2 text-[10px] font-semibold ${
            syncStatus === 'online'
              ? 'border-green-500/20 bg-green-500/5 text-green-400'
              : syncStatus === 'offline'
              ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
          }`}
          title={
            syncStatus === 'online' ? 'Live sync — all devices in real time'
              : syncStatus === 'offline' ? 'Server unreachable — working offline'
              : 'Connecting...'
          }
        >
          {syncStatus === 'connecting' ? (
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
          ) : syncStatus === 'online' ? (
            <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          ) : (
            <CloudOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
          <span className="hidden md:inline tracking-wider uppercase">
            {syncStatus === 'online' ? 'Live' : syncStatus === 'offline' ? 'Offline' : '...'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rounded-xl p-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Log out"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Notifications Drawer — rendered via PORTAL so it escapes the sticky header */}
      {createPortal(
        <AnimatePresence>
          {notifOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                onClick={() => setNotifOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[460px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A] flex-shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 flex-shrink-0">
                      <Bell className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold">Notifications</h2>
                      <p className="text-xs text-white/40">{notifs.length} total · {notifs.filter(n => !n.read).length} unread</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifOpen(false)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05] flex-shrink-0">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {notifs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/20 py-20">
                      <Bell className="h-12 w-12 opacity-30 mb-3" />
                      <p className="text-sm">No notifications yet.</p>
                      <p className="text-xs mt-1 text-white/15">You'll see new orders & messages here.</p>
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">{n.type === 'order' ? '🔔' : n.type === 'message' ? '💬' : 'ℹ️'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-white">{n.title}</div>
                            <p className="mt-1 text-sm text-white/60 break-words">{n.body}</p>
                            <div className="mt-2 text-[10px] text-white/30 tracking-wider uppercase">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Team Chat Drawer — rendered via PORTAL */}
      {createPortal(
        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                onClick={() => setChatOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[460px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A] flex-shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold">Team Chat</h2>
                      <p className="text-xs text-white/40">Barista · Cashier · Owner</p>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05] flex-shrink-0">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
                  <ChatPanel
                    conversationId="group"
                    senderName={user?.name || 'Staff'}
                    senderRole={user?.role || 'Staff'}
                    heightClass="flex-1 min-h-0"
                    emptyText="Team group chat — start the conversation!"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
