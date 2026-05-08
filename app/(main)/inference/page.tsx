"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Brain, Cpu, ImagePlus, Loader2, Sparkles, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { InferenceProgress } from "@/components/inference/InferenceProgress";
import {
  getInferenceModelsForContext,
  getInferenceModelConfig,
  type InferenceModelId,
} from "@/features/battle/config";
import { runGeoInference, type GeoInferenceResult } from "@/lib/cloudbase";
import {
  runGeoInferenceFromSpace,
  type GeoInferencePhase,
} from "@/lib/hf-space-browser";
import { cn } from "@/lib/utils";

const MAX_BYTES = 6 * 1024 * 1024;

const BUTTON_LABEL: Record<GeoInferencePhase, string> = {
  upload: "上传并接入中…",
  predict: "正在提交任务…",
  poll: "模型推理中…",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

function fileToBase64Data(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("读取图片失败。"));
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("读取图片失败。"));
        return;
      }
      const i = r.indexOf(",");
      resolve(i >= 0 ? r.slice(i + 1) : r);
    };
    reader.readAsDataURL(file);
  });
}

export default function InferencePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const standaloneModels = useMemo(
    () => getInferenceModelsForContext("standalone"),
    []
  );
  const [inferenceModelId, setInferenceModelId] = useState<InferenceModelId>(() =>
    getInferenceModelsForContext("standalone")[0].id
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inferencePhase, setInferencePhase] = useState<GeoInferencePhase | null>(
    null
  );
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState<GeoInferenceResult | null>(null);

  const selectedModelMeta = useMemo(
    () => getInferenceModelConfig(inferenceModelId),
    [inferenceModelId]
  );
  const useBrowserHf = selectedModelMeta?.inferenceChannel === "browser-hf";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(0);
    const id = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [loading]);

  const onPick = useCallback(() => inputRef.current?.click(), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] || null;
    e.target.value = "";
    setError(null);
    setResult(null);

    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("请选择图片文件。");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      setError("图片请小于 6MB。");
      return;
    }

    setFile(nextFile);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(nextFile);
    });
  }, []);

  const runInference = useCallback(async () => {
    if (!file) {
      setError("请先选择一张图片。");
      return;
    }

    setLoading(true);
    setError(null);
    setInferencePhase(null);
    setResult(null);

    try {
      let nextResult: GeoInferenceResult;

      if (useBrowserHf) {
        nextResult = await runGeoInferenceFromSpace({
          file,
          modelId: inferenceModelId,
          onPhase: (phase) => {
            setInferencePhase(phase);
          },
        });
      } else {
        const image_base64 = await fileToBase64Data(file);
        nextResult = await runGeoInference({
          image_base64,
          model_id: inferenceModelId,
        });
      }
      setResult(nextResult);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "推理请求失败。");
    } finally {
      setLoading(false);
      setInferencePhase(null);
    }
  }, [file, inferenceModelId, useBrowserHf]);

  const resultDescription =
    result?.source === "stub"
      ? "当前为占位响应：请在云函数环境配置 GEO_INFERENCE_SERVICE_URL 后接入真实服务。"
      : result?.source === "hf-space"
        ? "由 Hugging Face Space（寻境）返回。"
        : result?.source === "openai"
          ? "由 OpenAI 多模态接口（云函数代理）返回。"
          : result?.source === "deepseek"
            ? "由 DeepSeek 接口（云函数代理）返回。"
            : result?.source === "kimi"
              ? "由 Kimi（Moonshot）接口（云函数代理）返回。"
              : result?.source === "glm"
                ? "由智谱 GLM 接口（云函数代理）返回。"
                : result?.source === "qwen"
                  ? "由通义 Qwen（DashScope 兼容模式）返回。"
                  : result?.source === "remote"
                    ? "由已配置的寻境推理服务返回。"
                    : "提交图片后在此查看地点推断、证据摘要与思维链。";

  const buttonLine =
    loading && inferencePhase
      ? BUTTON_LABEL[inferencePhase]
      : loading
        ? "处理中…"
        : "开始求证";

  return (
    <div className="relative pb-20 pt-2">
      <div className="absolute left-1/2 top-0 -z-10 h-full w-full max-w-7xl -translate-x-1/2 overflow-hidden pointer-events-none">
        <div className="absolute right-[-5%] top-[-10%] h-[400px] w-[400px] rounded-full bg-sky-200/20 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-5%] h-[300px] w-[300px] rounded-full bg-blue-200/20 blur-[80px]" />
      </div>

      <section className="mb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-600">
            <Zap size={14} className="fill-sky-600" />
            寻境推理
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            空间
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              求证
            </span>
            任务
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
            上传图像后，系统将基于“识图”初判与“寻境”工作流进行地理推理，输出候选地点、关键线索和可复核的思维链说明。
          </p>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mx-auto mb-6 max-w-7xl"
      >
        <div className="flex flex-col gap-4 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-500 hover:shadow-xl hover:shadow-sky-100 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Cpu size={26} strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">模型选择</h2>
          </div>
          <div className="relative w-full md:max-w-md md:shrink-0">
            <label htmlFor="inference-model-select" className="sr-only">
              选择模型
            </label>
            <select
              id="inference-model-select"
              value={inferenceModelId}
              onChange={(e) =>
                setInferenceModelId(e.target.value as InferenceModelId)
              }
              disabled={loading}
              className="h-[52px] w-full cursor-pointer appearance-none rounded-2xl border-2 border-slate-100 bg-slate-50/80 px-4 pr-10 text-[15px] font-semibold text-slate-800 outline-none transition-colors focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {standaloneModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2"
      >
        <motion.div variants={item}>
          <div
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8",
              "shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-sky-100"
            )}
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-purple-500 opacity-0 blur-3xl transition-opacity group-hover:opacity-20" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <ImagePlus size={28} strokeWidth={2} />
            </div>

            <h2 className="mb-2 text-xl font-bold text-slate-800">上传图片</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              支持常见图片格式，单张不超过 6MB。
            </p>

            <div className="mt-auto space-y-4">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={onPick}
                disabled={loading}
                className={cn(
                  "relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 text-slate-500",
                  "transition-colors hover:border-purple-200 hover:bg-purple-50/20",
                  loading && "pointer-events-none opacity-90"
                )}
              >
                {previewUrl ? (
                  <motion.div
                    className="relative h-full w-full"
                    animate={
                      loading && !reducedMotion
                        ? { scale: [1, 1.04, 1] }
                        : { scale: 1 }
                    }
                    transition={
                      loading && !reducedMotion
                        ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                  >
                    <Image
                      src={previewUrl}
                      alt="预览"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </motion.div>
                ) : (
                  <>
                    <ImagePlus size={32} className="opacity-50" />
                    <span className="text-sm font-medium">点击选择图片</span>
                  </>
                )}
              </button>
              <Button
                className="h-12 w-full rounded-full text-base font-semibold shadow-lg shadow-sky-200/50"
                onClick={runInference}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    {buttonLine}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始求证
                  </>
                )}
              </Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div
            className={cn(
              "group relative flex h-full min-h-[min(520px,70vh)] flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8",
              "shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-sky-100"
            )}
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-sky-500 opacity-0 blur-3xl transition-opacity group-hover:opacity-15" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Brain size={28} strokeWidth={2} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">求证结果</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {loading
                ? useBrowserHf
                  ? "正在连接寻境服务并等待模型输出，请查看下方状态与等待时间。"
                  : "正在通过云函数调用所选模型，请稍候。"
                : resultDescription}
            </p>

            <div className="flex min-h-0 flex-1 flex-col space-y-4">
              {!result && !loading ? (
                <p className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 py-12 text-sm text-slate-400">
                  暂无结果
                </p>
              ) : null}
              {loading && useBrowserHf ? (
                <div
                  className="flex min-h-0 flex-1 flex-col gap-3"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <InferenceProgress />
                  <p className="text-center text-xs text-slate-400">
                    已等待 {elapsedSec} 秒
                    {elapsedSec >= 30 ? " · 请耐心等待或检查网络" : null}
                  </p>
                </div>
              ) : null}
              {loading && !useBrowserHf ? (
                <div
                  className="relative flex min-h-[min(320px,40vh)] flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-violet-50/40 p-8 shadow-inner"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <Loader2
                    className="h-10 w-10 shrink-0 animate-spin text-sky-600"
                    aria-hidden
                  />
                  <p className="text-center text-sm font-semibold text-slate-700">
                    云函数推理中…
                  </p>
                  <p className="text-xs text-slate-400">
                    已等待 {elapsedSec} 秒
                  </p>
                </div>
              ) : null}
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      地点推断
                    </h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                      {result.address}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      思维链
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {result.chain_of_thought}
                    </p>
                  </div>
                  {typeof result.latitude === "number" &&
                  typeof result.longitude === "number" ? (
                    <div>
                      <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        坐标
                      </h3>
                      <p className="text-sm text-slate-700">
                        {result.latitude}, {result.longitude}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
