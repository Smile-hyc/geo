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
      setError(e instanceof Error ? e.message : "发送验证码失败，请确认邮箱已注册");
    }
  };

  const onResetPassword = async (data: Step2Data) => {
    setError(null);
    try {
      await resetPasswordWithCode(email, verificationId, data.code, data.newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "重置失败，请检查验证码是否正确");
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-green-500">密码已重置</CardTitle>
          <CardDescription>
            新密码已生效，即将跳转到登录页…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">立即登录</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "reset") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">设置新密码</CardTitle>
          <CardDescription>
            验证码已发送至 <span className="font-medium text-foreground">{email}</span>，
            请查收邮件并输入验证码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step2Form.handleSubmit(onResetPassword)} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">邮箱验证码</Label>
              <Input
                id="code"
                placeholder="请输入 6 位验证码"
                {...step2Form.register("code")}
                maxLength={10}
              />
              {step2Form.formState.errors.code && (
                <p className="text-xs text-destructive">{step2Form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="至少 6 位"
                {...step2Form.register("newPassword")}
              />
              {step2Form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{step2Form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                {...step2Form.register("confirmPassword")}
              />
              {step2Form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{step2Form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={step2Form.formState.isSubmitting}
            >
              {step2Form.formState.isSubmitting ? "重置中…" : "重置密码"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
            >
              返回修改邮箱
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">忘记密码</CardTitle>
        <CardDescription>
          输入注册时使用的邮箱，我们将发送验证码帮助您重置密码
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={step1Form.handleSubmit(onSendCode)} className="space-y-4">
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
              {...step1Form.register("email")}
            />
            {step1Form.formState.errors.email && (
              <p className="text-xs text-destructive">{step1Form.formState.errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={step1Form.formState.isSubmitting}
          >
            {step1Form.formState.isSubmitting ? "发送中…" : "发送验证码"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            返回登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
