# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: switch-account.spec.ts >> 页面导航不卡顿（< 5s）
- Location: tests/e2e/switch-account.spec.ts:33:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: '成本报告' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: '成本报告' }) resolved to 2 elements:
    1) <h1 class="text-2xl font-bold text-slate-900">成本报告</h1> aka getByRole('heading', { name: '成本报告', exact: true })
    2) <h3 class="font-medium text-slate-900">2026-03 月度成本报告</h3> aka getByRole('link', { name: '2026-03 月度成本报告 已就绪 2026-03-01' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: '成本报告' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "智能秘书" [ref=e5] [cursor=pointer]:
          - /url: /console
          - img [ref=e7]
          - generic [ref=e9]: 智能秘书
        - generic [ref=e10]: 星辰科技
        - button "赵 赵总监 租户超管" [ref=e11] [cursor=pointer]:
          - generic [ref=e13]: 赵
          - generic [ref=e14]:
            - paragraph [ref=e15]: 赵总监
            - paragraph [ref=e16]: 租户超管
    - generic [ref=e17]:
      - complementary [ref=e18]:
        - navigation [ref=e19]:
          - paragraph [ref=e20]: 用户端
          - link "控制台首页" [ref=e21] [cursor=pointer]:
            - /url: /console
            - img [ref=e22]
            - text: 控制台首页
          - link "秘书中心" [ref=e24] [cursor=pointer]:
            - /url: /assistant
            - img [ref=e25]
            - text: 秘书中心
          - link "巡检提醒" [ref=e27] [cursor=pointer]:
            - /url: /assistant/alerts
            - img [ref=e28]
            - text: 巡检提醒
          - link "成本报告" [active] [ref=e30] [cursor=pointer]:
            - /url: /assistant/reports
            - img [ref=e31]
            - text: 成本报告
          - link "续租管理" [ref=e33] [cursor=pointer]:
            - /url: /assistant/renewals
            - img [ref=e34]
            - text: 续租管理
          - link "秘书设置" [ref=e36] [cursor=pointer]:
            - /url: /assistant/settings
            - img [ref=e37]
            - text: 秘书设置
          - paragraph [ref=e41]: 管理端
          - link "管理总览" [ref=e42] [cursor=pointer]:
            - /url: /admin
            - img [ref=e43]
            - text: 管理总览
          - link "功能配置" [ref=e45] [cursor=pointer]:
            - /url: /admin/config
            - img [ref=e46]
            - text: 功能配置
          - link "权限管理" [ref=e48] [cursor=pointer]:
            - /url: /admin/permissions
            - img [ref=e49]
            - text: 权限管理
          - link "审计中心" [ref=e51] [cursor=pointer]:
            - /url: /admin/audit
            - img [ref=e52]
            - text: 审计中心
          - link "运营监控" [ref=e54] [cursor=pointer]:
            - /url: /admin/monitor
            - img [ref=e55]
            - text: 运营监控
      - main [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]:
            - heading "成本报告" [level=1] [ref=e60]
            - paragraph [ref=e61]: 费用分析和优化建议
          - generic [ref=e62]:
            - button "生成月度报告" [ref=e64]
            - link "2026-03 月度成本报告 已就绪 2026-03-01 ~ 2026-03-31 ¥172,529.77 环比 +12.4%" [ref=e66] [cursor=pointer]:
              - /url: /assistant/reports/14f2d044-79e6-4655-b258-247740cc81d3
              - generic [ref=e69]:
                - generic [ref=e70]:
                  - generic [ref=e71]:
                    - heading "2026-03 月度成本报告" [level=3] [ref=e72]
                    - generic [ref=e73]: 已就绪
                  - paragraph [ref=e74]: 2026-03-01 ~ 2026-03-31
                - generic [ref=e75]:
                  - paragraph [ref=e76]: ¥172,529.77
                  - paragraph [ref=e77]: 环比 +12.4%
    - button "智能秘书" [ref=e78]:
      - img [ref=e79]
  - button "Open Next.js Dev Tools" [ref=e86] [cursor=pointer]:
    - img [ref=e87]
  - alert [ref=e90]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("账号切换：登录赵总监 → 退出 → 登录张工", async ({ page }) => {
  4  |   // 1. 登录赵总监
  5  |   await page.goto("/login");
  6  |   await page.waitForLoadState("networkidle");
  7  |   await page.fill('input[type="email"]', "zhao@acme.com");
  8  |   await page.fill('input[type="password"]', "demo123456");
  9  |   await page.click('button[type="submit"]');
  10 |   await page.waitForURL("**/console", { timeout: 20000 });
  11 |   // 确认是赵总监
  12 |   await expect(page.getByText("赵总监")).toBeVisible({ timeout: 10000 });
  13 |   // 应能看到管理端
  14 |   await expect(page.getByRole("link", { name: "功能配置" })).toBeVisible();
  15 | 
  16 |   // 2. 直接导航到登录页（模拟切换账号）
  17 |   await page.goto("/login");
  18 |   await page.waitForLoadState("networkidle");
  19 |   // 等待旧 session 清除
  20 |   await page.waitForTimeout(1000);
  21 | 
  22 |   // 3. 登录张工
  23 |   await page.fill('input[type="email"]', "zhang@acme.com");
  24 |   await page.fill('input[type="password"]', "demo123456");
  25 |   await page.click('button[type="submit"]');
  26 |   await page.waitForURL("**/console", { timeout: 20000 });
  27 |   // 确认是张工
  28 |   await expect(page.getByText("张工")).toBeVisible({ timeout: 10000 });
  29 |   // 不应看到管理端
  30 |   await expect(page.getByRole("link", { name: "功能配置" })).not.toBeVisible();
  31 | });
  32 | 
  33 | test("页面导航不卡顿（< 5s）", async ({ page }) => {
  34 |   await page.goto("/login");
  35 |   await page.waitForLoadState("networkidle");
  36 |   await page.fill('input[type="email"]', "zhao@acme.com");
  37 |   await page.fill('input[type="password"]', "demo123456");
  38 |   await page.click('button[type="submit"]');
  39 |   await page.waitForURL("**/console", { timeout: 20000 });
  40 | 
  41 |   // 测试各页面导航速度
  42 |   const pages = [
  43 |     { link: "巡检提醒", heading: "巡检提醒" },
  44 |     { link: "成本报告", heading: "成本报告" },
  45 |     { link: "续租管理", heading: "续租管理" },
  46 |     { link: "控制台首页", heading: "控制台" },
  47 |   ];
  48 | 
  49 |   for (const p of pages) {
  50 |     const start = Date.now();
  51 |     await page.getByRole("link", { name: p.link }).click();
> 52 |     await expect(page.getByRole("heading", { name: p.heading })).toBeVisible({ timeout: 5000 });
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  53 |     const elapsed = Date.now() - start;
  54 |     console.log(`  ${p.link}: ${elapsed}ms`);
  55 |     expect(elapsed).toBeLessThan(5000);
  56 |   }
  57 | });
  58 | 
```