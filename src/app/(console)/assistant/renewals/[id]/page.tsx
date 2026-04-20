import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RenewalApprovalClient } from "@/components/renewals/renewal-approval-client";

export default async function RenewalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: renewal } = await supabase
    .from("assistant_renewal")
    .select("*")
    .eq("renewal_id", id)
    .single();

  if (!renewal) notFound();

  const role = user?.app_metadata?.role || "member";
  const canApprove = ["billing_admin", "super_admin"].includes(role) && renewal.status === "pending_approval" && new Date(renewal.expired_at) > new Date();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">续租方案详情</h1>
        <p className="text-sm text-slate-500 mt-1">
          创建于 {new Date(renewal.created_at).toLocaleString("zh-CN")}
        </p>
      </div>
      <RenewalApprovalClient renewal={renewal} canApprove={canApprove} />
    </div>
  );
}
