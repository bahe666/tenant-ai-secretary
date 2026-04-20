import { createAdminClient } from "@/lib/supabase/admin";

let _supabase: ReturnType<typeof createAdminClient> | null = null;
function getDb() {
  if (!_supabase) _supabase = createAdminClient();
  return _supabase;
}

// 为保持代码简洁，在内部引用 supabase 的地方使用 getDb()
const supabase = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

// 生成去重 key
function dedupeKey(resourceId: string, alertType: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${resourceId}:${alertType}:${today}`;
}

// 检查是否已发送过（24h 去重）
async function isDuplicate(key: string): Promise<boolean> {
  const { data } = await supabase
    .from("assistant_alert")
    .select("alert_id")
    .eq("dedupe_key", key)
    .limit(1);
  return (data?.length || 0) > 0;
}

// 插入告警
async function insertAlert(alert: {
  tenant_id: string;
  alert_type: string;
  resource_id?: string;
  resource_name?: string;
  severity: string;
  summary: string;
  detail: Record<string, unknown>;
  dedupe_key: string;
}) {
  const dup = await isDuplicate(alert.dedupe_key);
  if (dup) return null;
  const { data, error } = await supabase
    .from("assistant_alert")
    .insert(alert)
    .select()
    .single();
  if (error) console.error("Alert insert error:", error.message);
  return data;
}

// 规则 1: 资源到期预警
export async function checkResourceExpiry(tenantId: string) {
  const alerts: unknown[] = [];
  const now = new Date();
  const thresholds = [
    { days: 7, severity: "warning" },
    { days: 3, severity: "critical" },
    { days: 1, severity: "critical" },
  ];

  for (const { days, severity } of thresholds) {
    const deadline = new Date(now.getTime() + days * 86400000);
    const { data: resources } = await supabase
      .from("resources")
      .select("resource_id, name, spec, expire_at")
      .eq("tenant_id", tenantId)
      .eq("status", "running")
      .eq("billing_type", "prepaid")
      .lte("expire_at", deadline.toISOString())
      .gt("expire_at", now.toISOString());

    for (const r of resources || []) {
      const daysLeft = Math.ceil(
        (new Date(r.expire_at).getTime() - now.getTime()) / 86400000
      );
      const alert = await insertAlert({
        tenant_id: tenantId,
        alert_type: "resource_expiry",
        resource_id: r.resource_id,
        resource_name: r.name,
        severity,
        summary: `${r.name}（${r.spec}）将在 ${daysLeft} 天后到期`,
        detail: {
          expire_at: r.expire_at,
          days_left: daysLeft,
          spec: r.spec,
        },
        dedupe_key: dedupeKey(r.resource_id, `resource_expiry_${days}d`),
      });
      if (alert) alerts.push(alert);
    }
  }
  return alerts;
}

// 规则 2: 使用率异常检测
export async function checkUsageAnomaly(tenantId: string) {
  const alerts: unknown[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // 查找有使用率数据的资源
  const { data: resources } = await supabase
    .from("resources")
    .select("id, resource_id, name, spec, resource_type")
    .eq("tenant_id", tenantId)
    .eq("status", "running")
    .in("resource_type", ["gpu", "ecs"]);

  for (const r of resources || []) {
    const metricType = r.resource_type === "gpu" ? "gpu" : "cpu";
    const { data: metrics } = await supabase
      .from("usage_metrics")
      .select("value")
      .eq("resource_id", r.id)
      .eq("metric_type", metricType)
      .gte("sampled_at", sevenDaysAgo);

    if (!metrics?.length) continue;
    const avg =
      metrics.reduce((s, m) => s + Number(m.value), 0) / metrics.length;

    if (avg < 5) {
      const alert = await insertAlert({
        tenant_id: tenantId,
        alert_type: "usage_anomaly",
        resource_id: r.resource_id,
        resource_name: r.name,
        severity: "warning",
        summary: `${r.name}（${r.spec}）${metricType.toUpperCase()} 使用率连续 7 天仅 ${avg.toFixed(1)}%，疑似闲置`,
        detail: {
          avg_usage: avg,
          metric_type: metricType,
          period: "7d",
          spec: r.spec,
        },
        dedupe_key: dedupeKey(r.resource_id, "usage_anomaly"),
      });
      if (alert) alerts.push(alert);
    }
  }
  return alerts;
}

// 规则 3: 费用异常告警
export async function checkCostSpike(tenantId: string) {
  const alerts: unknown[] = [];
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  // 获取今日总费用
  const { data: todayBills } = await supabase
    .from("billing_records")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("date", today);

  const todayTotal = (todayBills || []).reduce(
    (s, b) => s + Number(b.amount),
    0
  );
  if (todayTotal === 0) return alerts;

  // 获取过去 7 天平均
  const { data: recentBills } = await supabase
    .from("billing_records")
    .select("amount")
    .eq("tenant_id", tenantId)
    .gte("date", sevenDaysAgo)
    .lt("date", today);

  const recentTotal = (recentBills || []).reduce(
    (s, b) => s + Number(b.amount),
    0
  );
  const recentDays = 7;
  const avgDaily = recentTotal / recentDays;

  if (avgDaily > 0 && todayTotal > avgDaily * 3) {
    const ratio = ((todayTotal / avgDaily) * 100).toFixed(0);
    const alert = await insertAlert({
      tenant_id: tenantId,
      alert_type: "cost_spike",
      severity: "critical",
      summary: `今日消费 ¥${todayTotal.toFixed(0)} 是过去 7 天均值的 ${ratio}%（均值 ¥${avgDaily.toFixed(0)}/天）`,
      detail: {
        today_cost: todayTotal,
        avg_daily: avgDaily,
        ratio: Number(ratio),
      },
      dedupe_key: dedupeKey("tenant", "cost_spike"),
    });
    if (alert) alerts.push(alert);
  }
  return alerts;
}

// 规则 4: 配额预警
export async function checkQuotaWarning(tenantId: string) {
  const alerts: unknown[] = [];
  const { data: quotas } = await supabase
    .from("quotas")
    .select("quota_type, quota_limit, quota_used")
    .eq("tenant_id", tenantId);

  const QUOTA_LABELS: Record<string, string> = {
    gpu_instances: "GPU 实例",
    ecs_instances: "云服务器",
    elastic_ips: "弹性公网IP",
    security_group_rules: "安全组规则",
  };

  for (const q of quotas || []) {
    const usage = q.quota_used / q.quota_limit;
    if (usage >= 0.9) {
      const alert = await insertAlert({
        tenant_id: tenantId,
        alert_type: "quota_warning",
        severity: usage >= 0.95 ? "critical" : "warning",
        summary: `${QUOTA_LABELS[q.quota_type] || q.quota_type} 配额使用率达 ${(usage * 100).toFixed(0)}%（${q.quota_used}/${q.quota_limit}）`,
        detail: {
          quota_type: q.quota_type,
          used: q.quota_used,
          limit: q.quota_limit,
          usage_pct: usage * 100,
        },
        dedupe_key: dedupeKey("quota", q.quota_type),
      });
      if (alert) alerts.push(alert);
    }
  }
  return alerts;
}

// 执行全部巡检
export async function runAllPatrols(tenantId: string) {
  const results = await Promise.all([
    checkResourceExpiry(tenantId),
    checkUsageAnomaly(tenantId),
    checkCostSpike(tenantId),
    checkQuotaWarning(tenantId),
  ]);
  return results.flat();
}
