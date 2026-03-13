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
import { signUpWithEmail, getLoginState, syncUserToDb } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(2, "用户名至少 2 个字符").max(20, "用户名最多 20 个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  // 两步注册状态
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyFn, setVerifyFn] = useState<((token: string) => Promise<void>) | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // 第一步：提交注册表单，触发验证码发送
  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const { verifyOtp } = await signUpWithEmail(data.email, data.password);

      if (verifyOtp === null) {
        // 无需 OTP，直接获取登录状态
        await finishLogin(data.email, data.username);
        return;
      }

      // 需要 OTP 验证，切换到第二步
      setVerifyFn(() => verifyOtp);
      setPendingEmail(data.email);
      setPendingUsername(data.username);
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败，请重试");
    }
  };

  // 第二步：验证邮箱验证码
  const onVerify = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      setError("请输入验证码");
      return;
    }
    if (!verifyFn) return;

    setError(null);
    setVerifying(true);
    try {
      await verifyFn(otp.trim());
      await finishLogin(pendingEmail, pendingUsername);
    } catch (e) {
      setError(e instanceof Error ? e.message : "验证失败，请重试");
    } finally {
      setVerifying(false);
    }
  };

  // 完成注册登录流程：同步用户到数据库并跳转
  const finishLogin = async (email: string, username: string) => {
    const loginState = await getLoginState();
    if (!loginState) throw new Error("登录状态获取失败，请重新登录");
    const uid = loginState.user.uid ?? email;
    const dbUser = await syncUserToDb({ username, email });
    setUser({
      uid,
      email,
      username: dbUser.username || username,
      role: dbUser.role || "user",
      points_balance: dbUser.points_balance ?? 0,
      level: dbUser.level ?? 1,
    });
    router.push("/home");
  };

  // ── 第二步：输入验证码 ──────────────────────────────────
  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">验证邮箱</CardTitle>
          <CardDescription>
            验证码已发送至 <span className="font-medium text-foreground">{pendingEmail}</span>，
            请查收邮件并输入 6 位验证码
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="otp">邮箱验证码</Label>
            <Input
              id="otp"
              placeholder="请输入验证码（如 101365）"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={10}
              autoFocus
            />
          </div>
          <Button className="w-full" onClick={onVerify} disabled={verifying}>
            {verifying ? "验证中…" : "确认验证"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { setStep("form"); setError(null); setOtp(""); }}
          >
            返回修改信息
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── 第一步：填写注册信息 ────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">创建账号</CardTitle>
        <CardDescription>加入 GeoAnnotate 开始地理探索</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="地理探索者"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "发送验证码…" : "注册"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            立即登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
