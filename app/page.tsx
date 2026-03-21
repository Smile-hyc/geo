import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CORE_APP_ROUTES } from "@/features/platform/routes";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff,#f7fafc_38%,#edf4fb_100%)] text-foreground">
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl text-slate-900">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-700">
            GeoAnnotate 平台
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            把公开文档与地理标注应用明确分区。
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            首页现在按照需求文档完成拆分：公开的 Wiki 位于
            <code className="mx-1 rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">/wiki</code>
            ，任务驱动的应用位于
            <code className="mx-1 rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">/app</code>
            。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app/home" className="inline-flex items-center gap-2">
                进入平台
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/wiki">浏览 Wiki</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/80 text-slate-900 border-slate-200 hover:bg-white hover:text-slate-900"
            >
              <Link href="/auth/login">登录</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white/90 shadow-xl shadow-sky-900/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              核心应用
            </CardTitle>
            <CardDescription>
              覆盖人工推理采集、AI 对战、积分奖励与管理流程。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {CORE_APP_ROUTES.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-2xl border border-border bg-accent/20 p-4 transition hover:border-primary/50 hover:bg-accent/40"
              >
                <p className="font-medium">{route.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {route.description}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-slate-200 bg-white/90 shadow-xl shadow-sky-900/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-600" />
                公开 Wiki
              </CardTitle>
              <CardDescription>
                面向入门、阅读路径、数据集、工具和实验笔记的公开文档区。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/wiki">打开 /wiki</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-xl shadow-sky-900/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-rose-600" />
                按需求文档搭建的 MVP
              </CardTitle>
              <CardDescription>
                当前仓库已经把需求文档要求的路由分区和预留页面搭起来了。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>新增了与文档一致的 `/app` 与 `/auth` 路由分区。</p>
              <p>保留了公开且独立视觉风格的 `/wiki`。</p>
              <p>为用户、AI 模型、分析与奖励后台预留了页面位置。</p>
              <div className="pt-2">
                <Button asChild variant="ghost" className="px-0">
                  <Link href="/admin" className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    打开管理后台
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
