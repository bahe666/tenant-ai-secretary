import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedResponse();

  const { data: renewals } = await supabase
    .from("assistant_renewal")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return successResponse(renewals || []);
}
