"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getLoginState, signUpWithEmail, syncUserToDb } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const schema = z
  .object({
    username: z.string().min(2, "用户名至少需要 2 个字符。").max(20, "用户名最多 20 个字符。"),
    email: z.string().email("请输入有效的邮箱地址。"),
    password: z.string().min(6, "密码至少需要 6 个字符。"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyFn, setVerifyFn] = useState<((token: string) => Promise<void>) | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const finishLogin = async (email: string, username: string) => {
    const loginState = await getLoginState();
    if (!loginState) throw new Error("账号已创建，但未获取到登录状态。");
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
    router.push("/app/home");
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const { verifyOtp } = await signUpWithEmail(data.email, data.password);
      if (verifyOtp === null) {
        await finishLogin(data.email, data.username);
        return;
      }
      setVerifyFn(() => verifyOtp);
      setPendingEmail(data.email);
      setPendingUsername(data.username);
      setStep("verify");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "注册失败。");
    }
  };

  const onVerify = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      setError("请输入验证码。");
      return;
    }
    if (!verifyFn) return;

    setError(null);
    setVerifying(true);
    try {
      await verifyFn(otp.trim());
      await finishLogin(pendingEmail, pendingUsername);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "验证码校验失败。");
    } finally {
      setVerifying(false);
    }
  };

  if (step === "verify") {
    return (
      <Card className="border-none shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-black">验证邮箱</CardTitle>
          <CardDescription>
            请输入发送到 {pendingEmail} 的验证码。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="otp">验证码</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={10}
              className="text-center tracking-[0.5em] text-2xl font-bold rounded-2xl h-16"
              autoFocus
            />
          </div>

          <Button onClick={onVerify} className="w-full h-12" disabled={verifying}>
            {verifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
            完成验证
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setStep("form");
              setOtp("");
              setError(null);
            }}
            className="w-full h-12"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回修改信息
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-black">注册</CardTitle>
        <CardDescription>
          开启您的地理标注竞技之旅。
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

          <Field label="用户名" error={errors.username?.message}>
            <Input placeholder="您的称呼" className="rounded-2xl h-12" {...register("username")} />
          </Field>
          
          <Field label="邮箱" error={errors.email?.message}>
            <Input type="email" placeholder="name@example.com" className="rounded-2xl h-12" {...register("email")} />
          </Field>

          <Field label="密码" error={errors.password?.message}>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                className="pr-12 rounded-2xl h-12" 
                {...register("password")} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <Field label="确认密码" error={errors.confirmPassword?.message}>
            <div className="relative">
              <Input 
                type={showConfirmPassword ? "text" : "password"} 
                className="pr-12 rounded-2xl h-12" 
                {...register("confirmPassword")} 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            立即注册
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-50 pt-6">
        <p className="text-sm text-slate-500">
          已有账号？{" "}
          <Link href="/auth/login" className="font-bold text-primary hover:underline">
            返回登录
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="ml-1">{label}</Label>
      {children}
      {error ? <p className="text-xs font-bold text-red-500 ml-1">{error}</p> : null}
    </div>
  );
}
