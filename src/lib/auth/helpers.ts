import { createClient } from "@/lib/supabase/server";
import { type Role, ADMIN_ROLES } from "@/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
  role: Role;
}

/**
 * 从 Supabase Auth 获取当前用户信息
 * 包含 tenant_id 和 role（从 app_metadata 提取）
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    tenant_id: user.app_metadata?.tenant_id,
    role: user.app_metadata?.role || "member",
  };
}

/**
 * 检查用户是否有管理端权限
 */
export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * 检查用户是否有某功能的权限
 */
export function hasFeatureAccess(
  role: Role,
  feature: string,
  allowedFeatures?: string[]
): boolean {
  // 如果有自定义权限配置，使用自定义配置
  if (allowedFeatures) {
    return allowedFeatures.includes(feature);
  }

  // 否则使用角色默认权限
  const { ROLE_DEFAULT_FEATURES } = require("@/constants/roles");
  return ROLE_DEFAULT_FEATURES[role]?.includes(feature) ?? false;
}
