"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const DEMO_ACCOUNTS = [
  { name: "张工", role: "研发工程师", email: "zhang@acme.com", tenant: "星辰科技", color: "bg-blue-100 text-blue-800" },
  { name: "李管理", role: "资源管理员", email: "li@acme.com", tenant: "星辰科技", color: "bg-green-100 text-green-800" },
  { name: "王财务", role: "计费管理员", email: "wang@acme.com", tenant: "星辰科技", color: "bg-amber-100 text-amber-800" },
  { name: "赵总监", role: "租户超管", email: "zhao@acme.com", tenant: "星辰科技", color: "bg-purple-100 text-purple-800" },
  { name: "创新实验室", role: "超级管理员", email: "user@innovlab.com", tenant: "创新实验室", color: "bg-rose-100 text-rose-800" },
];

const DEMO_PASSWORD = "demo123456";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // 进入登录页时清除旧 session，确保可以切换账号
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Full page reload to ensure cookies are sent with the next request
      window.location.href = "/console";
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: DEMO_PASSWORD,
    });

    if (error) {
      setError("演示账号登录失败: " + error.message);
      setLoading(false);
    } else {
      window.location.href = "/console";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.13c-1.052.177-2.131.252-3.22.252h-4.286c-1.089 0-2.168-.075-3.22-.252l-.772-.13c-1.717-.293-2.299-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">智能秘书</h1>
          </div>
          <p className="text-sm text-slate-500">租户专属智能秘书 MVP Demo</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">登录</CardTitle>
            <CardDescription>输入账号密码或使用演示账号快速体验</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">演示账号快速登录</CardTitle>
            <CardDescription className="text-xs">点击即可切换不同角色体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account.email)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {account.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{account.tenant}</Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${account.color}`}>
                    {account.role}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
