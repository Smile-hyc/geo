"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Brain, ImagePlus, Loader2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { runGeoInference, type GeoInferenceResult } from "@/lib/cloudbase";
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("无法读取文件"));
        return;
      }
      const comma = r.indexOf(",");
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export default function InferencePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
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
    const f = e.target.files?.[0];
    e.target.value = "";
    setError(null);
    setResult(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("请选择图片文件。");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("图片请小于 6MB。");
      return;
    }
    setFile(f);
    setMimeType(f.type);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
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
      const image_base64 = await fileToBase64(file);
      const res = await runGeoInference({
        image_base64,
        mime_type: mimeType || undefined,
      });
      setResult(res);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "推理请求失败。");
    } finally {
      setLoading(false);
    }
  }, [file, mimeType]);

  const resultDescription =
    result?.source === "stub"
      ? "当前为占位响应：请在云函数环境配置 GEO_INFERENCE_SERVICE_URL 后接入真实服务。"
      : result?.source === "remote"
        ? "由已配置的寻境推理服务返回。"
        : "提交图片后在此查看地点推断、证据摘要与思维链。";

  return (
    <div className="relative pb-20 pt-2">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-sky-200/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-blue-200/20 blur-[80px] rounded-full" />
      </div>

      <section className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-xs font-bold uppercase tracking-wider mb-6">
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
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2"
      >
        <motion.div variants={item}>
          <div
            className={cn(
              "group relative flex flex-col h-full p-8 rounded-[2.5rem] bg-white border border-slate-100",
              "shadow-sm hover:shadow-2xl hover:shadow-sky-100 transition-all duration-500 overflow-hidden"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity bg-purple-500" />

            <div className="flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-purple-50 text-purple-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <ImagePlus size={28} strokeWidth={2} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">上传图片</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">支持常见图片格式，单张不超过 6MB。</p>

            <div className="space-y-4 mt-auto">
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
                  "relative w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-200",
                  "flex flex-col items-center justify-center gap-2 text-slate-500",
                  "hover:border-purple-200 hover:bg-purple-50/20 transition-colors"
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
                className={cn(
                  "w-full rounded-full h-12 text-base font-semibold shadow-lg shadow-sky-200/50"
                )}
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
              "group relative flex flex-col h-full p-8 rounded-[2.5rem] bg-white border border-slate-100",
              "shadow-sm hover:shadow-2xl hover:shadow-sky-100 transition-all duration-500 overflow-hidden min-h-[min(520px,70vh)]"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity bg-sky-500" />

            <div className="flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-purple-50 text-purple-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Brain size={28} strokeWidth={2} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">求证结果</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{resultDescription}</p>

            <div className="flex-1 flex flex-col space-y-4 min-h-0">
              {!result && !loading ? (
                <p className="text-sm text-slate-400 flex-1 flex items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 py-12">
                  暂无结果
                </p>
              ) : null}
              {loading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-slate-500 text-sm rounded-3xl border border-slate-100 bg-slate-50/30 py-12">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  正在请求云端推理…
                </div>
              ) : null}
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 flex-1 overflow-y-auto pr-1"
                >
                  {result.source === "stub" ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 text-xs px-3 py-2.5">
                      占位模式（model_ref: {result.model_ref ?? "—"}）
                    </div>
                  ) : null}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      地点推断
                    </h3>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {result.address}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      思维链
                    </h3>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {result.chain_of_thought}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
