// 业务领域类型定义

// 租户
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
}

// 用户
export interface User {
  id: string;
  tenant_id: string;
  display_name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

// 云资源
export interface Resource {
  id: string;
  tenant_id: string;
  resource_id: string;
  resource_type: string;
  name: string;
  spec: string | null;
  region: string;
  status: string;
  billing_type: string;
  tags: Record<string, string>;
  resource_group: string | null;
  expire_at: string | null;
  created_at: string;
}

// 账单记录
export interface BillingRecord {
  id: string;
  tenant_id: string;
  resource_id: string | null;
  date: string;
  product_type: string;
  amount: number;
  currency: string;
  created_at: string;
}

// 使用率指标
export interface UsageMetric {
  id: string;
  tenant_id: string;
  resource_id: string;
  metric_type: string;
  value: number;
  sampled_at: string;
}

// 会话
export interface AssistantSession {
  id: string;
  tenant_id: string;
  user_id: string;
  status: "active" | "closed";
  message_count: number;
  created_at: string;
  updated_at: string;
}

// 消息
export interface AssistantMessage {
  id: string;
  session_id: string;
  tenant_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Array<{ type: string; name: string; url?: string }>;
  created_at: string;
}

// 巡检提醒
export type AlertType = "resource_expiry" | "usage_anomaly" | "cost_spike" | "quota_warning";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "pending" | "read" | "dismissed";

export interface AssistantAlert {
  alert_id: string;
  tenant_id: string;
  alert_type: AlertType;
  resource_id: string | null;
  resource_name: string | null;
  severity: AlertSeverity;
  summary: string;
  detail: Record<string, unknown>;
  status: AlertStatus;
  notified_channels: string[];
  dedupe_key: string | null;
  created_at: string;
}

// 成本报告
export interface AssistantReport {
  report_id: string;
  tenant_id: string;
  report_type: "monthly" | "weekly";
  period_start: string;
  period_end: string;
  summary: {
    total: number;
    mom_change: number;
    yoy_change: number | null;
  };
  top_costs: Array<{ product: string; amount: number; percentage: number }>;
  anomalies: Array<{ date: string; amount: number; avg_amount: number; reason: string }>;
  idle_resources: Array<{
    resource_id: string;
    name: string;
    spec: string;
    avg_usage: number;
    estimated_saving: number;
  }>;
  recommendations: Array<{ action: string; target: string; saving: number }>;
  expiring_resources: Array<{
    resource_id: string;
    name: string;
    expire_at: string;
    estimated_renewal: number;
  }>;
  status: "generating" | "ready" | "failed";
  created_at: string;
}

// 续租方案
export type RenewalStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired"
  | "executing"
  | "completed"
  | "failed";

export interface RenewalItem {
  resource_id: string;
  name: string;
  spec: string;
  duration_months: number;
  price: number;
}

export interface AssistantRenewal {
  renewal_id: string;
  tenant_id: string;
  status: RenewalStatus;
  items: RenewalItem[];
  total_amount: number;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  expired_at: string;
  executed_at: string | null;
  execution_result: Record<string, unknown> | null;
  created_at: string;
}

// 审计日志
export type AuditActionType =
  | "query"
  | "alert_generate"
  | "report_generate"
  | "renewal_create"
  | "renewal_approve"
  | "renewal_reject"
  | "renewal_execute"
  | "config_change"
  | "permission_change"
  | "kill_switch";

export interface AssistantAuditLog {
  log_id: string;
  tenant_id: string;
  user_id: string | null;
  agent_instance_id: string | null;
  action_type: AuditActionType;
  resource_ids: string[];
  request_detail: Record<string, unknown>;
  response_detail: Record<string, unknown>;
  approval_info: Record<string, unknown> | null;
  result: "success" | "failure" | "partial_success";
  is_anomaly: boolean;
  timeline: Array<{ step: string; timestamp: string }>;
  created_at: string;
}

// 秘书配置
export interface AssistantConfig {
  config_id: string;
  tenant_id: string;
  enabled_features: string[];
  template_id: string;
  resource_scope: {
    type: "all" | "tags" | "resource_group";
    filter?: Record<string, string>;
  };
  amount_limit_per_action: number;
  amount_limit_per_month: number;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

// 权限规则
export interface AssistantPermissionRule {
  rule_id: string;
  tenant_id: string;
  role_name: string;
  allowed_features: string[];
  resource_constraints: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 提醒偏好
export interface AssistantAlertPreference {
  preference_id: string;
  tenant_id: string;
  user_id: string;
  enabled_alert_types: AlertType[];
  channels: { in_app: boolean; sms: boolean; email: boolean };
  frequency: "realtime" | "daily_digest" | "weekly_digest";
  quiet_hours: { start: string; end: string };
  updated_at: string;
}
