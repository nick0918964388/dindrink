import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getSessionById, getMenuById } from '../utils/api';
import { OrderSession, MenuItem } from '../types';

interface ItemSummary {
  menuItemName: string;
  price: number;
  quantity: number;
  details: Array<{
    customerName: string;
    iceLevel: string;
    sugarLevel: string;
  }>;
}

export default function Organizer() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<OrderSession | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const loadSession = async () => {
      const foundSession = await getSessionById(sessionId);
      console.log('Organizer 載入 session:', { sessionId, foundSession });

      if (!foundSession) {
        alert('找不到該訂單');
        navigate('/');
        return;
      }

      if (!foundSession.orders) {
        foundSession.orders = [];
      }

      setSession(foundSession);

      const foundMenu = await getMenuById(foundSession.menuId);
      if (foundMenu) {
        setMenu(foundMenu.items);
      }
    };

    loadSession();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadSession, 2000);

    return () => clearInterval(interval);
  }, [sessionId, navigate]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // Calculate item summary
  const itemSummary: { [key: string]: ItemSummary } = {};

  const orders = session.orders || [];
  console.log('處理訂單數量:', orders.length);

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!itemSummary[item.menuItemId]) {
        itemSummary[item.menuItemId] = {
          menuItemName: item.menuItemName,
          price: item.price,
          quantity: 0,
          details: [],
        };
      }

      itemSummary[item.menuItemId].quantity += 1;
      itemSummary[item.menuItemId].details.push({
        customerName: order.customerName,
        iceLevel: item.iceLevel,
        sugarLevel: item.sugarLevel,
      });
    });
  });

  const summaryArray = Object.values(itemSummary);
  const totalItems = summaryArray.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = summaryArray.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderUrl = `${window.location.origin}/order/${sessionId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('連結已複製！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                訂單管理
              </h1>
              <p className="text-gray-600">{session.menuName}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← 返回首頁
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-700 mb-1">訂單數</p>
              <p className="text-3xl font-bold text-indigo-900">
                {orders.length}
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                {showQR ? '隱藏' : '顯示'} QR Code
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                複製點餐連結
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
            菜單品項
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              品項彙總
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
                            {detail.customerName}
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

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              所有訂單
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>尚無訂單</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .slice()
                  .reverse()
                  .map((order) => {
                    const orderTotal = order.items.reduce(
                      (sum, item) => sum + item.price,
                      0
                    );

                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {order.customerName}
                          </h3>
                          <span className="text-indigo-600 font-bold">
                            NT$ {orderTotal}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="text-sm bg-gray-50 rounded p-2"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {item.menuItemName}
                                  </p>
                                  <p className="text-gray-600">
                                    {item.iceLevel} / {item.sugarLevel}
                                  </p>
                                </div>
                                <span className="text-gray-700 font-medium ml-2">
                                  NT$ {item.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString('zh-TW')}
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
