"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithEmail, syncUserToDb } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { Loader2, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

// 统一样式规范 - 复用自 AnnotatePage/ProfilePage
const primaryButtonStyle = "rounded-2xl border-2 border-transparent bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:-translate-y-1 hover:bg-blue-700 active:scale-95 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  
  // 新增状态：控制密码可见性
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
      if (!loginState) throw new Error("登录失败");
      const uid = loginState.user.uid ?? data.email;
      const email = data.email;
      const dbUser = await syncUserToDb({
        username: email.split("@")[0],
        email,
        cloudbase_uid: uid,
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
    <Card className="rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6 text-center md:text-left">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
          Welcome Back
        </p>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap">
          欢迎回来
        </CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          登录 GeoAnnotate 开始地理数据标注。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
              邮箱地址
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                密码
              </Label>
              <Link href="/auth/forgot-password" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                忘记密码？
              </Link>
            </div>
            
            {/* 密码输入框容器 */}
            <div className="relative">
              <Input
                id="password"
                // 动态切换 type
                type={showPassword ? "text" : "password"}
                placeholder="" // 保持干净，移除伪掩码 placeholder
                // pr-11 确保文字不会重叠到眼睛图标上
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white transition-all h-11 pr-11"
                {...register("password")}
              />
              {/* 眼睛图标按钮 */}
              <button
                type="button" // 必须显式声明 type="button"，防止点击触发表单提交
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {errors.password && (
              <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.password.message}</p>
            )}
          </div>

          <button 
            type="submit" 
            className={primaryButtonStyle + " w-full h-12 mt-2"} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                正在验证
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                立即登录
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-medium text-slate-500">
            还没有账号？{" "}
            <Link href="/auth/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
