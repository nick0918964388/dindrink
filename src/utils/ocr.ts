import { MenuItem } from '../types';

// Ollama API 設定（可透過環境變數覆蓋）
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://192.168.1.161:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3-vl:32b';

export const processMenuImage = async (imageFile: File): Promise<MenuItem[]> => {
  try {
    // 將圖片轉為 base64
    const base64Image = await fileToBase64(imageFile);
    
    // 呼叫 Ollama VLM API
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `請辨識這張飲料菜單圖片，提取所有飲料品項和價格。
請以 JSON 格式回傳，格式如下：
[{"name": "品項名稱", "price": 數字價格}, ...]

注意：
- 只提取飲料品項，不要包含其他文字
- 價格必須是數字（不含貨幣符號）
- 如果有大杯/中杯等規格，請分開列出
- 只回傳 JSON 陣列，不要有其他文字`,
        images: [base64Image],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    const items = parseOllamaResponse(data.response);
    
    return items;
  } catch (error) {
    console.error('OCR 處理失敗:', error);
    throw error;
  }
};

// 將 File 轉為 base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 移除 data:image/xxx;base64, 前綴
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 解析 Ollama 回應
const parseOllamaResponse = (response: string): MenuItem[] => {
  try {
    // 嘗試從回應中提取 JSON
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('無法從回應中提取 JSON:', response);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // 轉換為 MenuItem 格式
    return parsed.map((item: { name: string; price: number }) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name?.trim() || '',
      price: typeof item.price === 'number' ? item.price : parseInt(item.price, 10) || 0,
    })).filter((item: MenuItem) => item.name && item.price > 0);
  } catch (error) {
    console.error('解析 Ollama 回應失敗:', error, response);
    return [];
  }
};
