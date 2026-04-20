"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportListClient } from "@/components/reports/report-list-client";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_report").select("report_id, report_type, period_start, period_end, summary, status, created_at").order("period_start", { ascending: false }).limit(20);
      setReports(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">成本报告</h1><p className="text-sm text-slate-500 mt-1">费用分析和优化建议</p></div>
      {loading ? <div className="py-12 text-center text-slate-400">加载中...</div> : <ReportListClient initialReports={reports} />}
    </div>
  );
}
