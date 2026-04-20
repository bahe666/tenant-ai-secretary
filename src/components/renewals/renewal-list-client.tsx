"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-600" },
  pending_approval: { label: "待审批", color: "bg-amber-100 text-amber-800" },
  approved: { label: "已批准", color: "bg-blue-100 text-blue-800" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  expired: { label: "已过期", color: "bg-slate-100 text-slate-500" },
  executing: { label: "执行中", color: "bg-blue-100 text-blue-800" },
  completed: { label: "已完成", color: "bg-green-100 text-green-800" },
  failed: { label: "执行失败", color: "bg-red-100 text-red-800" },
};

interface Renewal {
  renewal_id: string;
  status: string;
  items: Array<{ resource_id: string; name: string; spec: string; duration_months: number; price: number }>;
  total_amount: number;
  created_by: string;
  expired_at: string;
  created_at: string;
}

export function RenewalListClient({ initialRenewals, userRole }: { initialRenewals: Renewal[]; userRole: string }) {
  const [renewals] = useState(initialRenewals);
  const [generating, setGenerating] = useState(false);
  const canGenerate = ["billing_admin", "super_admin", "platform_ops"].includes(userRole);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await fetch("/api/v1/assistant/renewals/generate", { method: "POST" });
      window.location.reload();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {canGenerate && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "生成中..." : "生成续租方案"}
          </Button>
        </div>
      )}

      {renewals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            暂无续租方案。{canGenerate ? "点击「生成续租方案」检测到期资源。" : ""}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {renewals.map(r => {
            const statusInfo = STATUS_LABELS[r.status] || { label: r.status, color: "bg-slate-100" };
            const isExpired = new Date(r.expired_at) < new Date() && r.status === "pending_approval";
            return (
              <Link key={r.renewal_id} href={`/assistant/renewals/${r.renewal_id}`}>
                <Card className="hover:border-blue-300 transition-colors cursor-pointer mb-3">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {isExpired ? "已过期" : statusInfo.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(r.created_at).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {r.items.length} 个资源续租方案
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.items.map(i => i.name).join("、")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">¥{r.total_amount.toLocaleString("zh-CN")}</p>
                        {r.status === "pending_approval" && !isExpired && (
                          <p className="text-xs text-amber-600">
                            {Math.ceil((new Date(r.expired_at).getTime() - Date.now()) / 3600000)}h 后过期
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
