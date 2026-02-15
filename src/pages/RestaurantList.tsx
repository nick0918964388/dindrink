import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurants, deleteRestaurant } from '../utils/api';
import { RestaurantWithMenu } from '../types';

export default function RestaurantList() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = () => {
    navigate('/restaurant/new');
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (confirm('確定要刪除此餐廳嗎？相關的菜單和訂單也會被刪除。')) {
      await deleteRestaurant(id);
      loadRestaurants();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🏪 餐廳管理</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← 返回首頁
            </button>
          </div>

          <button
            onClick={handleCreateRestaurant}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>新增餐廳（上傳菜單 OCR）</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">已儲存的餐廳</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>載入中...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">還沒有任何餐廳</p>
              <p className="text-sm">點擊上方按鈕新增第一間餐廳</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map(restaurant => (
                <div
                  key={restaurant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {restaurant.menu?.items.length || 0} 項商品
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        建立於 {new Date(restaurant.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/group-order/new?restaurantId=${restaurant.id}`)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                      >
                        開團
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                      >
                        刪除
                      </button>
                    </div>
                  </div>

                  {/* 顯示菜單預覽 */}
                  {restaurant.menu && restaurant.menu.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">菜單預覽：</p>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.menu.items.slice(0, 5).map(item => (
                          <span
                            key={item.id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {item.name} ${item.price}
                          </span>
                        ))}
                        {restaurant.menu.items.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{restaurant.menu.items.length - 5} 更多...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
