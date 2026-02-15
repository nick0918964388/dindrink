// === 基礎類型 ===

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category?: string; // 飲料分類（如：奶茶類、紅茶類等）
}

// === 餐廳與菜單 ===

export type Restaurant = {
  id: string;
  name: string;
  createdAt: string;
}

export type Menu = {
  id: string;
  restaurantId: string;
  items: MenuItem[];
  createdAt: string;
}

// 餐廳與菜單的組合視圖（前端用）
export type RestaurantWithMenu = Restaurant & {
  menu: Menu | null;
}

// === 訂單相關 ===

export type TemperatureOption = '熱' | '常溫' | '去冰' | '微冰' | '少冰' | '正常冰';
export type SugarLevel = '正常糖' | '少糖' | '微糖' | '無糖';

export type OrderItemDetail = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  temperature: TemperatureOption;
  sugarLevel: SugarLevel;
  quantity: number;
}

export type OrderItem = {
  id: string;
  groupOrderId: string;
  userName: string;
  items: OrderItemDetail[];
  createdAt: string;
}

export type GroupOrderStatus = 'open' | 'locked';

export type GroupOrder = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  menuId: string;
  status: GroupOrderStatus;
  createdAt: string;
  createdBy: string;
  orderItems: OrderItem[];
}

// === 向後相容類型（逐步移除） ===

export type CustomerOrder = {
  id: string;
  customerName: string;
  items: OrderItemDetail[];
  createdAt: string;
}

export type OrderSession = {
  id: string;
  menuId: string;
  menuName: string;
  orders: CustomerOrder[];
  createdAt: string;
}
