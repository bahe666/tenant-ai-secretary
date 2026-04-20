import { test, expect } from "@playwright/test";

test("账号切换：登录赵总监 → 退出 → 登录张工", async ({ page }) => {
  // 1. 登录赵总监
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "zhao@acme.com");
  await page.fill('input[type="password"]', "demo123456");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/console", { timeout: 20000 });
  // 确认是赵总监
  await expect(page.getByText("赵总监")).toBeVisible({ timeout: 10000 });
  // 应能看到管理端
  await expect(page.getByRole("link", { name: "功能配置" })).toBeVisible();

  // 2. 直接导航到登录页（模拟切换账号）
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  // 等待旧 session 清除
  await page.waitForTimeout(1000);

  // 3. 登录张工
  await page.fill('input[type="email"]', "zhang@acme.com");
  await page.fill('input[type="password"]', "demo123456");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/console", { timeout: 20000 });
  // 确认是张工
  await expect(page.getByText("张工")).toBeVisible({ timeout: 10000 });
  // 不应看到管理端
  await expect(page.getByRole("link", { name: "功能配置" })).not.toBeVisible();
});

test("页面导航不卡顿（< 5s）", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "zhao@acme.com");
  await page.fill('input[type="password"]', "demo123456");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/console", { timeout: 20000 });

  // 测试各页面导航速度
  const pages = [
    { link: "巡检提醒", heading: "巡检提醒" },
    { link: "成本报告", heading: "成本报告" },
    { link: "续租管理", heading: "续租管理" },
    { link: "控制台首页", heading: "控制台" },
  ];

  for (const p of pages) {
    const start = Date.now();
    await page.getByRole("link", { name: p.link }).click();
    await expect(page.getByRole("heading", { name: p.heading })).toBeVisible({ timeout: 5000 });
    const elapsed = Date.now() - start;
    console.log(`  ${p.link}: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(5000);
  }
});
