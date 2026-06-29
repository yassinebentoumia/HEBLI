// ============================================================
// HEBLI – Owner Dashboard (Premium Management Center)
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  Send,
  FileText,
  Activity,
  DollarSign,
  Zap,
  Shield,
  PackageOpen,
  MessageCircle,
  LifeBuoy,
  Clock,
  CircleDot,
  Bell,
  Receipt,
  Star,
  Calendar,
  Printer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonStat } from '@/components/ui/Skeleton';
import { useApp } from '@/contexts/AppContext';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getStaff,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getOrders,
  getInventory,

  getAuditLogs,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  computeAnalytics,
  getTickets,
  updateTicket,
  getSessions,
  getStaffDayDuration,
  getStaffMonthDuration,
  addNotification,
  getPayments,
  deleteOrder,
  deletePayment,
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getInvoices,
  getConsumptions,
  addConsumption,
} from '@/utils/store';
import StaffTopBar from '@/components/StaffTopBar';
import { getStaffTitle } from '@/utils/roles';
import ChatPanel from '@/components/ChatPanel';
import type {
  Product,
  Staff,

  AuditLog,
  Category,
  Ticket,
  Order,
  Payment,
  Supplier,
  SupplierProduct,
  Invoice,
  Consumption,
  StaffRole,
} from '@/types';

const COLORS = ['#D4AF37', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#EC4899'];

type Tab = 'dashboard' | 'products' | 'categories' | 'staff' | 'inventory' | 'orders' | 'invoices' | 'reports' | 'analytics' | 'assistant' | 'chat' | 'tickets' | 'logs';

const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: Receipt },
  { key: 'reports', label: 'Shift Reports', icon: FileText },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'categories', label: 'Categories', icon: Package },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'inventory', label: 'Inventory', icon: PackageOpen },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'chat', label: 'Team Chat', icon: MessageCircle },
  { key: 'tickets', label: 'Tickets', icon: LifeBuoy },
  { key: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { key: 'logs', label: 'Audit Logs', icon: FileText },
];
const staffRoles: StaffRole[] = ['Barista', 'Cashier', 'Administrator'];
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <OverviewTab />;
      case 'products': return <ProductsTab />;
      case 'categories': return <CategoriesTab />;
      case 'staff': return <StaffTab />;
      case 'inventory': return <InventoryTab />;
      case 'orders': return <OrdersTab />;
      case 'invoices': return <InvoicesTab />;
      case 'reports': return <ReportsTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'chat': return <TeamChatTab />;
      case 'tickets': return <TicketsTab />;
      case 'assistant': return <AIAssistantTab />;
      case 'logs': return <AuditLogsTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 flex-shrink-0">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">Owner</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          <StaffTopBar onLogout={() => { logoutUser(); navigate('/staff'); }} />
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          renderTab()
        )}
      </main>
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const analytics = useMemo(() => computeAnalytics(period), [period]);
  const orders = useMemo(() => getOrders(), []);
  const lowStock = useMemo(() => getInventory().filter((i) => i.quantity <= i.minStock), []);

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-xl px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
              period === p
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                : 'border border-white/[0.06] text-white/40 hover:text-white/70'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 tracking-wider uppercase">Revenue</div>
                <div className="text-2xl font-bold">{analytics.totalRevenue.toFixed(2)} DT</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 tracking-wider uppercase">Orders</div>
                <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 tracking-wider uppercase">Avg Order</div>
                <div className="text-2xl font-bold">{analytics.averageOrderValue.toFixed(2)} DT</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard hover={false}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${lowStock.length > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${lowStock.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <div>
                <div className="text-xs text-white/40 tracking-wider uppercase">Low Stock</div>
                <div className="text-2xl font-bold">{lowStock.length}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Revenue Trend</h3>
        {analytics.revenueByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics.revenueByDay}>
              <defs>
                <linearGradient id="revGrad" x1={0} y1={0} x2={0} y2={1}>
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} DT`} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                formatter={(value: any) => [`${Number(value).toFixed(2)} DT`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-white/20 text-sm">No revenue data for this period</div>
        )}
      </GlassCard>

      {/* Best Sellers + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Best Sellers</h3>
          {analytics.bestSellingProducts.length > 0 ? (
            <div className="space-y-3">
              {analytics.bestSellingProducts.slice(0, 5).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#D4AF37]/50 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-white/30">{p.count} sold</div>
                  </div>
                  <span className="text-sm font-semibold text-[#D4AF37]">{p.revenue.toFixed(2)} DT</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-white/20 text-sm">No sales data yet</div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] p-3">
                  <div>
                    <div className="text-sm font-medium text-[#D4AF37]">{o.id}</div>
                    <div className="text-xs text-white/40">{o.clientName} • {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{o.total.toFixed(2)} DT</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-white/20 text-sm">No orders yet</div>
          )}
        </GlassCard>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-red-400">Low Stock Alerts</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-red-500/10 bg-red-500/[0.03] p-3">
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-red-400/70">
                    {item.quantity} {item.unit} remaining
                    {item.quantity <= item.criticalStock && ' • CRITICAL'}
                  </div>
                </div>
                <span className={`text-sm font-bold ${item.quantity <= item.criticalStock ? 'text-red-400' : 'text-amber-400'}`}>
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ============================================================
// Products Tab
// ============================================================

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | 'All'>('All');
  const { addLog } = useApp();

  const [form, setForm] = useState({
    name: '',
    category: 'Espresso',
    description: '',
    price: '',
    image: '',
  });

  useEffect(() => { setProducts(getProducts()); }, []);

  const filtered = products.filter((p) => {
    const catMatch = filterCat === 'All' || p.category === filterCat;
    const searchMatch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: '', category: 'Espresso', description: '', price: '', image: '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, description: p.description, price: String(p.price), image: p.image || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editProduct) {
      updateProduct(editProduct.id, {
        name: form.name,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image,
      });
      addLog('Product Updated', `Product "${form.name}" was updated`);
    } else {
      addProduct({
        id: 'p' + Date.now(),
        name: form.name,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image,
        active: true,
        createdAt: new Date().toISOString(),
      });
      addLog('Product Created', `Product "${form.name}" was created`);
    }
    setProducts(getProducts());
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteProduct(id);
    addLog('Product Deleted', `Product "${name}" was deleted`);
    setProducts(getProducts());
  };

  const toggleActive = (id: string, name: string, current: boolean) => {
    updateProduct(id, { active: !current });
    addLog('Product Toggled', `Product "${name}" ${!current ? 'activated' : 'deactivated'}`);
    setProducts(getProducts());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              type="text" placeholder="Search products..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/20 outline-none w-64"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 px-4 text-sm text-white/70 outline-none"
          >
            <option value="All" className="bg-[#111]">All Categories</option>
            {getCategories().map((c) => (
              <option key={c.id} value={c.name} className="bg-[#111]">{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <GoldButton onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add Product
        </GoldButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${p.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-2 text-[10px] font-medium tracking-wider text-[#D4AF37] uppercase">{p.category}</div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-xs text-white/40 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-[#D4AF37]">{p.price.toFixed(2)} DT</span>
                <button
                  onClick={() => toggleActive(p.id, p.name, p.active)}
                  className={`text-xs rounded-lg px-3 py-1 transition-colors ${p.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                >
                  {p.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editProduct ? 'Edit Product' : 'New Product'}</h3>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-white/30 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Product Name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <select value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 outline-none"
                >
                  {getCategories().map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#111]">{c.icon} {c.name}</option>
                  ))}
                </select>
                <textarea placeholder="Description" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none resize-none"
                />
                <input type="number" placeholder="Price" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} step="0.01" min="0"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <input type="text" placeholder="Image URL (optional)" value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GoldButton>
                <GoldButton className="flex-1" onClick={handleSave}>
                  {editProduct ? 'Update' : 'Create'}
                </GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Categories Tab
// ============================================================

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const { addLog } = useApp();
  const [form, setForm] = useState({ name: '', icon: '☕' });

  useEffect(() => { setCategories(getCategories()); }, []);

  const openNew = () => {
    setEditCat(null);
    setForm({ name: '', icon: '☕' });
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditCat(c);
    setForm({ name: c.name, icon: c.icon });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editCat) {
      updateCategory(editCat.id, { name: form.name.trim(), icon: form.icon });
      addLog('Category Updated', `Category "${form.name}" was updated`);
    } else {
      addCategory({
        id: 'cat-' + Date.now(),
        name: form.name.trim(),
        icon: form.icon,
        createdAt: new Date().toISOString(),
      });
      addLog('Category Created', `Category "${form.name}" was created`);
    }
    setCategories(getCategories());
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteCategory(id);
    addLog('Category Deleted', `Category "${name}" was deleted`);
    setCategories(getCategories());
  };

  const iconOptions = ['☕', '🫧', '🥛', '🍵', '🍰', '🧊', '🥐', '🍪', '🥤', '🍫', '🧋', '🍯', '✨', '🌟', '💎'];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <GoldButton onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add Category
        </GoldButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-3xl">
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                  <p className="text-xs text-white/30 mt-0.5">
                    {getProducts().filter((p) => p.category === cat.name).length} products
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(cat)} className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                  <Edit className="h-3 w-3 inline mr-1" /> Edit
                </button>
                <button onClick={() => handleDelete(cat.id, cat.name)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/30 hover:text-red-400 hover:border-red-500/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="py-16 text-center text-white/20">
          <p className="text-sm">No categories yet. Create your first one!</p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editCat ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Category Name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <div>
                  <label className="text-xs text-white/30 mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setForm({ ...form, icon })}
                        className={`text-xl p-2 rounded-xl transition-all ${
                          form.icon === icon
                            ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 scale-110'
                            : 'bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GoldButton>
                <GoldButton className="flex-1" onClick={handleSave}>{editCat ? 'Update' : 'Create'}</GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Staff Tab
// ============================================================

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StaffTab() {
  const { user, addLog } = useApp();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', role: 'Barista' as StaffRole, pin: '', email: '' });
  const [, setTick] = useState(0);
  // Private notification modal
  const [notifTarget, setNotifTarget] = useState<Staff | null>(null);
  const [notifText, setNotifText] = useState('');
  // Private chat drawer
  const [chatStaff, setChatStaff] = useState<Staff | null>(null);
  // Salary draft per staff (DT per MINUTE)
  const [salaryDrafts, setSalaryDrafts] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];
  const monthKey = today.slice(0, 7); // YYYY-MM
  const activeIds = getSessions().filter((s) => s.active).map((s) => s.staffId);

  useEffect(() => {
    setStaff(getStaff());
    const int = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

  // Save the star rating (1–3)
  const setRating = (id: string, name: string, rating: 1 | 2 | 3) => {
    updateStaffMember(id, { rating });
    addLog('Rating Updated', `${name} → ${rating}★`);
    setStaff(getStaff());
  };

  // Save salary-per-minute (DT)
  const saveSalary = (id: string, name: string) => {
    const raw = salaryDrafts[id];
    if (raw === undefined) return;
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0) return;
    updateStaffMember(id, { salaryPerMinute: num });
    addLog('Salary Updated', `${name} → ${num.toFixed(4)} DT/min`);
    setSalaryDrafts((d) => { const c = { ...d }; delete c[id]; return c; });
    setStaff(getStaff());
  };

  const sendNotif = () => {
    if (!notifTarget || !notifText.trim()) return;
    addNotification({
      id: 'ntf-' + Date.now(),
      target: notifTarget.name,
      title: `Message from ${user?.name || 'Owner'}`,
      body: notifText.trim(),
      type: 'message',
      read: false,
      createdAt: new Date().toISOString(),
    });
    addLog('Notification Sent', `To ${notifTarget.name}: ${notifText.trim()}`);
    setNotifTarget(null);
    setNotifText('');
  };

  const openNew = () => {
    setEditStaff(null);
    setForm({ name: '', role: 'Barista', pin: '', email: '' });
    setShowForm(true);
  };

  const openEdit = (s: Staff) => {
    setEditStaff(s);
    setForm({ name: s.name, role: s.role, pin: s.pin, email: s.email || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.pin) return;
    if (editStaff) {
      updateStaffMember(editStaff.id, { ...form });
      addLog('Staff Updated', `Staff "${form.name}" was updated`);
    } else {
      addStaffMember({
        id: 's' + Date.now(),
        ...form,
        active: true,
        createdAt: new Date().toISOString(),
      });
      addLog('Staff Created', `Staff "${form.name}" was created`);
    }
    setStaff(getStaff());
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteStaffMember(id);
    addLog('Staff Deleted', `Staff "${name}" was deleted`);
    setStaff(getStaff());
  };

  const toggleActive = (id: string, name: string, current: boolean) => {
    updateStaffMember(id, { active: !current });
    addLog('Staff Toggled', `Staff "${name}" ${!current ? 'activated' : 'suspended'}`);
    setStaff(getStaff());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <GoldButton onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add Staff
        </GoldButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {staff.map((s, i) => {
          const todaySec = getStaffDayDuration(s.id, today);
          const monthSec = getStaffMonthDuration(s.id, monthKey);
          const perMin = s.salaryPerMinute || 0;
          const todayPay = (todaySec / 60) * perMin;
          const monthPay = (monthSec / 60) * perMin;
          const draft = salaryDrafts[s.id];
          const stars = (s.rating ?? 0) as 0 | 1 | 2 | 3;
          const title = getStaffTitle(s);

          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard>
                {/* Header — name, role title, status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg font-bold text-[#D4AF37]">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{s.name}</h3>
                      <p className="text-[11px] text-[#D4AF37]/80 font-semibold tracking-wider uppercase">{title}</p>
                      <p className="text-[10px] text-white/30">{s.role} · PIN {s.pin}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${s.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {s.active ? 'Active' : 'Suspended'}
                    </span>
                    {activeIds.includes(s.id) && (
                      <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
                        <CircleDot className="h-2.5 w-2.5 animate-pulse" /> On Duty
                      </span>
                    )}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/30">Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(s.id, s.name, n as 1 | 2 | 3)}
                        className="hover:scale-110 transition-transform"
                        title={`Set ${n} star${n > 1 ? 's' : ''}`}
                      >
                        <Star className={`h-4 w-4 ${n <= stars ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/15 hover:text-white/40'}`} />
                      </button>
                    ))}
                  </div>
                  {stars > 0 && (
                    <span className="ml-1 text-[10px] text-white/40">→ {title}</span>
                  )}
                </div>

                {/* Work time */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/30 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Today
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-amber-400">{fmtDur(todaySec)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/30 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> This Month
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-blue-400">{fmtDur(monthSec)}</div>
                  </div>
                </div>

                {/* Salary input + computed pay */}
                <div className="mt-3 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#D4AF37]/80 flex items-center gap-1">
                    <DollarSign className="h-2.5 w-2.5" /> Salary per minute (DT)
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="e.g. 0.05"
                      value={draft !== undefined ? draft : (perMin > 0 ? String(perMin) : '')}
                      onChange={(e) => setSalaryDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/40"
                    />
                    <button
                      onClick={() => saveSalary(s.id, s.name)}
                      disabled={draft === undefined}
                      className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[11px] font-bold text-black hover:bg-amber-400 disabled:opacity-30 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  {perMin > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-white/30">Pay today</div>
                        <div className="font-mono text-sm font-bold text-green-400">{todayPay.toFixed(2)} DT</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-white/30">Pay this month</div>
                        <div className="font-mono text-sm font-bold text-green-400">{monthPay.toFixed(2)} DT</div>
                      </div>
                    </div>
                  )}
                </div>

                {s.email && <div className="mt-2 text-[10px] text-white/30">{s.email}</div>}

                {/* Actions */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setNotifTarget(s)} className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-1">
                    <Bell className="h-3 w-3" /> Notify
                  </button>
                  <button onClick={() => setChatStaff(s)} className="rounded-lg border border-white/[0.08] py-1.5 text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1">
                    <MessageCircle className="h-3 w-3" /> Chat
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => openEdit(s)} className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                    <Edit className="h-3 w-3 inline mr-1" /> Edit
                  </button>
                  <button onClick={() => toggleActive(s.id, s.name, s.active)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${s.active ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-green-500/20 text-green-400 hover:bg-green-500/10'}`}
                  >
                    {s.active ? 'Suspend' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(s.id, s.name)}
                    className="rounded-lg border border-white/[0.08] px-2 py-1.5 text-xs text-white/30 hover:text-red-400 hover:border-red-500/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editStaff ? 'Edit Staff' : 'New Staff'}</h3>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Full Name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <select value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 outline-none"
                >
                  {staffRoles.map((r) => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                </select>
                <input type="text" placeholder="PIN (4 digits)" value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  maxLength={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <input type="email" placeholder="Email (optional)" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GoldButton>
                <GoldButton className="flex-1" onClick={handleSave}>{editStaff ? 'Update' : 'Create'}</GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Notification Modal — PORTAL */}
      {createPortal(
        <AnimatePresence>
          {notifTarget && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setNotifTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Bell className="h-5 w-5 text-[#D4AF37]" /> Notify {notifTarget.name}</h3>
                  <button onClick={() => setNotifTarget(null)} className="rounded-lg p-1 text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <textarea
                  placeholder="Write a private message / notification..."
                  value={notifText} onChange={(e) => setNotifText(e.target.value)} rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none resize-none"
                />
                <div className="mt-4 flex gap-3">
                  <GoldButton variant="outline" className="flex-1" onClick={() => setNotifTarget(null)}>Cancel</GoldButton>
                  <GoldButton className="flex-1" onClick={sendNotif}>Send Notification</GoldButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Private Chat Drawer (Owner ↔ Staff) — PORTAL */}
      {createPortal(
        <AnimatePresence>
          {chatStaff && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                onClick={() => setChatStaff(null)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[460px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A] flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15">
                      <MessageCircle className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{chatStaff.name}</h2>
                      <p className="text-xs text-white/40">{chatStaff.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setChatStaff(null)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
                  <ChatPanel
                    conversationId={`dm:${chatStaff.id}`}
                    senderName={user?.name || 'Owner'}
                    senderRole={user?.role || 'Administrator'}
                    heightClass="flex-1 min-h-0"
                    emptyText={`Private chat with ${chatStaff.name}`}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ============================================================
// Inventory Tab
// ============================================================

// ============================================================
// New Inventory: derived from invoices.
// Each supplier-product is grouped. The card shows total qty
// (e.g. "Bon 1000 kg"). Click it to see all individual purchase
// batches (Bon 1, Bon 2, ...) with date, qty, price, supplier.
// ============================================================

interface InventoryGroup {
  key: string;            // groupBy key (productName lowercased)
  displayName: string;    // e.g. "Lait"
  totalQty: number;       // sum across all units (using base unit when possible)
  baseUnit: string;       // common unit string
  // Variants are sub-groups keyed by full product name (e.g. "Lait 1L" vs "Lait 2L")
  variants: Array<{
    key: string;          // full normalized name
    name: string;         // "Lait 1L"
    qty: number;          // total qty of this variant
    unit: string;         // unit
    pieces?: number;      // number of pieces if quantifiable (sum of all line quantities)
    avgPrice: number;     // average unit price
    suppliers: string[];  // distinct supplier names
    lines: Array<{
      id: string;
      invoiceNumber: string;
      invoiceId: string;
      supplierName: string;
      date: string;
      qty: number;
      unitPrice: number;
      productName: string;
    }>;
  }>;
  totalSpent: number;
}

// "Lait 1L" → base name "Lait", variant "1L". Falls back to whole name.
function splitProductName(full: string): { base: string; variant: string } {
  // Try to detect a size suffix like "1L", "2 L", "500ml", "1kg", "12 pcs", etc.
  const m = full.match(/^(.*?)\s*([\d.,]+\s*(?:kg|g|l|ml|cl|pcs?|pcs|pack|x))$/i);
  if (m) {
    return { base: m[1].trim() || full, variant: m[2].trim() };
  }
  // Fallback: keep first word as base, rest as variant
  const parts = full.trim().split(/\s+/);
  if (parts.length > 1) {
    return { base: parts[0], variant: parts.slice(1).join(' ') };
  }
  return { base: full, variant: '' };
}

function buildInventoryFromInvoices(invoices: Invoice[], consumptions: Consumption[] = []): InventoryGroup[] {
  const variantMap = new Map<string, InventoryGroup['variants'][number]>();
  const groupMap = new Map<string, InventoryGroup>();

  invoices.forEach((inv) => {
    inv.lines.forEach((line) => {
      const cleanName = line.productName.replace(/\s*\/\s*.+$/, '').trim();
      const { base, variant } = splitProductName(cleanName);
      const baseKey = base.toLowerCase();
      const variantKey = cleanName.toLowerCase();
      const unit = (line.productName.match(/\/\s*(.+)$/) || [, ''])[1].trim();

      let v = variantMap.get(variantKey);
      if (!v) {
        v = {
          key: variantKey,
          name: variant ? `${base} ${variant}` : base,
          qty: 0,
          unit,
          avgPrice: 0,
          suppliers: [],
          lines: [],
        };
        variantMap.set(variantKey, v);
      }
      v.qty += line.quantity;
      v.lines.push({
        id: line.id,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        supplierName: inv.supplierName,
        date: inv.date,
        qty: line.quantity,
        unitPrice: line.unitPrice,
        productName: cleanName,
      });
      if (!v.suppliers.includes(inv.supplierName)) v.suppliers.push(inv.supplierName);

      let g = groupMap.get(baseKey);
      if (!g) {
        g = {
          key: baseKey,
          displayName: base,
          totalQty: 0,
          baseUnit: unit,
          variants: [],
          totalSpent: 0,
        };
        groupMap.set(baseKey, g);
      }
      g.totalQty += line.quantity;
      g.totalSpent += line.quantity * line.unitPrice;
      if (!g.baseUnit && unit) g.baseUnit = unit;
    });
  });

  // SUBTRACT consumptions
  consumptions.forEach((c) => {
    if (c.variantKey) {
      const v = variantMap.get(c.variantKey);
      if (v) v.qty = Math.max(0, v.qty - c.quantity);
    }
    const g = groupMap.get(c.productKey);
    if (g) g.totalQty = Math.max(0, g.totalQty - c.quantity);
  });

  // Compute averages + attach variants to groups
  variantMap.forEach((v) => {
    const totalCost = v.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const totalQtyAcrossLines = v.lines.reduce((s, l) => s + l.qty, 0);
    v.avgPrice = totalQtyAcrossLines > 0 ? totalCost / totalQtyAcrossLines : 0;
    v.lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const { base } = splitProductName(v.lines[0]?.productName || v.name);
    const g = groupMap.get(base.toLowerCase());
    if (g) g.variants.push(v);
  });

  return Array.from(groupMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function InventoryTab() {
  const { user, addLog } = useApp();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [search, setSearch] = useState('');
  const [openGroup, setOpenGroup] = useState<InventoryGroup | null>(null);
  const [openVariant, setOpenVariant] = useState<InventoryGroup['variants'][number] | null>(null);

  // Consume modal state
  const [consumeTarget, setConsumeTarget] = useState<{
    productKey: string; productName: string;
    variantKey?: string; variantName?: string;
    unit?: string; available: number;
  } | null>(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [consumeReason, setConsumeReason] = useState('');

  const load = () => {
    setInvoices(getInvoices());
    setConsumptions(getConsumptions());
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 3000);
    return () => clearInterval(int);
  }, []);

  const groups = useMemo(() => buildInventoryFromInvoices(invoices, consumptions), [invoices, consumptions]);

  const performConsume = () => {
    if (!consumeTarget) return;
    const qty = parseFloat(consumeQty);
    if (isNaN(qty) || qty <= 0) return;
    addConsumption({
      id: 'cons-' + Date.now(),
      productKey: consumeTarget.productKey,
      productName: consumeTarget.productName,
      variantKey: consumeTarget.variantKey,
      variantName: consumeTarget.variantName,
      quantity: qty,
      unit: consumeTarget.unit,
      reason: consumeReason.trim() || undefined,
      consumedBy: user?.name || 'Owner',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    });
    addLog(
      'Inventory Consumed',
      `${qty}${consumeTarget.unit ? ' ' + consumeTarget.unit : ''} of ${consumeTarget.variantName || consumeTarget.productName}${consumeReason ? ` — ${consumeReason}` : ''}`
    );
    setConsumeTarget(null);
    setConsumeQty('');
    setConsumeReason('');
    // refresh in next tick
    setTimeout(load, 100);
  };

  // Recent consumption list
  const recentConsumptions = useMemo(
    () => consumptions.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
    [consumptions]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) => g.displayName.toLowerCase().includes(q) || g.variants.some((v) => v.name.toLowerCase().includes(q))
    );
  }, [groups, search]);

  const totalSKUs = groups.reduce((s, g) => s + g.variants.length, 0);
  const totalSpent = groups.reduce((s, g) => s + g.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Distinct Products</div>
          <div className="mt-1 text-2xl font-bold text-[#D4AF37]">{groups.length}</div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Variants (SKUs)</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">{totalSKUs}</div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Spent on Stock</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{totalSpent.toFixed(2)} DT</div>
        </GlassCard>
      </div>

      {/* Search + Info */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50"
          />
        </div>
        <div className="text-[11px] text-white/30">Inventory is auto-generated from invoices.</div>
      </div>

      {/* Group cards */}
      {filteredGroups.length === 0 ? (
        <div className="py-16 text-center text-white/25">
          <PackageOpen className="h-10 w-10 mx-auto opacity-30 mb-2" />
          {invoices.length === 0 ? (
            <>
              <p className="text-sm">No inventory yet.</p>
              <p className="mt-1 text-[11px] text-white/15">Cashiers create invoices in their dashboard; items will appear here automatically.</p>
            </>
          ) : (
            <p className="text-sm">No products match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((g) => (
            <div key={g.key} className="relative group">
              <button onClick={() => setOpenGroup(g)} className="w-full text-left">
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] tracking-wider text-[#D4AF37] uppercase">
                      {g.variants.length} variant{g.variants.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] text-white/30">{g.totalSpent.toFixed(2)} DT</span>
                  </div>
                  <h3 className="text-lg font-bold capitalize">{g.displayName}</h3>
                  <div className="mt-2 text-3xl font-black text-white">
                    {g.totalQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-sm text-white/30 ml-1.5">{g.baseUnit || ''}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.variants.slice(0, 3).map((v) => (
                      <span key={v.key} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                        {v.name}
                      </span>
                    ))}
                    {g.variants.length > 3 && (
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                        +{g.variants.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-[10px] text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors">
                      Tap for details →
                    </div>
                  </div>
                </GlassCard>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConsumeTarget({
                    productKey: g.key,
                    productName: g.displayName,
                    unit: g.baseUnit,
                    available: g.totalQty,
                  });
                }}
                className="absolute bottom-3 right-3 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                title="Deduct from this product"
              >
                <Trash2 className="h-3 w-3" /> Consume
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Consumptions */}
      {recentConsumptions.length > 0 && (
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400/70" /> Recent Consumptions
          </h3>
          <div className="space-y-2">
            {recentConsumptions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] p-3">
                <div>
                  <div className="text-sm font-medium">
                    {c.variantName || c.productName}
                    <span className="ml-2 text-red-400 font-mono">−{c.quantity}{c.unit ? ' ' + c.unit : ''}</span>
                  </div>
                  <div className="text-[11px] text-white/30">
                    by {c.consumedBy}{c.reason ? ` · ${c.reason}` : ''}
                  </div>
                </div>
                <div className="text-[10px] text-white/30 text-right">
                  {new Date(c.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ============== Group Detail Drawer (Variants list) ============== */}
      {createPortal(
        <AnimatePresence>
          {openGroup && !openVariant && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                onClick={() => setOpenGroup(null)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[480px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
              >
                <div className="flex items-start justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A]">
                  <div>
                    <h2 className="text-xl font-bold capitalize">{openGroup.displayName}</h2>
                    <p className="text-xs text-white/40 mt-0.5">
                      <span className="font-mono text-[#D4AF37]">{openGroup.totalQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {openGroup.baseUnit}</span> total ·
                      {' '}{openGroup.variants.length} variant{openGroup.variants.length !== 1 ? 's' : ''} ·
                      {' '}{openGroup.totalSpent.toFixed(2)} DT spent
                    </p>
                  </div>
                  <button onClick={() => setOpenGroup(null)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/30">Variants — click for purchase batches</div>
                  {openGroup.variants.map((v) => (
                    <div key={v.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <button
                        onClick={() => setOpenVariant(v)}
                        className="w-full text-left hover:opacity-90"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold capitalize">{v.name}</div>
                            <div className="text-[11px] text-white/40 mt-0.5">
                              {v.lines.length} purchase{v.lines.length !== 1 ? 's' : ''} ·
                              {' '}avg {v.avgPrice.toFixed(2)} DT{v.unit ? `/${v.unit}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-[#D4AF37]">
                              {v.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-white/30">{v.unit || 'units'}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {v.suppliers.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">📦 {s}</span>
                          ))}
                        </div>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setOpenVariant(v)}
                          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-[11px] text-white/60 hover:bg-white/[0.04] transition-colors"
                        >
                          View batches →
                        </button>
                        <button
                          onClick={() => setConsumeTarget({
                            productKey: openGroup.key,
                            productName: openGroup.displayName,
                            variantKey: v.key,
                            variantName: v.name,
                            unit: v.unit || openGroup.baseUnit,
                            available: v.qty,
                          })}
                          className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Consume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ============== Variant Detail Drawer (Purchase batches) ============== */}
      {createPortal(
        <AnimatePresence>
          {openVariant && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
                onClick={() => setOpenVariant(null)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[480px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
              >
                <div className="flex items-start justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A]">
                  <div>
                    <button onClick={() => setOpenVariant(null)} className="text-[11px] text-white/40 hover:text-white mb-1 flex items-center gap-1">
                      ← Back to {openGroup?.displayName}
                    </button>
                    <h2 className="text-xl font-bold capitalize">{openVariant.name}</h2>
                    <p className="text-xs text-white/40 mt-0.5">
                      <span className="font-mono text-[#D4AF37]">{openVariant.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {openVariant.unit}</span> total
                      · across {openVariant.lines.length} purchase{openVariant.lines.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button onClick={() => { setOpenVariant(null); setOpenGroup(null); }} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Purchase Batches (Bon)</div>
                  {openVariant.lines.map((l, i) => (
                    <div
                      key={l.id}
                      className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                              Bon {openVariant.lines.length - i}
                            </span>
                            <span className="text-[11px] font-mono text-white/40">{l.invoiceNumber}</span>
                          </div>
                          <div className="mt-1 text-xs text-white/50">📦 {l.supplierName}</div>
                          <div className="text-[10px] text-white/30">{new Date(l.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold text-white">
                            {l.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-white/40 ml-1">{openVariant.unit}</span>
                          </div>
                          <div className="text-[10px] text-white/40">@ {l.unitPrice.toFixed(2)} DT</div>
                          <div className="text-[11px] font-semibold text-[#D4AF37]">{(l.qty * l.unitPrice).toFixed(2)} DT</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ============== Consume Modal ============== */}
      {createPortal(
        <AnimatePresence>
          {consumeTarget && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setConsumeTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Consume Stock</h3>
                    <p className="text-xs text-white/40">
                      {consumeTarget.variantName ? `From ${consumeTarget.variantName}` : `From ${consumeTarget.productName}`}
                    </p>
                  </div>
                  <button onClick={() => setConsumeTarget(null)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Available</div>
                  <div className="mt-0.5 font-mono text-lg font-bold text-[#D4AF37]">
                    {consumeTarget.available.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {consumeTarget.unit && <span className="ml-1 text-xs text-white/40">{consumeTarget.unit}</span>}
                  </div>
                </div>

                <label className="text-[10px] uppercase tracking-wider text-white/40">Quantity to consume</label>
                <input
                  type="number" step="0.01" min="0" max={consumeTarget.available}
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(e.target.value)}
                  placeholder={`Max ${consumeTarget.available}${consumeTarget.unit ? ' ' + consumeTarget.unit : ''}`}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-base font-semibold text-white placeholder:text-white/20 outline-none focus:border-red-400/50"
                  autoFocus
                />

                <label className="text-[10px] uppercase tracking-wider text-white/40 mt-4 block">Reason (optional)</label>
                <input
                  type="text"
                  value={consumeReason}
                  onChange={(e) => setConsumeReason(e.target.value)}
                  placeholder="e.g. broken bottle, daily usage, spillage..."
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-red-400/50"
                />

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setConsumeTarget(null)}
                    className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/70 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performConsume}
                    disabled={!consumeQty || parseFloat(consumeQty) <= 0 || parseFloat(consumeQty) > consumeTarget.available}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-30"
                  >
                    Consume
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ============================================================
// Analytics Tab
// ============================================================

function AnalyticsTab() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const analytics = useMemo(() => computeAnalytics(period), [period]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['today', 'week', 'month', 'year'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-xl px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
              period === p ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'border border-white/[0.06] text-white/40 hover:text-white/70'
            }`}
          >{p}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Revenue', value: `${analytics.totalRevenue.toFixed(2)} DT`, color: 'text-green-400', icon: DollarSign },
          { label: 'Orders', value: analytics.totalOrders, color: 'text-blue-400', icon: ShoppingBag },
          { label: 'Avg Order', value: `${analytics.averageOrderValue.toFixed(2)} DT`, color: 'text-amber-400', icon: Activity },
          { label: 'Best Seller', value: analytics.bestSellingProducts[0]?.name || '-', color: 'text-[#D4AF37]', icon: Zap },
        ].map((stat, i) => (
          <GlassCard key={i} hover={false}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03]`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs text-white/40 tracking-wider uppercase">{stat.label}</div>
                <div className={`text-xl font-bold truncate ${stat.color}`}>{stat.value}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Chart */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Revenue Trend</h3>
        {analytics.revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueByMonth}>
              <defs>
                <linearGradient id="revGrad2" x1={0} y1={0} x2={0} y2={1}>
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(v) => `${v} DT`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-white/20">No data</div>
        )}
      </GlassCard>

      {/* Category Distribution + Best Sellers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Revenue by Category</h3>
          {analytics.revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RPieChart>
                <Pie data={analytics.revenueByCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name }: any) => name}>
                  {analytics.revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              </RPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-white/20">No data</div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Best Selling Products</h3>
          {analytics.bestSellingProducts.length > 0 ? (
            <div className="space-y-2">
              {analytics.bestSellingProducts.slice(0, 8).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 rounded-xl border border-white/[0.04] p-3">
                  <span className="text-lg font-bold text-[#D4AF37]/50 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-white/30">{p.count} sold</div>
                  </div>
                  <span className="text-sm font-semibold text-[#D4AF37]">{p.revenue.toFixed(2)} DT</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-white/20">No data</div>
          )}
        </GlassCard>
      </div>

      {/* Peak Hours Heat Map */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Orders by Hour (Peak Times)</h3>
        {analytics.revenueByHour.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.revenueByHour}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="orders" fill="#D4AF37" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-white/20">No data</div>
        )}
      </GlassCard>
    </div>
  );
}

// ============================================================
// AI Assistant Tab
// ============================================================

function AIAssistantTab() {
  const presetQuestions = [
    { q: 'شنوا أحسن منتج عندي هالشهر؟', en: 'best' },
    { q: 'قداش ربحت اليوم؟', en: 'revenue' },
    { q: 'شنوا المنتجات اللي قريب يخلاصو؟', en: 'stock' },
    { q: 'شنوا أكثر كاطيقوريا تتباع؟', en: 'category' },
    { q: 'قداش سعر معدل الطلب؟', en: 'avg' },
  ];

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'مرحباً! أنا المساعد الذكي لـ HEBLI 🤖\n\nنجم نساعدك تحلل مبيعاتك، مخزونك، وأداء محلّك.\n\nاختار من الأسئلة المقترحة أو اكتب سؤالك:' },
  ]);
  const [input, setInput] = useState('');

  const generateResponse = (userMsg: string) => {
    const analytics = computeAnalytics('month');
    const analyticsDay = computeAnalytics('today');
    const inventory = getInventory();
    const lowStock = inventory.filter((i) => i.quantity <= i.minStock);

    const lower = userMsg.toLowerCase();
    const arabic = /[\u0600-\u06FF]/;
    const isArabic = arabic.test(userMsg);

    // Detect Tunisian Arabic keywords
    const hasBest = lower.includes('best') || lower.includes('top') || lower.includes('أحسن') || lower.includes('اكثر') || lower.includes('popular') || lower.includes('يباع');
    const hasRevenue = lower.includes('revenue') || lower.includes('ربحت') || lower.includes('ربح') || lower.includes('income') || lower.includes('earning') || lower.includes('مال');
    const hasStock = lower.includes('stock') || lower.includes('مخزون') || lower.includes('يخلاص') || lower.includes('خلص') || lower.includes('low') || lower.includes('قليل');
    const hasCategory = lower.includes('category') || lower.includes('كاطيقوريا') || lower.includes('نوع');
    const hasHour = lower.includes('hour') || lower.includes('peak') || lower.includes('busy') || lower.includes('ساعة') || lower.includes('وقت');
    const hasAvg = lower.includes('avg') || lower.includes('average') || lower.includes('معدل') || lower.includes('متوسط');

    if (isArabic) {
      // Tunisian Arabic responses
      if (hasBest) {
        const top = analytics.bestSellingProducts[0];
        if (top) {
          return `🏆 **${top.name}** هوما أحسن منتج عندك هالشهر!\nتبع منّو **${top.count}** وحدة، وربح منّو **${top.revenue.toFixed(2)} DT** 🎉`;
        }
        return 'مازال ما عنديش بيانات كافية هالشهر. جرّب بعد ما تبيع شوية قهوات ☕';
      } else if (hasRevenue) {
        return `💰 **اليوم**: ${analyticsDay.totalRevenue.toFixed(2)} DT من ${analyticsDay.totalOrders} طلب\n📅 **هالشهر**: ${analytics.totalRevenue.toFixed(2)} DT من ${analytics.totalOrders} طلب\n💵 المعدل لكل طلب: ${analytics.averageOrderValue.toFixed(2)} DT`;
      } else if (hasStock) {
        if (lowStock.length > 0) {
          let msg = `⚠️ عندك **${lowStock.length}** منتجات قريب يخلاصو:\n\n`;
          lowStock.forEach(i => {
            msg += `• **${i.name}**: ${i.quantity} ${i.unit} باقي (الحد الأدنى: ${i.minStock})\n`;
          });
          msg += '\nلازم تزيد تشري مخزون 📦';
          return msg;
        }
        return '✅ المخزون عندك كامل مزيان. ما شي قريب يخلاص 👍';
      } else if (hasCategory) {
        const topCat = analytics.revenueByCategory[0];
        if (topCat) {
          return `📂 أكتر كاطيقوريا تتباع عندك هي **${topCat.category}**\nربحت منّا **${topCat.revenue.toFixed(2)} DT** هالشهر 🏅`;
        }
        return 'مازال ما عنديش بيانات على الكاطيقوريات.';
      } else if (hasHour) {
        const peak = [...analytics.revenueByHour].sort((a, b) => b.orders - a.orders)[0];
        if (peak) {
          return `🕐 أكثر ساعة عندك فيها خدمة هي **${peak.hour}:00**\nفيها **${peak.orders}** طلبات\n\nننصحك تزيد موظف هالوقت ⚡`;
        }
        return 'مازال ما عنديش بيانات على الساعات.';
      } else if (hasAvg) {
        return `💵 معدل سعر الطلب هالشهر هو **${analytics.averageOrderValue.toFixed(2)} DT**\nمن مجموع ${analytics.totalOrders} طلبات.`;
      }
      return `تفضل ملخص سريع:\n\n💰 الربح اليوم: **${analyticsDay.totalRevenue.toFixed(2)} DT**\n📋 عدد الطلبات: **${analytics.totalOrders}**\n💵 المعدل: **${analytics.averageOrderValue.toFixed(2)} DT**\n📦 مخزون قليل: **${lowStock.length}**\n\nجرّب تسأل على:\n• أحسن منتج\n• المخزون\n• الربح\n• الكاطيقوريات`;
    }

    // English fallback
    if (hasBest) {
      const top = analytics.bestSellingProducts[0];
      if (top) return `🏆 **${top.name}** is your best seller with ${top.count} units sold for ${top.revenue.toFixed(2)} DT.`;
      return 'No sales data yet.';
    } else if (hasRevenue) {
      return `💰 Today: ${analyticsDay.totalRevenue.toFixed(2)} DT (${analyticsDay.totalOrders} orders)\nThis month: ${analytics.totalRevenue.toFixed(2)} DT (${analytics.totalOrders} orders)\nAvg: ${analytics.averageOrderValue.toFixed(2)} DT`;
    } else if (hasStock) {
      if (lowStock.length > 0) {
        let msg = `⚠️ ${lowStock.length} items low:\n`;
        lowStock.forEach(i => { msg += `• ${i.name}: ${i.quantity} ${i.unit}\n`; });
        return msg;
      }
      return '✅ Stock is healthy.';
    } else if (hasCategory) {
      const tc = analytics.revenueByCategory[0];
      return tc ? `📂 Top: **${tc.category}** with ${tc.revenue.toFixed(2)} DT` : 'No data.';
    } else if (hasHour) {
      const p = [...analytics.revenueByHour].sort((a, b) => b.orders - a.orders)[0];
      return p ? `🕐 Peak: ${p.hour}:00 with ${p.orders} orders` : 'No data.';
    } else if (hasAvg) {
      return `💵 Avg order: ${analytics.averageOrderValue.toFixed(2)} DT`;
    }
    return `💰 Revenue: ${analytics.totalRevenue.toFixed(2)} DT\n📋 Orders: ${analytics.totalOrders}\n📦 Low stock: ${lowStock.length}\n\nTry asking about best sellers, revenue, or stock.`;
  };

  const handleSend = (msg: string) => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setTimeout(() => {
      const response = generateResponse(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <GlassCard className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/[0.05] text-white/90 whitespace-pre-line'
              }`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#D4AF37]">$1</strong>') }} />
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Preset Questions */}
        {messages.length <= 1 && (
          <div className="mt-4 space-y-2">
            {presetQuestions.map((pq) => (
              <button
                key={pq.en}
                onClick={() => handleSend(pq.q)}
                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.05] hover:border-[#D4AF37]/20 hover:text-[#D4AF37] transition-all"
              >
                {pq.q}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="اكتب سؤالك..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && handleSend(input)}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50"
          />
          <GoldButton onClick={() => input.trim() && handleSend(input)}>
            <Send className="h-4 w-4" />
          </GoldButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ============================================================
// Audit Logs Tab
// ============================================================

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { setLogs(getAuditLogs()); }, []);

  const filtered = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
        <input
          type="text" placeholder="Search logs..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 outline-none"
        />
      </div>

      <GlassCard hover={false}>
        {filtered.length > 0 ? (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.slice().reverse().map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-xs text-white/50">
                    {log.action.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="text-xs text-white/40">{log.details}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/30">{log.user}</div>
                  <div className="text-[10px] text-white/20">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-white/20">No audit logs yet</div>
        )}
      </GlassCard>
    </div>
  );
}

// ============================================================
// Team Chat Tab (Owner)
// ============================================================

function TeamChatTab() {
  const { user } = useApp();
  return (
    <div className="max-w-3xl mx-auto">
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#D4AF37]" /> Team Group Chat
          <span className="ml-auto text-[10px] text-white/25 normal-case tracking-normal">Barista · Cashier · Owner</span>
        </h3>
        <ChatPanel
          conversationId="group"
          senderName={user?.name || 'Owner'}
          senderRole={user?.role || 'Administrator'}
          heightClass="h-[460px]"
          emptyText="Team group chat — start the conversation!"
        />
      </GlassCard>
    </div>
  );
}

// ============================================================
// Tickets Tab (Owner – client support requests)
// ============================================================

function TicketsTab() {
  const { user, addLog } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);

  const load = () => {
    setTickets(getTickets().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    if (active) {
      const updated = getTickets().find((t) => t.id === active.id);
      if (updated) setActive(updated);
    }
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 2500);
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = (t: Ticket) => {
    updateTicket(t.id, { status: 'accepted' });
    addNotification({
      id: 'ntf-' + Date.now(),
      target: t.clientName,
      title: 'Request Accepted',
      body: `The owner opened a live chat for "${t.subject}".`,
      type: 'message',
      read: false,
      createdAt: new Date().toISOString(),
    });
    addLog('Ticket Accepted', `${t.id} from ${t.clientName}`);
    load();
    setActive({ ...t, status: 'accepted' });
  };

  const close = (t: Ticket) => {
    updateTicket(t.id, { status: 'closed' });
    addLog('Ticket Closed', `${t.id}`);
    load();
    setActive(null);
  };

  if (active) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setActive(null)} className="mb-4 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
          ← Back to tickets
        </button>
        <GlassCard hover={false} className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/40 tracking-wider uppercase">{active.id} · {active.clientName}</div>
              <h2 className="mt-1 text-lg font-bold">{active.subject}</h2>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
              active.status === 'accepted' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
              active.status === 'closed' ? 'border-white/10 bg-white/5 text-white/40' :
              'border-amber-500/20 bg-amber-500/10 text-amber-400'
            }`}>{active.status}</span>
          </div>
          <p className="mt-3 text-sm text-white/60">{active.message}</p>
          <div className="mt-4 flex gap-2">
            {active.status === 'pending' && (
              <GoldButton size="sm" onClick={() => accept(active)}>Accept & Open Chat</GoldButton>
            )}
            {active.status !== 'closed' && (
              <button onClick={() => close(active)} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                Close Ticket
              </button>
            )}
          </div>
        </GlassCard>

        {active.status === 'accepted' && (
          <GlassCard hover={false}>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#D4AF37]" /> Live Chat with {active.clientName}
            </h3>
            <ChatPanel
              conversationId={`ticket:${active.id}`}
              senderName={user?.name || 'Owner'}
              senderRole="Owner"
              heightClass="h-[360px]"
              emptyText={`Chat with ${active.clientName}`}
            />
          </GlassCard>
        )}
      </div>
    );
  }

  const pending = tickets.filter((t) => t.status === 'pending');
  const others = tickets.filter((t) => t.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-amber-400 mb-3 flex items-center gap-2">
          <LifeBuoy className="h-4 w-4" /> Pending Requests
          {pending.length > 0 && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px]">{pending.length}</span>}
        </h3>
        {pending.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map((t) => (
              <GlassCard key={t.id} onClick={() => setActive(t)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-white/40">{t.id} · {t.clientName}</div>
                    <h4 className="mt-1 font-semibold">{t.subject}</h4>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400">New</span>
                </div>
                <p className="mt-2 text-sm text-white/50 line-clamp-2">{t.message}</p>
                <GoldButton size="sm" className="mt-3 w-full" onClick={() => accept(t)}>Accept & Chat</GoldButton>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-white/20 text-sm rounded-2xl border border-white/[0.04]">No pending requests</div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-white/30 mb-3">Other Tickets</h3>
          <div className="space-y-2">
            {others.map((t) => (
              <GlassCard key={t.id} onClick={() => setActive(t)} className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#D4AF37]">{t.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${t.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}>{t.status}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-white/50">{t.clientName} · {t.subject}</div>
                </div>
                <MessageCircle className="h-4 w-4 text-white/30" />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Orders Tab (Owner — view & delete all orders + payments)
// ============================================================

function OrdersTab() {
  const { addLog } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'paid' | 'pending'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'order' | 'payment' | 'today' | 'history'; id?: string } | null>(null);

  const load = () => {
    setOrders(getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setPayments(getPayments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 3000);
    return () => clearInterval(int);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = orders.filter((o) => {
    if (filter === 'today' && new Date(o.createdAt).toISOString().split('T')[0] !== today) return false;
    if (filter === 'paid' && o.status !== 'Paid') return false;
    if (filter === 'pending' && o.status === 'Paid') return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  const handleDeleteOrder = (id: string) => {
    deleteOrder(id);
    addLog('Order Deleted', `Order ${id} was deleted by owner`);
    load();
    setConfirmDelete(null);
  };

  const handleDeleteToday = () => {
    const todayPayments = payments.filter((p) => p.date === today);
    todayPayments.forEach((p) => deletePayment(p.id));
    addLog('Today Payments Cleared', `${todayPayments.length} payments from today deleted`);
    load();
    setConfirmDelete(null);
  };

  const handleDeleteHistory = () => {
    payments.forEach((p) => deletePayment(p.id));
    orders.forEach((o) => deleteOrder(o.id));
    addLog('All History Cleared', `All orders & payments deleted`);
    load();
    setConfirmDelete(null);
  };

  const totalToday = payments.filter((p) => p.date === today).reduce((s, p) => s + p.amount, 0);
  const totalAll = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Today's revenue</div>
          <div className="mt-1 text-2xl font-bold text-green-400">{totalToday.toFixed(2)} DT</div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Total revenue (all-time)</div>
          <div className="mt-1 text-2xl font-bold text-[#D4AF37]">{totalAll.toFixed(2)} DT</div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Orders</div>
          <div className="mt-1 text-2xl font-bold">{orders.length}</div>
        </GlassCard>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Danger Zone — Owner Only
        </h3>
        <p className="mt-1 text-xs text-white/40">Clear past sales records. These actions cannot be undone.</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setConfirmDelete({ type: 'today' })}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete today's orders ({payments.filter((p) => p.date === today).length})
          </button>
          <button
            onClick={() => setConfirmDelete({ type: 'history' })}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete ALL history ({orders.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, product..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'today', 'paid', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-[#D4AF37] text-black'
                  : 'border border-white/[0.08] text-white/50 hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/25">
            <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="text-sm">No orders match these filters.</p>
          </div>
        ) : (
          filtered.map((o) => {
            const payment = payments.find((p) => p.orderId === o.id);
            return (
              <GlassCard key={o.id} hover={false} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#D4AF37]">{o.id}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        o.status === 'Paid' ? 'bg-green-500/10 text-green-400' :
                        o.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400' :
                        o.status === 'In Preparation' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{o.status}</span>
                      <span className="text-xs text-white/40">{o.clientName}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {new Date(o.createdAt).toLocaleString()}
                      {payment && <span className="ml-2 text-white/30">· Cashier: {payment.cashierName}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.items.map((it, i) => (
                        <span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/50">
                          {it.quantity}x {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-base font-bold text-[#D4AF37]">{o.total.toFixed(2)} DT</span>
                    <button
                      onClick={() => setConfirmDelete({ type: 'order', id: o.id })}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 p-1.5 text-red-400 hover:bg-red-500/15 transition-colors"
                      title="Delete this order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Confirm Dialog */}
      {createPortal(
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setConfirmDelete(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Confirm Deletion</h3>
                    <p className="text-xs text-white/40">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-6">
                  {confirmDelete.type === 'order' && `Delete order ${confirmDelete.id}? Its payment record will also be removed.`}
                  {confirmDelete.type === 'today' && `Delete ALL ${payments.filter((p) => p.date === today).length} payment(s) from today?`}
                  {confirmDelete.type === 'history' && `Delete ALL ${orders.length} orders and ${payments.length} payments from the entire history?`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/70 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDelete.type === 'order' && confirmDelete.id) handleDeleteOrder(confirmDelete.id);
                      else if (confirmDelete.type === 'today') handleDeleteToday();
                      else if (confirmDelete.type === 'history') handleDeleteHistory();
                    }}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-400"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ============================================================
// Invoices Tab (Owner — manages Suppliers + sees all Invoices)
// ============================================================

function InvoicesTab() {
  const navigate = useNavigate();
  const { addLog } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [view, setView] = useState<'suppliers' | 'history'>('suppliers');

  // Supplier form modal
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [sForm, setSForm] = useState<{ name: string; phone: string; address: string; products: SupplierProduct[] }>(
    { name: '', phone: '', address: '', products: [] }
  );
  const [newProd, setNewProd] = useState({ name: '', price: '', unit: '' });

  const load = () => {
    setSuppliers(getSuppliers().sort((a, b) => a.name.localeCompare(b.name)));
    setInvoices(getInvoices().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 3000);
    return () => clearInterval(int);
  }, []);

  const openNewSupplier = () => {
    setEditSupplier(null);
    setSForm({ name: '', phone: '', address: '', products: [] });
    setNewProd({ name: '', price: '', unit: '' });
    setShowSupplierForm(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditSupplier(s);
    setSForm({ name: s.name, phone: s.phone || '', address: s.address || '', products: [...s.products] });
    setNewProd({ name: '', price: '', unit: '' });
    setShowSupplierForm(true);
  };

  const addProductLine = () => {
    if (!newProd.name.trim() || !newProd.price) return;
    const price = parseFloat(newProd.price);
    if (isNaN(price) || price < 0) return;
    setSForm((f) => ({
      ...f,
      products: [
        ...f.products,
        {
          id: 'sp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          name: newProd.name.trim(),
          price,
          unit: newProd.unit.trim() || undefined,
        },
      ],
    }));
    setNewProd({ name: '', price: '', unit: '' });
  };

  const removeProductLine = (pid: string) => {
    setSForm((f) => ({ ...f, products: f.products.filter((p) => p.id !== pid) }));
  };

  const saveSupplier = () => {
    if (!sForm.name.trim()) return;
    if (editSupplier) {
      updateSupplier(editSupplier.id, {
        name: sForm.name.trim(),
        phone: sForm.phone.trim() || undefined,
        address: sForm.address.trim() || undefined,
        products: sForm.products,
      });
      addLog('Supplier Updated', `${sForm.name} (${sForm.products.length} products)`);
    } else {
      addSupplier({
        id: 'sup-' + Date.now(),
        name: sForm.name.trim(),
        phone: sForm.phone.trim() || undefined,
        address: sForm.address.trim() || undefined,
        products: sForm.products,
        createdAt: new Date().toISOString(),
      });
      addLog('Supplier Added', `${sForm.name} (${sForm.products.length} products)`);
    }
    setShowSupplierForm(false);
    load();
  };

  const removeSupplier = (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.name}"? This cannot be undone.`)) return;
    deleteSupplier(s.id);
    addLog('Supplier Deleted', s.name);
    load();
  };

  const totalSpent = invoices.reduce((sum, i) => sum + i.total, 0);
  const today = new Date().toISOString().split('T')[0];
  const monthKey = today.slice(0, 7);
  const monthSpent = invoices.filter((i) => i.date.startsWith(monthKey)).reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Suppliers</div>
          <div className="mt-1 text-2xl font-bold text-[#D4AF37]">{suppliers.length}</div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Invoices this month</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">
            {invoices.filter((i) => i.date.startsWith(monthKey)).length}
            <span className="text-sm font-normal text-white/40 ml-2">({monthSpent.toFixed(2)} DT)</span>
          </div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-xs text-white/40 uppercase tracking-wider">Total spent (all-time)</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{totalSpent.toFixed(2)} DT</div>
        </GlassCard>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setView('suppliers')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            view === 'suppliers' ? 'bg-[#D4AF37] text-black' : 'border border-white/[0.08] text-white/50 hover:bg-white/5'
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setView('history')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            view === 'history' ? 'bg-[#D4AF37] text-black' : 'border border-white/[0.08] text-white/50 hover:bg-white/5'
          }`}
        >
          Invoice History ({invoices.length})
        </button>
      </div>

      {view === 'suppliers' ? (
        <>
          <div className="flex justify-end">
            <GoldButton onClick={openNewSupplier}>
              <Plus className="h-4 w-4" /> Add Supplier
            </GoldButton>
          </div>

          {suppliers.length === 0 ? (
            <div className="py-16 text-center text-white/25">
              <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">No suppliers yet — add your first one.</p>
              <p className="mt-1 text-[11px] text-white/15">Cashiers will pick from this list when creating invoices.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((s) => (
                <GlassCard key={s.id}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{s.name}</h3>
                      {s.phone && <p className="text-[11px] text-white/40">📞 {s.phone}</p>}
                      {s.address && <p className="text-[11px] text-white/40 truncate">📍 {s.address}</p>}
                    </div>
                    <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                      {s.products.length} item{s.products.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {s.products.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto space-y-1 pr-1">
                      {s.products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-white/60 truncate">{p.name}{p.unit ? ` / ${p.unit}` : ''}</span>
                          <span className="font-semibold text-[#D4AF37]">{p.price.toFixed(2)} DT</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEditSupplier(s)} className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                      <Edit className="h-3 w-3 inline mr-1" /> Edit
                    </button>
                    <button onClick={() => removeSupplier(s)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/15 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      ) : (
        /* INVOICE HISTORY */
        <div className="space-y-2">
          {invoices.length === 0 ? (
            <div className="py-16 text-center text-white/25">
              <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">No invoices created yet.</p>
              <p className="mt-1 text-[11px] text-white/15">Cashiers can create invoices from the Caisse dashboard.</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <GlassCard key={inv.id} hover={false} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#D4AF37]">{inv.number}</span>
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/50">{inv.supplierName}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {new Date(inv.createdAt).toLocaleString()} · Cashier: {inv.cashierName}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {inv.lines.slice(0, 4).map((l) => (
                        <span key={l.id} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/50">
                          {l.quantity}× {l.productName}
                        </span>
                      ))}
                      {inv.lines.length > 4 && (
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/40">+{inv.lines.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="text-base font-bold text-[#D4AF37]">{inv.total.toFixed(2)} DT</div>
                    <div className="text-[10px] text-white/30">{inv.lines.length} line{inv.lines.length !== 1 ? 's' : ''}</div>
                    <button
                      onClick={() => navigate(`/cashier/invoice?id=${inv.id}`)}
                      className="mt-1 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors flex items-center gap-1"
                      title="Open & print this invoice"
                    >
                      <Printer className="h-3 w-3" /> Open / Print
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Supplier Form Modal */}
      {createPortal(
        <AnimatePresence>
          {showSupplierForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={() => setShowSupplierForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#111] my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#D4AF37]" />
                    {editSupplier ? 'Edit Supplier' : 'New Supplier'}
                  </h3>
                  <button onClick={() => setShowSupplierForm(false)} className="rounded-lg p-1 text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input type="text" placeholder="Supplier name *" value={sForm.name}
                      onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
                      className="sm:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                    />
                    <input type="text" placeholder="Phone" value={sForm.phone}
                      onChange={(e) => setSForm({ ...sForm, phone: e.target.value })}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                    />
                    <input type="text" placeholder="Address (optional)" value={sForm.address}
                      onChange={(e) => setSForm({ ...sForm, address: e.target.value })}
                      className="sm:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-3">
                      Products ({sForm.products.length})
                    </div>

                    <div className="grid grid-cols-12 gap-2 mb-3">
                      <input
                        type="text" placeholder="Product name"
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addProductLine()}
                        className="col-span-6 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none"
                      />
                      <input
                        type="number" step="0.01" min="0" placeholder="Price"
                        value={newProd.price}
                        onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addProductLine()}
                        className="col-span-3 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none"
                      />
                      <input
                        type="text" placeholder="Unit (kg, L...)"
                        value={newProd.unit}
                        onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addProductLine()}
                        className="col-span-2 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none"
                      />
                      <button
                        onClick={addProductLine}
                        className="col-span-1 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-amber-400 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {sForm.products.length === 0 ? (
                      <div className="text-center text-xs text-white/25 py-4">
                        No products yet. Add at least one.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {sForm.products.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-black/20 px-3 py-2">
                            <span className="flex-1 text-sm truncate">{p.name}{p.unit ? ` / ${p.unit}` : ''}</span>
                            <span className="text-sm font-semibold text-[#D4AF37]">{p.price.toFixed(2)} DT</span>
                            <button onClick={() => removeProductLine(p.id)} className="rounded p-1 text-white/30 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 p-5 border-t border-white/[0.06]">
                  <button onClick={() => setShowSupplierForm(false)} className="flex-1 rounded-xl border border-white/[0.08] py-3 text-sm font-medium text-white/70 hover:bg-white/5">Cancel</button>
                  <button onClick={saveSupplier} disabled={!sForm.name.trim()} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-30">
                    {editSupplier ? 'Update Supplier' : 'Create Supplier'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ============================================================
// Reports Tab (Shift Reports — filter + open printable rapport)
// ============================================================

function ReportsTab() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [shift, setShift] = useState<'day' | 'night' | 'all'>('all');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cashier, setCashier] = useState<string>('All Cashiers');

  useEffect(() => {
    setStaff(getStaff());
  }, []);

  const cashiers = staff.filter((s) => s.role === 'Cashier' || s.role === 'Administrator');

  const openReport = () => {
    const params = new URLSearchParams({
      cashier,
      shift,
      period,
      date,
    });
    navigate(`/report?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#D4AF37]" /> Generate Shift Report
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Filter sales + consommation by cashier, shift, and period — then open the printable rapport.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Caisse</label>
            <select
              value={cashier}
              onChange={(e) => setCashier(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            >
              <option value="All Cashiers" className="bg-[#111]">All Cashiers</option>
              {cashiers.map((s) => (
                <option key={s.id} value={s.name} className="bg-[#111]">{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as 'day' | 'night' | 'all')}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            >
              <option value="all" className="bg-[#111]">All hours</option>
              <option value="day" className="bg-[#111]">☀️ Jour (06:00–18:00)</option>
              <option value="night" className="bg-[#111]">🌙 Nuit (18:00–06:00)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Période</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            >
              <option value="day" className="bg-[#111]">📅 Jour</option>
              <option value="week" className="bg-[#111]">🗓 Semaine</option>
              <option value="month" className="bg-[#111]">📆 Mois</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        <div className="mt-6">
          <GoldButton onClick={openReport}>
            <FileText className="h-4 w-4" /> Open Rapport
          </GoldButton>
        </div>
      </div>

      {/* Quick presets */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-6">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Quick Presets</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Today — Day Shift', s: 'day' as const, p: 'day' as const },
            { label: 'Today — Night Shift', s: 'night' as const, p: 'day' as const },
            { label: 'This Week — All', s: 'all' as const, p: 'week' as const },
            { label: 'This Month — All', s: 'all' as const, p: 'month' as const },
            { label: 'This Week — Day Shifts', s: 'day' as const, p: 'week' as const },
            { label: 'This Week — Night Shifts', s: 'night' as const, p: 'week' as const },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                const p = new URLSearchParams({
                  cashier, shift: preset.s, period: preset.p, date,
                });
                navigate(`/report?${p.toString()}`);
              }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left text-sm hover:border-[#D4AF37]/30 hover:bg-white/[0.04] transition-colors flex items-center justify-between"
            >
              <span>{preset.label}</span>
              <span className="text-[10px] text-[#D4AF37]/70">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
