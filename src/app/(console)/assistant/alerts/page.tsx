"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertList } from "@/components/alerts/alert-list";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_alert").select("*").order("created_at", { ascending: false }).limit(100);
      setAlerts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">巡检提醒</h1>
        <p className="text-sm text-slate-500 mt-1">资源巡检和异常提醒</p>
      </div>
      {loading ? <div className="py-12 text-center text-slate-400">加载中...</div> : <AlertList initialAlerts={alerts} />}
    </div>
  );
}
