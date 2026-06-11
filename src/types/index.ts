// ============================================================
// HEBLI – Ultra Luxury Smart Coffee Management Platform
// Core Type Definitions
// ============================================================

export type UserRole = 'client' | 'barista' | 'cashier' | 'owner';

export type OrderStatus = 'Pending' | 'In Preparation' | 'Paid' | 'Ready';

export type StaffRole = 'Barista' | 'Cashier' | 'Administrator';

export type ProductCategory = string;

export type InventoryItemType =
  | 'Coffee Beans'
  | 'Milk'
  | 'Sugar'
  | 'Chocolate'
  | 'Tea'
  | 'Cups'
  | 'Packaging'
  | 'Other';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  email?: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  image: string;
  active: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  clientName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  note?: string;
  prepTimeSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string; // 'group', or `dm:ownerId:staffId`, or `ticket:ticketId`
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  clientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'accepted' | 'closed';
  createdAt: string;
}

export interface StaffSession {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  loginAt: string;
  logoutAt?: string;
  durationSeconds?: number;
  dayKey: string; // YYYY-MM-DD
  active: boolean; // on-duty toggle
}

export interface AppNotification {
  id: string;
  target: string; // staff name, role, or 'all'
  title: string;
  body: string;
  type: 'order' | 'message' | 'info';
  read: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  cashierName: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  quantity: number;
  unit: string;
  minStock: number;
  criticalStock: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'purchase' | 'consumption';
  quantity: number;
  cost?: number;
  supplier?: string;
  date: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestSellingProducts: { name: string; count: number; revenue: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  revenueByHour: { hour: number; orders: number }[];
  topProducts: { name: string; quantity: number }[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface AIQuery {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}
