import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReportDetail } from "@/components/reports/report-detail";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("assistant_report")
    .select("*")
    .eq("report_id", id)
    .single();

  if (!report) notFound();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {report.period_start.slice(0, 7)} 月度成本报告
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {report.period_start} ~ {report.period_end}
        </p>
      </div>
      <ReportDetail report={report} />
    </div>
  );
}
