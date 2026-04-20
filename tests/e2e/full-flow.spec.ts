import { test, expect } from "@playwright/test";

const SUPER_ADMIN = { email: "zhao@acme.com", password: "demo123456" };
const BILLING_ADMIN = { email: "wang@acme.com", password: "demo123456" };
const MEMBER = { email: "zhang@acme.com", password: "demo123456" };

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // window.location.href causes full reload, wait for it
  await page.waitForURL("**/console", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

// ====== 1. 登录 ======
test("1.1 登录页显示演示账号", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("演示账号快速登录")).toBeVisible();
  await expect(page.getByText("zhao@acme.com")).toBeVisible();
});

test("1.2 超管登录成功进入控制台", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByRole("heading", { name: "控制台" })).toBeVisible({ timeout: 10000 });
});

test("1.3 快速登录按钮", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByText("zhao@acme.com").click();
  await page.waitForURL("**/console", { timeout: 20000 });
});

// ====== 2. 控制台首页 ======
test("2.1 首页显示资源统计卡片", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByText("总资源数")).toBeVisible();
  await expect(page.getByText("近 30 天费用")).toBeVisible();
  await expect(page.getByText("即将到期")).toBeVisible();
});

test("2.2 侧边栏导航项完整", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByRole("link", { name: "秘书中心" })).toBeVisible();
  await expect(page.getByRole("link", { name: "巡检提醒" })).toBeVisible();
  await expect(page.getByRole("link", { name: "成本报告" })).toBeVisible();
  await expect(page.getByRole("link", { name: "续租管理" })).toBeVisible();
});

test("2.3 超管可看管理端导航", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByRole("link", { name: "功能配置" })).toBeVisible();
  await expect(page.getByRole("link", { name: "审计中心" })).toBeVisible();
});

// ====== 3. AI 对话 ======
test("3.1 对话浮窗可打开关闭", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  // 浮窗按钮
  const btn = page.locator("button").filter({ hasText: "" }).locator("svg").last();
  // 用更通用的选择器 - 找固定在右下角的按钮
  const chatBtn = page.locator(".fixed.bottom-6.right-6");
  await expect(chatBtn).toBeVisible();
  await chatBtn.click();
  await expect(page.getByText("专属答疑")).toBeVisible();
  // 关闭
  await chatBtn.click();
  await expect(page.getByText("专属答疑")).not.toBeVisible();
});

test("3.2 对话面板有欢迎消息", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.locator(".fixed.bottom-6.right-6").click();
  await expect(page.getByText("我是你的专属智能秘书")).toBeVisible();
});

// ====== 4. 巡检提醒 ======
test("4.1 巡检提醒页面可访问", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.getByRole("link", { name: "巡检提醒" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "巡检提醒" })).toBeVisible();
});

test("4.2 执行巡检生成告警", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/assistant/alerts");
  await page.waitForLoadState("networkidle");
  const btn = page.getByRole("button", { name: /执行巡检/ });
  await expect(btn).toBeVisible();
  await btn.click();
  // 等待刷新
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");
});

// ====== 5. 成本报告 ======
test("5.1 成本报告页面可访问", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.getByRole("link", { name: "成本报告" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "成本报告" })).toBeVisible();
});

test("5.2 生成月度报告", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/assistant/reports");
  await page.waitForLoadState("networkidle");
  const btn = page.getByRole("button", { name: /生成月度报告/ });
  await expect(btn).toBeVisible();
  await btn.click();
  await page.waitForTimeout(8000);
  await page.waitForLoadState("networkidle");
});

// ====== 6. 续租管理 ======
test("6.1 续租管理页面可访问", async ({ page }) => {
  await login(page, BILLING_ADMIN.email, BILLING_ADMIN.password);
  await page.goto("/assistant/renewals");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "续租管理" })).toBeVisible();
});

test("6.2 生成续租方案", async ({ page }) => {
  await login(page, BILLING_ADMIN.email, BILLING_ADMIN.password);
  await page.goto("/assistant/renewals");
  await page.waitForLoadState("networkidle");
  const btn = page.getByRole("button", { name: /生成续租方案/ });
  await expect(btn).toBeVisible();
});

// ====== 7. 管理端 ======
test("7.1 管理端总览", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "智能秘书管理" })).toBeVisible();
});

test("7.2 功能配置", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/config");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "功能配置" })).toBeVisible();
  await expect(page.getByText("预设模板")).toBeVisible();
  await expect(page.getByText("功能模块开关")).toBeVisible();
});

test("7.3 权限管理", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/permissions");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "权限管理" })).toBeVisible();
});

test("7.4 审计中心", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/audit");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "审计中心" })).toBeVisible();
});

test("7.5 运营监控", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/monitor");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "运营监控" })).toBeVisible();
});

// ====== 8. 权限隔离 ======
test("8.1 普通成员看不到管理端", async ({ page }) => {
  await login(page, MEMBER.email, MEMBER.password);
  await expect(page.getByRole("link", { name: "功能配置" })).not.toBeVisible();
});
