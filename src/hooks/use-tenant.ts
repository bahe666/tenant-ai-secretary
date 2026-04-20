"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/constants/roles";

interface TenantContext {
  userId: string;
  email: string;
  tenantId: string;
  role: Role;
  displayName: string;
  loading: boolean;
}

export function useTenant(): TenantContext {
  const [context, setContext] = useState<TenantContext>({
    userId: "",
    email: "",
    tenantId: "",
    role: "member",
    displayName: "",
    loading: true,
  });

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 获取 users 表中的 display_name
        const { data: profile } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();

        setContext({
          userId: user.id,
          email: user.email || "",
          tenantId: user.app_metadata?.tenant_id || "",
          role: user.app_metadata?.role || "member",
          displayName: profile?.display_name || user.email || "",
          loading: false,
        });
      } else {
        setContext((prev) => ({ ...prev, loading: false }));
      }
    }

    loadUser();
  }, []);

  return context;
}
