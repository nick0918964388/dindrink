import { createWorker } from 'tesseract.js';
import { MenuItem } from '../types';

// 後端 OCR API（使用 Ollama VLM）
const API_BASE = '/api';

// Ollama 設定
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'https://jollama.nickai.cc';

export const processMenuImage = async (imageFile: File): Promise<MenuItem[]> => {
  try {
    // 優先使用 Ollama VLM
    console.log('嘗試使用 Ollama VLM...');
    return await processWithOllama(imageFile);
  } catch (error) {
    console.warn('Ollama VLM 失敗，改用 Tesseract OCR:', error);
    // Fallback 到 Tesseract.js
    return await processWithTesseract(imageFile);
  }
};

// Ollama VLM 處理
const processWithOllama = async (imageFile: File): Promise<MenuItem[]> => {
  const base64Image = await fileToBase64(imageFile);
  
  // 透過後端 proxy 呼叫
  const response = await fetch(`${API_BASE}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    throw new Error(`OCR API 錯誤: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  
  return parseOllamaResponse(data.response);
};

// Tesseract.js 處理（Fallback）
const processWithTesseract = async (imageFile: File): Promise<MenuItem[]> => {
  const worker = await createWorker('chi_tra+eng');

  try {
    const { data: { text } } = await worker.recognize(imageFile);
    const items = parseMenuText(text);
    await worker.terminate();
    return items;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
};

// 將 File 轉為 base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 解析 Ollama 回應
const parseOllamaResponse = (response: string): MenuItem[] => {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('無法從回應中提取 JSON:', response);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
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

// 解析 Tesseract 文字
const parseMenuText = (text: string): MenuItem[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const items: MenuItem[] = [];
  const pricePattern = /(?:\$|NT\$|元)?\s*(\d+)\s*(?:元)?/;

  lines.forEach(line => {
    const priceMatch = line.match(pricePattern);
    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      let name = line.replace(priceMatch[0], '').trim();
      name = name.replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim();

      if (name && price) {
        items.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          price
        });
      }
    }
  });

  return items;
};
