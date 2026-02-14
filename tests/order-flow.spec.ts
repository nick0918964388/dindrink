import { test, expect } from '@playwright/test';

test.describe('團購飲料系統測試', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
  });

  test('完整訂單流程測試 - 驗證訂單管理頁面顯示', async ({ page, context }) => {
    // 步驟 1: 建立菜單
    await page.goto('http://localhost:5173/menu/new');
    await page.fill('input[placeholder*="清心福全"]', '測試飲料店');

    // 新增第一個品項
    await page.click('text=新增品項');
    await page.locator('input[placeholder="品項名稱"]').first().fill('珍珠奶茶');
    await page.locator('input[placeholder="價格"]').first().fill('50');

    // 新增第二個品項
    await page.click('text=新增品項');
    await page.locator('input[placeholder="品項名稱"]').last().fill('綠茶');
    await page.locator('input[placeholder="價格"]').last().fill('30');

    // 儲存菜單
    await page.click('text=儲存菜單');
    await page.waitForURL('http://localhost:5173/');

    // 步驟 2: 建立訂單 Session
    await page.click('text=使用');
    await page.waitForURL(/session/);

    // 等待「建立訂單連結」按鈕出現並點擊
    const createButton = page.locator('button:has-text("建立訂單連結")');
    await createButton.waitFor({ state: 'visible' });
    await createButton.click();

    // 等待並獲取訂單連結
    const orderLinkInput = page.locator('input[readonly]').first();
    await orderLinkInput.waitFor({ state: 'visible', timeout: 10000 });
    const orderUrl = await orderLinkInput.inputValue();
    console.log('訂單連結:', orderUrl);

    // 前往管理頁面
    await page.click('text=前往管理頁面');
    await page.waitForURL(/organizer/);
    const organizerUrl = page.url();
    console.log('管理頁面:', organizerUrl);

    // 驗證初始狀態 - 應該顯示 0 筆訂單
    await expect(page.locator('text=訂單數').locator('..').locator('text=0')).toBeVisible();
    await expect(page.locator('text=尚無訂單').first()).toBeVisible();

    // 步驟 3: 開新分頁模擬客戶點餐
    const customerPage = await context.newPage();
    await customerPage.goto(orderUrl);

    // 先加入飲料
    await customerPage.locator('text=加入').first().click(); // 珍珠奶茶

    // 填寫姓名（加入飲料後才會顯示）
    await customerPage.fill('input[placeholder*="姓名"]', '測試客戶A');

    // 修改冰量和糖度
    await customerPage.selectOption('select', { index: 0 }); // 選擇冰量

    // 送出訂單
    await customerPage.click('text=送出訂單');
    await expect(customerPage.locator('text=訂單已送出')).toBeVisible({ timeout: 5000 });

    console.log('客戶 A 已送出訂單');

    // 步驟 4: 第二個客戶點餐
    const customerPage2 = await context.newPage();
    await customerPage2.goto(orderUrl);
    await customerPage2.locator('text=加入').last().click(); // 綠茶
    await customerPage2.fill('input[placeholder*="姓名"]', '測試客戶B');
    await customerPage2.click('text=送出訂單');
    await expect(customerPage2.locator('text=訂單已送出')).toBeVisible({ timeout: 5000 });

    console.log('客戶 B 已送出訂單');

    // 步驟 5: 回到管理頁面驗證
    await page.bringToFront();

    // 等待輪詢更新 (最多 3 秒)
    await page.waitForTimeout(3000);

    // 驗證訂單數量
    await expect(page.locator('text=訂單數').locator('..').locator('text=2')).toBeVisible({ timeout: 5000 });

    // 驗證飲料總數
    await expect(page.locator('text=飲料總數').locator('..').locator('text=2')).toBeVisible();

    // 驗證總金額 (50 + 30 = 80)
    await expect(page.locator('text=總金額').locator('..').locator('text=80')).toBeVisible();

    // 驗證品項彙總
    await expect(page.locator('text=珍珠奶茶').first()).toBeVisible();
    await expect(page.locator('text=綠茶').first()).toBeVisible();

    // 驗證客戶名稱顯示
    await expect(page.locator('text=測試客戶A').first()).toBeVisible();
    await expect(page.locator('text=測試客戶B').first()).toBeVisible();

    console.log('✅ 訂單管理頁面正確顯示所有訂單');

    // 關閉其他分頁
    await customerPage.close();
    await customerPage2.close();
  });

  test('OCR 待選清單功能測試', async ({ page }) => {
    await page.goto('http://localhost:5173/menu/new');
    await page.fill('input[placeholder*="清心福全"]', 'OCR 測試店');

    // 注意：這裡只能測試 UI 流程，無法真正測試 OCR
    // 我們會檢查 UI 元素是否存在

    // 檢查上傳按鈕存在
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // 手動新增一些品項來模擬 OCR 結果
    await page.click('text=新增品項');
    await page.locator('input[placeholder="品項名稱"]').fill('測試品項');
    await page.locator('input[placeholder="價格"]').fill('40');

    // 儲存菜單
    await page.click('text=儲存菜單');
    await page.waitForURL('http://localhost:5173/');

    console.log('✅ OCR UI 功能正常（實際 OCR 需要圖片測試）');
  });
});
