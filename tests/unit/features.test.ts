import { describe, it, expect } from "vitest";
import { FEATURES, FEATURE_LABELS, TEMPLATES } from "@/constants/features";

describe("功能模块常量", () => {
  it("应定义 4 个功能模块", () => {
    expect(Object.keys(FEATURES)).toHaveLength(4);
  });

  it("每个功能都有中文名", () => {
    for (const feature of Object.values(FEATURES)) {
      expect(FEATURE_LABELS[feature]).toBeDefined();
    }
  });

  it("只读模板不包含续租", () => {
    expect(TEMPLATES.READONLY.features).not.toContain("renewal");
    expect(TEMPLATES.READONLY.features).toContain("qa");
    expect(TEMPLATES.READONLY.features).toContain("patrol");
    expect(TEMPLATES.READONLY.features).toContain("cost_insight");
  });

  it("完整模板包含全部 4 个功能", () => {
    expect(TEMPLATES.FULL.features).toHaveLength(4);
    expect(TEMPLATES.FULL.features).toContain("renewal");
  });
});
