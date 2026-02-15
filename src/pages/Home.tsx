import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupOrders, deleteGroupOrder } from '../utils/api';
import { GroupOrder } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupOrders();
  }, []);

  const loadGroupOrders = async () => {
    try {
      const data = await getGroupOrders();
      setGroupOrders(data);
    } catch (err) {
      console.error('Failed to load group orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewOrder = () => {
    navigate('/group-order/new');
  };

  const handleManageRestaurants = () => {
    navigate('/restaurants');
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/group-order/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('確定要刪除此團購訂單嗎？')) {
      await deleteGroupOrder(orderId);
      loadGroupOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'locked') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          已鎖定
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
        開放中
      </span>
    );
  };

  const calculateOrderTotal = (order: GroupOrder) => {
    return order.orderItems?.reduce((total, item) => {
      return total + item.items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
    }, 0) || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧋 團購點飲料</h1>
          <p className="text-gray-600">輕鬆管理團購訂單</p>
        </div>

        {/* 主要操作按鈕 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleCreateNewOrder}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-2"
          >
            <span className="text-3xl">🛒</span>
            <span className="text-xl">開啟新團購訂單</span>
            <span className="text-sm opacity-80">選擇餐廳並建立團購</span>
          </button>
          
          <button
            onClick={handleManageRestaurants}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl flex flex-col items-center gap-2"
          >
            <span className="text-3xl">🏪</span>
            <span className="text-xl">管理餐廳 / 菜單</span>
            <span className="text-sm opacity-80">新增、編輯餐廳菜單</span>
          </button>
        </div>

        {/* 團購訂單列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 團購訂單列表</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>載入中...</p>
            </div>
          ) : groupOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">還沒有任何團購訂單</p>
              <p className="text-sm">點擊上方「開啟新團購訂單」開始</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupOrders.map(order => {
                const totalAmount = calculateOrderTotal(order);
                const orderCount = order.orderItems?.length || 0;
                
                return (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {order.restaurantName}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>開團者：{order.createdBy}</p>
                          <p>
                            {orderCount} 人點餐 · 總金額 NT$ {totalAmount}
                          </p>
                          <p>
                            {new Date(order.createdAt).toLocaleString('zh-TW')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
