import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRenewalPlan } from "@/lib/services/renewal-service";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedResponse();

  const role = user.app_metadata?.role;
  if (!["billing_admin", "super_admin", "platform_ops"].includes(role)) {
    return forbiddenResponse("仅计费管理员及以上角色可生成续租方案");
  }

  const tenantId = user.app_metadata?.tenant_id;
  const result = await generateRenewalPlan(tenantId);
  return successResponse(result);
}
