// 角色定义
export const ROLES = {
  MEMBER: "member",
  RESOURCE_ADMIN: "resource_admin",
  BILLING_ADMIN: "billing_admin",
  SUPER_ADMIN: "super_admin",
  PLATFORM_OPS: "platform_ops",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// 角色中文名
export const ROLE_LABELS: Record<Role, string> = {
  member: "普通成员",
  resource_admin: "资源管理员",
  billing_admin: "计费管理员",
  super_admin: "租户超管",
  platform_ops: "平台运维",
};

// 角色对应的默认功能权限
export const ROLE_DEFAULT_FEATURES: Record<Role, string[]> = {
  member: ["qa"],
  resource_admin: ["qa", "patrol"],
  billing_admin: ["qa", "patrol", "cost_insight", "renewal"],
  super_admin: ["qa", "patrol", "cost_insight", "renewal"],
  platform_ops: ["qa", "patrol", "cost_insight", "renewal"],
};

// 管理端权限角色
export const ADMIN_ROLES: Role[] = ["super_admin", "platform_ops"];
