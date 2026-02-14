export type MenuItem = {
  id: string;
  name: string;
  price: number;
}

export type Menu = {
  id: string;
  name: string;
  items: MenuItem[];
  createdAt: string;
}

export type IceLevel = '正常冰' | '少冰' | '微冰' | '去冰';
export type SugarLevel = '正常糖' | '少糖' | '微糖' | '無糖';

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  iceLevel: IceLevel;
  sugarLevel: SugarLevel;
}

export type CustomerOrder = {
  id: string;
  customerName: string;
  items: OrderItem[];
  createdAt: string;
}

export type OrderSession = {
  id: string;
  menuId: string;
  menuName: string;
  orders: CustomerOrder[];
  createdAt: string;
}
