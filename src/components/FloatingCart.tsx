import { useState } from 'react';
import { OrderItemDetail } from '../types';

type FloatingCartProps = {
  cart: OrderItemDetail[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: 'temperature' | 'sugarLevel' | 'quantity', value: string | number) => void;
  temperatureOptions: string[];
  sugarLevels: string[];
};

export default function FloatingCart({
  cart,
  onRemove,
  onUpdate,
  temperatureOptions,
  sugarLevels
}: FloatingCartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) return null;

  return (
    <>
      {/* 浮動按鈕 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed right-4 bottom-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50"
        aria-label="查看購物車"
      >
        <div className="relative">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      {/* 展開的購物車面板 */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsExpanded(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">🛒 我的訂單</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">{totalItems} 杯飲料</span>
                <span className="text-indigo-600 font-semibold">NT$ {totalPrice}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {item.menuItemName}
                      </h4>
                      <p className="text-indigo-600 font-medium text-sm">
                        NT$ {item.price} × {item.quantity} = NT$ {item.price * item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      移除
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        數量
                      </label>
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdate(index, 'quantity', parseInt(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                          onUpdate(index, 'temperature', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {temperatureOptions.map((level) => (
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
                          onUpdate(index, 'sugarLevel', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {sugarLevels.map((level) => (
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

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-800">總計</span>
                <span className="text-2xl font-bold text-indigo-600">
                  NT$ {totalPrice}
                </span>
              </div>
              <p className="text-sm text-gray-500 text-center">
                向下滾動到訂單區填寫姓名並送出
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
