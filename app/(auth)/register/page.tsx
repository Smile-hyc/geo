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
  Mail,
  UserPlus,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="wg-panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#abc8b6]">邮箱验证</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#f2fff5]">验证账号</h1>
        <p className="mt-1 text-sm text-[#bed5c5]">请输入发送到 {pendingEmail} 的验证码。</p>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-xs uppercase tracking-[0.14em] text-[#aac6b4]">
              验证码
            </Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={10}
              className="text-center tracking-[0.2em]"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={onVerify}
            disabled={verifying}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.9)] text-sm font-semibold text-white"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            验证
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("form");
              setOtp("");
              setError(null);
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#3f644c] bg-[rgba(20,37,27,0.82)] text-sm font-semibold text-[#deefe4]"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wg-panel p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[#abc8b6]">身份验证</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#f2fff5]">注册</h1>
      <p className="mt-1 text-sm text-[#bed5c5]">创建账号后即可开始标注任务。</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <Field label="用户名" error={errors.username?.message}>
          <Input {...register("username")} />
        </Field>
        <Field label="邮箱" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="密码" error={errors.password?.message}>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} className="pr-10" {...register("password")} />
            <button
              type="button"
              onClick={() => setShowPassword((state) => !state)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#b6cdbf]"
              aria-label="切换密码可见性"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="确认密码" error={errors.confirmPassword?.message}>
          <div className="relative">
            <Input type={showConfirmPassword ? "text" : "password"} className="pr-10" {...register("confirmPassword")} />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((state) => !state)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#b6cdbf]"
              aria-label="切换确认密码可见性"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#4b795d] bg-[rgba(36,87,52,0.9)] text-sm font-semibold text-white"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          注册
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#bfd5c7]">
        已有账号？{" "}
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
