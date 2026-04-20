import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  member: "普通成员", resource_admin: "资源管理员",
  billing_admin: "计费管理员", super_admin: "租户超管",
};

const FEATURE_LABELS: Record<string, string> = {
  qa: "专属答疑", patrol: "主动巡检", cost_insight: "成本洞察", renewal: "自动续租",
};

export default async function PermissionsPage() {
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("assistant_permission_rule")
    .select("*")
    .order("role_name");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">权限管理</h1>
        <p className="text-sm text-slate-500 mt-1">角色权限和资源约束配置</p>
      </div>

      {/* 权限总览 */}
      <Card>
        <CardHeader><CardTitle className="text-base">角色-功能映射</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left text-slate-500 text-xs">角色</th>
                  <th className="py-2 text-center text-slate-500 text-xs">专属答疑</th>
                  <th className="py-2 text-center text-slate-500 text-xs">主动巡检</th>
                  <th className="py-2 text-center text-slate-500 text-xs">成本洞察</th>
                  <th className="py-2 text-center text-slate-500 text-xs">自动续租</th>
                </tr>
              </thead>
              <tbody>
                {(rules || []).map((rule: Record<string, unknown>) => (
                  <tr key={rule.rule_id as string} className="border-b last:border-0">
                    <td className="py-3">
                      <Badge variant="outline">{ROLE_LABELS[rule.role_name as string] || rule.role_name as string}</Badge>
                    </td>
                    {["qa", "patrol", "cost_insight", "renewal"].map(feature => (
                      <td key={feature} className="py-3 text-center">
                        {(rule.allowed_features as string[])?.includes(feature) ? (
                          <span className="text-green-600 text-lg">✓</span>
                        ) : (
                          <span className="text-slate-300 text-lg">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 权限来源说明 */}
      <Card>
        <CardHeader><CardTitle className="text-base">权限继承说明</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• 秘书权限遵循平台现有 RBAC 体系，不引入新的角色模型</p>
            <p>• <strong>第一层（角色）</strong>：角色决定可使用的功能模块</p>
            <p>• <strong>第二层（属性）</strong>：在角色允许范围内，通过资源标签进一步限制操作边界</p>
            <p>• 系统强制：秘书只能操作本租户的资源，跨租户操作被 RLS 拦截</p>
            <p>• 金额限制：单次和每月续租金额有上限设置</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
