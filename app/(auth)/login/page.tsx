"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signInWithEmail, syncUserToDb } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址。"),
  password: z.string().min(6, "密码至少需要 6 个字符。"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const loginState = await signInWithEmail(data.email, data.password);
      if (!loginState) throw new Error("登录失败。");
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败。");
    }
  };

  return (
    <Card className="border-none shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-black">登录</CardTitle>
        <CardDescription>
          欢迎回来，请登录您的工作台。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              className="rounded-2xl h-12"
              {...register("email")} 
            />
            {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link href="/auth/forgot-password" title="找回密码" className="text-xs font-bold text-primary hover:underline">
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                className="pr-12 rounded-2xl h-12"
                {...register("password")} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            立即登录
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">或者</span>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500">
          还没有账号？{" "}
          <Link href="/auth/register" className="font-bold text-primary hover:underline">
            立即注册
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
