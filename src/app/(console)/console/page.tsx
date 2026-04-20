import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConsolePage() {
  const supabase = await createClient();

  // 查询资源统计
  const { data: resources } = await supabase
    .from("resources")
    .select("id, resource_type, status, name, spec, expire_at");

  // 查询最近 30 天账单汇总
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentBills } = await supabase
    .from("billing_records")
    .select("amount")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  // 查询最近告警
  const { data: alerts } = await supabase
    .from("assistant_alert")
    .select("alert_id, severity, summary, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const totalResources = resources?.length || 0;
  const runningResources = resources?.filter((r) => r.status === "running").length || 0;
  const expiringResources = resources?.filter((r) => {
    if (!r.expire_at) return false;
    const days = (new Date(r.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 7;
  }).length || 0;

  const totalCost = recentBills?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

  // 按类型统计资源
  const typeStats: Record<string, number> = {};
  resources?.forEach((r) => {
    typeStats[r.resource_type] = (typeStats[r.resource_type] || 0) + 1;
  });

  const TYPE_LABELS: Record<string, string> = {
    gpu: "GPU 实例",
    ecs: "云服务器",
    storage: "存储服务",
    network: "网络",
    database: "数据库",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">控制台</h1>
        <p className="text-sm text-slate-500 mt-1">资源概览和运营状态</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总资源数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalResources}</p>
            <p className="text-xs text-green-600 mt-1">{runningResources} 个运行中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">近 30 天费用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">¥{totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-slate-500 mt-1">CNY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">即将到期</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${expiringResources > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {expiringResources}
            </p>
            <p className="text-xs text-slate-500 mt-1">7 天内到期</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">待处理告警</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${(alerts?.length || 0) > 0 ? "text-red-600" : "text-slate-900"}`}>
              {alerts?.length || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">未读提醒</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">资源分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeStats).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{TYPE_LABELS[type] || type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / totalResources) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近告警</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.alert_id} className="flex items-start gap-3 text-sm">
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : alert.severity === "warning" ? "outline" : "secondary"}
                      className="shrink-0 mt-0.5"
                    >
                      {alert.severity === "critical" ? "严重" : alert.severity === "warning" ? "警告" : "提示"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-slate-700 truncate">{alert.summary}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(alert.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">暂无告警</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
