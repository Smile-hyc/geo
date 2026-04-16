"use client";

import Link from "next/link";
import { Crosshair, Gift, Swords, Trophy } from "lucide-react";

type Action = {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
};

const MAIN_ACTIONS: Action[] = [
  {
    href: "/app/annotate/mode",
    title: "\u5f00\u59cb\u6807\u6ce8",
    subtitle: "\u5355\u5f20\u4efb\u52a1\u6807\u6ce8\u6d41\u7a0b",
    icon: Crosshair,
  },
  {
    href: "/app/battle",
    title: "\u5f00\u59cb\u5bf9\u6218",
    subtitle: "\u4e0e AI \u591a\u8f6e\u5bf9\u6218",
    icon: Swords,
  },
  {
    href: "/app/rewards",
    title: "\u79ef\u5206\u5956\u52b1",
    subtitle: "\u4f7f\u7528\u79ef\u5206\u5151\u6362\u5956\u52b1",
    icon: Gift,
  },
  {
    href: "/app/leaderboard",
    title: "\u6392\u884c\u699c",
    subtitle: "\u67e5\u770b\u5168\u7ad9\u79ef\u5206\u6392\u884c",
    icon: Trophy,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-78px)] py-6">
      <section className="mx-auto w-full max-w-[980px]">
        <p className="text-xs uppercase tracking-[0.2em] text-[#b3cfbd]">
          {"\u4e3b\u83dc\u5355"}
        </p>
        <h1 className="mt-3 font-['Jockey_One'] text-[clamp(3.2rem,10vw,6.2rem)] leading-[0.88] text-[#f2fff5]">
          GeoAnnotate
        </h1>
        <p className="mt-3 text-base text-[#bfd6c7]">
          {"\u9009\u62e9\u4e00\u4e2a\u6a21\u5f0f\u7ee7\u7eed\u4f7f\u7528\u5e73\u53f0\u3002"}
        </p>

        <div className="mt-7 overflow-hidden rounded-md border border-[#335642] bg-[rgba(12,24,16,0.6)]">
          {MAIN_ACTIONS.map((action, index) => (
            <ActionRow
              key={action.href}
              action={action}
              bordered={index !== MAIN_ACTIONS.length - 1}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionRow({
  action,
  bordered,
}: {
  action: Action;
  bordered: boolean;
}) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className={[
        "group flex items-center gap-4 px-5 py-5 transition hover:bg-[rgba(28,49,36,0.75)]",
        bordered ? "border-b border-[#2f4f3d]" : "",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[rgba(45,84,57,0.75)] text-[#dff4e7]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight text-[#eafcf0]">
          {action.title}
        </p>
        <p className="mt-1 text-sm text-[#b4cdbd]">{action.subtitle}</p>
      </div>
    </Link>
  );
}
