// ============================================================
// HEBLI – Shift Report (Rapport de Shift)
// Printable. Owner-only.
//
// URL: /report?cashier=NAME&period=day|week|month&date=YYYY-MM-DD&shift=day|night|all
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getPayments, getOrders, getInvoices } from '@/utils/store';

type Shift = 'day' | 'night' | 'all';
type Period = 'day' | 'week' | 'month';

// Day shift = 06:00–18:00, Night shift = 18:00–06:00 (next day)
function isInShift(d: Date, shift: Shift): boolean {
  if (shift === 'all') return true;
  const h = d.getHours();
  if (shift === 'day') return h >= 6 && h < 18;
  return h >= 18 || h < 6;
}

function periodRange(period: Period, anchor: Date): { from: Date; to: Date; label: string } {
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);
  if (period === 'day') {
    const from = new Date(a);
    const to = new Date(a);
    to.setHours(23, 59, 59, 999);
    return { from, to, label: from.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) };
  }
  if (period === 'week') {
    const day = a.getDay(); // 0..6 Sun..Sat
    const monday = new Date(a);
    monday.setDate(a.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
      from: monday, to: sunday,
      label: `Week of ${monday.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }
  // month
  const first = new Date(a.getFullYear(), a.getMonth(), 1);
  const last = new Date(a.getFullYear(), a.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: first, to: last, label: first.toLocaleDateString([], { year: 'numeric', month: 'long' }) };
}

export default function ShiftReport() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [params] = useSearchParams();

  const cashier = params.get('cashier') || 'All Cashiers';
  const shift = (params.get('shift') as Shift) || 'all';
  const period = (params.get('period') as Period) || 'day';
  const dateParam = params.get('date');
  const anchor = useMemo(() => (dateParam ? new Date(dateParam) : new Date()), [dateParam]);

  const range = useMemo(() => periodRange(period, anchor), [period, anchor]);

  const [payments, setPayments] = useState(() => getPayments());
  const [orders, setOrders] = useState(() => getOrders());
  const [invoices, setInvoices] = useState(() => getInvoices());

  useEffect(() => {
    const load = () => {
      setPayments(getPayments());
      setOrders(getOrders());
      setInvoices(getInvoices());
    };
    load();
    const int = setInterval(load, 4000);
    return () => clearInterval(int);
  }, []);

  // 1) Filter payments by cashier + period + shift
  const matchPayment = (p: typeof payments[number]) => {
    const d = new Date(p.createdAt);
    if (d < range.from || d > range.to) return false;
    if (!isInShift(d, shift)) return false;
    if (cashier !== 'All Cashiers' && p.cashierName !== cashier) return false;
    return true;
  };

  const matchedPayments = payments.filter(matchPayment);
  const orderById = new Map(orders.map((o) => [o.id, o]));

  // 2) Aggregate by product across all matched orders
  type Agg = { name: string; qty: number; unitPrice: number; total: number };
  const aggMap = new Map<string, Agg>();
  matchedPayments.forEach((p) => {
    const o = orderById.get(p.orderId);
    if (!o) return;
    o.items.forEach((it) => {
      const key = it.name.trim().toLowerCase();
      const ex = aggMap.get(key);
      if (ex) {
        ex.qty += it.quantity;
        ex.total += it.quantity * it.price;
      } else {
        aggMap.set(key, { name: it.name, qty: it.quantity, unitPrice: it.price, total: it.quantity * it.price });
      }
    });
  });
  const productRows = Array.from(aggMap.values()).sort((a, b) => b.total - a.total);
  const totalSales = productRows.reduce((s, r) => s + r.total, 0);
  const totalUnits = productRows.reduce((s, r) => s + r.qty, 0);
  const totalOrders = matchedPayments.length;

  // 3) Invoices (consommation) in the same window — filtered by cashier if specific
  const matchedInvoices = invoices.filter((inv) => {
    const d = new Date(inv.createdAt);
    if (d < range.from || d > range.to) return false;
    if (!isInShift(d, shift)) return false;
    if (cashier !== 'All Cashiers' && inv.cashierName !== cashier) return false;
    return true;
  });
  const totalConsommation = matchedInvoices.reduce((s, i) => s + i.total, 0);

  const net = totalSales - totalConsommation;
  const shiftLabel = shift === 'day' ? 'Jour (06:00–18:00)' : shift === 'night' ? 'Nuit (18:00–06:00)' : 'Toutes les heures';
  const periodLabel = period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : 'Mois';

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area {
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .print-area * { color: #000 !important; border-color: #ddd !important; }
          .print-gold { color: #B8941E !important; }
          .print-bg-light { background: #FAF6EB !important; }
          @page { size: A4; margin: 18mm; }
        }
      `}</style>

      <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate('/owner')}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37]">HEBLI</span> Rapport
            </h1>
            <p className="text-[10px] sm:text-xs text-white/30">{user?.name}</p>
          </div>
          <div className="flex-1" />
          {user?.role === 'Administrator' && (
            <button
              onClick={handlePrint}
              className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="print-area rounded-3xl border border-white/[0.06] bg-[#0C0C0C] shadow-2xl"
        >
          {/* HEAD */}
          <div className="p-6 sm:p-10 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#D4AF37] print-gold">HEBLI</div>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-white/40 uppercase">Rapport de Shift</div>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Date</div>
                  <div className="text-sm font-semibold">{range.label}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Shift</div>
                  <div className="text-sm font-semibold">{shiftLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Période</div>
                  <div className="text-sm font-semibold">{periodLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Caisse</div>
                  <div className="text-sm font-semibold">{cashier}</div>
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 sm:p-10 space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                Ventes par produit
              </div>
              <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/50 print-bg-light">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">#</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Produit</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Quantité</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Prix unitaire</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-sm">
                          Aucune vente trouvée pour cette période / shift / caisse.
                        </td>
                      </tr>
                    ) : (
                      productRows.map((r, i) => (
                        <tr key={r.name} className="border-t border-white/[0.04]">
                          <td className="px-4 py-2.5 text-white/40">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{r.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{r.qty}</td>
                          <td className="px-4 py-2.5 text-right text-white/60">{r.unitPrice.toFixed(2)} DT</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#D4AF37] print-gold">
                            {r.total.toFixed(2)} DT
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {productRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#D4AF37]/40 print-bg-light">
                        <td colSpan={2} className="px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-semibold">
                          Sous-total ventes ({totalUnits} unités · {totalOrders} commandes)
                        </td>
                        <td colSpan={2}></td>
                        <td className="px-4 py-3 text-right font-bold text-[#D4AF37] print-gold text-base">
                          {totalSales.toFixed(2)} DT
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Consommation from invoices */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                Consommation (factures dans la période)
              </div>
              {matchedInvoices.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40">
                  Aucune facture enregistrée pendant ce shift / période.
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/50 print-bg-light">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">N° Facture</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Fournisseur</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Caissier</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Articles</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedInvoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-white/[0.04]">
                          <td className="px-4 py-2.5 font-bold text-[#D4AF37] print-gold">{inv.number}</td>
                          <td className="px-4 py-2.5">{inv.supplierName}</td>
                          <td className="px-4 py-2.5 text-white/60">{inv.cashierName}</td>
                          <td className="px-4 py-2.5 text-right text-white/60">{inv.lines.length}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{inv.total.toFixed(2)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-red-500/40 print-bg-light">
                        <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-semibold">
                          Total consommation
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-400 print-gold text-base">
                          −{totalConsommation.toFixed(2)} DT
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* FOOT */}
          <div className="p-6 sm:p-10 border-t-2 border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37]/5 to-transparent print-bg-light">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">Total Ventes</div>
                <div className="text-2xl sm:text-3xl font-black text-[#D4AF37] print-gold tracking-tight mt-1">
                  {totalSales.toFixed(2)} DT
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">Total Consommation</div>
                <div className="text-2xl sm:text-3xl font-black text-red-400 print-gold tracking-tight mt-1">
                  −{totalConsommation.toFixed(2)} DT
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">Net</div>
                <div className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${net >= 0 ? 'text-green-400' : 'text-red-400'} print-gold`}>
                  {net >= 0 ? '+' : ''}{net.toFixed(2)} DT
                </div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-white/30 text-right">
              Generated by {user?.name} on {new Date().toLocaleString()}
            </div>
          </div>
        </motion.div>

        <div className="no-print mt-4 text-center">
          <button onClick={() => navigate('/owner')} className="text-xs text-white/30 hover:text-white/60">
            ← Back to Owner Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
