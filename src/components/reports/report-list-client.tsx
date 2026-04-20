"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportSummary {
  report_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  summary: { total: number; mom_change: number };
  status: string;
  created_at: string;
}

export function ReportListClient({ initialReports }: { initialReports: ReportSummary[] }) {
  const [reports, setReports] = useState(initialReports);
  const [generating, setGenerating] = useState(false);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/assistant/reports/generate", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={generateReport} disabled={generating}>
          {generating ? "生成中..." : "生成月度报告"}
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            暂无报告。点击"生成月度报告"创建分析报告。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <Link key={report.report_id} href={`/assistant/reports/${report.report_id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {report.period_start.slice(0, 7)} 月度成本报告
                        </h3>
                        <Badge variant={report.status === "ready" ? "outline" : "secondary"} className="text-xs">
                          {report.status === "ready" ? "已就绪" : "生成中"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {report.period_start} ~ {report.period_end}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ¥{report.summary?.total?.toLocaleString("zh-CN", { minimumFractionDigits: 0 }) || "0"}
                      </p>
                      {report.summary?.mom_change !== undefined && (
                        <p className={`text-xs ${report.summary.mom_change > 0 ? "text-red-600" : "text-green-600"}`}>
                          环比 {report.summary.mom_change > 0 ? "+" : ""}{report.summary.mom_change.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
