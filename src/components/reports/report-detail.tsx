"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const PRODUCT_LABELS: Record<string, string> = {
  gpu: "GPU 实例", ecs: "云服务器", storage: "存储", network: "网络", database: "数据库", other: "其他",
};

interface Report {
  report_id: string;
  period_start: string;
  period_end: string;
  summary: { total: number; mom_change: number; yoy_change: number | null };
  top_costs: Array<{ product: string; amount: number; percentage: number }>;
  anomalies: Array<{ date: string; amount: number; avg_amount: number; reason: string }>;
  idle_resources: Array<{ resource_id: string; name: string; spec: string; avg_usage: number; estimated_saving: number }>;
  recommendations: Array<{ action: string; target: string; saving: number }>;
  expiring_resources: Array<{ resource_id: string; name: string; expire_at: string; estimated_renewal: number }>;
}

export function ReportDetail({ report }: { report: Report }) {
  const pieData = report.top_costs.map(c => ({
    name: PRODUCT_LABELS[c.product] || c.product,
    value: c.amount,
  }));

  const totalSaving = report.recommendations.reduce((s, r) => s + r.saving, 0);
  const totalRenewal = report.expiring_resources.reduce((s, r) => s + r.estimated_renewal, 0);

  return (
    <div className="space-y-6">
      {/* 费用概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">总费用</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">¥{report.summary.total.toLocaleString("zh-CN", { minimumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">环比变化</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${report.summary.mom_change > 0 ? "text-red-600" : "text-green-600"}`}>
              {report.summary.mom_change > 0 ? "+" : ""}{report.summary.mom_change.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">潜在节省</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">¥{totalSaving.toLocaleString("zh-CN")}/月</p>
          </CardContent>
        </Card>
      </div>

      {/* 费用构成饼图 */}
      <Card>
        <CardHeader><CardTitle>费用构成 Top 5</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {report.top_costs.map((c, i) => (
                <div key={c.product} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{PRODUCT_LABELS[c.product] || c.product}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">¥{c.amount.toLocaleString("zh-CN", { minimumFractionDigits: 0 })}</span>
                    <span className="text-slate-400 ml-2">{c.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 异常波动 */}
      {report.anomalies.length > 0 && (
        <Card>
          <CardHeader><CardTitle>异常波动</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.anomalies.map(a => (
                <div key={a.date} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-red-800">{a.date}</p>
                    <p className="text-xs text-red-600">{a.reason}</p>
                  </div>
                  <Badge variant="destructive">¥{a.amount.toLocaleString("zh-CN", { minimumFractionDigits: 0 })}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 闲置资源 */}
      {report.idle_resources.length > 0 && (
        <Card>
          <CardHeader><CardTitle>闲置资源</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-slate-500">
                  <th className="py-2 text-left">资源</th><th className="py-2 text-left">规格</th>
                  <th className="py-2 text-right">平均使用率</th><th className="py-2 text-right">预估节省</th>
                </tr></thead>
                <tbody>
                  {report.idle_resources.map(r => (
                    <tr key={r.resource_id} className="border-b last:border-0">
                      <td className="py-2">{r.name}</td><td className="py-2 text-slate-500">{r.spec}</td>
                      <td className="py-2 text-right text-red-600">{r.avg_usage.toFixed(1)}%</td>
                      <td className="py-2 text-right text-green-600 font-medium">¥{r.estimated_saving.toLocaleString("zh-CN")}/月</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 到期资源 */}
      {report.expiring_resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              30天内到期资源
              <span className="text-sm font-normal text-slate-500 ml-2">预估续费 ¥{totalRenewal.toLocaleString("zh-CN")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.expiring_resources.map(r => (
                <div key={r.resource_id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-slate-500">到期：{new Date(r.expire_at).toLocaleDateString("zh-CN")}</p>
                  </div>
                  <span className="text-sm font-medium">¥{r.estimated_renewal.toLocaleString("zh-CN")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
