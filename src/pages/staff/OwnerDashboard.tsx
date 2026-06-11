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
  updateInventoryItem,
  getInventoryTransactions,
  addInventoryTransaction,
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
  addNotification,
} from '@/utils/store';
import StaffTopBar from '@/components/StaffTopBar';
import ChatPanel from '@/components/ChatPanel';
import type {
  Product,
  Staff,
  InventoryItem,
  InventoryTransaction,
  AuditLog,
  Category,
  Ticket,
  StaffRole,
} from '@/types';

const COLORS = ['#D4AF37', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#EC4899'];

type Tab = 'dashboard' | 'products' | 'categories' | 'staff' | 'inventory' | 'analytics' | 'assistant' | 'chat' | 'tickets' | 'logs';

const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
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

  const today = new Date().toISOString().split('T')[0];
  const activeIds = getSessions().filter((s) => s.active).map((s) => s.staffId);

  useEffect(() => {
    setStaff(getStaff());
    const int = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg font-bold text-[#D4AF37]">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-xs text-white/40">{s.role}</p>
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
              <div className="mt-3 text-xs text-white/30 space-y-1">
                <div>PIN: {s.pin}</div>
                {s.email && <div>Email: {s.email}</div>}
                <div className="flex items-center gap-1.5 text-amber-400/80">
                  <Clock className="h-3 w-3" />
                  Worked today: <span className="font-mono font-semibold">{fmtDur(getStaffDayDuration(s.id, today))}</span>
                </div>
              </div>
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
        ))}
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

function InventoryTab() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showConsume, setShowConsume] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const { addLog } = useApp();

  useEffect(() => {
    setInventory(getInventory());
    setTransactions(getInventoryTransactions());
  }, []);

  const handlePurchase = () => {
    if (!selectedItem || !qty) return;
    const qtyNum = parseFloat(qty);
    updateInventoryItem(selectedItem.id, { quantity: selectedItem.quantity + qtyNum });
    addInventoryTransaction({
      id: 'tx-' + Date.now(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: 'purchase',
      quantity: qtyNum,
      cost: cost ? parseFloat(cost) : undefined,
      supplier: supplier || undefined,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
    addLog('Inventory Purchase', `Purchased ${qtyNum} ${selectedItem.unit} of ${selectedItem.name}`);
    setInventory(getInventory());
    setTransactions(getInventoryTransactions());
    setShowPurchase(false);
    setQty(''); setCost(''); setSupplier('');
  };

  const handleConsume = () => {
    if (!selectedItem || !qty) return;
    const qtyNum = parseFloat(qty);
    updateInventoryItem(selectedItem.id, { quantity: Math.max(0, selectedItem.quantity - qtyNum) });
    addInventoryTransaction({
      id: 'tx-' + Date.now(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: 'consumption',
      quantity: qtyNum,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
    addLog('Inventory Consumption', `Consumed ${qtyNum} ${selectedItem.unit} of ${selectedItem.name}`);
    setInventory(getInventory());
    setTransactions(getInventoryTransactions());
    setShowConsume(false);
    setQty('');
  };

  const getStockLevel = (item: InventoryItem) => {
    if (item.quantity <= item.criticalStock) return 'critical';
    if (item.quantity <= item.minStock) return 'low';
    return 'good';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inventory.map((item, i) => {
          const level = getStockLevel(item);
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] tracking-wider text-[#D4AF37] uppercase">{item.type}</span>
                  <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    level === 'critical' ? 'bg-red-500/10 text-red-400' :
                    level === 'low' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    {level}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <div className="mt-2 text-2xl font-bold">
                  <span className={level === 'critical' ? 'text-red-400' : level === 'low' ? 'text-amber-400' : 'text-white'}>
                    {item.quantity}
                  </span>
                  <span className="text-sm text-white/30 ml-1">{item.unit}</span>
                </div>
                <div className="mt-1 text-xs text-white/20">
                  Min: {item.minStock} {item.unit} | Critical: {item.criticalStock} {item.unit}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setSelectedItem(item); setShowPurchase(true); }}
                    className="flex-1 rounded-lg bg-green-500/10 py-1.5 text-xs text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    + Purchase
                  </button>
                  <button
                    onClick={() => { setSelectedItem(item); setShowConsume(true); }}
                    className="flex-1 rounded-lg bg-amber-500/10 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    - Consume
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4">Recent Transactions</h3>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(-10).reverse().map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] p-3">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${tx.type === 'purchase' ? 'text-green-400' : 'text-amber-400'}`}>
                    {tx.type === 'purchase' ? '📥' : '📤'}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{tx.itemName}</div>
                    <div className="text-xs text-white/30">
                      {tx.type === 'purchase' ? 'Purchased' : 'Consumed'} {tx.quantity} {tx.type === 'purchase' && tx.cost ? `• ${tx.cost.toFixed(2)} DT` : ''}
                      {tx.supplier ? ` • ${tx.supplier}` : ''}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-white/30">{tx.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-white/20 text-sm">No transactions yet</div>
        )}
      </GlassCard>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPurchase(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Purchase: {selectedItem?.name}</h3>
              <div className="space-y-3">
                <input type="number" placeholder="Quantity" value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <input type="number" placeholder="Total Cost (DT)" value={cost}
                  onChange={(e) => setCost(e.target.value)} step="0.01"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
                <input type="text" placeholder="Supplier (optional)" value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowPurchase(false)}>Cancel</GoldButton>
                <GoldButton className="flex-1" onClick={handlePurchase}>Confirm</GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consume Modal */}
      <AnimatePresence>
        {showConsume && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConsume(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Consume: {selectedItem?.name}</h3>
              <input type="number" placeholder={`Quantity (max ${selectedItem?.quantity})`} value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
              />
              <div className="mt-6 flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowConsume(false)}>Cancel</GoldButton>
                <GoldButton className="flex-1" onClick={handleConsume}>Confirm</GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
