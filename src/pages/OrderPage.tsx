import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getGroupOrderById, addOrderItem } from '../utils/api';
import { GroupOrder, MenuItem, OrderItemDetail, TemperatureOption, SugarLevel } from '../types';
import FloatingCart from '../components/FloatingCart';

const TEMPERATURE_OPTIONS: TemperatureOption[] = ['熱', '常溫', '去冰', '微冰', '少冰', '正常冰'];
const SUGAR_LEVELS: SugarLevel[] = ['正常糖', '少糖', '微糖', '無糖'];

// 預設分類順序
const DEFAULT_CATEGORY_ORDER = ['奶茶類', '紅茶類', '綠茶類', '烏龍茶類', '鮮奶茶類', '特調類', '其他'];

// 根據飲料名稱自動分類
function autoCategorizeDrink(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('奶茶') || lowerName.includes('珍珠') || lowerName.includes('波霸')) {
    return '奶茶類';
  }
  if (lowerName.includes('紅茶') || lowerName.includes('阿薩姆') || lowerName.includes('錫蘭')) {
    return '紅茶類';
  }
  if (lowerName.includes('綠茶') || lowerName.includes('茉莉') || lowerName.includes('香片')) {
    return '綠茶類';
  }
  if (lowerName.includes('烏龍') || lowerName.includes('青茶') || lowerName.includes('高山')) {
    return '烏龍茶類';
  }
  if (lowerName.includes('鮮奶') || lowerName.includes('拿鐵') || lowerName.includes('牛奶')) {
    return '鮮奶茶類';
  }
  if (lowerName.includes('多多') || lowerName.includes('果汁') || lowerName.includes('檸檬') || 
      lowerName.includes('冬瓜') || lowerName.includes('仙草') || lowerName.includes('愛玉')) {
    return '特調類';
  }
  
  return '其他';
}

// 將菜單分組
function groupMenuItems(items: MenuItem[]): Map<string, MenuItem[]> {
  const groups = new Map<string, MenuItem[]>();
  
  items.forEach(item => {
    const category = item.category || autoCategorizeDrink(item.name);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  });
  
  // 根據預設順序排序
  const sortedGroups = new Map<string, MenuItem[]>();
  DEFAULT_CATEGORY_ORDER.forEach(cat => {
    if (groups.has(cat)) {
      sortedGroups.set(cat, groups.get(cat)!);
    }
  });
  // 加入未在預設順序中的分類
  groups.forEach((items, cat) => {
    if (!sortedGroups.has(cat)) {
      sortedGroups.set(cat, items);
    }
  });
  
  return sortedGroups;
}

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [userName, setUserName] = useState('');
  const [cart, setCart] = useState<OrderItemDetail[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!orderId) return;

      const data = await getGroupOrderById(orderId);
      if (!data) {
        setError('找不到該訂單');
        setLoading(false);
        return;
      }

      setGroupOrder(data);
      if (data.menu) {
        setMenu(data.menu.items);
      }
      
      setLoading(false);
    };

    loadData();

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      if (!orderId) return;
      const updatedData = await getGroupOrderById(orderId);
      if (updatedData) {
        setGroupOrder(updatedData);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // 分組展開狀態
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 計算分組後的菜單
  const groupedMenu = useMemo(() => groupMenuItems(menu), [menu]);

  // 初始化時展開所有分類
  useEffect(() => {
    if (groupedMenu.size > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(groupedMenu.keys()));
    }
  }, [groupedMenu]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(groupedMenu.keys()));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    // 檢查購物車中是否已有相同品項（相同溫度和糖度）
    const existingIndex = cart.findIndex(
      item => item.menuItemId === menuItem.id && 
              item.temperature === '正常冰' && 
              item.sugarLevel === '正常糖'
    );

    if (existingIndex >= 0) {
      // 增加數量
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      // 新增品項
      const newItem: OrderItemDetail = {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        temperature: '正常冰',
        sugarLevel: '正常糖',
        quantity: 1,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateCartItem = (
    index: number,
    field: 'temperature' | 'sugarLevel' | 'quantity',
    value: string | number
  ) => {
    const newCart = [...cart];
    if (field === 'temperature') {
      newCart[index].temperature = value as TemperatureOption;
    } else if (field === 'sugarLevel') {
      newCart[index].sugarLevel = value as SugarLevel;
    } else if (field === 'quantity') {
      newCart[index].quantity = value as number;
    }
    setCart(newCart);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!userName.trim()) {
      alert('請輸入姓名');
      return;
    }

    if (cart.length === 0) {
      alert('請至少選擇一項飲料');
      return;
    }

    if (!groupOrder || !orderId) return;

    // 檢查訂單是否已鎖定
    if (groupOrder.status === 'locked') {
      alert('此訂單已鎖定，無法新增點餐');
      return;
    }

    try {
      await addOrderItem(orderId, {
        id: uuidv4(),
        userName: userName.trim(),
        items: cart,
        createdAt: new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err.message || '新增點餐失敗');
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !groupOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到訂單</h2>
          <p className="text-gray-600">
            此訂單可能已被刪除或連結無效
          </p>
        </div>
      </div>
    );
  }

  // 訂單已鎖定的提示
  if (groupOrder.status === 'locked' && !isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">訂單已鎖定</h2>
          <p className="text-gray-600 mb-4">
            此團購訂單已被開團者鎖定，暫時無法新增點餐。
          </p>
          <p className="text-sm text-gray-500">
            如需點餐，請聯繫開團者 {groupOrder.createdBy} 解除鎖定
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">訂單已送出！</h2>
          <p className="text-gray-600 mb-6">
            感謝 {userName} 的訂購
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">訂單總計</p>
            <p className="text-3xl font-bold text-indigo-600">NT$ {totalPrice}</p>
            <p className="text-sm text-gray-500 mt-1">{totalItems} 杯飲料</p>
          </div>
          <button
            onClick={() => {
              setUserName('');
              setCart([]);
              setIsSubmitted(false);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            🔄 再次點餐
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧋 {groupOrder.restaurantName}
          </h1>
          <p className="text-gray-600">開團者：{groupOrder.createdBy}</p>
          <p className="text-sm text-gray-500 mt-1">選擇你想要的飲料</p>
        </div>

        {/* 菜單 - 分組顯示 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📋 菜單</h2>
            <div className="flex gap-2">
              <button
                onClick={expandAllCategories}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                全部展開
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={collapseAllCategories}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                全部收合
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {Array.from(groupedMenu.entries()).map(([category, items]) => (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* 分類標題 - 可點擊展開/收合 */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-800">
                      {category}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({items.length} 項)
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                      expandedCategories.has(category) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* 分類內容 */}
                {expandedCategories.has(category) && (
                  <div className="p-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition duration-200"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <p className="text-indigo-600 font-medium">NT$ {item.price}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                        >
                          + 加入
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 購物車 */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🛒 我的訂單</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你的姓名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="請輸入你的姓名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4 mb-6">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {item.menuItemName}
                      </h3>
                      <p className="text-indigo-600 font-medium">
                        NT$ {item.price} × {item.quantity} = NT$ {item.price * item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      移除
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        數量
                      </label>
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateCartItem(
                            index,
                            'quantity',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        溫度
                      </label>
                      <select
                        value={item.temperature}
                        onChange={(e) =>
                          handleUpdateCartItem(
                            index,
                            'temperature',
                            e.target.value as TemperatureOption
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {TEMPERATURE_OPTIONS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        甜度
                      </label>
                      <select
                        value={item.sugarLevel}
                        onChange={(e) =>
                          handleUpdateCartItem(
                            index,
                            'sugarLevel',
                            e.target.value as SugarLevel
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {SUGAR_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold text-gray-800">總計</span>
                  <span className="text-sm text-gray-500 ml-2">({totalItems} 杯)</span>
                </div>
                <span className="text-2xl font-bold text-indigo-600">
                  NT$ {totalPrice}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              ✅ 送出訂單
            </button>
          </div>
        )}

        {/* 已有的訂單（讓使用者看到其他人的點餐） */}
        {groupOrder.orderItems && groupOrder.orderItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              👥 目前已有 {groupOrder.orderItems.length} 人點餐
            </h2>
            <div className="space-y-3">
              {groupOrder.orderItems.slice().reverse().map((orderItem) => {
                const orderTotal = orderItem.items.reduce(
                  (sum, item) => sum + item.price * (item.quantity || 1),
                  0
                );
                return (
                  <div
                    key={orderItem.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        {orderItem.userName}
                      </span>
                      <span className="text-indigo-600 font-semibold">
                        NT$ {orderTotal}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {orderItem.items.map(i => 
                        `${i.menuItemName}${(i.quantity || 1) > 1 ? ` ×${i.quantity}` : ''}`
                      ).join('、')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 浮動購物車 */}
      <FloatingCart
        cart={cart}
        onRemove={handleRemoveFromCart}
        onUpdate={handleUpdateCartItem}
        temperatureOptions={TEMPERATURE_OPTIONS}
        sugarLevels={SUGAR_LEVELS}
      />
    </div>
  );
}
