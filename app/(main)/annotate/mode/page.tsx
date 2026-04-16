"use client";

import Link from "next/link";
import { Layers, Map, MapPin, Mountain, Satellite } from "lucide-react";
import { useState } from "react";

import { ANNOTATION_MODES, ANNOTATION_TYPES, type AnnotationTypeId } from "@/lib/modes";

const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin className="h-4 w-4 text-[#d7f2df]" />,
  remote_sensing: <Satellite className="h-4 w-4 text-[#d7f2df]" />,
  map_mode: <Map className="h-4 w-4 text-[#d7f2df]" />,
  terrain: <Mountain className="h-4 w-4 text-[#d7f2df]" />,
  mixed: <Layers className="h-4 w-4 text-[#d7f2df]" />,
};

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] = useState<AnnotationTypeId>("hybrid");

  return (
    <div className="min-h-[calc(100vh-78px)] py-4">
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="wg-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">标注设置</p>
          <h1 className="mt-3 font-['Jockey_One'] text-5xl leading-[0.9] text-[#f2fff5]">
            选择模式
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#c2d8c9]">
            选择标注类型与任务场景。
          </p>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#d8eee0]">
            标注类型
          </h2>
          <div className="mt-2 grid gap-2">
            {ANNOTATION_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setAnnotationType(type.id)}
                className={[
                  "rounded-md border p-3 text-left transition",
                  annotationType === type.id
                    ? "border-[#5a8c6f] bg-[rgba(35,71,48,0.86)]"
                    : "border-[#335643] bg-[rgba(17,33,24,0.78)] hover:border-[#4b765d]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[#f4fff8]">{type.name}</p>
                <p className="mt-1 text-xs text-[#bfd5c7]">{type.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="wg-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">可用模式</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ANNOTATION_MODES.map((mode) => (
              <Link
                key={mode.id}
                href={`/app/annotate?mode=${encodeURIComponent(mode.id)}&annotationType=${encodeURIComponent(annotationType)}`}
                className="group rounded-md border border-[#355843] bg-[rgba(21,39,28,0.8)] p-4 transition hover:border-[#58866b] hover:bg-[rgba(29,53,38,0.88)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[rgba(45,84,57,0.8)] p-2">
                      {MODE_ICONS[mode.id] ?? <MapPin className="h-4 w-4 text-[#d7f2df]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#f4fff8]">{mode.name}</p>
                      <p className="text-xs text-[#b7d0c0]">{mode.defaultReward} 积分</p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-6 text-[#bfd5c7]">{mode.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
