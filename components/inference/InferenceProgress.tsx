"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const STAGE_DURATION_MS = 6000;

const INFERENCE_STAGES = [
  {
    title: "识别植被种类中...",
    detail: "比对树冠、农田边界与绿地纹理，提取地表覆盖线索。",
    label: "植被",
    fill: "bg-emerald-500",
    glow: "bg-emerald-300/35",
    Visual: VegetationVisual,
  },
  {
    title: "识别建筑群系中...",
    detail: "分析屋顶形态、楼群密度与阴影方向，判断人造结构分布。",
    label: "建筑",
    fill: "bg-sky-500",
    glow: "bg-sky-300/35",
    Visual: BuildingVisual,
  },
  {
    title: "抽取道路与水系中...",
    detail: "跟踪线性通道、河道弯曲与交汇关系，整理交通和水文线索。",
    label: "路网",
    fill: "bg-cyan-500",
    glow: "bg-cyan-300/35",
    Visual: NetworkVisual,
  },
  {
    title: "匹配地貌纹理中...",
    detail: "结合坡向、纹理颗粒与地块边界，校验候选区域的地理一致性。",
    label: "地貌",
    fill: "bg-amber-500",
    glow: "bg-amber-300/35",
    Visual: TerrainVisual,
  },
  {
    title: "生成空间推理结论中...",
    detail: "汇总视觉证据、坐标候选与推理链，准备输出可复核结果。",
    label: "定位中",
    fill: "bg-violet-500",
    glow: "bg-violet-300/35",
    Visual: ResultVisual,
  },
] as const;

export function InferenceProgress() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = INFERENCE_STAGES[stageIndex];
  const Visual = stage.Visual;

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setStageIndex(
        Math.floor(elapsed / STAGE_DURATION_MS) % INFERENCE_STAGES.length
      );
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/40 p-5"
    >
      <div className="relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white bg-white">
        <motion.div
          key={`${stage.title}-glow`}
          className={cn(
            "absolute inset-x-10 top-8 h-24 rounded-full blur-3xl",
            stage.glow
          )}
          initial={{ opacity: 0.2, scale: 0.85 }}
          animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.85, 1.08, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          key={stage.title}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45 }}
          className="relative flex h-full min-h-[220px] items-center justify-center px-3 py-4"
        >
          <Visual />
        </motion.div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-800">{stage.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {stage.detail}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {INFERENCE_STAGES.map((item, index) => {
            const isComplete = index < stageIndex;
            const isCurrent = index === stageIndex;

            return (
              <div
                key={item.label}
                className="h-1.5 overflow-hidden rounded-full bg-slate-200"
              >
                {isComplete ? (
                  <div className={cn("h-full w-full", item.fill)} />
                ) : null}
                {isCurrent ? (
                  <motion.div
                    key={`${item.label}-${stageIndex}`}
                    className={cn("h-full", item.fill)}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[11px] font-semibold text-slate-400">
          {INFERENCE_STAGES.map((item, index) => (
            <span
              key={item.label}
              className={cn(index === stageIndex && "text-slate-700")}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function VegetationVisual() {
  return (
    <motion.svg
      viewBox="0 0 260 180"
      className="h-[190px] w-full max-w-[320px]"
      role="img"
      aria-label="植被识别矢量图"
    >
      <defs>
        <linearGradient id="veg-ground" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#dcfce7" />
          <stop offset="1" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>
      <rect x="22" y="112" width="216" height="40" rx="20" fill="url(#veg-ground)" />
      <motion.path
        d="M44 138 C76 118, 94 152, 126 132 S184 120, 218 139"
        fill="none"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0.2, opacity: 0.35 }}
        animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {[62, 105, 150, 196].map((x, index) => (
        <motion.g
          key={x}
          animate={{ y: [0, -7, 0] }}
          transition={{
            duration: 2.8,
            delay: index * 0.18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <rect x={x - 3} y="86" width="6" height="42" rx="3" fill="#92400e" />
          <circle cx={x} cy="76" r="22" fill="#22c55e" />
          <circle cx={x - 16} cy="88" r="17" fill="#16a34a" />
          <circle cx={x + 16} cy="88" r="17" fill="#4ade80" />
        </motion.g>
      ))}
      <motion.circle
        cx="130"
        cy="88"
        r="58"
        fill="none"
        stroke="#10b981"
        strokeDasharray="7 9"
        strokeWidth="3"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "130px 88px" }}
      />
    </motion.svg>
  );
}

function BuildingVisual() {
  return (
    <motion.svg
      viewBox="0 0 260 180"
      className="h-[190px] w-full max-w-[320px]"
      role="img"
      aria-label="建筑群识别矢量图"
    >
      <rect x="30" y="128" width="200" height="18" rx="9" fill="#e0f2fe" />
      <g fill="#bae6fd" stroke="#0284c7" strokeWidth="2">
        <rect x="52" y="70" width="34" height="64" rx="5" />
        <rect x="96" y="50" width="42" height="84" rx="5" />
        <rect x="150" y="82" width="30" height="52" rx="5" />
        <rect x="190" y="62" width="28" height="72" rx="5" />
      </g>
      <g fill="#0284c7">
        {[62, 74, 106, 120, 160, 201].map((x) => (
          <rect key={x} x={x} y="84" width="7" height="7" rx="2" />
        ))}
        {[106, 120, 201].map((x) => (
          <rect key={`${x}-2`} x={x} y="101" width="7" height="7" rx="2" />
        ))}
      </g>
      <motion.path
        d="M42 52 H226"
        stroke="#0ea5e9"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: [0, 1, 0], x: [-40, 40, 80] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="42"
        y="38"
        width="176"
        height="110"
        rx="18"
        fill="none"
        stroke="#38bdf8"
        strokeDasharray="8 8"
        strokeWidth="3"
        animate={{ strokeDashoffset: [0, -64] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </motion.svg>
  );
}

function NetworkVisual() {
  return (
    <motion.svg
      viewBox="0 0 260 180"
      className="h-[190px] w-full max-w-[320px]"
      role="img"
      aria-label="道路水系抽取矢量图"
    >
      <rect x="28" y="34" width="204" height="112" rx="24" fill="#ecfeff" />
      <motion.path
        d="M42 116 C74 90, 92 130, 122 102 S164 78, 218 96"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ pathLength: 0.15 }}
        animate={{ pathLength: [0.15, 1, 0.15] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <path
        d="M54 54 L114 88 L152 70 L210 124"
        fill="none"
        stroke="#64748b"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M54 54 L114 88 L152 70 L210 124"
        fill="none"
        stroke="#f8fafc"
        strokeDasharray="9 12"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -84] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      {[54, 114, 152, 210].map((x, index) => (
        <motion.circle
          key={x}
          cx={x}
          cy={[54, 88, 70, 124][index]}
          r="6"
          fill="#0891b2"
          animate={{ scale: [1, 1.45, 1], opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 2.2,
            delay: index * 0.25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

function TerrainVisual() {
  return (
    <motion.svg
      viewBox="0 0 260 180"
      className="h-[190px] w-full max-w-[320px]"
      role="img"
      aria-label="地貌纹理匹配矢量图"
    >
      <rect x="34" y="34" width="192" height="118" rx="24" fill="#fffbeb" />
      {[0, 1, 2, 3].map((index) => (
        <motion.path
          key={index}
          d={`M${54 + index * 8} ${122 - index * 18} C${
            88 + index * 6
          } ${88 - index * 5}, ${134 + index * 8} ${144 - index * 18}, ${
            202 - index * 4
          } ${76 + index * 10}`}
          fill="none"
          stroke={["#f59e0b", "#d97706", "#b45309", "#92400e"][index]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 8"
          animate={{ strokeDashoffset: [0, -48] }}
          transition={{
            duration: 6 + index,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      <motion.g
        animate={{ scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "132px 92px" }}
      >
        <circle cx="132" cy="92" r="34" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <path d="M132 50 V134 M90 92 H174" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
      <motion.path
        d="M66 138 C94 124, 118 142, 146 126 S190 114, 214 132"
        fill="none"
        stroke="#84cc16"
        strokeWidth="5"
        strokeLinecap="round"
        animate={{ pathLength: [0.15, 1, 0.15] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

function ResultVisual() {
  return (
    <motion.svg
      viewBox="0 0 260 180"
      className="h-[190px] w-full max-w-[320px]"
      role="img"
      aria-label="空间推理结果生成矢量图"
    >
      <rect x="42" y="34" width="176" height="116" rx="22" fill="#f5f3ff" />
      <path d="M72 128 L110 88 L148 108 L190 62" fill="none" stroke="#a78bfa" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M132 48 C113 48, 98 63, 98 82 C98 109, 132 132, 132 132 C132 132, 166 109, 166 82 C166 63, 151 48, 132 48 Z"
          fill="#8b5cf6"
        />
        <circle cx="132" cy="82" r="13" fill="#fff" />
      </motion.g>
      {[42, 70, 98].map((r, index) => (
        <motion.circle
          key={r}
          cx="132"
          cy="88"
          r={r}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeOpacity="0.45"
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: [0.75, 1.1], opacity: [0, 0.6, 0] }}
          transition={{
            duration: 3.2,
            delay: index * 0.55,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ transformOrigin: "132px 88px" }}
        />
      ))}
    </motion.svg>
  );
}
