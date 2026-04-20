import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

const supabase = createAdminClient();

/**
 * 检测即将到期的资源，生成续租方案
 */
export async function generateRenewalPlan(tenantId: string) {
  // 获取秘书配置
  const { data: config } = await supabase
    .from("assistant_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (!config || !config.enabled_features?.includes("renewal")) {
    return { error: "续租功能未启用" };
  }

  // 查询 7 天内到期的资源
  const now = new Date();
  const deadline = new Date(now.getTime() + 7 * 86400000);

  let query = supabase
    .from("resources")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "running")
    .eq("billing_type", "prepaid")
    .gt("expire_at", now.toISOString())
    .lte("expire_at", deadline.toISOString());

  // 如果配置了标签过滤
  if (config.resource_scope?.type === "tags" && config.resource_scope?.filter) {
    const tags = config.resource_scope.filter;
    for (const [key, value] of Object.entries(tags)) {
      query = query.contains("tags", { [key]: value });
    }
  }

  const { data: resources } = await query;
  if (!resources?.length) return { error: "没有即将到期的资源" };

  // 生成续租项
  const PRICE_MAP: Record<string, number> = {
    "A100-80G": 12000,
    "A100-40G": 9000,
    "V100-32G": 6000,
    "8C16G": 2400,
    "4C8G": 1200,
    "8C32G-500GB": 3600,
    "16C64G-1TB": 7200,
    "16G": 800,
  };

  const items = resources.map((r: any) => ({
    resource_id: r.resource_id,
    name: r.name,
    spec: r.spec || "标准",
    duration_months: 3,
    price: PRICE_MAP[r.spec] || 3000,
  }));

  const totalAmount = items.reduce((s: number, i: any) => s + i.price, 0);

  // 金额阈值校验
  if (totalAmount > Number(config.amount_limit_per_action)) {
    return {
      error: `方案总金额 ¥${totalAmount} 超过单次上限 ¥${config.amount_limit_per_action}`,
      items,
      totalAmount,
    };
  }

  // 写入续租方案
  const expiredAt = new Date(now.getTime() + 24 * 3600000); // 24h 后过期

  const { data: renewal, error } = await supabase
    .from("assistant_renewal")
    .insert({
      tenant_id: tenantId,
      status: "pending_approval",
      items,
      total_amount: totalAmount,
      created_by: "system",
      expired_at: expiredAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Renewal creation error:", error.message);
    return { error: error.message };
  }

  return { renewal };
}

/**
 * 审批续租方案
 */
export async function approveRenewal(renewalId: string, userId: string, tenantId: string) {
  // 获取方案
  const { data: renewal } = await supabase
    .from("assistant_renewal")
    .select("*")
    .eq("renewal_id", renewalId)
    .eq("tenant_id", tenantId)
    .single();

  if (!renewal) return { error: "方案不存在" };
  if (renewal.status !== "pending_approval") return { error: `方案状态为 ${renewal.status}，无法审批` };
  if (new Date(renewal.expired_at) < new Date()) return { error: "方案已过期" };

  // 更新为已批准
  await supabase
    .from("assistant_renewal")
    .update({ status: "approved", approved_by: userId, approved_at: new Date().toISOString() })
    .eq("renewal_id", renewalId);

  // 模拟执行续租
  await supabase
    .from("assistant_renewal")
    .update({ status: "executing" })
    .eq("renewal_id", renewalId);

  // 延长资源到期时间
  const results: any[] = [];
  for (const item of renewal.items as any[]) {
    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + (item.duration_months || 3));

    const { error } = await supabase
      .from("resources")
      .update({ expire_at: newExpiry.toISOString() })
      .eq("resource_id", item.resource_id)
      .eq("tenant_id", tenantId);

    results.push({
      resource_id: item.resource_id,
      name: item.name,
      success: !error,
      new_expire_at: newExpiry.toISOString(),
      error: error?.message,
    });
  }

  const allSuccess = results.every((r) => r.success);
  const finalStatus = allSuccess ? "completed" : "failed";

  // 更新最终状态
  await supabase
    .from("assistant_renewal")
    .update({
      status: finalStatus,
      executed_at: new Date().toISOString(),
      execution_result: { results, all_success: allSuccess },
    })
    .eq("renewal_id", renewalId);

  // 写入审计日志
  await supabase.from("assistant_audit_log").insert({
    tenant_id: tenantId,
    user_id: userId,
    agent_instance_id: "assistant-v1",
    action_type: "renewal_execute",
    resource_ids: (renewal.items as any[]).map((i: any) => i.resource_id),
    request_detail: { renewal_id: renewalId, items: renewal.items },
    response_detail: { results },
    approval_info: { approved_by: userId, approved_at: new Date().toISOString() },
    result: allSuccess ? "success" : "partial_success",
    is_anomaly: !allSuccess,
    timeline: [
      { step: "approved", timestamp: new Date().toISOString() },
      { step: "executed", timestamp: new Date().toISOString() },
    ],
  });

  return { success: allSuccess, results };
}

/**
 * 拒绝续租方案
 */
export async function rejectRenewal(renewalId: string, userId: string, tenantId: string) {
  const { error } = await supabase
    .from("assistant_renewal")
    .update({ status: "rejected" })
    .eq("renewal_id", renewalId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending_approval");

  if (error) return { error: error.message };

  await supabase.from("assistant_audit_log").insert({
    tenant_id: tenantId,
    user_id: userId,
    agent_instance_id: "assistant-v1",
    action_type: "renewal_reject",
    resource_ids: [],
    request_detail: { renewal_id: renewalId },
    result: "success",
    timeline: [{ step: "rejected", timestamp: new Date().toISOString() }],
  });

  return { success: true };
}

/**
 * 检查并过期超时方案
 */
export async function expireTimeoutRenewals(tenantId: string) {
  const { data, error } = await supabase
    .from("assistant_renewal")
    .update({ status: "expired" })
    .eq("tenant_id", tenantId)
    .eq("status", "pending_approval")
    .lt("expired_at", new Date().toISOString())
    .select("renewal_id");

  return { expired: data?.length || 0 };
}
