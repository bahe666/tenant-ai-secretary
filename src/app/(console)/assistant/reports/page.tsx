import { createClient } from "@/lib/supabase/server";
import { ReportListClient } from "@/components/reports/report-list-client";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("assistant_report")
    .select("report_id, report_type, period_start, period_end, summary, status, created_at")
    .order("period_start", { ascending: false })
    .limit(20);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">成本报告</h1>
        <p className="text-sm text-slate-500 mt-1">费用分析和优化建议</p>
      </div>
      <ReportListClient initialReports={reports || []} />
    </div>
  );
}
