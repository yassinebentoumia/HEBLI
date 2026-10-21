// ============================================================
// HEBLI Phase 2 — typed REST / SSE client
// All requests are same-origin and send HTTP-only staff sessions.
// ============================================================

import type { Order, Payment, Product, Staff, Category } from '@/types';

export interface TableSnapshot {
  number: number;
  state: 'free' | 'occupied' | 'paid';
  order: Order | null;
}

export interface ApiEnvelope<T> {
  data: T;
  updatedAt: number;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let code = 'request_failed';
    try { code = (await res.json()).error || code; } catch { /* ignore */ }
    // Let route guards/context react immediately if an old PWA/browser session
    // has expired after a deployment — never leave a silent frozen dashboard.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hebli-auth-expired'));
    }
    throw new ApiError(res.status, code);
  }
  return res.json() as Promise<T>;
}

// ----- Auth -----
export interface SessionStaff {
  id: string;
  name: string;
  role: Staff['role'];
  active: boolean;
  rating?: Staff['rating'];
}
export const loginServer = (pin: string) => request<{ data: SessionStaff }>('/api/v2/auth/login', {
  method: 'POST', body: JSON.stringify({ pin }),
});
export const getServerSession = () => request<{ data: SessionStaff }>('/api/v2/auth/me');
export const logoutServer = () => request<{ ok: true }>('/api/v2/auth/logout', { method: 'POST', body: '{}' });

// ----- Public customer data -----
export const getV2Products = () => request<ApiEnvelope<Product[]>>('/api/v2/products');
export const getV2Categories = () => request<ApiEnvelope<Category[]>>('/api/v2/categories');
export const getV2Tables = () => request<ApiEnvelope<TableSnapshot[]>>('/api/v2/tables');
export const getV2TrackingOrders = (tableNumber: number, orderId?: string | null) =>
  request<ApiEnvelope<Order[]>>(`/api/v2/track/${tableNumber}${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`);

export interface CreateOrderInput {
  tableNumber: number;
  items: Order['items'];
  clientName?: string;
  note?: string;
  loyaltyName?: string;
  allowAddToExisting?: boolean;
}
export const createV2Order = (input: CreateOrderInput) => request<ApiEnvelope<Order>>('/api/v2/orders', {
  method: 'POST', body: JSON.stringify(input),
});

// ----- Staff orders / payments -----
export interface OrderQuery {
  view?: 'active' | 'barista' | 'all';
  table?: number;
  status?: Order['status'];
  limit?: number;
}
export function getV2Orders(query: OrderQuery = {}) {
  const params = new URLSearchParams();
  if (query.view) params.set('view', query.view);
  if (query.table) params.set('table', String(query.table));
  if (query.status) params.set('status', query.status);
  if (query.limit) params.set('limit', String(query.limit));
  return request<ApiEnvelope<Order[]>>(`/api/v2/orders?${params.toString()}`);
}

export const updateV2Order = (id: string, input: Partial<Pick<Order, 'status' | 'note' | 'tableNumber' | 'prepTimeSeconds'>>) =>
  request<ApiEnvelope<Order>>(`/api/v2/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });

export const cancelV2Order = (id: string, reason?: string) =>
  request<ApiEnvelope<Order>>(`/api/v2/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });

export const payV2Order = (id: string) =>
  request<ApiEnvelope<{ order: Order; payment: Payment }>>(`/api/v2/orders/${encodeURIComponent(id)}/pay`, { method: 'POST', body: '{}' });

export const freeV2Table = (number: number) =>
  request<ApiEnvelope<{ tableNumber: number; freedOrders: string[] }>>(`/api/v2/tables/${number}/free`, { method: 'POST', body: '{}' });

export const getV2Payments = (date?: string) =>
  request<ApiEnvelope<Payment[]>>(`/api/v2/payments${date ? `?date=${encodeURIComponent(date)}` : ''}`);

// ----- Realtime SSE -----
export type Phase2Event = {
  type: string;
  updatedAt?: number;
  orderId?: string;
  tableNumber?: number;
  status?: Order['status'];
};

/**
 * Subscribe to lightweight server events. Events contain no sensitive full
 * state; screens refetch only their own endpoint on an event.
 */
export function subscribePhase2Events(
  scope: 'client' | 'staff',
  onEvent: (event: Phase2Event) => void,
  onError?: () => void,
): () => void {
  const source = new EventSource(`/api/v2/events?scope=${scope}`, { withCredentials: true });
  const names = ['connected', 'order.created', 'order.updated', 'order.cancelled', 'order.paid', 'table.freed', 'state.updated'];
  names.forEach((name) => {
    source.addEventListener(name, (raw) => {
      try { onEvent(JSON.parse((raw as MessageEvent).data)); } catch { /* ignore malformed event */ }
    });
  });
  source.onerror = () => onError?.();
  return () => source.close();
}
