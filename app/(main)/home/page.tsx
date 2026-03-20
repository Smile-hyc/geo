"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  Gift,
  MapPin,
  ShieldCheck,
  Swords,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";

const ENTRY_CARDS = [
  {
    id: "annotate",
    href: "/app/annotate/mode",
    icon: <MapPin className="h-8 w-8 text-blue-500" />,
    title: "Annotation tasks",
    description:
      "Pick a data collection mode and choose whether to capture reasoning, geo-element boxes, or both.",
  },
  {
    id: "battle",
    href: "/app/battle",
    icon: <Swords className="h-8 w-8 text-rose-500" />,
    title: "AI battle",
    description:
      "Configure timed rounds, choose a mock AI opponent, and compare scores round by round.",
  },
  {
    id: "rewards",
    href: "/app/rewards",
    icon: <Gift className="h-8 w-8 text-amber-500" />,
    title: "Rewards",
    description:
      "Redeem points and inspect the current reward inventory exposed by the admin side.",
  },
  {
    id: "leaderboard",
    href: "/app/leaderboard",
    icon: <Trophy className="h-8 w-8 text-emerald-500" />,
    title: "Leaderboard",
    description:
      "Review top performers and use the ranking area as the future entry for richer stats.",
  },
  {
    id: "history",
    href: "/app/history",
    icon: <Clock className="h-8 w-8 text-violet-500" />,
    title: "History",
    description:
      "Track past annotations, battles, and the current state of your collected data.",
  },
  {
    id: "wiki",
    href: "/wiki",
    icon: <BookOpen className="h-8 w-8 text-sky-500" />,
    title: "Public wiki",
    description:
      "Open the onboarding and research documentation without mixing it into the gameplay shell.",
  },
] as const;

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <section className="rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#111827_60%,#1e293b)] px-6 py-8 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-300">
          Core App
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Welcome back, {user?.username ?? "Explorer"}.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          The platform is now organized around the requirement document: data collection,
          AI battle, user progress, and research-facing admin workflows.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="rounded-full bg-white/10 px-4 py-1.5">
            Level {user?.level ?? 1}
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1.5">
            {user?.points_balance ?? 0} points
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1.5">
            Role: {user?.role ?? "user"}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENTRY_CARDS.map((card) => (
          <Link key={card.id} href={card.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/50">
                  {card.icon}
                </div>
                <div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {card.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/app/annotate/mode">Start annotation</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/battle">Start battle</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/app/profile">Open profile</Link>
        </Button>
        {user?.role === "admin" ? (
          <Button asChild variant="secondary">
            <Link href="/admin" className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin console
            </Link>
          </Button>
        ) : null}
      </section>
    </div>
  );
}
