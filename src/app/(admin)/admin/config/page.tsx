"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConfigPanel } from "@/components/admin/config-panel";

export default function ConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("assistant_config").select("*").single();
      setConfig(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">功能配置</h1><p className="text-sm text-slate-500 mt-1">配置秘书功能模块和操作范围</p></div>
      {loading ? <p className="text-slate-400">加载中...</p> : <ConfigPanel initialConfig={config} />}
    </div>
  );
}
