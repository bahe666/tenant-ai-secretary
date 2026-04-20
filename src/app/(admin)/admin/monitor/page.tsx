"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonitorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [chatRes, alertRes, reportRes, renewalRes, anomalyRes, configRes] = await Promise.all([
        supabase.from("assistant_audit_log").select("*", { count: "exact", head: true }).eq("action_type", "query"),
        supabase.from("assistant_alert").select("*", { count: "exact", head: true }),
        supabase.from("assistant_report").select("*", { count: "exact", head: true }),
        supabase.from("assistant_renewal").select("*", { count: "exact", head: true }),
        supabase.from("assistant_audit_log").select("*", { count: "exact", head: true }).eq("is_anomaly", true),
        supabase.from("assistant_config").select("is_active").single(),
      ]);
      setData({
        chatCount: chatRes.count || 0, alertCount: alertRes.count || 0, reportCount: reportRes.count || 0,
        renewalCount: renewalRes.count || 0, anomalyCount: anomalyRes.count || 0, isActive: configRes.data?.is_active ?? true,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6"><h1 className="text-2xl font-bold text-slate-900">运营监控</h1><p className="text-slate-400 mt-4">加载中...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">运营监控</h1><p className="text-sm text-slate-500 mt-1">调用量、性能和限流管理</p></div>
      <Card className={data.isActive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="py-4 px-5 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${data.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium">{data.isActive ? "秘书运行中" : "秘书已暂停"}</span>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "对话次数", value: data.chatCount },
          { label: "巡检告警", value: data.alertCount },
          { label: "成本报告", value: data.reportCount },
          { label: "续租方案", value: data.renewalCount },
          { label: "异常操作", value: data.anomalyCount, danger: data.anomalyCount > 0 },
        ].map(m => (
          <Card key={m.label}><CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">{m.label}</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${m.danger ? "text-red-600" : ""}`}>{m.value}</p></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="text-base">限流配置</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4 text-sm">
        {[{ label: "模型调用 TPM", value: "10,000 TPM" }, { label: "API 频率", value: "60 次/分钟" }, { label: "工作流超时", value: "5 分钟" }, { label: "推理深度", value: "20 步" }].map(c => (
          <div key={c.label} className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">{c.label}</p><p className="text-lg font-medium mt-1">{c.value}</p></div>
        ))}
      </div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">熔断状态</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between p-3 bg-green-50 rounded-lg"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm">正常</span></div><span className="text-xs text-slate-500">连续失败：0 次（阈值：3 次）</span></div></CardContent></Card>
    </div>
  );
}
