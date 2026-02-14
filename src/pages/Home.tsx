import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenus, deleteMenu } from '../utils/api';
import { Menu } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (err) {
      console.error('Failed to load menus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = () => {
    navigate('/menu/new');
  };

  const handleUseMenu = (menuId: string) => {
    navigate(`/session/new?menuId=${menuId}`);
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (confirm('確定要刪除此菜單嗎？')) {
      await deleteMenu(menuId);
      loadMenus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">團購點飲料</h1>
          <p className="text-gray-600">輕鬆管理團購訂單</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={handleCreateMenu}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            + 建立新菜單
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">歷史菜單</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>載入中...</p>
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>還沒有任何菜單</p>
              <p className="text-sm mt-2">點擊上方按鈕建立第一個菜單</p>
            </div>
          ) : (
            <div className="space-y-3">
              {menus.map(menu => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition duration-200"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{menu.name}</h3>
                    <p className="text-sm text-gray-500">
                      {menu.items.length} 項商品
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseMenu(menu.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                      使用
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
