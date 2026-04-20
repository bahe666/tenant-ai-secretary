import { createClient } from "@/lib/supabase/server";
import { RenewalListClient } from "@/components/renewals/renewal-list-client";

export default async function RenewalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role || "member";

  const { data: renewals } = await supabase
    .from("assistant_renewal")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">续租管理</h1>
        <p className="text-sm text-slate-500 mt-1">资源续租方案和审批</p>
      </div>
      <RenewalListClient initialRenewals={renewals || []} userRole={role} />
    </div>
  );
}
