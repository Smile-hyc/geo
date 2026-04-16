"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Brain, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { runGeoInference, type GeoInferenceResult } from "@/lib/cloudbase";
import { cn } from "@/lib/utils";

const MAX_BYTES = 6 * 1024 * 1024;

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

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-4">
          <Brain size={14} />
          AI 地理推理
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">推理任务</h1>
        <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
          上传影像，由 GeoAgent 类模型推断地理位置并给出思维链说明。当前后端可返回占位结果；部署 GPU 推理服务并配置环境变量后即可接入真实模型。
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="text-purple-600" size={20} />
              上传图片
            </CardTitle>
            <CardDescription>支持常见图片格式，单张不超过 6MB。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                "relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200",
                "flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
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
              className="w-full rounded-xl h-11"
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
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">推理结果</CardTitle>
            <CardDescription>
              {result?.source === "stub"
                ? "当前为占位响应：请在云函数环境配置 GEO_INFERENCE_SERVICE_URL 后接入真实服务。"
                : result?.source === "remote"
                  ? "由已配置的推理服务返回。"
                  : "提交图片后在此查看地址推断与思维链。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result && !loading ? (
              <p className="text-sm text-slate-400">暂无结果</p>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在请求云端推理…
              </div>
            ) : null}
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {result.source === "stub" ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-xs px-3 py-2">
                    占位模式（model_ref: {result.model_ref ?? "—"}）
                  </div>
                ) : null}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    地址推断
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
