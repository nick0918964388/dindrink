import { Menu, OrderSession, CustomerOrder, Restaurant, RestaurantWithMenu, GroupOrder, OrderItemDetail } from '../types';

// Use relative path so Vite proxy works for both local and ngrok
const API_BASE = '/api';

// === Restaurant APIs ===

export const getRestaurants = async (): Promise<RestaurantWithMenu[]> => {
  const res = await fetch(`${API_BASE}/restaurants`);
  return res.json();
};

export const getRestaurantById = async (id: string): Promise<RestaurantWithMenu | null> => {
  const res = await fetch(`${API_BASE}/restaurants/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const saveRestaurant = async (restaurant: Restaurant, menu: { id: string; items: { id: string; name: string; price: number }[]; createdAt: string }): Promise<RestaurantWithMenu> => {
  const res = await fetch(`${API_BASE}/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...restaurant, menu }),
  });
  return res.json();
};

export const deleteRestaurant = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/restaurants/${id}`, { method: 'DELETE' });
};

// === Group Order APIs ===

export const getGroupOrders = async (): Promise<GroupOrder[]> => {
  const res = await fetch(`${API_BASE}/group-orders`);
  return res.json();
};

export const getGroupOrderById = async (id: string): Promise<(GroupOrder & { menu: Menu | null }) | null> => {
  const res = await fetch(`${API_BASE}/group-orders/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const createGroupOrder = async (groupOrder: Omit<GroupOrder, 'orderItems'>): Promise<GroupOrder> => {
  const res = await fetch(`${API_BASE}/group-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(groupOrder),
  });
  return res.json();
};

export const updateGroupOrderStatus = async (id: string, status: 'open' | 'locked'): Promise<GroupOrder> => {
  const res = await fetch(`${API_BASE}/group-orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const deleteGroupOrder = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/group-orders/${id}`, { method: 'DELETE' });
};

// === Order Item APIs ===

export const addOrderItem = async (groupOrderId: string, orderItem: { id: string; userName: string; items: OrderItemDetail[]; createdAt: string }): Promise<GroupOrder> => {
  const res = await fetch(`${API_BASE}/group-orders/${groupOrderId}/order-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderItem),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '新增點餐失敗');
  }
  return res.json();
};

export const deleteOrderItem = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/order-items/${id}`, { method: 'DELETE' });
};

// === Menu APIs (向後相容) ===

export const getMenus = async (): Promise<Menu[]> => {
  const res = await fetch(`${API_BASE}/menus`);
  return res.json();
};

export const getMenuById = async (id: string): Promise<Menu | null> => {
  const res = await fetch(`${API_BASE}/menus/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const saveMenu = async (menu: Menu): Promise<Menu> => {
  const res = await fetch(`${API_BASE}/menus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
  });
  return res.json();
};

export const deleteMenu = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/menus/${id}`, { method: 'DELETE' });
};

// === Session APIs (向後相容) ===

export const getSessions = async (): Promise<OrderSession[]> => {
  const res = await fetch(`${API_BASE}/sessions`);
  return res.json();
};

export const getSessionById = async (id: string): Promise<OrderSession | null> => {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const saveSession = async (session: OrderSession): Promise<OrderSession> => {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  return res.json();
};

export const addOrderToSession = async (sessionId: string, order: CustomerOrder): Promise<OrderSession> => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  return res.json();
};

export const deleteSession = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
};
