"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = { member: "普通成员", resource_admin: "资源管理员", billing_admin: "计费管理员", super_admin: "租户超管" };

export default function PermissionsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_permission_rule").select("*").order("role_name");
      setRules(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">权限管理</h1><p className="text-sm text-slate-500 mt-1">角色权限和资源约束配置</p></div>
      {loading ? <p className="text-slate-400">加载中...</p> : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">角色-功能映射</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="py-2 text-left text-slate-500 text-xs">角色</th><th className="py-2 text-center text-xs text-slate-500">答疑</th><th className="py-2 text-center text-xs text-slate-500">巡检</th><th className="py-2 text-center text-xs text-slate-500">成本</th><th className="py-2 text-center text-xs text-slate-500">续租</th></tr></thead>
                <tbody>{rules.map((r: any) => (
                  <tr key={r.rule_id} className="border-b last:border-0">
                    <td className="py-3"><Badge variant="outline">{ROLE_LABELS[r.role_name] || r.role_name}</Badge></td>
                    {["qa","patrol","cost_insight","renewal"].map(f => (<td key={f} className="py-3 text-center">{r.allowed_features?.includes(f) ? <span className="text-green-600">&#10003;</span> : <span className="text-slate-300">&mdash;</span>}</td>))}
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-base">权限继承说明</CardTitle></CardHeader><CardContent><div className="space-y-2 text-sm text-slate-600"><p>&#8226; 第一层（角色）：角色决定可使用的功能模块</p><p>&#8226; 第二层（属性）：通过资源标签进一步限制操作边界</p><p>&#8226; 系统强制：秘书只能操作本租户的资源</p></div></CardContent></Card>
        </>
      )}
    </div>
  );
}
