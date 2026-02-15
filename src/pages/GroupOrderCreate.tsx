import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { getRestaurants, getRestaurantById, createGroupOrder } from '../utils/api';
import { RestaurantWithMenu } from '../types';

export default function GroupOrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRestaurantId = searchParams.get('restaurantId');

  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(preselectedRestaurantId || '');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [createdBy, setCreatedBy] = useState('');
  const [groupOrderId] = useState(uuidv4());
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadSelectedRestaurant(selectedRestaurantId);
    } else {
      setSelectedRestaurant(null);
    }
  }, [selectedRestaurantId]);

  const loadRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data);
      
      // 如果有預選的餐廳，設定它
      if (preselectedRestaurantId) {
        setSelectedRestaurantId(preselectedRestaurantId);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedRestaurant = async (id: string) => {
    const restaurant = await getRestaurantById(id);
    setSelectedRestaurant(restaurant);
  };

  const handleCreateGroupOrder = async () => {
    if (!selectedRestaurant || !selectedRestaurant.menu) {
      alert('請選擇餐廳');
      return;
    }

    if (!createdBy.trim()) {
      alert('請輸入開團者姓名');
      return;
    }

    await createGroupOrder({
      id: groupOrderId,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      menuId: selectedRestaurant.menu.id,
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: createdBy.trim()
    });

    setShowQR(true);
  };

  const orderUrl = `${window.location.origin}/order/${groupOrderId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('連結已複製！');
  };

  const handleGoToManage = () => {
    navigate(`/group-order/${groupOrderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🛒 開啟新團購</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← 返回首頁
            </button>
          </div>

          {!showQR ? (
            <div className="space-y-6">
              {/* 選擇餐廳 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇餐廳
                </label>
                {restaurants.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-3">還沒有任何餐廳</p>
                    <button
                      onClick={() => navigate('/restaurant/new')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                      + 新增餐廳
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {restaurants.map(restaurant => (
                      <div
                        key={restaurant.id}
                        onClick={() => setSelectedRestaurantId(restaurant.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                          selectedRestaurantId === restaurant.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {restaurant.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {restaurant.menu?.items.length || 0} 項商品
                            </p>
                          </div>
                          {selectedRestaurantId === restaurant.id && (
                            <span className="text-indigo-600 text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => navigate('/restaurant/new')}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition duration-200"
                    >
                      + 新增其他餐廳
                    </button>
                  </div>
                )}
              </div>

              {/* 開團者姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開團者姓名
                </label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="請輸入你的名字"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* 已選餐廳預覽 */}
              {selectedRestaurant && selectedRestaurant.menu && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    已選：{selectedRestaurant.name}
                  </h3>
                  <p className="text-sm text-indigo-700 mb-3">
                    共 {selectedRestaurant.menu.items.length} 項商品
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.menu.items.slice(0, 6).map(item => (
                      <span
                        key={item.id}
                        className="text-xs bg-white text-indigo-700 px-2 py-1 rounded shadow-sm"
                      >
                        {item.name} ${item.price}
                      </span>
                    ))}
                    {selectedRestaurant.menu.items.length > 6 && (
                      <span className="text-xs text-indigo-500">
                        +{selectedRestaurant.menu.items.length - 6} 更多...
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateGroupOrder}
                disabled={!selectedRestaurant || !createdBy.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🚀 建立團購訂單
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <span className="text-4xl">🎉</span>
                <h3 className="text-xl font-semibold text-green-800 mt-2">
                  團購訂單已建立！
                </h3>
                <p className="text-green-600 mt-1">
                  分享以下連結或 QR Code 給朋友們開始點餐
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  掃描 QR Code 點餐
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <QRCodeSVG value={orderUrl} size={200} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  點餐連結
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                  >
                    📋 複製
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleGoToManage}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  📊 前往訂單管理頁面
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
