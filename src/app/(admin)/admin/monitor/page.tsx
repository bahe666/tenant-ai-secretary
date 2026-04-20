import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MonitorPage() {
  const supabase = await createClient();

  // 统计对话数
  const { count: chatCount } = await supabase
    .from("assistant_audit_log")
    .select("*", { count: "exact", head: true })
    .eq("action_type", "query");

  // 统计告警数
  const { count: alertCount } = await supabase
    .from("assistant_alert")
    .select("*", { count: "exact", head: true });

  // 统计报告数
  const { count: reportCount } = await supabase
    .from("assistant_report")
    .select("*", { count: "exact", head: true });

  // 统计续租数
  const { count: renewalCount } = await supabase
    .from("assistant_renewal")
    .select("*", { count: "exact", head: true });

  // 异常操作数
  const { count: anomalyCount } = await supabase
    .from("assistant_audit_log")
    .select("*", { count: "exact", head: true })
    .eq("is_anomaly", true);

  // 获取秘书配置
  const { data: config } = await supabase.from("assistant_config").select("is_active").single();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">运营监控</h1>
        <p className="text-sm text-slate-500 mt-1">调用量、性能和限流管理</p>
      </div>

      {/* 秘书状态 */}
      <Card className={config?.is_active ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="py-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${config?.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="font-medium">{config?.is_active ? "秘书运行中" : "秘书已暂停"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">对话次数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{chatCount || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">巡检告警</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{alertCount || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">成本报告</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{reportCount || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">续租方案</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{renewalCount || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500">异常操作</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${(anomalyCount || 0) > 0 ? "text-red-600" : ""}`}>{anomalyCount || 0}</p></CardContent>
        </Card>
      </div>

      {/* 限流配置 */}
      <Card>
        <CardHeader><CardTitle className="text-base">限流配置</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">模型调用 TPM 上限</p>
              <p className="text-lg font-medium mt-1">10,000 TPM</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">API 调用频率上限</p>
              <p className="text-lg font-medium mt-1">60 次/分钟</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">工作流超时</p>
              <p className="text-lg font-medium mt-1">5 分钟</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">推理深度限制</p>
              <p className="text-lg font-medium mt-1">20 步</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 熔断状态 */}
      <Card>
        <CardHeader><CardTitle className="text-base">熔断状态</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">熔断器状态：正常</span>
            </div>
            <span className="text-xs text-slate-500">连续失败：0 次（阈值：3 次）</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
