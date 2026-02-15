import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { saveRestaurant } from '../utils/api';
import { processMenuImage } from '../utils/ocr';
import { MenuItem } from '../types';

// 預設分類選項
const CATEGORY_OPTIONS = ['奶茶類', '紅茶類', '綠茶類', '烏龍茶類', '鮮奶茶類', '特調類', '其他'];

export default function RestaurantCreate() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [scannedItems, setScannedItems] = useState<MenuItem[]>([]);
  const [selectedScannedIds, setSelectedScannedIds] = useState<Set<string>>(new Set());

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      const extractedItems = await processMenuImage(file);
      if (extractedItems.length === 0) {
        setError('無法識別菜單項目，請手動新增');
      } else {
        setScannedItems(extractedItems);
        setSelectedScannedIds(new Set());
      }
    } catch (err) {
      setError('圖片處理失敗，請手動新增項目');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleScannedItem = (id: string) => {
    setSelectedScannedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSelectedScannedItems = () => {
    const selectedItems = scannedItems.filter(item => selectedScannedIds.has(item.id));
    setItems([...items, ...selectedItems]);
    setScannedItems([]);
    setSelectedScannedIds(new Set());
  };

  const handleCancelScannedSelection = () => {
    setScannedItems([]);
    setSelectedScannedIds(new Set());
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        name: '',
        price: 0
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: 'name' | 'price' | 'category', value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      alert('請輸入餐廳名稱');
      return;
    }

    if (items.length === 0) {
      alert('請至少新增一個品項');
      return;
    }

    const validItems = items.filter(item => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      alert('請確保所有品項都有名稱和價格');
      return;
    }

    const restaurantId = uuidv4();
    const menuId = uuidv4();
    const now = new Date().toISOString();

    await saveRestaurant(
      {
        id: restaurantId,
        name: restaurantName,
        createdAt: now
      },
      {
        id: menuId,
        items: validItems,
        createdAt: now
      }
    );
    
    navigate('/restaurants');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">新增餐廳</h1>
            <button
              onClick={() => navigate('/restaurants')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← 返回
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              餐廳名稱
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="例如：清心福全 市政店"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上傳菜單圖片（OCR 自動識別）
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isProcessing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {isProcessing && (
              <p className="text-sm text-indigo-600 mt-2">🔄 處理中... 這可能需要幾秒鐘</p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>
        </div>

        {scannedItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📸 掃描識別結果 - 請勾選要加入的品項</h2>
              <button
                onClick={handleCancelScannedSelection}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                取消
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {scannedItems.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedScannedIds.has(item.id)}
                    onChange={() => handleToggleScannedItem(item.id)}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-indigo-600 font-semibold">NT$ {item.price}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedScannedIds(new Set(scannedItems.map(i => i.id)))}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                全選
              </button>
              <button
                onClick={handleAddSelectedScannedItems}
                disabled={selectedScannedIds.size === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                加入已選品項 ({selectedScannedIds.size})
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">🍹 品項列表</h2>
            <button
              onClick={handleAddItem}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
            >
              + 手動新增品項
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>尚未新增任何品項</p>
              <p className="text-sm mt-2">上傳圖片或手動新增品項</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center flex-wrap">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    placeholder="品項名稱"
                    className="flex-1 min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={item.category || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="">分類</option>
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.price || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                    placeholder="價格"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              💾 儲存餐廳與菜單
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
