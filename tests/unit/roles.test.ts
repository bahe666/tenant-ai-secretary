import { describe, it, expect } from "vitest";
import { ROLES, ROLE_LABELS, ROLE_DEFAULT_FEATURES, ADMIN_ROLES } from "@/constants/roles";

describe("角色常量", () => {
  it("应定义 5 种角色", () => {
    expect(Object.keys(ROLES)).toHaveLength(5);
  });

  it("每种角色都有中文名", () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_LABELS[role]).toBeDefined();
      expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
    }
  });

  it("每种角色都有默认功能权限", () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_DEFAULT_FEATURES[role]).toBeDefined();
      expect(Array.isArray(ROLE_DEFAULT_FEATURES[role])).toBe(true);
    }
  });

  it("普通成员仅有 qa 权限", () => {
    expect(ROLE_DEFAULT_FEATURES.member).toEqual(["qa"]);
  });

  it("计费管理员拥有全部功能", () => {
    expect(ROLE_DEFAULT_FEATURES.billing_admin).toContain("qa");
    expect(ROLE_DEFAULT_FEATURES.billing_admin).toContain("patrol");
    expect(ROLE_DEFAULT_FEATURES.billing_admin).toContain("cost_insight");
    expect(ROLE_DEFAULT_FEATURES.billing_admin).toContain("renewal");
  });

  it("管理员角色列表包含 super_admin 和 platform_ops", () => {
    expect(ADMIN_ROLES).toContain("super_admin");
    expect(ADMIN_ROLES).toContain("platform_ops");
    expect(ADMIN_ROLES).toHaveLength(2);
  });
});
