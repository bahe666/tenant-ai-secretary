import { createClient } from "@/lib/supabase/server";

export async function buildTenantContext(tenantId: string) {
  const supabase = await createClient();

  // 资源概况
  const { data: resources } = await supabase
    .from("resources")
    .select("resource_type, status, name, spec, expire_at")
    .eq("tenant_id", tenantId);

  const typeCounts: Record<string, number> = {};
  let expiringCount = 0;
  resources?.forEach((r) => {
    typeCounts[r.resource_type] = (typeCounts[r.resource_type] || 0) + 1;
    if (r.expire_at) {
      const days = (new Date(r.expire_at).getTime() - Date.now()) / 86400000;
      if (days > 0 && days <= 7) expiringCount++;
    }
  });

  const resourceSummary = `共 ${resources?.length || 0} 个资源。类型分布：${Object.entries(typeCounts)
    .map(([t, c]) => `${t} ${c}个`)
    .join("、")}。其中 ${expiringCount} 个将在 7 天内到期。`;

  // 最近告警
  const { data: alerts } = await supabase
    .from("assistant_alert")
    .select("summary, severity, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentAlerts = alerts?.length
    ? alerts.map((a) => `[${a.severity}] ${a.summary}`).join("\n")
    : "暂无未读告警";

  // 本月费用
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: bills } = await supabase
    .from("billing_records")
    .select("amount, product_type")
    .eq("tenant_id", tenantId)
    .gte("date", monthStart);

  const totalCost = bills?.reduce((s, b) => s + Number(b.amount), 0) || 0;
  const costByType: Record<string, number> = {};
  bills?.forEach((b) => {
    costByType[b.product_type] = (costByType[b.product_type] || 0) + Number(b.amount);
  });

  const costSummary = `本月累计费用 ¥${totalCost.toFixed(0)}。构成：${Object.entries(costByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, a]) => `${t} ¥${a.toFixed(0)}`)
    .join("、")}`;

  return { resourceSummary, recentAlerts, costSummary };
}
