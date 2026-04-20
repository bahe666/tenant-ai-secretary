import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: config } = await supabase.from("assistant_config").select("*").single();
  const { count: alertCount } = await supabase.from("assistant_alert").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: pendingRenewals } = await supabase.from("assistant_renewal").select("*", { count: "exact", head: true }).eq("status", "pending_approval");
  const { count: logCount } = await supabase.from("assistant_audit_log").select("*", { count: "exact", head: true });
  const { data: rules } = await supabase.from("assistant_permission_rule").select("role_name, allowed_features");

  const FEATURE_LABELS: Record<string, string> = {
    qa: "答疑", patrol: "巡检", cost_insight: "成本", renewal: "续租",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">智能秘书管理</h1>
        <p className="text-sm text-slate-500 mt-1">秘书运行状态和管理配置</p>
      </div>

      {/* 运行状态 */}
      <Card className={config?.is_active ? "border-green-200" : "border-red-200"}>
        <CardContent className="py-4 px-5 flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${config?.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium">{config?.is_active ? "秘书运行中" : "秘书已暂停"}</span>
          <div className="flex-1" />
          <div className="flex gap-1">
            {(config?.enabled_features || []).map((f: string) => (
              <Badge key={f} variant="outline" className="text-xs">{FEATURE_LABELS[f] || f}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 快速概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">待处理告警</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${(alertCount || 0) > 0 ? "text-amber-600" : ""}`}>{alertCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">待审批续租</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${(pendingRenewals || 0) > 0 ? "text-blue-600" : ""}`}>{pendingRenewals || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">审计记录总数</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{logCount || 0}</p></CardContent>
        </Card>
      </div>

      {/* 权限概览 */}
      <Card>
        <CardHeader><CardTitle className="text-base">权限配置概览</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(rules || []).map((r: Record<string, unknown>) => (
              <div key={r.role_name as string} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-medium">{r.role_name as string}</span>
                <div className="flex gap-1">
                  {(r.allowed_features as string[]).map(f => (
                    <Badge key={f} variant="secondary" className="text-xs">{FEATURE_LABELS[f] || f}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
