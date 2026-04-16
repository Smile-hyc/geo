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
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle, Mail, AlertCircle, ArrowLeft } from "lucide-react";

// 统一样式规范
const primaryButtonStyle = "rounded-2xl border-2 border-transparent bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:-translate-y-1 hover:bg-blue-700 active:scale-95 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0";
const secondaryButtonStyle = "rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600 hover:text-blue-600 active:scale-95 inline-flex items-center justify-center gap-2";

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

  // 注册状态管理
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyFn, setVerifyFn] = useState<((token: string) => Promise<void>) | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  // 密码显示切换状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败，请重试");
    }
  };

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

  const finishLogin = async (email: string, username: string) => {
    const loginState = await getLoginState();
    if (!loginState) throw new Error("登录状态获取失败，请重新登录");
    const uid = loginState.user.uid ?? email;
    const dbUser = await syncUserToDb({ username, email, cloudbase_uid: uid });
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

  // ── 第二步：输入验证码 ──────────────────────────────────
  if (step === "verify") {
    return (
      <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <CardHeader className="text-center md:text-left pb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto md:mx-0">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">验证邮箱</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
            验证码已发送至 <span className="font-bold text-blue-600">{pendingEmail}</span>，请查收邮件并输入 6 位验证码。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">邮箱验证码</Label>
            <Input
              id="otp"
              placeholder="请输入 6 位验证码"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={10}
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-12 text-center text-lg font-bold tracking-[0.5em]"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-3">
            <button className={primaryButtonStyle + " w-full h-12"} onClick={onVerify} disabled={verifying}>
              {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              确认验证
            </button>
            <button
              className={secondaryButtonStyle + " w-full h-12"}
              onClick={() => { setStep("form"); setError(null); setOtp(""); }}
            >
              返回修改信息
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── 第一步：填写注册信息 ────────────────────────────────
  return (
    <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6 text-center md:text-left">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">Join GeoAnnotate</p>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">创建账号</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">加入 GeoAnnotate 开始您的地理探索之旅。</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">用户名</Label>
            <Input
              id="username"
              placeholder="探索者昵称"
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11"
              {...register("username")}
            />
            {errors.username && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11"
              {...register("email")}
            />
            {errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">设置密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="" 
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">确认密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder=""
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 pr-11"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" className={primaryButtonStyle + " w-full h-12 mt-4"} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />正在发送...</> : <><UserPlus className="h-5 w-5" />发送验证码</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-slate-500">
            已有账号？ <Link href="/auth/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">立即登录</Link>
          </p>
          <Link href="/app/home" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mt-2">
            <ArrowLeft className="h-3 w-3" /> 返回应用首页
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
