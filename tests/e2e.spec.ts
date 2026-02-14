import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// 使用 serial 模式讓測試按順序執行
test.describe.serial('飲料團購 App E2E 測試', () => {
  
  test('1. 首頁載入', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('團購點飲料')).toBeVisible();
    await expect(page.getByText('建立新菜單')).toBeVisible();
  });

  test('2. 建立菜單流程', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 點擊建立新菜單
    await page.click('text=建立新菜單');
    await expect(page).toHaveURL(/\/menu\/new/);
    
    // 填寫菜單名稱
    await page.fill('input[placeholder*="清心福全"]', 'E2E測試店');
    
    // 新增品項
    await page.click('text=新增品項');
    await page.fill('input[placeholder="品項名稱"]', '珍珠奶茶');
    await page.fill('input[placeholder="價格"]', '50');
    
    // 再新增一個品項
    await page.click('text=新增品項');
    const nameInputs = page.locator('input[placeholder="品項名稱"]');
    await nameInputs.nth(1).fill('綠茶');
    const priceInputs = page.locator('input[placeholder="價格"]');
    await priceInputs.nth(1).fill('30');
    
    // 儲存菜單
    await page.click('text=儲存菜單');
    
    // 應該回到首頁並看到新菜單
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByText('E2E測試店')).toBeVisible();
  });

  test('3. 建立訂單連結', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('E2E測試店')).toBeVisible();
    
    // 點擊使用按鈕
    await page.locator('button:has-text("使用")').first().click();
    await expect(page).toHaveURL(/\/session\/new/);
    
    // 建立訂單連結
    await page.locator('button:has-text("建立訂單連結")').click();
    
    // 等待 QR Code 區塊出現
    await expect(page.getByText('掃描 QR Code 點餐')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('前往管理頁面')).toBeVisible();
  });

  test('4. 完整點餐流程', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('E2E測試店')).toBeVisible();
    
    // 點擊使用按鈕
    await page.locator('button:has-text("使用")').first().click();
    
    // 建立訂單連結
    await page.locator('button:has-text("建立訂單連結")').click();
    
    // 等待 QR Code 和連結出現
    await expect(page.getByText('掃描 QR Code 點餐')).toBeVisible({ timeout: 10000 });
    
    // 取得訂單連結
    const orderInput = page.locator('input[readonly]');
    await expect(orderInput).toBeVisible();
    const orderUrl = await orderInput.inputValue();
    expect(orderUrl).toContain('/order/');
    
    // 開新分頁模擬客戶點餐
    const customerPage = await context.newPage();
    await customerPage.goto(orderUrl);
    
    // 確認菜單顯示
    await expect(customerPage.getByText('E2E測試店')).toBeVisible();
    await expect(customerPage.getByText('珍珠奶茶')).toBeVisible();
    
    // 加入購物車
    await customerPage.locator('button:has-text("加入")').first().click();
    
    // 填寫姓名
    await customerPage.fill('input[placeholder*="姓名"]', 'E2E客戶');
    
    // 送出訂單
    await customerPage.click('text=送出訂單');
    
    // 確認訂單送出成功
    await expect(customerPage.getByText('訂單已送出')).toBeVisible();
    await expect(customerPage.getByText('E2E客戶')).toBeVisible();
    
    await customerPage.close();
  });

  test('5. 管理頁面顯示訂單', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('E2E測試店')).toBeVisible();
    
    // 點擊使用按鈕
    await page.locator('button:has-text("使用")').first().click();
    
    // 建立訂單連結
    await page.locator('button:has-text("建立訂單連結")').click();
    await expect(page.getByText('掃描 QR Code 點餐')).toBeVisible({ timeout: 10000 });
    
    // 前往管理頁面
    await page.click('text=前往管理頁面');
    
    // 確認管理頁面載入
    await expect(page.getByText('訂單管理')).toBeVisible();
    await expect(page.getByText('菜單品項')).toBeVisible();
    await expect(page.getByText('珍珠奶茶')).toBeVisible();
  });

  test('6. 清理測試資料', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('E2E測試店')).toBeVisible();
    
    // 刪除測試菜單
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("刪除")').first().click();
    
    // 等待頁面刷新
    await page.waitForTimeout(1000);
    await page.reload();
    
    // 確認已刪除（或顯示「還沒有任何菜單」）
    await expect(page.getByText('還沒有任何菜單')).toBeVisible({ timeout: 5000 });
  });
});
