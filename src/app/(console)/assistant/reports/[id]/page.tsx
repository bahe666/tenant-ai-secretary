"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ReportDetail } from "@/components/reports/report-detail";

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_report").select("*").eq("report_id", params.id).single();
      setReport(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <div className="p-6"><p className="text-slate-400">加载中...</p></div>;
  if (!report) return <div className="p-6"><p className="text-red-500">报告不存在</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{report.period_start?.slice(0, 7)} 月度成本报告</h1>
        <p className="text-sm text-slate-500 mt-1">{report.period_start} ~ {report.period_end}</p>
      </div>
      <ReportDetail report={report} />
    </div>
  );
}
