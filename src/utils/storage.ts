import { Menu, OrderSession } from '../types';

const MENUS_KEY = 'drink-order-menus';
const SESSIONS_KEY = 'drink-order-sessions';

// Menu storage
export const saveMenu = (menu: Menu): void => {
  const menus = getMenus();
  const existingIndex = menus.findIndex(m => m.id === menu.id);

  if (existingIndex >= 0) {
    menus[existingIndex] = menu;
  } else {
    menus.push(menu);
  }

  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
};

export const getMenus = (): Menu[] => {
  const data = localStorage.getItem(MENUS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getMenuById = (id: string): Menu | null => {
  const menus = getMenus();
  return menus.find(m => m.id === id) || null;
};

export const deleteMenu = (id: string): void => {
  const menus = getMenus().filter(m => m.id !== id);
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
};

// Session storage
export const saveSession = (session: OrderSession): void => {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const getSessions = (): OrderSession[] => {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getSessionById = (id: string): OrderSession | null => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};
