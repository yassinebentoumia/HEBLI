// ============================================================
// HEBLI – Local Storage Data Store
// Atomic writes, backup system, data initialization
// ============================================================

import type {
  Product,
  Order,
  Staff,
  Payment,
  InventoryItem,
  InventoryTransaction,
  AuditLog,
  Category,
  ChatMessage,
  Ticket,
  StaffSession,
  AppNotification,
  Supplier,
  Invoice,
  Consumption,
} from '@/types';
import { schedulePush, SYNC_KEYS, recordDeletion } from './sync';

const KEYS = {
  products: 'hebli_products',
  orders: 'hebli_orders',
  staff: 'hebli_staff',
  payments: 'hebli_payments',
  inventory: 'hebli_inventory',
  inventoryTransactions: 'hebli_inventory_transactions',
  auditLogs: 'hebli_audit_logs',
  categories: 'hebli_categories',
  chat: 'hebli_chat_messages',
  tickets: 'hebli_tickets',
  sessions: 'hebli_staff_sessions',
  notifications: 'hebli_notifications',
  suppliers: 'hebli_suppliers',
  invoices: 'hebli_invoices',
  consumptions: 'hebli_consumptions',
  backups: 'hebli_backups',
  currentUser: 'hebli_current_user',
};

// Atomic write with temp key to prevent corruption + cloud sync
function atomicWrite<T>(key: string, data: T): void {
  const tmpKey = key + '_tmp';
  try {
    localStorage.setItem(tmpKey, JSON.stringify(data));
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.removeItem(tmpKey);
    // Push to cloud if this key is synced
    if (SYNC_KEYS.includes(key)) {
      schedulePush();
    }
  } catch (e) {
    console.error('Atomic write failed:', e);
  }
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Try tmp recovery
    const tmpRaw = localStorage.getItem(key + '_tmp');
    if (tmpRaw) {
      try {
        return JSON.parse(tmpRaw) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// ============================================================
// Default Data
// ============================================================

const defaultProducts: Product[] = [
  {
    id: 'p1',
    name: 'Signature Espresso',
    category: 'Espresso',
    description: 'Rich, bold single-origin Ethiopian espresso with notes of dark chocolate and caramel.',
    price: 4.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Double Espresso',
    category: 'Espresso',
    description: 'Double shot of our signature espresso. Intense and aromatic.',
    price: 5.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'Classic Cappuccino',
    category: 'Cappuccino',
    description: 'Velvety steamed milk over a double espresso, finished with a cloud of foam.',
    price: 6.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p4',
    name: 'Caramel Cappuccino',
    category: 'Cappuccino',
    description: 'Classic cappuccino swirled with house-made caramel sauce.',
    price: 7.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p5',
    name: 'Vanilla Latte',
    category: 'Latte',
    description: 'Smooth espresso with steamed milk and Madagascar vanilla.',
    price: 6.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p6',
    name: 'Hazelnut Latte',
    category: 'Latte',
    description: 'Rich espresso with steamed milk and Italian hazelnut syrup.',
    price: 7.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p7',
    name: 'Matcha Latte',
    category: 'Latte',
    description: 'Premium Japanese ceremonial matcha whisked with steamed milk.',
    price: 7.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p8',
    name: 'Earl Grey Tea',
    category: 'Tea',
    description: 'Classic bergamot-infused black tea, served in a cast iron pot.',
    price: 5.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p9',
    name: 'Moroccan Mint Tea',
    category: 'Tea',
    description: 'Fresh mint leaves with gunpowder green tea, sweetened to perfection.',
    price: 5.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p10',
    name: 'Chamomile Honey',
    category: 'Tea',
    description: 'Soothing chamomile with a drizzle of organic wildflower honey.',
    price: 5.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p11',
    name: 'Tiramisu',
    category: 'Desserts',
    description: 'Layers of espresso-soaked ladyfingers with mascarpone cream.',
    price: 9.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p12',
    name: 'Chocolate Croissant',
    category: 'Desserts',
    description: 'Buttery, flaky croissant filled with Belgian dark chocolate.',
    price: 6.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p13',
    name: 'Iced Caramel Macchiato',
    category: 'Cold Drinks',
    description: 'Chilled espresso with vanilla syrup, milk, and caramel drizzle over ice.',
    price: 7.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p14',
    name: 'Cold Brew',
    category: 'Cold Drinks',
    description: 'Slow-steeped for 20 hours. Smooth, chocolatey, and refreshing.',
    price: 6.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p15',
    name: 'Strawberry Frappé',
    category: 'Cold Drinks',
    description: 'Blended strawberries with cream and ice, topped with whipped cream.',
    price: 8.00,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p16',
    name: 'Mocha Frappuccino',
    category: 'Cold Drinks',
    description: 'Coffee, chocolate, and ice blended together with a swirl of whipped cream.',
    price: 8.50,
    image: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const defaultStaff: Staff[] = [
  { id: 's1', name: 'Ahmed Al-Rashid', role: 'Barista', pin: '1234', email: 'ahmed@hebli.com', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 's2', name: 'Sarah Chen', role: 'Barista', pin: '2345', email: 'sarah@hebli.com', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 's3', name: 'Michael Torres', role: 'Cashier', pin: '3456', email: 'michael@hebli.com', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 's4', name: 'Emily Watson', role: 'Cashier', pin: '4567', email: 'emily@hebli.com', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 's5', name: 'Yassine HEBLI', role: 'Administrator', pin: '9999', email: 'yassine@hebli.com', active: true, createdAt: '2026-01-01T00:00:00Z' },
];

const defaultInventory: InventoryItem[] = [
  { id: 'inv1', name: 'Ethiopian Coffee Beans', type: 'Coffee Beans', quantity: 25, unit: 'kg', minStock: 5, criticalStock: 2, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv2', name: 'Colombian Coffee Beans', type: 'Coffee Beans', quantity: 18, unit: 'kg', minStock: 5, criticalStock: 2, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv3', name: 'Whole Milk', type: 'Milk', quantity: 40, unit: 'L', minStock: 10, criticalStock: 3, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv4', name: 'Oat Milk', type: 'Milk', quantity: 15, unit: 'L', minStock: 5, criticalStock: 2, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv5', name: 'Almond Milk', type: 'Milk', quantity: 12, unit: 'L', minStock: 5, criticalStock: 2, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv6', name: 'Organic Sugar', type: 'Sugar', quantity: 30, unit: 'kg', minStock: 5, criticalStock: 2, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv7', name: 'Belgian Chocolate', type: 'Chocolate', quantity: 10, unit: 'kg', minStock: 3, criticalStock: 1, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv8', name: 'Matcha Powder', type: 'Tea', quantity: 4, unit: 'kg', minStock: 1, criticalStock: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv9', name: 'Earl Grey Tea Leaves', type: 'Tea', quantity: 6, unit: 'kg', minStock: 2, criticalStock: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv10', name: 'Paper Cups (8oz)', type: 'Cups', quantity: 500, unit: 'pcs', minStock: 100, criticalStock: 30, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv11', name: 'Paper Cups (12oz)', type: 'Cups', quantity: 400, unit: 'pcs', minStock: 100, criticalStock: 30, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv12', name: 'Paper Cups (16oz)', type: 'Cups', quantity: 300, unit: 'pcs', minStock: 75, criticalStock: 25, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv13', name: 'Branded Sleeves', type: 'Packaging', quantity: 600, unit: 'pcs', minStock: 150, criticalStock: 50, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv14', name: 'Takeaway Bags', type: 'Packaging', quantity: 200, unit: 'pcs', minStock: 50, criticalStock: 20, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv15', name: 'Caramel Syrup', type: 'Other', quantity: 8, unit: 'L', minStock: 2, criticalStock: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv16', name: 'Vanilla Syrup', type: 'Other', quantity: 7, unit: 'L', minStock: 2, criticalStock: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'inv17', name: 'Hazelnut Syrup', type: 'Other', quantity: 6, unit: 'L', minStock: 2, criticalStock: 0.5, updatedAt: '2026-01-01T00:00:00Z' },
];

const defaultCategories: Category[] = [
  { id: 'cat-espresso', name: 'Espresso', icon: '☕', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-cappuccino', name: 'Cappuccino', icon: '🫧', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-latte', name: 'Latte', icon: '🥛', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-tea', name: 'Tea', icon: '🍵', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-desserts', name: 'Desserts', icon: '🍰', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-cold', name: 'Cold Drinks', icon: '🧊', createdAt: '2026-01-01T00:00:00Z' },
];

// ============================================================
// Initialize data
// ============================================================

export function initializeData(): void {
  if (!localStorage.getItem(KEYS.products)) {
    atomicWrite(KEYS.products, defaultProducts);
  }
  if (!localStorage.getItem(KEYS.staff)) {
    atomicWrite(KEYS.staff, defaultStaff);
  }
  if (!localStorage.getItem(KEYS.orders)) {
    atomicWrite(KEYS.orders, []);
  }
  if (!localStorage.getItem(KEYS.payments)) {
    atomicWrite(KEYS.payments, []);
  }
  if (!localStorage.getItem(KEYS.inventory)) {
    atomicWrite(KEYS.inventory, defaultInventory);
  }
  if (!localStorage.getItem(KEYS.inventoryTransactions)) {
    atomicWrite(KEYS.inventoryTransactions, []);
  }
  if (!localStorage.getItem(KEYS.auditLogs)) {
    atomicWrite(KEYS.auditLogs, []);
  }
  if (!localStorage.getItem(KEYS.categories)) {
    atomicWrite(KEYS.categories, defaultCategories);
  }
  if (!localStorage.getItem(KEYS.backups)) {
    atomicWrite(KEYS.backups, []);
  }
}

// ============================================================
// CRUD Operations
// ============================================================

// Products
export function getProducts(): Product[] {
  return safeRead<Product[]>(KEYS.products, defaultProducts);
}

export function getActiveProducts(): Product[] {
  return getProducts().filter((p) => p.active);
}

export function saveProducts(products: Product[]): void {
  atomicWrite(KEYS.products, products);
}

export function addProduct(product: Product): void {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates };
    saveProducts(products);
  }
}

export function deleteProduct(id: string): void {
  recordDeletion(KEYS.products, id);
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

// Categories
export function getCategories(): Category[] {
  return safeRead<Category[]>(KEYS.categories, defaultCategories);
}

export function saveCategories(categories: Category[]): void {
  atomicWrite(KEYS.categories, categories);
}

export function addCategory(cat: Category): void {
  const cats = getCategories();
  cats.push(cat);
  saveCategories(cats);
}

export function updateCategory(id: string, updates: Partial<Category>): void {
  const cats = getCategories();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx !== -1) {
    cats[idx] = { ...cats[idx], ...updates };
    saveCategories(cats);
  }
}

export function deleteCategory(id: string): void {
  recordDeletion(KEYS.categories, id);
  const cats = getCategories().filter((c) => c.id !== id);
  saveCategories(cats);
}

export function getCategoryIcon(name: string): string {
  const cats = getCategories();
  return cats.find((c) => c.name === name)?.icon || '☕';
}

// ============================================================
// Chat Messages
// ============================================================
export function getChatMessages(): ChatMessage[] {
  return safeRead<ChatMessage[]>(KEYS.chat, []);
}

export function addChatMessage(msg: ChatMessage): void {
  const all = getChatMessages();
  all.push(msg);
  // keep last 500 messages
  const trimmed = all.slice(-500);
  atomicWrite(KEYS.chat, trimmed);
}

export function getConversation(conversationId: string): ChatMessage[] {
  return getChatMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Owner-only: delete a single chat message
export function deleteChatMessage(id: string): void {
  recordDeletion(KEYS.chat, id);
  const remaining = getChatMessages().filter((m) => m.id !== id);
  atomicWrite(KEYS.chat, remaining);
}

// Owner-only: delete an entire conversation
export function deleteConversation(conversationId: string): number {
  const all = getChatMessages();
  const toDelete = all.filter((m) => m.conversationId === conversationId);
  toDelete.forEach((m) => recordDeletion(KEYS.chat, m.id));
  const remaining = all.filter((m) => m.conversationId !== conversationId);
  atomicWrite(KEYS.chat, remaining);
  return toDelete.length;
}

// ============================================================
// Tickets (client → owner support requests)
// ============================================================
export function getTickets(): Ticket[] {
  return safeRead<Ticket[]>(KEYS.tickets, []);
}

export function addTicket(ticket: Ticket): void {
  const all = getTickets();
  all.push(ticket);
  atomicWrite(KEYS.tickets, all);
}

export function updateTicket(id: string, updates: Partial<Ticket>): void {
  const all = getTickets();
  const idx = all.findIndex((t) => t.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    atomicWrite(KEYS.tickets, all);
  }
}

// ============================================================
// Staff Sessions (on-duty work timer)
// ============================================================
export function getSessions(): StaffSession[] {
  return safeRead<StaffSession[]>(KEYS.sessions, []);
}

// Start an ON-DUTY session (clock-in)
export function startSession(staff: { id: string; name: string; role: string }): string {
  const sessions = getSessions();
  const now = new Date();
  const id = 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  sessions.push({
    id,
    staffId: staff.id,
    staffName: staff.name,
    role: staff.role,
    loginAt: now.toISOString(),
    dayKey: now.toISOString().split('T')[0],
    active: true,
  });
  atomicWrite(KEYS.sessions, sessions);
  return id;
}

// End / clock-out a session
export function endSession(sessionId: string): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx !== -1 && sessions[idx].active) {
    const now = new Date();
    sessions[idx].logoutAt = now.toISOString();
    sessions[idx].active = false;
    sessions[idx].durationSeconds = Math.floor(
      (now.getTime() - new Date(sessions[idx].loginAt).getTime()) / 1000
    );
    atomicWrite(KEYS.sessions, sessions);
  }
}

export function getActiveSessions(): StaffSession[] {
  return getSessions().filter((s) => s.active);
}

// Total worked seconds for a staff member on a given day
export function getStaffDayDuration(staffId: string, dayKey: string): number {
  const sessions = getSessions().filter((s) => s.staffId === staffId && s.dayKey === dayKey);
  return sessions.reduce((sum, s) => {
    if (s.durationSeconds) return sum + s.durationSeconds;
    if (s.active) return sum + Math.floor((Date.now() - new Date(s.loginAt).getTime()) / 1000);
    return sum;
  }, 0);
}

// Total worked seconds for a staff member in a given calendar month
// monthKey: 'YYYY-MM'  (e.g. '2026-03')
export function getStaffMonthDuration(staffId: string, monthKey: string): number {
  const sessions = getSessions().filter(
    (s) => s.staffId === staffId && s.dayKey && s.dayKey.startsWith(monthKey)
  );
  return sessions.reduce((sum, s) => {
    if (s.durationSeconds) return sum + s.durationSeconds;
    if (s.active) return sum + Math.floor((Date.now() - new Date(s.loginAt).getTime()) / 1000);
    return sum;
  }, 0);
}

// Sessions for a specific day (for the audit list)
export function getStaffSessionsForDay(staffId: string, dayKey: string) {
  return getSessions()
    .filter((s) => s.staffId === staffId && s.dayKey === dayKey)
    .sort((a, b) => new Date(a.loginAt).getTime() - new Date(b.loginAt).getTime());
}

// ============================================================
// Notifications (owner → staff private messages, etc.)
// ============================================================
export function getNotifications(): AppNotification[] {
  return safeRead<AppNotification[]>(KEYS.notifications, []);
}

export function addNotification(n: AppNotification): void {
  const all = getNotifications();
  all.push(n);
  atomicWrite(KEYS.notifications, all.slice(-200));
}

export function getNotificationsFor(name: string, role: string): AppNotification[] {
  return getNotifications()
    .filter((n) => n.target === 'all' || n.target === name || n.target === role)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationRead(id: string): void {
  const all = getNotifications();
  const idx = all.findIndex((n) => n.id === id);
  if (idx !== -1) {
    all[idx].read = true;
    atomicWrite(KEYS.notifications, all);
  }
}

export function markAllNotificationsRead(name: string, role: string): void {
  const all = getNotifications();
  let changed = false;
  all.forEach((n) => {
    if ((n.target === 'all' || n.target === name || n.target === role) && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) atomicWrite(KEYS.notifications, all);
}

// Orders
export function getOrders(): Order[] {
  return safeRead<Order[]>(KEYS.orders, []);
}

export function saveOrders(orders: Order[]): void {
  atomicWrite(KEYS.orders, orders);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
}

export function updateOrderStatus(id: string, status: Order['status'], prepTimeSeconds?: number): void {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    if (prepTimeSeconds !== undefined) {
      orders[idx].prepTimeSeconds = prepTimeSeconds;
    }
    saveOrders(orders);
  }
}

// Assign (or clear) a physical table number for an order — System Table feature.
export function setOrderTable(id: string, tableNumber: number | undefined): void {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    orders[idx].tableNumber = tableNumber;
    orders[idx].updatedAt = new Date().toISOString();
    saveOrders(orders);
  }
}

// How many tables the floor has (used by System Table). Change to fit your café.
export const TABLE_COUNT = 16;

// Staff
export function getStaff(): Staff[] {
  return safeRead<Staff[]>(KEYS.staff, defaultStaff);
}

export function saveStaff(staff: Staff[]): void {
  atomicWrite(KEYS.staff, staff);
}

export function addStaffMember(person: Staff): void {
  const staff = getStaff();
  staff.push(person);
  saveStaff(staff);
}

export function updateStaffMember(id: string, updates: Partial<Staff>): void {
  const staff = getStaff();
  const idx = staff.findIndex((s) => s.id === id);
  if (idx !== -1) {
    staff[idx] = { ...staff[idx], ...updates };
    saveStaff(staff);
  }
}

export function deleteStaffMember(id: string): void {
  recordDeletion(KEYS.staff, id);
  const staff = getStaff().filter((s) => s.id !== id);
  saveStaff(staff);
}

// Payments
export function getPayments(): Payment[] {
  return safeRead<Payment[]>(KEYS.payments, []);
}

export function addPayment(payment: Payment): void {
  const payments = getPayments();
  payments.push(payment);
  atomicWrite(KEYS.payments, payments);
}

export function deletePayment(id: string): void {
  recordDeletion(KEYS.payments, id);
  const payments = getPayments().filter((p) => p.id !== id);
  atomicWrite(KEYS.payments, payments);
}

export function deleteOrder(id: string): void {
  recordDeletion(KEYS.orders, id);
  const orders = getOrders().filter((o) => o.id !== id);
  saveOrders(orders);
  // Also remove any payment(s) linked to this order
  const payments = getPayments();
  const toDelete = payments.filter((p) => p.orderId === id);
  toDelete.forEach((p) => recordDeletion(KEYS.payments, p.id));
  const remaining = payments.filter((p) => p.orderId !== id);
  atomicWrite(KEYS.payments, remaining);
}

// Inventory
export function getInventory(): InventoryItem[] {
  return safeRead<InventoryItem[]>(KEYS.inventory, defaultInventory);
}

export function saveInventory(items: InventoryItem[]): void {
  atomicWrite(KEYS.inventory, items);
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
  const items = getInventory();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    saveInventory(items);
  }
}

// Inventory Transactions
export function getInventoryTransactions(): InventoryTransaction[] {
  return safeRead<InventoryTransaction[]>(KEYS.inventoryTransactions, []);
}

export function addInventoryTransaction(tx: InventoryTransaction): void {
  const txs = getInventoryTransactions();
  txs.push(tx);
  atomicWrite(KEYS.inventoryTransactions, txs);
}

// Audit Logs
export function getAuditLogs(): AuditLog[] {
  return safeRead<AuditLog[]>(KEYS.auditLogs, []);
}

export function addAuditLog(log: AuditLog): void {
  const logs = getAuditLogs();
  logs.push(log);
  atomicWrite(KEYS.auditLogs, logs);
}

// Cashier daily/weekly stats
export function getCashierStats(cashierName: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const payments = getPayments();
  const cashPayments = payments.filter((p) => p.cashierName === cashierName);

  const todayPayments = cashPayments.filter((p) => p.date === today);
  const todayRevenue = todayPayments.reduce((s, p) => s + p.amount, 0);
  const todayCount = todayPayments.length;

  const weeklyPayments = cashPayments.filter((p) => new Date(p.createdAt) >= weekStart);
  const weeklyRevenue = weeklyPayments.reduce((s, p) => s + p.amount, 0);
  const weeklyCount = weeklyPayments.length;

  return {
    todayRevenue, todayCount, weeklyRevenue, weeklyCount,
  };
}

// Auth
export function loginStaff(pin: string): Staff | null {
  const staff = getStaff();
  const found = staff.find((s) => s.active && s.pin === pin);
  if (found) {
    localStorage.setItem(KEYS.currentUser, JSON.stringify(found));
    return found;
  }
  return null;
}

export function getCurrentUser(): Staff | null {
  return safeRead<Staff | null>(KEYS.currentUser, null);
}

export function logout(): void {
  localStorage.removeItem(KEYS.currentUser);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Backup
export function createBackup(): void {
  const backup = {
    timestamp: new Date().toISOString(),
    products: getProducts(),
    orders: getOrders(),
    staff: getStaff(),
    payments: getPayments(),
    inventory: getInventory(),
    inventoryTransactions: getInventoryTransactions(),
    auditLogs: getAuditLogs(),
    categories: getCategories(),
  };
  const backups = safeRead<typeof backup[]>(KEYS.backups, []);
  backups.push(backup);
  // Keep only last 30
  if (backups.length > 30) {
    backups.shift();
  }
  atomicWrite(KEYS.backups, backups);
}

// ============================================================
// Suppliers (Owner manages)
// ============================================================

export function getSuppliers(): Supplier[] {
  return safeRead<Supplier[]>(KEYS.suppliers, []);
}

export function addSupplier(s: Supplier): void {
  const all = getSuppliers();
  all.push(s);
  atomicWrite(KEYS.suppliers, all);
}

export function updateSupplier(id: string, updates: Partial<Supplier>): void {
  const all = getSuppliers();
  const idx = all.findIndex((s) => s.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    atomicWrite(KEYS.suppliers, all);
  }
}

export function deleteSupplier(id: string): void {
  recordDeletion(KEYS.suppliers, id);
  const all = getSuppliers().filter((s) => s.id !== id);
  atomicWrite(KEYS.suppliers, all);
}

// ============================================================
// Invoices (Cashier creates)
// ============================================================

export function getInvoices(): Invoice[] {
  return safeRead<Invoice[]>(KEYS.invoices, []);
}

export function addInvoice(inv: Invoice): void {
  const all = getInvoices();
  all.push(inv);
  atomicWrite(KEYS.invoices, all);
}

export function deleteInvoice(id: string): void {
  recordDeletion(KEYS.invoices, id);
  const all = getInvoices().filter((i) => i.id !== id);
  atomicWrite(KEYS.invoices, all);
}

// Auto-generate next invoice number (FAC-000001, FAC-000002, ...)
export function nextInvoiceNumber(): string {
  const list = getInvoices();
  let max = 0;
  list.forEach((i) => {
    const n = parseInt((i.number || '').replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return 'FAC-' + String(max + 1).padStart(6, '0');
}

// ============================================================
// Consumption (Owner deducts stock from inventory)
// ============================================================

export function getConsumptions(): Consumption[] {
  return safeRead<Consumption[]>(KEYS.consumptions, []);
}

export function addConsumption(c: Consumption): void {
  const all = getConsumptions();
  all.push(c);
  atomicWrite(KEYS.consumptions, all);
}

export function deleteConsumption(id: string): void {
  recordDeletion(KEYS.consumptions, id);
  const all = getConsumptions().filter((c) => c.id !== id);
  atomicWrite(KEYS.consumptions, all);
}

// ============================================================
// Analytics (computed dynamically)
// ============================================================

export function computeAnalytics(
  period: 'today' | 'week' | 'month' | 'year' = 'today'
): import('@/types').Analytics {
  const orders = getOrders().filter((o) => o.status === 'Paid' || o.status === 'Ready');
  const now = new Date();

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Best selling products
  const productMap = new Map<string, { count: number; revenue: number }>();
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      const existing = productMap.get(item.name) || { count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      productMap.set(item.name, existing);
    });
  });
  const bestSellingProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Revenue by day
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  filteredOrders.forEach((o) => {
    const key = new Date(o.createdAt).toISOString().split('T')[0];
    const existing = dayMap.get(key) || { revenue: 0, orders: 0 };
    existing.revenue += o.total;
    existing.orders += 1;
    dayMap.set(key, existing);
  });
  const revenueByDay = Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue by month
  const monthMap = new Map<string, { revenue: number; orders: number }>();
  filteredOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key) || { revenue: 0, orders: 0 };
    existing.revenue += o.total;
    existing.orders += 1;
    monthMap.set(key, existing);
  });
  const revenueByMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Revenue by category
  const products = getProducts();
  const catMap = new Map<string, number>();
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      const cat = product?.category || 'Other';
      catMap.set(cat, (catMap.get(cat) || 0) + item.price * item.quantity);
    });
  });
  const revenueByCategory = Array.from(catMap.entries()).map(([category, revenue]) => ({
    category,
    revenue,
  }));

  // Revenue by hour
  const hourMap = new Map<number, number>();
  filteredOrders.forEach((o) => {
    const hour = new Date(o.createdAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });
  const revenueByHour = Array.from(hourMap.entries())
    .map(([hour, orders]) => ({ hour, orders }))
    .sort((a, b) => a.hour - b.hour);

  // Top products by quantity
  const qtyMap = new Map<string, number>();
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      qtyMap.set(item.name, (qtyMap.get(item.name) || 0) + item.quantity);
    });
  });
  const topProducts = Array.from(qtyMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    bestSellingProducts,
    revenueByCategory,
    revenueByDay,
    revenueByMonth,
    revenueByHour,
    topProducts,
  };
}
