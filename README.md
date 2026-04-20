# 租户专属智能秘书 MVP

多租户 AI 智能秘书系统，为云服务控制台租户提供专属答疑、主动巡检、成本洞察和自动续租服务。

## 功能模块

### 用户端
- **F1 专属答疑** — AI 对话（SSE 流式）、资源查询、费用查询、文档搜索、来源标注
- **F2 主动巡检** — 资源到期预警、使用率异常检测、费用飙升告警、配额预警
- **F3 成本洞察** — 月度成本报告、费用构成分析（Recharts 图表）、闲置资源识别、优化建议
- **F4 自动续租** — 续租方案生成、HITL 审批流程、二次确认、执行反馈

### 企业管理端
- **F5 功能配置** — 模块开关、预设模板、金额阈值
- **F6 权限管理** — 角色-功能映射、权限总览
- **F7 审计中心** — 操作日志查询
- **F8 运营监控** — 调用量指标、限流配置、熔断状态

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| AI | Vercel AI SDK + Anthropic (routerhub) |
| 数据库 | Supabase PostgreSQL + RLS |
| 认证 | Supabase Auth |
| 图表 | Recharts |
| 测试 | Vitest |
| 部署 | Vercel |

## 演示账号

密码统一：`demo123456`

| 账号 | 角色 | 功能 | 租户 |
|------|------|------|------|
| zhang@acme.com | 研发工程师 | 仅答疑 | 星辰科技 |
| li@acme.com | 资源管理员 | 答疑+巡检 | 星辰科技 |
| wang@acme.com | 计费管理员 | 全部用户端功能 | 星辰科技 |
| zhao@acme.com | 租户超管 | 全部+管理端 | 星辰科技 |
| user@innovlab.com | 超管 | 全部 | 创新实验室 |

## 本地开发

```bash
npm install
cp .env.example .env.local  # 填入密钥
npm run dev                  # 启动开发服务器
npm test                     # 运行测试
```

## 数据库

```bash
brew install supabase/tap/supabase
supabase link --project-ref <ref>
supabase db push
node scripts/seed.mjs
```
