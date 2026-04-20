import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsoleShell } from "@/components/console/console-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role || "member";
  const tenantId = user.app_metadata?.tenant_id;

  if (role !== "super_admin" && role !== "platform_ops") {
    redirect("/console");
  }

  const [profileResult, tenantResult] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, email, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tenants")
      .select("name, slug")
      .eq("id", tenantId)
      .single(),
  ]);

  return (
    <ConsoleShell
      user={{
        id: user.id,
        displayName: profileResult.data?.display_name || user.email || "",
        email: user.email || "",
        role: role,
      }}
      tenant={{
        id: tenantId,
        name: tenantResult.data?.name || "未知租户",
        slug: tenantResult.data?.slug || "",
      }}
    >
      {children}
    </ConsoleShell>
  );
}
