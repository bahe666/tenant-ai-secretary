import { createClient } from "@/lib/supabase/server";
import { AlertList } from "@/components/alerts/alert-list";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: alerts } = await supabase
    .from("assistant_alert")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">巡检提醒</h1>
          <p className="text-sm text-slate-500 mt-1">资源巡检和异常提醒</p>
        </div>
      </div>
      <AlertList initialAlerts={alerts || []} />
    </div>
  );
}
