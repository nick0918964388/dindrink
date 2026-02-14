import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getSessionById, getMenuById, addOrderToSession } from '../utils/api';
import { OrderSession, MenuItem, OrderItem, IceLevel, SugarLevel, CustomerOrder } from '../types';

const ICE_LEVELS: IceLevel[] = ['正常冰', '少冰', '微冰', '去冰'];
const SUGAR_LEVELS: SugarLevel[] = ['正常糖', '少糖', '微糖', '無糖'];

export default function Order() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<OrderSession | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!sessionId) return;

      const foundSession = await getSessionById(sessionId);
      if (!foundSession) {
        alert('找不到該訂單');
        return;
      }

      setSession(foundSession);

      const foundMenu = await getMenuById(foundSession.menuId);
      if (foundMenu) {
        setMenu(foundMenu.items);
      }
      
      setLoading(false);
    };

    loadData();

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      if (!sessionId) return;
      const updatedSession = await getSessionById(sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleAddToCart = (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      price: menuItem.price,
      iceLevel: '正常冰',
      sugarLevel: '正常糖',
    };
    setCart([...cart, newItem]);
  };

  const handleUpdateCartItem = (
    index: number,
    field: 'iceLevel' | 'sugarLevel',
    value: IceLevel | SugarLevel
  ) => {
    const newCart = [...cart];
    if (field === 'iceLevel') {
      newCart[index].iceLevel = value as IceLevel;
    } else {
      newCart[index].sugarLevel = value as SugarLevel;
    }
    setCart(newCart);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('請輸入姓名');
      return;
    }

    if (cart.length === 0) {
      alert('請至少選擇一項飲料');
      return;
    }

    if (!session || !sessionId) return;

    const newOrder: CustomerOrder = {
      id: uuidv4(),
      customerName: customerName.trim(),
      items: cart,
      createdAt: new Date().toISOString(),
    };

    console.log('提交訂單:', newOrder);
    await addOrderToSession(sessionId, newOrder);
    setIsSubmitted(true);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">找不到訂單</p>
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
            感謝 {customerName} 的訂購
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">訂單總計</p>
            <p className="text-3xl font-bold text-indigo-600">NT$ {totalPrice}</p>
          </div>
          <button
            onClick={() => {
              setCustomerName('');
              setCart([]);
              setIsSubmitted(false);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            再次點餐
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {session.menuName}
          </h1>
          <p className="text-gray-600">選擇你想要的飲料</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">菜單</h2>
          <div className="grid gap-3">
            {menu.map((item) => (
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
                  加入
                </button>
              </div>
            ))}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">我的訂單</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
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
                        NT$ {item.price}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      移除
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        冰量
                      </label>
                      <select
                        value={item.iceLevel}
                        onChange={(e) =>
                          handleUpdateCartItem(
                            index,
                            'iceLevel',
                            e.target.value as IceLevel
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {ICE_LEVELS.map((level) => (
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
                <span className="text-lg font-semibold text-gray-800">總計</span>
                <span className="text-2xl font-bold text-indigo-600">
                  NT$ {totalPrice}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              送出訂單
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
