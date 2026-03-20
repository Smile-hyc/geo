"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithEmail, syncUserToDb } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const loginState = await signInWithEmail(data.email, data.password);
      if (!loginState) throw new Error("登录失败");
      const uid = loginState.user.uid ?? data.email;
      const email = data.email;
      const dbUser = await syncUserToDb({
        username: email.split("@")[0],
        email,
      });
      setUser({
        uid,
        email,
        username: dbUser.username || email.split("@")[0],
        role: dbUser.role || "user",
        points_balance: dbUser.points_balance ?? 0,
        level: dbUser.level ?? 1,
      });
      router.push("/app/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败，请重试");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">欢迎回来</CardTitle>
        <CardDescription>登录 GeoAnnotate 开始标注</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中…" : "登录"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            忘记密码？
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            立即注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
