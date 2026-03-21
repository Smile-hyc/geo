"use client";

import Link from "next/link";
import { useState } from "react";
import { Layers, Map, MapPin, Mountain, Satellite } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ANNOTATION_MODES, ANNOTATION_TYPES, type AnnotationTypeId } from "@/lib/modes";

const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin className="h-8 w-8 text-blue-500" />,
  remote_sensing: <Satellite className="h-8 w-8 text-emerald-500" />,
  map_mode: <Map className="h-8 w-8 text-amber-500" />,
  terrain: <Mountain className="h-8 w-8 text-stone-500" />,
  mixed: <Layers className="h-8 w-8 text-violet-500" />,
};

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] =
    useState<AnnotationTypeId>("hybrid");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">
          标注配置
        </p>
        <h1 className="text-3xl font-semibold">
          选择模式与标注流程。
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          需求文档要求明确区分思维链标注和地理元素框选两条流程。你可以先在这里选择其中一种，或直接进入混合采集流程。
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {ANNOTATION_TYPES.map((type) => {
          const selected = annotationType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setAnnotationType(type.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-medium text-primary">{type.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {type.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ANNOTATION_MODES.map((mode) => (
          <Link
            key={mode.id}
            href={`/app/annotate?mode=${encodeURIComponent(mode.id)}&annotationType=${encodeURIComponent(annotationType)}`}
          >
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/50">
                  {MODE_ICONS[mode.id] ?? (
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="mt-3">{mode.name}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>默认奖励：{mode.defaultReward} 积分</p>
                <p>真实位置地图：{mode.showTruthLocation ? "显示" : "隐藏"}</p>
                <p className="font-medium text-primary">
                  当前流程：{ANNOTATION_TYPES.find((type) => type.id === annotationType)?.name}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="flex justify-end">
        <Button asChild variant="ghost">
          <Link href="/app/home">返回应用首页</Link>
        </Button>
      </div>
    </div>
  );
}
