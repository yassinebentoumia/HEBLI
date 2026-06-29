// ============================================================
// HEBLI – Cashier: Create Invoice (Facture)
// Printable invoice creation page
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Plus, Trash2, Printer, Check, Save, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import {
  getSuppliers, addInvoice, nextInvoiceNumber, getInvoices, addAuditLog,
} from '@/utils/store';
import type { Supplier, SupplierProduct, InvoiceLine, Invoice } from '@/types';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [searchParams] = useSearchParams();
  const viewInvoiceId = searchParams.get('id');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<{ number: string; total: number } | null>(null);
  // When viewing an existing invoice (owner view), this is set
  const [readOnlyInvoice, setReadOnlyInvoice] = useState<Invoice | null>(null);

  // Stable invoice header (only for new invoices)
  const [invoiceNumber] = useState(() => nextInvoiceNumber());
  const [invoiceDate] = useState(() => new Date());

  // Product picker
  const [pickProductId, setPickProductId] = useState('');
  const [pickQty, setPickQty] = useState('1');

  useEffect(() => {
    setSuppliers(getSuppliers().sort((a, b) => a.name.localeCompare(b.name)));

    // If ?id= is in URL, load that existing invoice in read-only view
    if (viewInvoiceId) {
      const inv = getInvoices().find((i) => i.id === viewInvoiceId);
      if (inv) {
        setReadOnlyInvoice(inv);
        // Hydrate the rest so the layout renders identically
        const sup = getSuppliers().find((s) => s.id === inv.supplierId);
        setSelectedSupplier(sup || { id: inv.supplierId, name: inv.supplierName, products: [], createdAt: inv.createdAt });
        setLines(inv.lines);
        setNotes(inv.notes || '');
        setSaved({ number: inv.number, total: inv.total });
      }
    }
  }, [viewInvoiceId]);

  const productOptions: SupplierProduct[] = useMemo(
    () => (selectedSupplier ? selectedSupplier.products : []),
    [selectedSupplier]
  );

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const addLine = () => {
    if (!selectedSupplier || !pickProductId) return;
    const p = selectedSupplier.products.find((pp) => pp.id === pickProductId);
    if (!p) return;
    const qty = parseFloat(pickQty);
    if (isNaN(qty) || qty <= 0) return;
    setLines((prev) => [
      ...prev,
      {
        id: 'il-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        productId: p.id,
        productName: p.name + (p.unit ? ` / ${p.unit}` : ''),
        unitPrice: p.price,
        quantity: qty,
      },
    ]);
    setPickProductId('');
    setPickQty('1');
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSupplierChange = (id: string) => {
    const s = suppliers.find((x) => x.id === id) || null;
    setSelectedSupplier(s);
    setLines([]); // reset lines when changing supplier
  };

  const handleSave = () => {
    if (!selectedSupplier || lines.length === 0) return;
    const t = total;
    const date = invoiceDate.toISOString().split('T')[0];
    // Avoid duplicate save: if invoiceNumber already exists, regenerate
    const existing = getInvoices().some((i) => i.number === invoiceNumber);
    const num = existing ? nextInvoiceNumber() : invoiceNumber;
    addInvoice({
      id: 'inv-' + Date.now(),
      number: num,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      cashierName: user?.name || 'Unknown',
      lines: [...lines],
      total: t,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      date,
    });
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Invoice Created',
      details: `${num} · ${selectedSupplier.name} · ${t.toFixed(2)} DT`,
      user: user?.name || 'Unknown',
      timestamp: new Date().toISOString(),
    });
    setSaved({ number: num, total: t });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNew = () => {
    // simply reload the route to get a fresh invoice number
    window.location.reload();
  };

  const displayDate = readOnlyInvoice ? new Date(readOnlyInvoice.createdAt) : invoiceDate;
  const displayCashier = readOnlyInvoice ? readOnlyInvoice.cashierName : (user?.name || '—');
  const formattedDate = displayDate.toLocaleDateString([], {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Print styles — only the invoice paper prints, no chrome */}
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
            padding: 0 !important;
            max-width: none !important;
          }
          .print-area * {
            color: #000 !important;
            border-color: #ddd !important;
          }
          .print-gold { color: #B8941E !important; }
          .print-bg-light { background: #FAF6EB !important; }
          @page { size: A4; margin: 18mm; }
        }
      `}</style>

      {/* Top bar — hidden when printing */}
      <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(user?.role === 'Administrator' ? '/owner' : '/cashier')}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">Facture</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-white/30">{user?.name}</p>
          </div>
          <div className="flex-1" />
          {user?.role === 'Administrator' && (
            <button
              onClick={handlePrint}
              disabled={!saved}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors flex items-center gap-1.5"
              title="Owner-only feature"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          )}
          {!saved ? (
            <button
              onClick={handleSave}
              disabled={!selectedSupplier || lines.length === 0}
              className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-30 transition-colors flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> Save Invoice
            </button>
          ) : !readOnlyInvoice ? (
            <button
              onClick={handleNew}
              className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {saved && !readOnlyInvoice && (
          <div className="no-print mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-green-400">Invoice {saved.number} saved!</div>
              <div className="text-xs text-white/50">Total: {saved.total.toFixed(2)} DT — ready to print.</div>
            </div>
          </div>
        )}

        {/* ====== PRINTABLE INVOICE ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="print-area rounded-3xl border border-white/[0.06] bg-[#0C0C0C] shadow-2xl"
        >
          {/* HEAD */}
          <div className="p-6 sm:p-10 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#D4AF37] print-gold">HEBLI</div>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-white/40 uppercase">Premium Coffee · Facture</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Facture N°</div>
                <div className="text-xl font-bold text-[#D4AF37] print-gold tracking-wider">{saved ? saved.number : invoiceNumber}</div>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">Date</div>
                <div className="text-sm font-semibold">{formattedDate}</div>
                <div className="text-[10px] text-white/40">{formattedTime}</div>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">Cashier</div>
                <div className="text-sm font-semibold">{displayCashier}</div>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 sm:p-10 space-y-6">
            {/* Supplier picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                Supplier
              </label>
              {saved ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="font-bold text-base">{selectedSupplier?.name}</div>
                  {selectedSupplier?.phone && <div className="text-xs text-white/50 mt-0.5">📞 {selectedSupplier.phone}</div>}
                  {selectedSupplier?.address && <div className="text-xs text-white/50">📍 {selectedSupplier.address}</div>}
                </div>
              ) : suppliers.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                  ⚠️ No suppliers configured yet. Ask the owner to add suppliers in the Owner → Invoices tab.
                </div>
              ) : (
                <select
                  value={selectedSupplier?.id || ''}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="" className="bg-[#111]">— Select a supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#111]">
                      {s.name} ({s.products.length} products)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Add article row */}
            {selectedSupplier && !saved && (
              <div className="no-print rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/80 mb-3">
                  Add Article
                </div>
                {productOptions.length === 0 ? (
                  <div className="text-xs text-white/40">
                    This supplier has no products. Ask the owner to add some in the Invoices tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={pickProductId}
                      onChange={(e) => setPickProductId(e.target.value)}
                      className="col-span-8 sm:col-span-8 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-[#111]">— Choose article —</option>
                      {productOptions.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#111]">
                          {p.name}{p.unit ? ` / ${p.unit}` : ''} — {p.price.toFixed(2)} DT
                        </option>
                      ))}
                    </select>
                    <input
                      type="number" min="0.01" step="0.01"
                      value={pickQty}
                      onChange={(e) => setPickQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLine()}
                      placeholder="Qty"
                      className="col-span-3 sm:col-span-3 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      onClick={addLine}
                      disabled={!pickProductId}
                      className="col-span-1 sm:col-span-1 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-amber-400 disabled:opacity-30 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Articles table */}
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/50 print-bg-light">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">#</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Article</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Unit Price</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Qty</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Subtotal</th>
                    <th className="no-print w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/30 text-sm">
                        No articles yet. {selectedSupplier ? 'Add articles above.' : 'Select a supplier first.'}
                      </td>
                    </tr>
                  ) : (
                    lines.map((l, i) => (
                      <tr key={l.id} className="border-t border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/40">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium">{l.productName}</td>
                        <td className="px-4 py-2.5 text-right text-white/60">{l.unitPrice.toFixed(2)} DT</td>
                        <td className="px-4 py-2.5 text-right">{l.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#D4AF37] print-gold">
                          {(l.unitPrice * l.quantity).toFixed(2)} DT
                        </td>
                        <td className="no-print px-2 py-2 text-right">
                          {!saved && (
                            <button onClick={() => removeLine(l.id)} className="rounded p-1 text-white/30 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {!saved && (
              <div className="no-print">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Delivery info, payment terms, ..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none resize-none"
                />
              </div>
            )}
            {saved && notes && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">Notes</div>
                <div className="text-sm text-white/70 whitespace-pre-wrap">{notes}</div>
              </div>
            )}
          </div>

          {/* FOOT — total */}
          <div className="p-6 sm:p-10 border-t-2 border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37]/5 to-transparent print-bg-light">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Total Consommation</div>
                <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] print-gold tracking-tight mt-1">
                  {total.toFixed(2)} DT
                </div>
              </div>
              <div className="text-right text-[10px] text-white/30">
                <div>HEBLI — Premium Coffee Management</div>
                <div className="mt-0.5">Generated by {displayCashier} on {formattedDate}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom actions on mobile */}
        <div className="no-print mt-6 flex gap-3 sm:hidden">
          {!saved ? (
            <button
              onClick={handleSave}
              disabled={!selectedSupplier || lines.length === 0}
              className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> Save Invoice
            </button>
          ) : (
            <>
              {user?.role === 'Administrator' && (
                <button onClick={handlePrint} className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black flex items-center justify-center gap-2">
                  <Printer className="h-4 w-4" /> Print
                </button>
              )}
              <button onClick={handleNew} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> New
              </button>
            </>
          )}
        </div>

        {/* Cancel link */}
        {!saved && (
          <button
            onClick={() => navigate(user?.role === 'Administrator' ? '/owner' : '/cashier')}
            className="no-print mt-4 mx-auto block text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Cancel and return
          </button>
        )}
      </main>
    </div>
  );
}
