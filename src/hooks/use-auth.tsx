"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  displayName: string;
  tenantName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          if (mounted) {
            setUser(null);
            setLoading(false);
            // 非登录页重定向
            if (pathname !== "/login") {
              router.replace("/login");
            }
          }
          return;
        }

        const tenantId = authUser.app_metadata?.tenant_id;
        const role = authUser.app_metadata?.role || "member";

        // 并行获取 profile 和 tenant
        const [profileRes, tenantRes] = await Promise.all([
          supabase.from("users").select("display_name").eq("id", authUser.id).single(),
          supabase.from("tenants").select("name").eq("id", tenantId).single(),
        ]);

        if (mounted) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            tenantId,
            role,
            displayName: profileRes.data?.display_name || authUser.email || "",
            tenantName: tenantRes.data?.name || "未知租户",
          });
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadUser();

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        router.replace("/login");
      } else if (event === "SIGNED_IN") {
        loadUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
