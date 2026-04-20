import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  successResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorizedResponse();

  const { error } = await supabase
    .from("assistant_alert")
    .update({ status: "read" })
    .eq("alert_id", id);

  if (error) return successResponse(null, error.message);
  return successResponse({ alert_id: id, status: "read" });
}
