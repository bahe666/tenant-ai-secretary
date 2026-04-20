import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { buildTenantContext } from "@/lib/ai/context-builder";
import { createAssistantTools } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tenantId = user.app_metadata?.tenant_id;
  const role = user.app_metadata?.role || "member";

  if (!tenantId) {
    return new Response("Missing tenant context", { status: 400 });
  }

  // 检查秘书是否启用
  const { data: config } = await supabase
    .from("assistant_config")
    .select("is_active, enabled_features")
    .eq("tenant_id", tenantId)
    .single();

  if (config && !config.is_active) {
    return new Response("智能秘书已暂停服务", { status: 503 });
  }

  if (config && !config.enabled_features?.includes("qa")) {
    return new Response("答疑功能未启用", { status: 403 });
  }

  // 获取租户名称
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .single();

  const { messages } = await req.json();

  // 构建上下文
  const context = await buildTenantContext(tenantId);

  const systemPrompt = buildSystemPrompt(
    { id: user.id, email: user.email || "", tenant_id: tenantId, role },
    tenant?.name || "未知租户",
    context
  );

  // 创建工具
  const tools = createAssistantTools(tenantId);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    tools,
    toolChoice: "auto",
    onFinish: async ({ text }) => {
      // 写入审计日志
      try {
        const adminSupabase = (await import("@/lib/supabase/admin")).createAdminClient();
        await adminSupabase.from("assistant_audit_log").insert({
          tenant_id: tenantId,
          user_id: user.id,
          agent_instance_id: "assistant-v1",
          action_type: "query",
          request_detail: { message_count: messages.length },
          response_detail: { response_length: text?.length || 0 },
          result: "success",
          is_anomaly: false,
          timeline: [{ step: "chat_complete", timestamp: new Date().toISOString() }],
        });
      } catch {
        // 审计写入失败不影响用户体验
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
