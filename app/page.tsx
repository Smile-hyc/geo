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
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617,#0f172a_35%,#f8fafc_35%)] text-foreground">
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
            GeoAnnotate Platform
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            A clearer split between public docs and the geo-annotation gameplay app.
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            The landing page now reflects the requirement document: a public Wiki
            under <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">/wiki</code>
            and a task-focused application under
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">/app</code>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app/home" className="inline-flex items-center gap-2">
                Enter platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/wiki">Browse wiki</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 shadow-xl shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Core platform
            </CardTitle>
            <CardDescription>
              Human reasoning capture, AI battles, points, rewards, and admin workflows.
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
          <Card className="border-slate-200 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-600" />
                Public wiki
              </CardTitle>
              <CardDescription>
                Sphinx-style onboarding content, reading paths, datasets, tools, and lab notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/wiki">Open /wiki</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-rose-600" />
                Requirement-driven MVP
              </CardTitle>
              <CardDescription>
                The repo now exposes the route partitions and placeholder surfaces
                requested by the new requirement document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Added /app and /auth route groups that mirror the document.</p>
              <p>Kept /wiki visually separate and public.</p>
              <p>Reserved admin surfaces for users, AI models, analytics, and rewards.</p>
              <div className="pt-2">
                <Button asChild variant="ghost" className="px-0">
                  <Link href="/admin" className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Open admin area
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
