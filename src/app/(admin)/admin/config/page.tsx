import { createClient } from "@/lib/supabase/server";
import { ConfigPanel } from "@/components/admin/config-panel";

export default async function ConfigPage() {
  const supabase = await createClient();
  const { data: config } = await supabase.from("assistant_config").select("*").single();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">功能配置</h1>
        <p className="text-sm text-slate-500 mt-1">配置秘书功能模块和操作范围</p>
      </div>
      <ConfigPanel initialConfig={config} />
    </div>
  );
}
