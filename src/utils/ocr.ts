import { createWorker } from 'tesseract.js';
import { MenuItem } from '../types';

export const processMenuImage = async (imageFile: File): Promise<MenuItem[]> => {
  const worker = await createWorker('chi_tra+eng');

  try {
    const { data: { text } } = await worker.recognize(imageFile);

    // Parse the OCR text to extract menu items and prices
    const items = parseMenuText(text);

    await worker.terminate();
    return items;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
};

const parseMenuText = (text: string): MenuItem[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const items: MenuItem[] = [];

  // Pattern to match price (e.g., $50, 50元, NT$50)
  const pricePattern = /(?:\$|NT\$|元)?\s*(\d+)\s*(?:元)?/;

  lines.forEach(line => {
    const priceMatch = line.match(pricePattern);

    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      // Remove the price from the line to get the item name
      let name = line.replace(priceMatch[0], '').trim();

      // Clean up the name
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
