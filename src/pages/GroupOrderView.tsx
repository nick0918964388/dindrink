import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getGroupOrderById, updateGroupOrderStatus, deleteOrderItem } from '../utils/api';
import { GroupOrder, Menu, MenuItem, OrderItemDetail } from '../types';

interface ItemSummary {
  menuItemName: string;
  price: number;
  quantity: number;
  details: Array<{
    userName: string;
    iceLevel: string;
    sugarLevel: string;
    itemQuantity: number;
  }>;
}

export default function GroupOrderView() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    loadGroupOrder();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadGroupOrder, 2000);

    return () => clearInterval(interval);
  }, [orderId, navigate]);

  const loadGroupOrder = async () => {
    if (!orderId) return;
    
    const data = await getGroupOrderById(orderId);
    if (!data) {
      if (!loading) {
        alert('找不到該訂單');
        navigate('/');
      }
      return;
    }

    setGroupOrder(data);
    if (data.menu) {
      setMenu(data.menu.items);
    }
    setLoading(false);
  };

  const handleToggleLock = async () => {
    if (!groupOrder || !orderId) return;
    
    const newStatus = groupOrder.status === 'open' ? 'locked' : 'open';
    const confirmMsg = newStatus === 'locked' 
      ? '確定要鎖定訂單嗎？鎖定後其他人將無法再點餐。'
      : '確定要解除鎖定嗎？解除後其他人可以繼續點餐。';
    
    if (confirm(confirmMsg)) {
      await updateGroupOrderStatus(orderId, newStatus);
      loadGroupOrder();
    }
  };

  const handleDeleteOrderItem = async (orderItemId: string, userName: string) => {
    if (confirm(`確定要刪除 ${userName} 的點餐嗎？`)) {
      await deleteOrderItem(orderItemId);
      loadGroupOrder();
    }
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

  if (!groupOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">找不到訂單</p>
        </div>
      </div>
    );
  }

  // Calculate item summary
  const itemSummary: { [key: string]: ItemSummary } = {};

  const orderItems = groupOrder.orderItems || [];

  orderItems.forEach((orderItem) => {
    orderItem.items.forEach((item) => {
      const qty = item.quantity || 1;
      if (!itemSummary[item.menuItemId]) {
        itemSummary[item.menuItemId] = {
          menuItemName: item.menuItemName,
          price: item.price,
          quantity: 0,
          details: [],
        };
      }

      itemSummary[item.menuItemId].quantity += qty;
      itemSummary[item.menuItemId].details.push({
        userName: orderItem.userName,
        iceLevel: item.iceLevel,
        sugarLevel: item.sugarLevel,
        itemQuantity: qty,
      });
    });
  });

  const summaryArray = Object.values(itemSummary);
  const totalItems = summaryArray.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = summaryArray.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderUrl = `${window.location.origin}/order/${orderId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('連結已複製！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 標題區 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 訂單管理
              </h1>
              <p className="text-gray-600">{groupOrder.restaurantName}</p>
              <p className="text-sm text-gray-500 mt-1">
                開團者：{groupOrder.createdBy}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                groupOrder.status === 'locked'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {groupOrder.status === 'locked' ? '🔒 已鎖定' : '🟢 開放中'}
              </span>
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                ← 返回首頁
              </button>
            </div>
          </div>

          {/* 統計數據 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-700 mb-1">點餐人數</p>
              <p className="text-3xl font-bold text-indigo-900">
                {orderItems.length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">飲料總數</p>
              <p className="text-3xl font-bold text-green-900">{totalItems}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">總金額</p>
              <p className="text-3xl font-bold text-purple-900">
                NT$ {totalPrice}
              </p>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                {showQR ? '隱藏' : '顯示'} QR Code
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                📋 複製點餐連結
              </button>
              <button
                onClick={handleToggleLock}
                className={`font-semibold py-3 px-6 rounded-lg transition duration-200 ${
                  groupOrder.status === 'locked'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {groupOrder.status === 'locked' ? '🔓 解除鎖定' : '🔒 鎖定訂單'}
              </button>
            </div>

            {showQR && (
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
                  <QRCodeSVG value={orderUrl} size={200} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 菜單品項區塊 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🍹 菜單品項
          </h2>
          {menu.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>無品項資料</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 text-center"
                >
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-indigo-600 font-semibold">NT$ {item.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 品項彙總 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📝 品項彙總
            </h2>

            {summaryArray.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>尚無訂單</p>
                <p className="text-sm mt-2">分享連結讓大家開始點餐</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaryArray.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {item.menuItemName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          NT$ {item.price} × {item.quantity} = NT${' '}
                          {item.price * item.quantity}
                        </p>
                      </div>
                      <div className="bg-indigo-100 text-indigo-800 font-bold py-2 px-4 rounded-lg">
                        {item.quantity} 杯
                      </div>
                    </div>

                    <div className="space-y-2">
                      {item.details.map((detail, detailIndex) => (
                        <div
                          key={detailIndex}
                          className="text-sm bg-gray-50 rounded p-2 flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-700">
                            {detail.userName} {detail.itemQuantity > 1 && `×${detail.itemQuantity}`}
                          </span>
                          <span className="text-gray-600">
                            {detail.iceLevel} / {detail.sugarLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 所有訂單 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              👥 所有訂單
            </h2>

            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>尚無訂單</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems
                  .slice()
                  .reverse()
                  .map((orderItem) => {
                    const orderTotal = orderItem.items.reduce(
                      (sum, item) => sum + item.price * (item.quantity || 1),
                      0
                    );

                    return (
                      <div
                        key={orderItem.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {orderItem.userName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 font-bold">
                              NT$ {orderTotal}
                            </span>
                            <button
                              onClick={() => handleDeleteOrderItem(orderItem.id, orderItem.userName)}
                              className="text-red-500 hover:text-red-700 text-sm"
                              title="刪除此訂單"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {orderItem.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="text-sm bg-gray-50 rounded p-2"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {item.menuItemName}
                                    {(item.quantity || 1) > 1 && (
                                      <span className="text-indigo-600 ml-1">
                                        ×{item.quantity}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-gray-600">
                                    {item.iceLevel} / {item.sugarLevel}
                                  </p>
                                </div>
                                <span className="text-gray-700 font-medium ml-2">
                                  NT$ {item.price * (item.quantity || 1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          {new Date(orderItem.createdAt).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
