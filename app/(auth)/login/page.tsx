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
    <div className="wg-panel p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[#abc8b6]">身份验证</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#f2fff5]">登录</h1>
      <p className="mt-1 text-sm text-[#bed5c5]">继续进入你的工作台。</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.14em] text-[#aac6b4]">
              邮箱
            </Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? <p className="text-xs text-red-200">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs uppercase tracking-[0.14em] text-[#aac6b4]">
              密码
            </Label>
            <Link href="/auth/forgot-password" className="text-xs text-[#b7d2c2] hover:text-white">
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} className="pr-10" {...register("password")} />
            <button
              type="button"
              onClick={() => setShowPassword((state) => !state)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#b6cdbf]"
              aria-label="切换密码可见性"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-xs text-red-200">{errors.password.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.9)] text-sm font-semibold text-white"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          登录
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#bfd5c7]">
        还没有账号？{" "}
        <Link href="/auth/register" className="font-semibold text-[#f2fff5]">
          注册
        </Link>
      </p>
    </div>
  );
}
