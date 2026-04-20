import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAllPatrols } from "@/lib/services/alert-service";
import {
  successResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorizedResponse();

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) return unauthorizedResponse();

  const alerts = await runAllPatrols(tenantId);
  return successResponse({ generated: alerts.length, alerts });
}
