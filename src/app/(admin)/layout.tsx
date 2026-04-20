"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConsoleShell } from "@/components/console/console-shell";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">加载中...</p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "super_admin" && user.role !== "platform_ops") {
      router.replace("/console");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSkeleton />;
  if (!user) return null;
  if (user.role !== "super_admin" && user.role !== "platform_ops") return null;

  return (
    <ConsoleShell
      user={{
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      }}
      tenant={{
        id: user.tenantId,
        name: user.tenantName,
        slug: "",
      }}
    >
      {children}
    </ConsoleShell>
  );
}
