// 功能模块定义
export const FEATURES = {
  QA: "qa",
  PATROL: "patrol",
  COST_INSIGHT: "cost_insight",
  RENEWAL: "renewal",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

// 功能中文名
export const FEATURE_LABELS: Record<Feature, string> = {
  qa: "专属答疑",
  patrol: "主动巡检",
  cost_insight: "成本洞察",
  renewal: "自动续租",
};

// 功能描述
export const FEATURE_DESCRIPTIONS: Record<Feature, string> = {
  qa: "基于租户上下文的智能问答，支持资源查询、文档检索、费用查询",
  patrol: "定期巡检资源状态，发现异常时主动推送提醒",
  cost_insight: "自动生成成本分析报告和优化建议",
  renewal: "自动生成续租方案，经人工确认后执行",
};

// 预设模板
export const TEMPLATES = {
  READONLY: {
    id: "readonly",
    name: "只读秘书",
    description: "答疑 + 巡检 + 成本报告，无操作能力",
    features: ["qa", "patrol", "cost_insight"] as Feature[],
  },
  FULL: {
    id: "full",
    name: "续租秘书",
    description: "全部功能，包含续租能力",
    features: ["qa", "patrol", "cost_insight", "renewal"] as Feature[],
  },
} as const;
