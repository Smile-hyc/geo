"use client";

import Link from "next/link";
import { MapPin, Satellite, Map, Mountain, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ANNOTATION_MODES } from "@/lib/modes";

const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin className="h-8 w-8 text-blue-400" />,
  remote_sensing: <Satellite className="h-8 w-8 text-emerald-400" />,
  map_mode: <Map className="h-8 w-8 text-amber-400" />,
  terrain: <Mountain className="h-8 w-8 text-stone-400" />,
  mixed: <Layers className="h-8 w-8 text-purple-400" />,
};

export default function AnnotateModeSelectPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">选择标注模式</h1>
        <p className="text-muted-foreground">
          不同模式对应不同的图库，选择后将从该图库中随机抽取题目进行标注
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ANNOTATION_MODES.map((mode) => (
          <Link key={mode.id} href={`/annotate?mode=${encodeURIComponent(mode.id)}`}>
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="p-2 rounded-xl bg-accent/50 group-hover:bg-accent transition-colors w-fit">
                  {MODE_ICONS[mode.id] ?? <MapPin className="h-8 w-8 text-muted-foreground" />}
                </div>
                <CardTitle className="mt-3">{mode.name}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-xs text-primary font-medium">开始标注 →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
