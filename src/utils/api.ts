import { Menu, OrderSession, CustomerOrder } from '../types';

// Use relative path so Vite proxy works for both local and ngrok
const API_BASE = '/api';

// === Menu APIs ===

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

// === Session APIs ===

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
