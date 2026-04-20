"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  resource_expiry: "资源到期",
  usage_anomaly: "使用率异常",
  cost_spike: "费用异常",
  quota_warning: "配额预警",
};

const TYPE_COLORS: Record<string, string> = {
  resource_expiry: "bg-amber-100 text-amber-800",
  usage_anomaly: "bg-blue-100 text-blue-800",
  cost_spike: "bg-red-100 text-red-800",
  quota_warning: "bg-purple-100 text-purple-800",
};

interface Alert {
  alert_id: string;
  alert_type: string;
  severity: string;
  summary: string;
  resource_name: string | null;
  detail: Record<string, unknown>;
  status: string;
  created_at: string;
}

export function AlertList({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patrolling, setPatrolling] = useState(false);

  async function runPatrol() {
    setPatrolling(true);
    try {
      const res = await fetch("/api/v1/assistant/patrol", { method: "POST" });
      if (res.ok) {
        // 刷新页面获取新数据
        window.location.reload();
      }
    } finally {
      setPatrolling(false);
    }
  }

  async function markRead(alertId: string) {
    const res = await fetch(`/api/v1/assistant/alerts/${alertId}/read`, {
      method: "POST",
    });
    if (res.ok) {
      setAlerts(
        alerts.map((a) =>
          a.alert_id === alertId ? { ...a, status: "read" } : a
        )
      );
    }
  }

  const filtered = alerts.filter((a) => {
    if (typeFilter !== "all" && a.alert_type !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {[
            "all",
            "resource_expiry",
            "usage_anomaly",
            "cost_spike",
            "quota_warning",
          ].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "all"
                ? `全部 (${alerts.length})`
                : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5"
          >
            <option value="all">全部状态</option>
            <option value="pending">未读 ({pendingCount})</option>
            <option value="read">已读</option>
          </select>
          <Button size="sm" onClick={runPatrol} disabled={patrolling}>
            {patrolling ? "巡检中..." : "执行巡检"}
          </Button>
        </div>
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            暂无提醒。点击"执行巡检"生成巡检报告。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card
              key={alert.alert_id}
              className={
                alert.status === "pending"
                  ? "border-l-4 border-l-blue-500"
                  : "opacity-75"
              }
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {alert.severity === "critical"
                          ? "严重"
                          : alert.severity === "warning"
                            ? "警告"
                            : "提示"}
                      </Badge>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[alert.alert_type] || "bg-slate-100"}`}
                      >
                        {TYPE_LABELS[alert.alert_type] || alert.alert_type}
                      </span>
                      {alert.status === "pending" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-800">{alert.summary}</p>
                    {alert.resource_name && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        资源：{alert.resource_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">
                      {new Date(alert.created_at).toLocaleString("zh-CN")}
                    </p>
                    {alert.status === "pending" && (
                      <button
                        onClick={() => markRead(alert.alert_id)}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        标记已读
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
