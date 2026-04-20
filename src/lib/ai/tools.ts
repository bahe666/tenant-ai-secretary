import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ToolSet } from "ai";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createAssistantTools(tenantId: string): ToolSet {
  const supabase = createAdminClient();

  return {
    queryResources: {
      description: "查询当前租户的云资源列表。可按类型、状态筛选。",
      parameters: z.object({
        resource_type: z.string().optional().describe("资源类型：gpu/ecs/storage/network/database"),
        status: z.string().optional().describe("状态：running/stopped/expired"),
        keyword: z.string().optional().describe("搜索关键词"),
      }),
      execute: async (params: any) => {
        let query = supabase.from("resources").select("*").eq("tenant_id", tenantId);
        if (params.resource_type) query = query.eq("resource_type", params.resource_type);
        if (params.status) query = query.eq("status", params.status);
        if (params.keyword) query = query.ilike("name", `%${params.keyword}%`);
        const { data } = await query.order("created_at", { ascending: false }).limit(20);
        return {
          resources: (data || []).map((r: any) => ({
            名称: r.name, ID: r.resource_id, 类型: r.resource_type,
            规格: r.spec, 状态: r.status,
            到期时间: r.expire_at ? new Date(r.expire_at).toLocaleDateString("zh-CN") : "按量付费",
            标签: r.tags, 资源组: r.resource_group,
          })),
          total: data?.length || 0,
          来源: "资源管理系统",
        };
      },
    },

    queryBilling: {
      description: "查询当前租户的费用账单信息。",
      parameters: z.object({
        days: z.number().default(30).describe("查询最近多少天"),
        product_type: z.string().optional().describe("产品类型"),
      }),
      execute: async (params: any) => {
        const since = new Date(Date.now() - params.days * 86400000).toISOString().split("T")[0];
        let query = supabase.from("billing_records").select("date, product_type, amount")
          .eq("tenant_id", tenantId).gte("date", since);
        if (params.product_type) query = query.eq("product_type", params.product_type);
        const { data } = await query.order("date", { ascending: false });
        const total = (data || []).reduce((s: number, b: any) => s + Number(b.amount), 0);
        const byType: Record<string, number> = {};
        (data || []).forEach((b: any) => {
          byType[b.product_type] = (byType[b.product_type] || 0) + Number(b.amount);
        });
        return {
          总费用: `¥${total.toFixed(2)}`, 查询天数: params.days,
          按产品分类: Object.entries(byType).sort((a, b) => b[1] - a[1])
            .map(([t, a]) => ({ 产品: t, 金额: `¥${a.toFixed(2)}`, 占比: `${((a / total) * 100).toFixed(1)}%` })),
          日均费用: `¥${(total / params.days).toFixed(2)}`, 来源: "计费系统",
        };
      },
    },

    queryUsageMetrics: {
      description: "查询指定资源的使用率指标。",
      parameters: z.object({
        resource_name: z.string().describe("资源名称或ID"),
        metric_type: z.string().default("gpu").describe("指标类型：cpu/gpu/memory"),
        hours: z.number().default(24).describe("查询最近多少小时"),
      }),
      execute: async (params: any) => {
        const { data: res } = await supabase.from("resources").select("id, name")
          .eq("tenant_id", tenantId)
          .or(`name.ilike.%${params.resource_name}%,resource_id.ilike.%${params.resource_name}%`)
          .limit(1).single();
        if (!res) return { error: "未找到该资源", 来源: "监控系统" };
        const since = new Date(Date.now() - params.hours * 3600000).toISOString();
        const { data: metrics } = await supabase.from("usage_metrics").select("value")
          .eq("resource_id", res.id).eq("metric_type", params.metric_type)
          .gte("sampled_at", since);
        const values = (metrics || []).map((m: any) => Number(m.value));
        const avg = values.length ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;
        return {
          资源: res.name, 指标类型: params.metric_type, 数据点数: values.length,
          平均使用率: `${avg.toFixed(1)}%`,
          最大使用率: values.length ? `${Math.max(...values).toFixed(1)}%` : "N/A",
          最小使用率: values.length ? `${Math.min(...values).toFixed(1)}%` : "N/A",
          来源: "监控系统",
        };
      },
    },

    searchDocs: {
      description: "搜索平台知识文档。用于回答技术操作类问题。",
      parameters: z.object({ query: z.string().describe("搜索关键词") }),
      execute: async (params: any) => {
        const keywords = params.query.split(/\s+/).filter(Boolean);
        let q = supabase.from("knowledge_docs").select("title, content, category, url");
        for (const kw of keywords.slice(0, 3)) {
          q = q.or(`title.ilike.%${kw}%,content.ilike.%${kw}%`);
        }
        const { data } = await q.limit(3);
        if (!data?.length) return { results: [], message: "未找到相关文档", 来源: "知识库" };
        return {
          results: data.map((d: any) => ({
            标题: d.title, 内容摘要: d.content.slice(0, 300), 分类: d.category, 链接: d.url,
          })),
          来源: "知识库",
        };
      },
    },

    queryAlerts: {
      description: "查询当前租户的巡检提醒。",
      parameters: z.object({
        alert_type: z.string().optional().describe("提醒类型"),
        status: z.string().optional().describe("状态：pending/read/dismissed"),
      }),
      execute: async (params: any) => {
        let query = supabase.from("assistant_alert")
          .select("alert_type, severity, summary, resource_name, status, created_at")
          .eq("tenant_id", tenantId);
        if (params.alert_type) query = query.eq("alert_type", params.alert_type);
        if (params.status) query = query.eq("status", params.status);
        const { data } = await query.order("created_at", { ascending: false }).limit(10);
        return {
          alerts: (data || []).map((a: any) => ({
            类型: a.alert_type, 级别: a.severity, 摘要: a.summary,
            资源: a.resource_name, 状态: a.status,
            时间: new Date(a.created_at).toLocaleString("zh-CN"),
          })),
          total: data?.length || 0, 来源: "巡检系统",
        };
      },
    },
  } as unknown as ToolSet;
}
