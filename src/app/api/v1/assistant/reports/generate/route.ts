import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMonthlyReport } from "@/lib/services/report-service";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedResponse();

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) return unauthorizedResponse();

  // 默认生成上月报告
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const report = await generateMonthlyReport(tenantId, year, lastMonth);
  return successResponse(report);
}
