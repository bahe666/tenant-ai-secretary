"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  query: "对话查询", alert_generate: "巡检生成", report_generate: "报告生成",
  renewal_create: "续租创建", renewal_approve: "续租审批", renewal_reject: "续租拒绝",
  renewal_execute: "续租执行", config_change: "配置变更", permission_change: "权限变更", kill_switch: "紧急终止",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">审计中心</h1><p className="text-sm text-slate-500 mt-1">操作日志和问答记录查询</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">操作日志</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-center text-slate-400 py-8">加载中...</p> : logs.length === 0 ? <p className="text-center text-slate-400 py-8">暂无审计记录</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500 text-xs"><th className="py-2 text-left">时间</th><th className="py-2 text-left">操作</th><th className="py-2 text-left">结果</th><th className="py-2 text-left">异常</th></tr></thead>
              <tbody>{logs.map((log: any) => (
                <tr key={log.log_id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 text-xs text-slate-500">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
                  <td className="py-2"><Badge variant="outline" className="text-xs">{ACTION_LABELS[log.action_type] || log.action_type}</Badge></td>
                  <td className="py-2"><Badge variant={log.result === "success" ? "outline" : "destructive"} className="text-xs">{log.result === "success" ? "成功" : "失败"}</Badge></td>
                  <td className="py-2">{log.is_anomaly && <span className="text-xs text-red-600">异常</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
