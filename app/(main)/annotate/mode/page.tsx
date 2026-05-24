"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  BarChart2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Crosshair,
  FileText,
  Gift,
  Layers,
  Map,
  MapPin,
  Mountain,
  Play,
  Route,
  Satellite,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ANNOTATION_MODES,
  ANNOTATION_TYPES,
  type AnnotationModeId,
  type AnnotationTypeId,
} from "@/lib/modes";
import { cn } from "@/lib/utils";

type TaskPoolRow = {
  id: AnnotationModeId;
  icon: ElementType;
  description: string;
  reward: number;
  samples: string;
  difficulty: "Medium" | "Hard";
  estimate: string;
  passRate: string;
};

type TypeMeta = {
  id: AnnotationTypeId;
  icon: ElementType;
};

const TYPE_META: TypeMeta[] = [
  { id: "reasoning", icon: Route },
  { id: "bbox", icon: Crosshair },
  { id: "hybrid", icon: Sparkles },
];

const TASK_POOL: TaskPoolRow[] = [
  {
    id: "street_view",
    icon: MapPin,
    description: "城市道路、店铺、路牌与建筑线索",
    reward: 50,
    samples: "1,248",
    difficulty: "Medium",
    estimate: "45s",
    passRate: "91%",
  },
  {
    id: "remote_sensing",
    icon: Satellite,
    description: "卫星影像、地表覆盖与大尺度空间线索",
    reward: 60,
    samples: "832",
    difficulty: "Hard",
    estimate: "60s",
    passRate: "86%",
  },
  {
    id: "map_mode",
    icon: Map,
    description: "地图截图、制图符号与道路拓扑判断",
    reward: 45,
    samples: "654",
    difficulty: "Medium",
    estimate: "40s",
    passRate: "93%",
  },
  {
    id: "terrain",
    icon: Mountain,
    description: "地貌、等高线与海拔变化模式",
    reward: 55,
    samples: "512",
    difficulty: "Hard",
    estimate: "55s",
    passRate: "88%",
  },
  {
    id: "mixed",
    icon: Layers,
    description: "覆盖多模态地理线索，适合综合能力训练",
    reward: 65,
    samples: "1,905",
    difficulty: "Hard",
    estimate: "75s",
    passRate: "84%",
  },
];

const MODE_ICON_COLOR: Record<AnnotationModeId, string> = {
  street_view: "#0ea5e9",
  remote_sensing: "#10b981",
  map_mode: "#8b5cf6",
  terrain: "#f59e0b",
  mixed: "#3b82f6",
};

const QUALITY_RULES = [
  "标注必须对应图像中可见线索",
  "推理说明需包含至少 2 个依据",
  "不确定时应降低置信度",
  "明显无效提交不会获得积分",
];

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] = useState<AnnotationTypeId>("hybrid");
  const [selectedMode, setSelectedMode] = useState<AnnotationModeId>("street_view");

  const selectedType = useMemo(
    () => ANNOTATION_TYPES.find((type) => type.id === annotationType) ?? ANNOTATION_TYPES[0],
    [annotationType]
  );
  const selectedModeData = useMemo(
    () => ANNOTATION_MODES.find((mode) => mode.id === selectedMode) ?? ANNOTATION_MODES[0],
    [selectedMode]
  );
  const selectedTask = useMemo(
    () => TASK_POOL.find((task) => task.id === selectedMode) ?? TASK_POOL[0],
    [selectedMode]
  );

  return (
    <div className="relative pb-36 pt-6">
      <AmbientBackground />

      <div className="mx-auto w-full max-w-[min(100%,1800px)]">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-xs font-bold text-sky-600">
              <Sparkles size={14} className="fill-sky-600" />
              地理数据贡献
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">标注任务</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              选择任务类型与数据场景，完成高质量地理标注以获得积分并提升数据集质量。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-[2rem] border border-slate-100 bg-white/80 p-3 shadow-sm backdrop-blur">
            <MiniStat label="今日完成" value="0" />
            <MiniStat label="当前积分" value="0 pts" highlight />
            <MiniStat label="当前等级" value="Rookie" />
          </div>
        </header>

        <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[340px_minmax(0,1fr)_300px] 2xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <TaskConfigPanel
            annotationType={annotationType}
            selectedMode={selectedMode}
            onTypeChange={setAnnotationType}
            onModeChange={setSelectedMode}
          />

          <main className="min-w-0">
            <section className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white/90 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">推荐任务池</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    根据当前配置推荐合适的数据场景
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 sm:flex">
                  <BarChart2 size={14} className="text-sky-500" />
                  5 个任务池
                </div>
              </div>

              <TaskPoolList selectedMode={selectedMode} onSelect={setSelectedMode} />

              <div className="flex flex-1 px-5 pb-5 pt-3">
                <section className="flex w-full flex-col justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50/60 px-6 py-5">
                  <h3 className="text-base font-extrabold text-slate-900">当前任务说明</h3>
                  <dl className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                    <InfoLine label="当前配置">
                      <span className="flex flex-wrap items-center gap-2">
                        <Pill>{selectedType.name}</Pill>
                        <span className="text-slate-300">+</span>
                        <Pill>{selectedModeData.name}</Pill>
                      </span>
                    </InfoLine>
                    <InfoLine label="任务内容">
                      {getTaskContent(annotationType, selectedModeData.name)}
                    </InfoLine>
                    <InfoLine label="质量要求">
                      需标出至少 2 个有效地理线索，并给出可复核的定位依据。
                    </InfoLine>
                    <InfoLine label="质检方式">自动规则检查 + 人工抽检</InfoLine>
                  </dl>
                </section>
              </div>
            </section>
          </main>

          <AsidePanel points={0} sampleCount={selectedTask.samples} modeName={selectedModeData.name} />
        </div>
      </div>

      <BottomBar
        annotationType={annotationType}
        selectedMode={selectedMode}
        selectedTypeName={selectedType.name}
        selectedModeName={selectedModeData.name}
        estimate={selectedType.estimatedTime}
        reward={selectedTask.reward}
      />
    </div>
  );
}

function TaskConfigPanel({
  annotationType,
  selectedMode,
  onTypeChange,
  onModeChange,
}: {
  annotationType: AnnotationTypeId;
  selectedMode: AnnotationModeId;
  onTypeChange: (type: AnnotationTypeId) => void;
  onModeChange: (mode: AnnotationModeId) => void;
}) {
  return (
    <aside className="h-full min-w-0 rounded-[2rem] border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur">
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">任务配置</h2>
      <div className="mt-5 border-t border-slate-100 pt-5">
        <SectionLabel>任务类型</SectionLabel>
        <div className="mt-4 space-y-3">
          {TYPE_META.map((meta) => {
            const type = ANNOTATION_TYPES.find((item) => item.id === meta.id)!;
            const active = annotationType === type.id;
            const Icon = meta.icon;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeChange(type.id)}
                className={cn(
                  "group flex min-h-[106px] w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left transition-all",
                  active
                    ? "border-sky-200 bg-sky-50/80 shadow-sm"
                    : "border-slate-100 bg-white hover:border-sky-100 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
                    active ? "bg-sky-500 text-white" : "bg-slate-50 text-slate-400 group-hover:text-sky-500"
                  )}
                >
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-base font-extrabold", active ? "text-sky-700" : "text-slate-800")}>
                    {type.name}
                  </span>
                  <span className="mt-1.5 block text-xs font-semibold leading-5 text-slate-500">
                    {type.description}
                  </span>
                  <span className="mt-2.5 block text-xs font-bold text-slate-400">预计 {type.estimatedTime}</span>
                </span>
                <SelectionDot active={active} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <SectionLabel>场景类型</SectionLabel>
        <div className="mt-4 space-y-2.5">
          {TASK_POOL.map((task) => {
            const mode = ANNOTATION_MODES.find((item) => item.id === task.id)!;
            const active = selectedMode === mode.id;
            const Icon = task.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-all",
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                    : "border-slate-100 bg-white text-slate-600 hover:border-sky-100 hover:bg-slate-50"
                )}
              >
                <Icon size={20} className={active ? "text-sky-500" : "text-slate-400"} />
                <span className="flex-1 text-sm font-extrabold">{mode.name}</span>
                <SelectionDot active={active} small />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function TaskPoolList({
  selectedMode,
  onSelect,
}: {
  selectedMode: AnnotationModeId;
  onSelect: (mode: AnnotationModeId) => void;
}) {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-[1.1fr_2.6fr_0.8fr_0.8fr_0.72fr] items-center px-3 py-3 text-xs font-extrabold text-slate-400">
        <span>场景</span>
        <span>说明</span>
        <span>奖励</span>
        <span>通过率</span>
        <span className="text-right">状态</span>
      </div>
      <div className="space-y-2">
        {TASK_POOL.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            active={selectedMode === task.id}
            onSelect={() => onSelect(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  active,
  onSelect,
}: {
  task: TaskPoolRow;
  active: boolean;
  onSelect: () => void;
}) {
  const mode = ANNOTATION_MODES.find((item) => item.id === task.id)!;
  const Icon = task.icon;
  const color = MODE_ICON_COLOR[task.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full min-w-0 grid-cols-[1.1fr_2.6fr_0.8fr_0.8fr_0.72fr] items-center rounded-[1.25rem] border px-3 py-3 text-left transition-all",
        active
          ? "border-sky-200 bg-sky-50/80 shadow-sm"
          : "border-slate-100 bg-white hover:border-sky-100 hover:bg-slate-50"
      )}
    >
      <span className="flex min-w-0 items-center gap-3 pr-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={20} strokeWidth={2.5} style={{ color }} />
        </span>
        <span className="truncate text-sm font-extrabold text-slate-800">{mode.name}</span>
      </span>
      <span className="min-w-0 pr-3 text-xs font-semibold leading-5 text-slate-500">
        <span className="line-clamp-2">{task.description}</span>
      </span>
      <span className="min-w-0 pr-2">
        <RewardBadge reward={task.reward} />
      </span>
      <span className="truncate pr-2 text-xs font-bold text-slate-600">{task.passRate}</span>
      <span className="min-w-0 text-right">
        {active ? (
          <span className="inline-flex min-w-[48px] justify-center rounded-xl bg-sky-100 px-2.5 py-1.5 text-xs font-extrabold text-sky-700">
            已选
          </span>
        ) : (
          <span className="inline-flex min-w-[48px] justify-center rounded-xl border border-sky-100 bg-white px-2.5 py-1.5 text-xs font-extrabold text-sky-600">
            选择
          </span>
        )}
      </span>
    </button>
  );
}

function AsidePanel({
  points,
  sampleCount,
  modeName,
}: {
  points: number;
  sampleCount: string;
  modeName: string;
}) {
  return (
    <aside className="flex h-full min-w-0 flex-col gap-5">
      <InfoCard title="我的贡献">
        <div className="space-y-4 text-sm font-bold">
          <Metric icon={CheckCircle2} label="今日完成" value="0" />
          <Metric icon={Gift} label="本周完成" value="0" />
          <Metric icon={ShieldCheck} label="质检通过率" value="--" />
          <div className="border-t border-slate-100 pt-4" />
          <Metric icon={CircleDollarSign} label="当前积分" value={`${points} pts`} blue />
          <Metric icon={Trophy} label="当前等级" value="Rookie" blue />
        </div>
      </InfoCard>

      <InfoCard title="质量标准">
        <ul className="space-y-3">
          {QUALITY_RULES.map((rule) => (
            <li key={rule} className="flex gap-3 text-sm font-semibold leading-6 text-slate-600">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="任务热度" className="flex-1">
        <p className="text-sm font-semibold text-slate-500">当前{modeName}任务池剩余样本</p>
        <p className="mt-2 text-3xl font-extrabold leading-none text-sky-600">{sampleCount}</p>
        <div className="mt-5 h-[112px] w-full">
          <SparkLine />
        </div>
      </InfoCard>
    </aside>
  );
}

function BottomBar({
  annotationType,
  selectedMode,
  selectedTypeName,
  selectedModeName,
  estimate,
  reward,
}: {
  annotationType: AnnotationTypeId;
  selectedMode: AnnotationModeId;
  selectedTypeName: string;
  selectedModeName: string;
  estimate: string;
  reward: number;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[min(100%,1680px)] -translate-x-1/2 rounded-[2rem] border border-slate-100 bg-white/95 px-5 py-4 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryItem icon={Target} label="任务类型" value={selectedTypeName} />
          <SummaryItem icon={MapPin} label="任务场景" value={selectedModeName} />
          <SummaryItem icon={Clock3} label="预计耗时" value={estimate} />
          <SummaryItem icon={Sparkles} label="单题奖励" value={`+${reward} pts`} />
          <SummaryItem icon={ShieldCheck} label="质检方式" value="自动规则 + 人工抽检" />
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border-slate-100 px-7 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
          >
            <FileText className="mr-2 h-4 w-4 text-slate-400" />
            查看标注指南
          </Button>
          <Link href={`/app/annotate?mode=${encodeURIComponent(selectedMode)}&annotationType=${encodeURIComponent(annotationType)}`}>
            <Button className="h-12 w-full rounded-2xl bg-sky-500 px-8 text-sm font-extrabold text-white shadow-lg shadow-sky-200 hover:bg-sky-600 sm:w-auto">
              <Play className="mr-2 h-4 w-4 fill-white" />
              开始标注
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute right-[-10%] top-0 h-[420px] w-[420px] rounded-full bg-sky-200/20 blur-[100px]" />
      <div className="absolute bottom-[10%] left-[-8%] h-[360px] w-[360px] rounded-full bg-blue-200/20 blur-[90px]" />
    </div>
  );
}

function MiniStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-[86px] px-3 py-1 text-center">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className={cn("mt-1 text-sm font-extrabold", highlight ? "text-sky-600" : "text-slate-800")}>{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
      <span>{children}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-[11px] font-bold text-slate-400">
        i
      </span>
    </div>
  );
}

function SelectionDot({ active, small = false }: { active: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-colors",
        small ? "h-6 w-6" : "mt-1 h-7 w-7",
        active ? "border-sky-500 bg-sky-500 text-white" : "border-slate-200 bg-white text-transparent"
      )}
    >
      <Check size={small ? 14 : 15} strokeWidth={3} />
    </span>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-xl bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-700">
      {children}
    </span>
  );
}

function RewardBadge({ reward }: { reward: number }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-xl px-2.5 py-1 text-xs font-extrabold leading-4",
        reward >= 60
          ? "bg-emerald-50 text-emerald-600"
          : reward <= 45
            ? "bg-violet-50 text-violet-600"
            : "bg-sky-100 text-sky-700"
      )}
    >
      +{reward}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: TaskPoolRow["difficulty"] }) {
  const hard = difficulty === "Hard";
  return (
    <span
      className={cn(
        "inline-flex rounded-xl px-2.5 py-1 text-xs font-extrabold leading-4",
        hard ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
      )}
    >
      {difficulty}
    </span>
  );
}

function InfoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur", className)}>
      <h2 className="mb-5 text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  blue = false,
}: {
  icon: ElementType;
  label: string;
  value: string;
  blue?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2.2} />
      <span className="min-w-0 flex-1 truncate text-slate-500">{label}</span>
      <span className={cn("shrink-0 font-extrabold", blue ? "text-sky-600" : "text-slate-800")}>{value}</span>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[54px] min-w-0 items-center gap-3 border-slate-100 px-4 sm:border-r last:border-r-0">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2.2} />
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 font-extrabold text-slate-700">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function SparkLine() {
  return (
    <svg viewBox="0 0 280 118" className="h-full w-full" role="img" aria-label="任务热度折线图">
      <defs>
        <linearGradient id="heatFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="28" y1="20" x2="28" y2="104" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="28" y1="104" x2="270" y2="104" stroke="#E2E8F0" strokeWidth="1" />
      <text x="0" y="28" fill="#94A3B8" fontSize="13" fontWeight="700">2K</text>
      <text x="0" y="68" fill="#94A3B8" fontSize="13" fontWeight="700">1K</text>
      <text x="8" y="108" fill="#94A3B8" fontSize="13" fontWeight="700">0</text>
      <path
        d="M28 76 L44 68 L58 60 L72 66 L86 54 L100 62 L114 48 L128 63 L142 56 L156 68 L170 58 L184 64 L198 76 L212 70 L226 78 L240 65 L254 82 L270 72 L270 104 L28 104 Z"
        fill="url(#heatFill)"
      />
      <path
        d="M28 76 L44 68 L58 60 L72 66 L86 54 L100 62 L114 48 L128 63 L142 56 L156 68 L170 58 L184 64 L198 76 L212 70 L226 78 L240 65 L254 82 L270 72"
        fill="none"
        stroke="#0ea5e9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function getTaskContent(annotationType: AnnotationTypeId, modeName: string) {
  if (annotationType === "reasoning") {
    return `完成${modeName}场景的定位推理说明，记录关键观察依据、最终判断与置信度。`;
  }
  if (annotationType === "bbox") {
    return `在${modeName}图像中框选可见地理元素，并补充每个元素的识别依据。`;
  }
  return `同时完成视觉线索选择、地理元素标注与${modeName}场景的简短推理说明。`;
}
