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
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithCode, sendPasswordResetCode } from "@/lib/cloudbase";

const step1Schema = z.object({
  email: z.string().email("请输入有效的邮箱地址。"),
});

const step2Schema = z
  .object({
    code: z.string().min(4, "请输入验证码。"),
    newPassword: z.string().min(6, "密码至少需要 6 个字符。"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的密码不一致。",
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "发送重置验证码失败。");
    }
  };

  const onResetPassword = async (data: Step2Data) => {
    setError(null);
    try {
      await resetPasswordWithCode(email, verificationId, data.code, data.newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "重置密码失败。");
    }
  };

  if (success) {
    return (
      <div className="wg-panel p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.86)]">
          <CheckCircle2 className="h-8 w-8 text-[#e8ffef]" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-[#f2fff5]">密码重置成功</h1>
        <p className="mt-2 text-sm text-[#bed5c5]">正在跳转到登录页...</p>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="wg-panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#abc8b6]">安全验证</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#f2fff5]">设置新密码</h1>
        <p className="mt-1 text-sm text-[#bed5c5]">验证码已发送到 {email}</p>

        <form onSubmit={step2Form.handleSubmit(onResetPassword)} className="mt-6 space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <Field label="验证码" error={step2Form.formState.errors.code?.message}>
            <Input className="tracking-[0.2em]" {...step2Form.register("code")} />
          </Field>

          <Field label="新密码" error={step2Form.formState.errors.newPassword?.message}>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} className="pr-10" {...step2Form.register("newPassword")} />
              <button
                type="button"
                onClick={() => setShowPass((state) => !state)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#b6cdbf]"
                aria-label="切换密码可见性"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="确认密码" error={step2Form.formState.errors.confirmPassword?.message}>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} className="pr-10" {...step2Form.register("confirmPassword")} />
              <button
                type="button"
                onClick={() => setShowConfirm((state) => !state)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#b6cdbf]"
                aria-label="切换确认密码可见性"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={step2Form.formState.isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.9)] text-sm font-semibold text-white"
          >
            {step2Form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            重置密码
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#3f644c] bg-[rgba(20,37,27,0.82)] text-sm font-semibold text-[#deefe4]"
          >
            返回
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="wg-panel p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[#abc8b6]">安全验证</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#f2fff5]">忘记密码</h1>
      <p className="mt-1 text-sm text-[#bed5c5]">通过邮箱获取重置验证码。</p>

      <form onSubmit={step1Form.handleSubmit(onSendCode)} className="mt-6 space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <Field label="邮箱" error={step1Form.formState.errors.email?.message}>
          <div className="relative">
            <Input type="email" className="pl-10" {...step1Form.register("email")} />
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b6cdbf]" />
          </div>
        </Field>

        <button
          type="submit"
          disabled={step1Form.formState.isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.9)] text-sm font-semibold text-white"
        >
          {step1Form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          发送验证码
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#bfd5c7]">
        返回{" "}
        <Link href="/auth/login" className="font-semibold text-[#f2fff5]">
          登录
        </Link>
      </p>
    </div>
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
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.14em] text-[#aac6b4]">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
