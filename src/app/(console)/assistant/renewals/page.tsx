"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RenewalListClient } from "@/components/renewals/renewal-list-client";

export default function RenewalsPage() {
  const { user } = useAuth();
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_renewal").select("*").order("created_at", { ascending: false }).limit(50);
      setRenewals(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">续租管理</h1><p className="text-sm text-slate-500 mt-1">资源续租方案和审批</p></div>
      {loading ? <div className="py-12 text-center text-slate-400">加载中...</div> : <RenewalListClient initialRenewals={renewals} userRole={user?.role || "member"} />}
    </div>
  );
}
