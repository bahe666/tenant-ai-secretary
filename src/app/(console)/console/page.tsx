"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConsolePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [resResult, billResult, alertResult] = await Promise.all([
        supabase.from("resources").select("id, resource_type, status, name, spec, expire_at"),
        supabase.from("billing_records").select("amount").gte("date", thirtyDaysAgo.toISOString().split("T")[0]),
        supabase.from("assistant_alert").select("alert_id, severity, summary, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      ]);

      setResources(resResult.data || []);
      setTotalCost((billResult.data || []).reduce((s: number, b: any) => s + Number(b.amount), 0));
      setAlerts(alertResult.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalResources = resources.length;
  const runningResources = resources.filter((r) => r.status === "running").length;
  const expiringResources = resources.filter((r) => {
    if (!r.expire_at) return false;
    const days = (new Date(r.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 7;
  }).length;

  const typeStats: Record<string, number> = {};
  resources.forEach((r) => {
    typeStats[r.resource_type] = (typeStats[r.resource_type] || 0) + 1;
  });

  const TYPE_LABELS: Record<string, string> = {
    gpu: "GPU 实例", ecs: "云服务器", storage: "存储服务", network: "网络", database: "数据库",
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900">控制台</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><CardContent className="py-8"><div className="h-8 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">控制台</h1>
        <p className="text-sm text-slate-500 mt-1">资源概览和运营状态</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">总资源数</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalResources}</p>
            <p className="text-xs text-green-600 mt-1">{runningResources} 个运行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">近 30 天费用</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">¥{totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">即将到期</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${expiringResources > 0 ? "text-amber-600" : "text-slate-900"}`}>{expiringResources}</p>
            <p className="text-xs text-slate-500 mt-1">7 天内到期</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">待处理告警</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${alerts.length > 0 ? "text-red-600" : "text-slate-900"}`}>{alerts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">资源分布</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeStats).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{TYPE_LABELS[type] || type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / totalResources) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">最近告警</CardTitle></CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.alert_id} className="flex items-start gap-3 text-sm">
                    <Badge variant={alert.severity === "critical" ? "destructive" : "outline"} className="shrink-0 mt-0.5">
                      {alert.severity === "critical" ? "严重" : alert.severity === "warning" ? "警告" : "提示"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-slate-700 truncate">{alert.summary}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(alert.created_at).toLocaleString("zh-CN")}</p>
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
