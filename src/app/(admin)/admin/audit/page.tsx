import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  query: "对话查询", alert_generate: "巡检生成", report_generate: "报告生成",
  renewal_create: "续租创建", renewal_approve: "续租审批", renewal_reject: "续租拒绝",
  renewal_execute: "续租执行", config_change: "配置变更", permission_change: "权限变更",
  kill_switch: "紧急终止",
};

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("assistant_audit_log")
    .select("*, users!assistant_audit_log_user_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">审计中心</h1>
        <p className="text-sm text-slate-500 mt-1">操作日志和问答记录查询</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">操作日志</CardTitle></CardHeader>
        <CardContent>
          {(logs?.length || 0) === 0 ? (
            <p className="text-center text-slate-400 py-8">暂无审计记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500 text-xs">
                    <th className="py-2 text-left">时间</th>
                    <th className="py-2 text-left">用户</th>
                    <th className="py-2 text-left">操作</th>
                    <th className="py-2 text-left">结果</th>
                    <th className="py-2 text-left">异常</th>
                  </tr>
                </thead>
                <tbody>
                  {(logs || []).map((log: Record<string, unknown>) => (
                    <tr key={log.log_id as string} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 text-xs text-slate-500">
                        {new Date(log.created_at as string).toLocaleString("zh-CN")}
                      </td>
                      <td className="py-2 text-xs">
                        {(log.users as Record<string, unknown>)?.display_name as string || "系统"}
                      </td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {ACTION_LABELS[log.action_type as string] || log.action_type as string}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={(log.result as string) === "success" ? "outline" : "destructive"} className="text-xs">
                          {(log.result as string) === "success" ? "成功" : (log.result as string) === "failure" ? "失败" : "部分成功"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {Boolean(log.is_anomaly) && <span className="text-xs text-red-600">异常</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
