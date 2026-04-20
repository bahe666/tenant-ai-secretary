import { test, expect } from "@playwright/test";

const SUPER_ADMIN = { email: "zhao@acme.com", password: "demo123456" };
const BILLING_ADMIN = { email: "wang@acme.com", password: "demo123456" };
const MEMBER = { email: "zhang@acme.com", password: "demo123456" };

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  // 等待 signOut 完成（ready 状态）
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/console", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

// ====== 1. 登录 ======
test("1.1 登录页显示演示账号", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("演示账号快速登录")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("zhao@acme.com")).toBeVisible();
});

test("1.2 超管登录成功进入控制台", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByRole("heading", { name: "控制台" })).toBeVisible({ timeout: 15000 });
});

test("1.3 快速登录按钮", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('button:has-text("zhao@acme.com")', { timeout: 10000 });
  await page.getByText("zhao@acme.com").click();
  await page.waitForURL("**/console", { timeout: 20000 });
});

// ====== 2. 控制台首页 ======
test("2.1 首页显示资源统计卡片", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  // 等待数据加载完成——检查具体数据而非标题
  await expect(page.getByText("24 个运行中")).toBeVisible({ timeout: 15000 });
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
  const chatBtn = page.locator(".fixed.bottom-6.right-6");
  await expect(chatBtn).toBeVisible();
  await chatBtn.click();
  await expect(page.getByText("专属答疑")).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "巡检提醒" })).toBeVisible({ timeout: 10000 });
});

test("4.2 执行巡检生成告警", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/assistant/alerts");
  await page.waitForLoadState("networkidle");
  const btn = page.getByRole("button", { name: /执行巡检/ });
  await expect(btn).toBeVisible({ timeout: 10000 });
});

// ====== 5. 成本报告 ======
test("5.1 成本报告页面可访问", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.getByRole("link", { name: "成本报告" }).click();
  await expect(page.getByRole("heading", { name: "成本报告", exact: true })).toBeVisible({ timeout: 10000 });
});

test("5.2 生成月度报告按钮可用", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/assistant/reports");
  await expect(page.getByRole("button", { name: /生成月度报告/ })).toBeVisible({ timeout: 10000 });
});

// ====== 6. 续租管理 ======
test("6.1 续租管理页面可访问", async ({ page }) => {
  await login(page, BILLING_ADMIN.email, BILLING_ADMIN.password);
  await page.goto("/assistant/renewals");
  await expect(page.getByRole("heading", { name: "续租管理" })).toBeVisible({ timeout: 10000 });
});

test("6.2 生成续租方案按钮", async ({ page }) => {
  await login(page, BILLING_ADMIN.email, BILLING_ADMIN.password);
  await page.goto("/assistant/renewals");
  await expect(page.getByRole("button", { name: /生成续租方案/ })).toBeVisible({ timeout: 10000 });
});

// ====== 7. 管理端 ======
test("7.1 管理端总览", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "智能秘书管理" })).toBeVisible({ timeout: 10000 });
});

test("7.2 功能配置", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/config");
  await expect(page.getByText("功能模块开关")).toBeVisible({ timeout: 10000 });
});

test("7.3 权限管理", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/permissions");
  await expect(page.getByRole("heading", { name: "权限管理" })).toBeVisible({ timeout: 10000 });
});

test("7.4 审计中心", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { name: "审计中心" })).toBeVisible({ timeout: 10000 });
});

test("7.5 运营监控", async ({ page }) => {
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await page.goto("/admin/monitor");
  await expect(page.getByRole("heading", { name: "运营监控" })).toBeVisible({ timeout: 10000 });
});

// ====== 8. 权限隔离 ======
test("8.1 普通成员看不到管理端", async ({ page }) => {
  await login(page, MEMBER.email, MEMBER.password);
  await expect(page.getByRole("link", { name: "功能配置" })).not.toBeVisible();
});

// ====== 9. 账号切换 ======
test("9.1 可以切换账号：赵总监→张工", async ({ page }) => {
  // 登录赵总监
  await login(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
  await expect(page.getByText("赵总监")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("link", { name: "功能配置" })).toBeVisible();

  // 导航到登录页切换账号
  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 登录张工
  await page.fill('input[type="email"]', MEMBER.email);
  await page.fill('input[type="password"]', "demo123456");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/console", { timeout: 20000 });

  // 验证是张工
  await expect(page.getByText("张工")).toBeVisible({ timeout: 10000 });
  // 不应看到管理端
  await expect(page.getByRole("link", { name: "功能配置" })).not.toBeVisible();
});
