"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURE_LABELS: Record<string, string> = { qa: "答疑", patrol: "巡检", cost_insight: "成本", renewal: "续租" };

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [configRes, alertRes, renewalRes, logRes, rulesRes] = await Promise.all([
        supabase.from("assistant_config").select("*").single(),
        supabase.from("assistant_alert").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("assistant_renewal").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("assistant_audit_log").select("*", { count: "exact", head: true }),
        supabase.from("assistant_permission_rule").select("role_name, allowed_features"),
      ]);
      setData({
        config: configRes.data,
        alertCount: alertRes.count || 0,
        renewalCount: renewalRes.count || 0,
        logCount: logRes.count || 0,
        rules: rulesRes.data || [],
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6"><h1 className="text-2xl font-bold text-slate-900">智能秘书管理</h1><p className="text-slate-400 mt-4">加载中...</p></div>;

  const { config, alertCount, renewalCount, logCount, rules } = data;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">智能秘书管理</h1><p className="text-sm text-slate-500 mt-1">秘书运行状态和管理配置</p></div>
      <Card className={config?.is_active ? "border-green-200" : "border-red-200"}>
        <CardContent className="py-4 px-5 flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${config?.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium">{config?.is_active ? "秘书运行中" : "秘书已暂停"}</span>
          <div className="flex-1" />
          <div className="flex gap-1">
            {(config?.enabled_features || []).map((f: string) => (<Badge key={f} variant="outline" className="text-xs">{FEATURE_LABELS[f] || f}</Badge>))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">待处理告警</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${alertCount > 0 ? "text-amber-600" : ""}`}>{alertCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">待审批续租</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${renewalCount > 0 ? "text-blue-600" : ""}`}>{renewalCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">审计记录总数</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{logCount}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">权限配置概览</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((r: any) => (
              <div key={r.role_name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-medium">{r.role_name}</span>
                <div className="flex gap-1">{(r.allowed_features as string[]).map((f: string) => (<Badge key={f} variant="secondary" className="text-xs">{FEATURE_LABELS[f] || f}</Badge>))}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
