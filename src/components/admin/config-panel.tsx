"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { id: "qa", name: "专属答疑", desc: "基于租户上下文的智能问答", risk: "低" },
  { id: "patrol", name: "主动巡检", desc: "定期巡检资源状态，主动推送提醒", risk: "低" },
  { id: "cost_insight", name: "成本洞察", desc: "自动生成成本报告和优化建议", risk: "低" },
  { id: "renewal", name: "自动续租", desc: "自动生成续租方案，需人工确认后执行", risk: "高" },
];

const TEMPLATES = [
  { id: "readonly", name: "只读秘书", features: ["qa", "patrol", "cost_insight"] },
  { id: "full", name: "续租秘书", features: ["qa", "patrol", "cost_insight", "renewal"] },
];

interface Config {
  config_id: string;
  enabled_features: string[];
  template_id: string;
  resource_scope: { type: string; filter?: Record<string, string> };
  amount_limit_per_action: number;
  amount_limit_per_month: number;
  is_active: boolean;
}

export function ConfigPanel({ initialConfig }: { initialConfig: Config | null }) {
  const [config, setConfig] = useState(initialConfig || {
    enabled_features: ["qa", "patrol", "cost_insight"],
    template_id: "readonly",
    resource_scope: { type: "all" },
    amount_limit_per_action: 50000,
    amount_limit_per_month: 200000,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  function toggleFeature(featureId: string) {
    const features = config.enabled_features || [];
    const updated = features.includes(featureId)
      ? features.filter((f: string) => f !== featureId)
      : [...features, featureId];
    setConfig({ ...config, enabled_features: updated });
  }

  function applyTemplate(templateId: string) {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl) setConfig({ ...config, enabled_features: tpl.features, template_id: templateId });
  }

  async function save() {
    setSaving(true);
    try {
      // In a real app this would call an API to update config
      alert("配置已保存（演示模式）");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 秘书状态 */}
      <Card>
        <CardHeader><CardTitle className="text-base">秘书运行状态</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">当前状态：<Badge variant={config.is_active ? "default" : "destructive"}>{config.is_active ? "运行中" : "已暂停"}</Badge></p>
            </div>
            <Button variant={config.is_active ? "destructive" : "default"} size="sm"
              onClick={() => setConfig({ ...config, is_active: !config.is_active })}>
              {config.is_active ? "紧急终止" : "恢复运行"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 预设模板 */}
      <Card>
        <CardHeader><CardTitle className="text-base">预设模板</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${
                  config.template_id === tpl.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                <p className="font-medium text-sm">{tpl.name}</p>
                <p className="text-xs text-slate-500 mt-1">{tpl.features.length} 个功能</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 功能开关 */}
      <Card>
        <CardHeader><CardTitle className="text-base">功能模块开关</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{f.name}</p>
                    <Badge variant={f.risk === "高" ? "destructive" : "secondary"} className="text-xs">{f.risk}风险</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
                <button onClick={() => toggleFeature(f.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    (config.enabled_features || []).includes(f.id) ? "bg-blue-600" : "bg-slate-300"
                  }`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    (config.enabled_features || []).includes(f.id) ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 金额阈值 */}
      <Card>
        <CardHeader><CardTitle className="text-base">金额阈值设置</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">单次续租上限</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400">¥</span>
                <input type="number" value={config.amount_limit_per_action}
                  onChange={e => setConfig({ ...config, amount_limit_per_action: Number(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">每月累计上限</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400">¥</span>
                <input type="number" value={config.amount_limit_per_month}
                  onChange={e => setConfig({ ...config, amount_limit_per_month: Number(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "保存中..." : "保存配置"}</Button>
      </div>
    </div>
  );
}
