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
import { sendPasswordResetCode, resetPasswordWithCode } from "@/lib/cloudbase";
import { 
  Loader2, 
  Mail, 
  KeyRound, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck
} from "lucide-react";

// 统一样式规范
const primaryButtonStyle = "rounded-2xl border-2 border-transparent bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:-translate-y-1 hover:bg-blue-700 active:scale-95 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0";
const secondaryButtonStyle = "rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600 hover:text-blue-600 active:scale-95 inline-flex items-center justify-center gap-2";

const step1Schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

const step2Schema = z.object({
  code: z.string().min(4, "请输入验证码"),
  newPassword: z.string().min(6, "密码至少 6 位"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 密码显示状态
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  const onSendCode = async (data: Step1Data) => {
    setError(null);
    try {
      const res = await sendPasswordResetCode(data.email);
      setEmail(data.email);
      setVerificationId(res.verification_id);
      setStep("reset");
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败，请确认邮箱已注册");
    }
  };

  const onResetPassword = async (data: Step2Data) => {
    setError(null);
    try {
      await resetPasswordWithCode(email, verificationId, data.code, data.newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "重置失败，请检查验证码");
    }
  };

  // ── 成功状态 ──
  if (success) {
    return (
      <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm text-center">
        <CardHeader className="pb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-green-50 text-green-500 shadow-sm">
            <CheckCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900">密码已重置</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mt-2">
            新密码已生效，正在为您跳转至登录页...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className={primaryButtonStyle + " w-full"}>
            <Link href="/auth/login">立即登录</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── 第二步：设置新密码 ──
  if (step === "reset") {
    return (
      <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">安全验证</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 leading-relaxed">
            验证码已发送至 <span className="font-bold text-blue-600">{email}</span>，请输入验证码并设置新密码。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step2Form.handleSubmit(onResetPassword)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">验证码</Label>
              <Input
                placeholder="6 位数字"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 font-mono tracking-widest"
                {...step2Form.register("code")}
              />
              {step2Form.formState.errors.code && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{step2Form.formState.errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">新密码</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="" 
                  className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 pr-11"
                  {...step2Form.register("newPassword")}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {step2Form.formState.errors.newPassword && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{step2Form.formState.errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">确认新密码</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder=""
                  className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 pr-11"
                  {...step2Form.register("confirmPassword")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {step2Form.formState.errors.confirmPassword && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{step2Form.formState.errors.confirmPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button type="submit" className={primaryButtonStyle + " w-full h-12"} disabled={step2Form.formState.isSubmitting}>
                {step2Form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                重置账户密码
              </button>
              <button type="button" className={secondaryButtonStyle + " w-full h-12"} onClick={() => { setStep("email"); setError(null); }}>
                返回修改邮箱
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ── 第一步：输入邮箱 ──
  return (
    <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">Security Recovery</p>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">忘记密码</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          请输入您的注册邮箱，我们将发送验证码帮助您重置密码。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={step1Form.handleSubmit(onSendCode)} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">电子邮箱</Label>
            <div className="relative">
              <Input
                type="email"
                placeholder="name@example.com"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-12 pl-11"
                {...step1Form.register("email")}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            {step1Form.formState.errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{step1Form.formState.errors.email.message}</p>}
          </div>
          <button type="submit" className={primaryButtonStyle + " w-full h-12"} disabled={step1Form.formState.isSubmitting}>
            {step1Form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "获取验证码"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
            <ArrowLeft className="h-3 w-3" /> 返回登录
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}