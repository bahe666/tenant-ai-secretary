"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RenewalApprovalClient } from "@/components/renewals/renewal-approval-client";

export default function RenewalDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [renewal, setRenewal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_renewal").select("*").eq("renewal_id", params.id).single();
      setRenewal(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <div className="p-6"><p className="text-slate-400">加载中...</p></div>;
  if (!renewal) return <div className="p-6"><p className="text-red-500">方案不存在</p></div>;

  const canApprove = ["billing_admin", "super_admin"].includes(user?.role || "") && renewal.status === "pending_approval" && new Date(renewal.expired_at) > new Date();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">续租方案详情</h1>
        <p className="text-sm text-slate-500 mt-1">创建于 {new Date(renewal.created_at).toLocaleString("zh-CN")}</p>
      </div>
      <RenewalApprovalClient renewal={renewal} canApprove={canApprove} />
    </div>
  );
}
