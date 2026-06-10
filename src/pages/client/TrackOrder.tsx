// ============================================================
// HEBLI – Live Order Tracking Page (Personalized)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, Circle, Timer, CreditCard, PackageOpen, User, Coffee, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { getOrders } from '@/utils/store';
import type { Order, OrderStatus } from '@/types';

const statusSteps: { status: OrderStatus; icon: typeof Clock; label: string; description: string }[] = [
  { status: 'Pending', icon: Clock, label: 'Order Received', description: 'Your order has been placed and is awaiting processing.' },
  { status: 'In Preparation', icon: Timer, label: 'In Preparation', description: 'Our barista is crafting your drinks with care.' },
  { status: 'Ready', icon: PackageOpen, label: 'Ready for Pickup', description: 'Your order is ready! Please proceed to the cashier to pay and collect.' },
  { status: 'Paid', icon: CreditCard, label: 'Payment Confirmed', description: 'Payment successful. Enjoy your premium coffee!' },
];

const statusColor: Record<OrderStatus, string> = {
  'Pending': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'In Preparation': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Ready': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  'Paid': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inputName, setInputName] = useState('');

  const loadOrders = useCallback((name: string) => {
    const all = getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const mine = all.filter(o => o.clientName.toLowerCase() === name.toLowerCase());
    setMyOrders(mine);
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('hebli_client_name');
    if (savedName) {
      setClientName(savedName);
      setInputName(savedName);
      loadOrders(savedName);
    }
  }, [loadOrders]);

  // Poll for updates
  useEffect(() => {
    if (!clientName) return;
    const interval = setInterval(() => {
      loadOrders(clientName);
      if (selectedOrder) {
        const all = getOrders();
        const updated = all.find(o => o.id === selectedOrder.id);
        if (updated && updated.status !== selectedOrder.status) {
          setSelectedOrder(updated);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [clientName, selectedOrder, loadOrders]);

  const handleFindOrders = () => {
    if (!inputName.trim()) return;
    localStorage.setItem('hebli_client_name', inputName.trim());
    setClientName(inputName.trim());
    loadOrders(inputName.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('hebli_client_name');
    setClientName('');
    setInputName('');
    setMyOrders([]);
    setSelectedOrder(null);
  };

  const currentStepIndex = selectedOrder ? statusSteps.findIndex((s) => s.status === selectedOrder.status) : -1;

  if (!clientName) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <button onClick={() => navigate('/')} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight"><span className="text-[#D4AF37]">HEBLI</span> Track Order</h1>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-4xl">
            <User className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-bold">Welcome Back!</h2>
          <p className="mt-2 text-white/40">Enter your name to see your active orders.</p>

          <GlassCard className="mt-8">
            <input
              type="text"
              placeholder="Enter your name..."
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindOrders()}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors mb-4"
            />
            <button
              onClick={handleFindOrders}
              className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
            >
              See My Orders
            </button>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate('/')} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight"><span className="text-[#D4AF37]">HEBLI</span> My Orders</h1>
          <div className="flex-1" />
          <button onClick={handleLogout} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-colors" title="Switch user">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        {!selectedOrder ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-white/40">Hello, {clientName}!</h2>
              <span className="text-xs text-white/20">{myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</span>
            </div>

            {myOrders.length > 0 ? (
              <div className="space-y-3">
                {myOrders.map((o) => (
                  <motion.button
                    key={o.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedOrder(o)}
                    className="w-full text-left"
                  >
                    <GlassCard className={`flex items-center justify-between p-4 ${o.status === 'Ready' ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#D4AF37]">{o.id}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase ${statusColor[o.status]}`}>
                            {o.status}
                          </span>
                          {o.status === 'Ready' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D4AF37] animate-pulse">
                              <Bell className="h-3 w-3" />
                              Go pay
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-white/40">
                          <Clock className="h-3 w-3" />
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white/60">{o.total.toFixed(2)} DT</span>
                    </GlassCard>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-white/20">
                <Coffee className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-4 text-sm">You haven't placed any orders yet.</p>
                <button onClick={() => navigate('/client/menu')} className="mt-4 text-sm text-[#D4AF37] hover:text-amber-400 transition-colors">
                  Browse Menu →
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setSelectedOrder(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to my orders
            </button>

            <GlassCard className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/40 tracking-wider uppercase">Order</div>
                  <div className="mt-1 text-2xl font-bold text-[#D4AF37] tracking-wider">{selectedOrder.id}</div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[0.1em] uppercase ${statusColor[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
                <div>
                  <div className="text-xs text-white/30">Customer</div>
                  <div className="mt-1 text-sm font-medium">{selectedOrder.clientName}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30">Items</div>
                  <div className="mt-1 text-sm font-medium">{selectedOrder.items.reduce((s, i) => s + i.quantity, 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30">Total</div>
                  <div className="mt-1 text-sm font-bold text-[#D4AF37]">{selectedOrder.total.toFixed(2)} DT</div>
                </div>
              </div>
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <div className="text-xs text-white/30 mb-2">Items</div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-white/70">{item.quantity}x {item.name}</span>
                    <span className="text-white/50">{(item.price * item.quantity).toFixed(2)} DT</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Payment Notification Banner */}
            {selectedOrder.status === 'Ready' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mb-8 rounded-3xl border-2 border-[#D4AF37]/50 bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/10 p-6 shadow-2xl shadow-[#D4AF37]/20"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/40"
                  >
                    <Bell className="h-7 w-7 text-black" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#D4AF37] mb-2">Your order is ready!</h3>
                    <p className="text-white/70 text-sm mb-3">
                      Please proceed to the <strong className="text-white">cashier</strong> to pay <strong className="text-[#D4AF37]">{selectedOrder.total.toFixed(2)} DT</strong> and collect your order.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span>Waiting for payment at cashier</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <GlassCard>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-6">Order Progress</h3>
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/[0.06]" />
                <motion.div
                  className="absolute left-[19px] top-2 w-0.5 bg-gradient-to-b from-[#D4AF37] to-amber-400"
                  initial={{ height: '0%' }}
                  animate={{ height: `${((currentStepIndex + 1) / statusSteps.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="space-y-6">
                  {statusSteps.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <motion.div key={step.status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                        <div className="relative z-10">
                          {isCompleted ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg ${isCurrent ? 'bg-[#D4AF37] text-black shadow-[#D4AF37]/30' : 'bg-green-500/20 text-green-400'}`}>
                              <CheckCircle2 className="h-5 w-5" />
                            </motion.div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] text-white/20">
                              <Circle className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className={`flex-1 pt-1 ${!isCompleted ? 'opacity-30' : ''}`}>
                          <div className={`text-sm font-semibold ${isCurrent ? 'text-[#D4AF37]' : 'text-white'}`}>{step.label}</div>
                          <div className="mt-0.5 text-xs text-white/40">{step.description}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            <div className="mt-8 text-center flex gap-4 justify-center">
              <button onClick={() => setSelectedOrder(null)} className="rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all">
                Track Another
              </button>
              <button onClick={() => navigate('/client/menu')} className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-all">
                Order More
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
