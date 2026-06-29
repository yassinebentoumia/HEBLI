// ============================================================
// HEBLI – AI Agent Context Builder
// Aggregates a rich, compact snapshot of every dashboard metric
// so the LLM can answer ANY business question accurately.
// ============================================================

import {
  getOrders, getPayments, getStaff, getProducts, getCategories,
  getInvoices, getSuppliers, getConsumptions, getSessions,
  getStaffDayDuration, getStaffMonthDuration, computeAnalytics,
} from '@/utils/store';

export function buildAIContext() {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const monthKey = todayKey.slice(0, 7);
  const yearKey = todayKey.slice(0, 4);

  const orders = getOrders();
  const payments = getPayments();
  const staff = getStaff();
  const products = getProducts();
  const categories = getCategories();
  const invoices = getInvoices();
  const suppliers = getSuppliers();
  const consumptions = getConsumptions();
  const sessions = getSessions();

  // --- Per-staff today + month worked seconds + computed pay
  const staffStats = staff.map((s) => {
    const todaySec = getStaffDayDuration(s.id, todayKey);
    const monthSec = getStaffMonthDuration(s.id, monthKey);
    const perMin = s.salaryPerMinute || 0;
    return {
      name: s.name,
      role: s.role,
      rating: s.rating || null,
      active: s.active,
      salaryPerMinute: perMin,
      workedTodayMinutes: Math.round(todaySec / 60),
      workedMonthMinutes: Math.round(monthSec / 60),
      payToday: +(((todaySec / 60) * perMin).toFixed(2)),
      payMonth: +(((monthSec / 60) * perMin).toFixed(2)),
      onDutyNow: sessions.some((x) => x.staffId === s.id && x.active),
    };
  });

  // --- Per-cashier sales today/week/month
  const cashierSales: Record<string, { today: number; week: number; month: number; ordersToday: number }> = {};
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  payments.forEach((p) => {
    const d = new Date(p.createdAt);
    const name = p.cashierName || 'Unknown';
    if (!cashierSales[name]) cashierSales[name] = { today: 0, week: 0, month: 0, ordersToday: 0 };
    if (p.date === todayKey) { cashierSales[name].today += p.amount; cashierSales[name].ordersToday += 1; }
    if (d >= weekStart) cashierSales[name].week += p.amount;
    if (p.date.startsWith(monthKey)) cashierSales[name].month += p.amount;
  });

  // --- Top selling products (today + month + all-time)
  const productCount = new Map<string, { qty: number; revenue: number }>();
  const productCountToday = new Map<string, { qty: number; revenue: number }>();
  orders.forEach((o) => {
    const isPaid = o.status === 'Paid' || o.status === 'Ready';
    if (!isPaid) return;
    const isToday = o.createdAt.split('T')[0] === todayKey;
    o.items.forEach((it) => {
      const ex = productCount.get(it.name) || { qty: 0, revenue: 0 };
      ex.qty += it.quantity;
      ex.revenue += it.quantity * it.price;
      productCount.set(it.name, ex);
      if (isToday) {
        const t = productCountToday.get(it.name) || { qty: 0, revenue: 0 };
        t.qty += it.quantity;
        t.revenue += it.quantity * it.price;
        productCountToday.set(it.name, t);
      }
    });
  });
  const topProducts = Array.from(productCount.entries())
    .map(([name, v]) => ({ name, qty: v.qty, revenue: +v.revenue.toFixed(2) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  const topProductsToday = Array.from(productCountToday.entries())
    .map(([name, v]) => ({ name, qty: v.qty, revenue: +v.revenue.toFixed(2) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // --- Revenue snapshots from existing analytics util
  const analyticsToday = computeAnalytics('today');
  const analyticsMonth = computeAnalytics('month');
  const analyticsYear = computeAnalytics('year');

  // --- Invoices / consommation summaries
  const invoicesThisMonth = invoices.filter((i) => i.date.startsWith(monthKey));
  const totalInvoicesMonth = invoicesThisMonth.reduce((s, i) => s + i.total, 0);
  const totalInvoicesAllTime = invoices.reduce((s, i) => s + i.total, 0);
  const consumptionsToday = consumptions.filter((c) => c.date === todayKey);
  const consumptionsMonth = consumptions.filter((c) => c.date.startsWith(monthKey));

  // --- Inventory snapshot (top 15 by spent)
  const invMap = new Map<string, { qty: number; spent: number; unit: string }>();
  invoices.forEach((inv) => {
    inv.lines.forEach((l) => {
      const k = l.productName.replace(/\s*\/\s*.+$/, '').trim();
      const unit = (l.productName.match(/\/\s*(.+)$/) || [, ''])[1].trim();
      const ex = invMap.get(k) || { qty: 0, spent: 0, unit };
      ex.qty += l.quantity;
      ex.spent += l.quantity * l.unitPrice;
      if (!ex.unit && unit) ex.unit = unit;
      invMap.set(k, ex);
    });
  });
  consumptions.forEach((c) => {
    const k = (c.variantName || c.productName).replace(/\s*\/\s*.+$/, '').trim();
    const ex = invMap.get(k);
    if (ex) ex.qty = Math.max(0, ex.qty - c.quantity);
  });
  const inventorySummary = Array.from(invMap.entries())
    .map(([name, v]) => ({ name, currentQty: +v.qty.toFixed(2), unit: v.unit, spent: +v.spent.toFixed(2) }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 15);

  return {
    inventory: inventorySummary,
    now: today.toISOString(),
    today: todayKey,
    month: monthKey,
    year: yearKey,
    cafe: {
      name: 'HEBLI',
      currency: 'DT',
    },
    summary: {
      revenueToday: +analyticsToday.totalRevenue.toFixed(2),
      ordersToday: analyticsToday.totalOrders,
      revenueMonth: +analyticsMonth.totalRevenue.toFixed(2),
      ordersMonth: analyticsMonth.totalOrders,
      revenueYear: +analyticsYear.totalRevenue.toFixed(2),
      ordersYear: analyticsYear.totalOrders,
      avgOrderToday: +analyticsToday.averageOrderValue.toFixed(2),
      avgOrderMonth: +analyticsMonth.averageOrderValue.toFixed(2),
      invoicesMonthTotal: +totalInvoicesMonth.toFixed(2),
      invoicesAllTime: +totalInvoicesAllTime.toFixed(2),
      netMonth: +(analyticsMonth.totalRevenue - totalInvoicesMonth).toFixed(2),
      consumptionsToday: consumptionsToday.length,
      consumptionsMonth: consumptionsMonth.length,
    },
    staff: staffStats,
    cashierSales: Object.entries(cashierSales).map(([name, v]) => ({
      cashier: name,
      revenueToday: +v.today.toFixed(2),
      revenueWeek: +v.week.toFixed(2),
      revenueMonth: +v.month.toFixed(2),
      ordersToday: v.ordersToday,
    })),
    topSellingProductsToday: topProductsToday,
    topSellingProductsAllTime: topProducts,
    revenueByCategory: analyticsMonth.revenueByCategory,
    revenueByDay: analyticsMonth.revenueByDay,
    revenueByHour: analyticsMonth.revenueByHour,
    products: products.map((p) => ({ name: p.name, category: p.category, price: p.price, active: p.active })),
    categories: categories.map((c) => c.name),
    suppliers: suppliers.map((s) => ({ name: s.name, phone: s.phone, productCount: s.products.length })),
    recentInvoices: invoices.slice(-10).map((i) => ({
      number: i.number, supplier: i.supplierName, cashier: i.cashierName,
      total: i.total, lines: i.lines.length, date: i.date,
    })),
    recentConsumptions: consumptions.slice(-10).map((c) => ({
      product: c.variantName || c.productName,
      qty: c.quantity, unit: c.unit, by: c.consumedBy, date: c.date,
    })),
    activeStaffOnDutyNow: sessions.filter((s) => s.active).map((s) => s.staffName),
  };
}
