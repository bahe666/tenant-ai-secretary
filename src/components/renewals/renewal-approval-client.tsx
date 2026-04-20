"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  pending_approval: { label: "待审批", variant: "outline" },
  approved: { label: "已批准", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
  expired: { label: "已过期", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  failed: { label: "执行失败", variant: "destructive" },
  executing: { label: "执行中", variant: "outline" },
};

interface Renewal {
  renewal_id: string;
  status: string;
  items: Array<{ resource_id: string; name: string; spec: string; duration_months: number; price: number }>;
  total_amount: number;
  created_by: string;
  expired_at: string;
  execution_result?: { results?: Array<{ resource_id: string; name: string; success: boolean; new_expire_at?: string }> };
}

export function RenewalApprovalClient({ renewal, canApprove }: { renewal: Renewal; canApprove: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const statusInfo = STATUS_LABELS[renewal.status] || { label: renewal.status, variant: "secondary" as const };
  const isExpired = new Date(renewal.expired_at) < new Date() && renewal.status === "pending_approval";

  async function handleApprove() {
    setLoading(true);
    try {
      await fetch(`/api/v1/assistant/renewals/${renewal.renewal_id}/approve`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await fetch(`/api/v1/assistant/renewals/${renewal.renewal_id}/reject`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 状态 */}
      <Card>
        <CardContent className="py-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">状态</span>
            <Badge variant={statusInfo.variant}>{isExpired ? "已过期" : statusInfo.label}</Badge>
          </div>
          {renewal.status === "pending_approval" && !isExpired && (
            <p className="text-sm text-amber-600">
              审批截止：{new Date(renewal.expired_at).toLocaleString("zh-CN")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 资源清单 */}
      <Card>
        <CardHeader><CardTitle>续租资源清单</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 text-left">资源名称</th>
                <th className="py-2 text-left">规格</th>
                <th className="py-2 text-center">续租时长</th>
                <th className="py-2 text-right">费用</th>
              </tr>
            </thead>
            <tbody>
              {renewal.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-slate-500">{item.spec}</td>
                  <td className="py-3 text-center">{item.duration_months} 个月</td>
                  <td className="py-3 text-right font-medium">¥{item.price.toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={3} className="py-3 text-right font-medium">总费用</td>
                <td className="py-3 text-right text-lg font-bold text-blue-700">
                  ¥{renewal.total_amount.toLocaleString("zh-CN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* 执行结果（已完成时显示） */}
      {renewal.execution_result?.results && (
        <Card>
          <CardHeader><CardTitle>执行结果</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {renewal.execution_result.results.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${r.success ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm">{r.name}</span>
                  <div className="flex items-center gap-2">
                    {r.new_expire_at && (
                      <span className="text-xs text-slate-500">
                        新到期：{new Date(r.new_expire_at).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                    <Badge variant={r.success ? "outline" : "destructive"}>
                      {r.success ? "成功" : "失败"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 审批按钮 */}
      {canApprove && (
        <Card>
          <CardContent className="py-4 px-5">
            {!confirmOpen ? (
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleReject} disabled={loading}>
                  拒绝
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={loading}>
                  确认续租
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-800 mb-3">
                  确认续租？将扣费 ¥{renewal.total_amount.toLocaleString("zh-CN")}，此操作不可撤销。
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={loading}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? "执行中..." : "确认并执行"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
