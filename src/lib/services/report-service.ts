import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export async function generateMonthlyReport(tenantId: string, year: number, month: number) {
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const prevMonthStart = month === 1 ? `${year - 1}-12-01` : `${year}-${String(month - 1).padStart(2, "0")}-01`;

  // 本月费用
  const { data: currentBills } = await supabase
    .from("billing_records")
    .select("date, product_type, amount")
    .eq("tenant_id", tenantId)
    .gte("date", periodStart)
    .lt("date", nextMonth);

  // 上月费用（计算环比）
  const { data: prevBills } = await supabase
    .from("billing_records")
    .select("amount")
    .eq("tenant_id", tenantId)
    .gte("date", prevMonthStart)
    .lt("date", periodStart);

  const total = (currentBills || []).reduce((s, b) => s + Number(b.amount), 0);
  const prevTotal = (prevBills || []).reduce((s, b) => s + Number(b.amount), 0);
  const momChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Top 5 费用构成
  const byType: Record<string, number> = {};
  (currentBills || []).forEach(b => {
    byType[b.product_type] = (byType[b.product_type] || 0) + Number(b.amount);
  });
  const topCosts = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, amount]) => ({
      product,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));

  // 日费用波动分析
  const dailyCosts: Record<string, number> = {};
  (currentBills || []).forEach(b => {
    dailyCosts[b.date] = (dailyCosts[b.date] || 0) + Number(b.amount);
  });
  const dailyValues = Object.values(dailyCosts);
  const avgDaily = dailyValues.length ? dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length : 0;
  const anomalies = Object.entries(dailyCosts)
    .filter(([, amt]) => amt > avgDaily * 2.5)
    .map(([date, amount]) => ({
      date,
      amount,
      avg_amount: avgDaily,
      reason: `日消费 ¥${amount.toFixed(0)} 是均值 ¥${avgDaily.toFixed(0)} 的 ${(amount / avgDaily * 100).toFixed(0)}%`,
    }));

  // 闲置资源识别
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: resources } = await supabase
    .from("resources")
    .select("id, resource_id, name, spec, resource_type")
    .eq("tenant_id", tenantId)
    .eq("status", "running")
    .in("resource_type", ["gpu", "ecs"]);

  const idleResources = [];
  for (const r of resources || []) {
    const metricType = r.resource_type === "gpu" ? "gpu" : "cpu";
    const { data: metrics } = await supabase
      .from("usage_metrics")
      .select("value")
      .eq("resource_id", r.id)
      .eq("metric_type", metricType)
      .gte("sampled_at", sevenDaysAgo);

    if (!metrics?.length) continue;
    const avg = metrics.reduce((s, m) => s + Number(m.value), 0) / metrics.length;
    if (avg < 10) {
      // 估算节省金额（简化：按 GPU 类型估价）
      const priceMap: Record<string, number> = { "A100-80G": 4000, "A100-40G": 3000, "V100-32G": 2000 };
      const estimatedSaving = priceMap[r.spec || ""] || 1500;
      idleResources.push({
        resource_id: r.resource_id,
        name: r.name,
        spec: r.spec,
        avg_usage: avg,
        estimated_saving: estimatedSaving,
      });
    }
  }

  // 优化建议
  const recommendations = idleResources.map(r => ({
    action: `释放或降配 ${r.name}`,
    target: r.name,
    saving: r.estimated_saving,
  }));

  // 即将到期资源
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString();
  const { data: expiringRes } = await supabase
    .from("resources")
    .select("resource_id, name, expire_at, spec")
    .eq("tenant_id", tenantId)
    .eq("billing_type", "prepaid")
    .eq("status", "running")
    .gt("expire_at", new Date().toISOString())
    .lte("expire_at", thirtyDaysLater);

  const expiringResources = (expiringRes || []).map(r => {
    const priceMap: Record<string, number> = { "A100-80G": 12000, "A100-40G": 9000, "V100-32G": 6000, "8C16G": 2400, "4C8G": 1200 };
    return {
      resource_id: r.resource_id,
      name: r.name,
      expire_at: r.expire_at,
      estimated_renewal: priceMap[r.spec || ""] || 3000,
    };
  });

  // 设置上月结束日期
  const periodEnd = new Date(nextMonth);
  periodEnd.setDate(periodEnd.getDate() - 1);

  // 写入报告
  const report = {
    tenant_id: tenantId,
    report_type: "monthly",
    period_start: periodStart,
    period_end: periodEnd.toISOString().split("T")[0],
    summary: { total, mom_change: momChange, yoy_change: null },
    top_costs: topCosts,
    anomalies,
    idle_resources: idleResources,
    recommendations,
    expiring_resources: expiringResources,
    status: "ready",
  };

  const { data, error } = await supabase
    .from("assistant_report")
    .insert(report)
    .select()
    .single();

  if (error) {
    console.error("Report generation error:", error.message);
    return null;
  }
  return data;
}
