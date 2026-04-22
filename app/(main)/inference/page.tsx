"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Brain, ImagePlus, Loader2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { GeoInferenceResult } from "@/lib/cloudbase";
import { runGeoInferenceFromSpace } from "@/lib/hf-space-browser";
import { cn } from "@/lib/utils";

const MAX_BYTES = 6 * 1024 * 1024;

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

export default function InferencePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoInferenceResult | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

    try {
      const nextResult = await runGeoInferenceFromSpace({ file });
      setResult(nextResult);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "推理请求失败。");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const resultDescription =
    result?.source === "remote"
      ? "结果由 Hugging Face Space 直接返回。"
      : "上传图片后，在这里查看地点推断与思维链。";

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
            AI 地理推理
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl">
            智能
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              推理
            </span>
            任务
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
            上传影像，由 GeoAgent 模型推断地理位置并给出思维链说明。推理页现在直接请求
            Hugging Face Space，不再经过 CloudBase 云函数上传大体积 base64。
          </p>
        </motion.div>
      </section>

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
              />
              <button
                type="button"
                onClick={onPick}
                className={cn(
                  "relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500",
                  "transition-colors hover:border-purple-200 hover:bg-purple-50/20"
                )}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="预览"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    推理中…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始推理
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

            <h2 className="mb-2 text-xl font-bold text-slate-800">推理结果</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              {resultDescription}
            </p>

            <div className="flex min-h-0 flex-1 flex-col space-y-4">
              {!result && !loading ? (
                <p className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 py-12 text-sm text-slate-400">
                  暂无结果
                </p>
              ) : null}
              {loading ? (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-3xl border border-slate-100 bg-slate-50/30 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  正在请求 GeoAgent Space…
                </div>
              ) : null}
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                  <div>
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      地址推断
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
