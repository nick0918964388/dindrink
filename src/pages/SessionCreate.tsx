import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { getMenuById, saveSession } from '../utils/api';
import { OrderSession, Menu } from '../types';

export default function SessionCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuId = searchParams.get('menuId');

  const [menu, setMenu] = useState<Menu | null>(null);
  const [sessionId] = useState(uuidv4());
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      if (!menuId) {
        navigate('/');
        return;
      }

      const foundMenu = await getMenuById(menuId);
      if (!foundMenu) {
        alert('找不到該菜單');
        navigate('/');
        return;
      }

      setMenu(foundMenu);
      setLoading(false);
    };

    loadMenu();
  }, [menuId, navigate]);

  const handleCreateSession = async () => {
    if (!menu) return;

    const session: OrderSession = {
      id: sessionId,
      menuId: menu.id,
      menuName: menu.name,
      orders: [],
      createdAt: new Date().toISOString()
    };

    console.log('建立新 session:', session);
    await saveSession(session);
    setShowQR(true);
  };

  const orderUrl = `${window.location.origin}/order/${sessionId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('連結已複製！');
  };

  const handleGoToOrganizer = () => {
    navigate(`/organizer/${sessionId}`);
  };

  if (loading || !menu) {
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
            <h1 className="text-3xl font-bold text-gray-800">建立訂單</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← 返回
            </button>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">
              {menu.name}
            </h2>
            <p className="text-sm text-indigo-700">
              {menu.items.length} 項商品
            </p>
          </div>

          {!showQR ? (
            <div>
              <p className="text-gray-600 mb-6">
                點擊下方按鈕建立訂單連結，分享給其他人開始點餐
              </p>
              <button
                onClick={handleCreateSession}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                建立訂單連結
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                  >
                    複製
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleGoToOrganizer}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  前往管理頁面
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
