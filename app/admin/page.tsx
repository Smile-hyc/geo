"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createQuestion,
  getTempFileURL,
  listSubmissions,
} from "@/lib/cloudbase";
import type { Submission } from "@/types/db";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function AdminPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [trueLocation, setTrueLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setSubsLoading(true);
    setSubsError(null);
    try {
      const { submissions: list } = await listSubmissions({ limit: 50 });
      setSubmissions(list);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "加载提交列表失败");
    } finally {
      setSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setUploadFile(null);
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("请选择图片文件（JPG/PNG 等）");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`图片大小请不超过 ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setUploadFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadFile || !trueLocation.trim()) {
      setUploadError("请选择图片并填写真实地点");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const base64 = await fileToBase64(uploadFile);
      await createQuestion({
        original_image_base64: base64,
        true_location: trueLocation.trim(),
      });
      setUploadFile(null);
      setTrueLocation("");
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
      (document.getElementById("admin-file-input") as HTMLInputElement).value = "";
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">管理后台</h1>
          <Link href="/">
            <Button variant="ghost" size="sm">返回首页</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>上传题目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
            <div className="space-y-2">
              <Label>地理图片</Label>
              <Input
                id="admin-file-input"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
              {imagePreviewUrl && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden inline-block max-w-xs">
                  <img
                    src={imagePreviewUrl}
                    alt="预览"
                    className="max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>真实地点（答案）</Label>
              <Input
                placeholder="例如：云南省大理市"
                value={trueLocation}
                onChange={(e) => setTrueLocation(e.target.value)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !trueLocation.trim()}
            >
              {uploading ? "上传中…" : "上传题目"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>数据回收 · 提交列表</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSubmissions} disabled={subsLoading}>
              {subsLoading ? "加载中…" : "刷新"}
            </Button>
          </CardHeader>
          <CardContent>
            {subsError && (
              <p className="text-sm text-destructive mb-4">{subsError}</p>
            )}
            {submissions.length === 0 && !subsLoading && (
              <p className="text-muted-foreground text-sm">暂无提交记录</p>
            )}
            <ul className="space-y-4">
              {submissions.map((sub) => (
                <SubmissionCard key={sub._id} submission={sub} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.indexOf(",") >= 0 ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const [annotatedUrl, setAnnotatedUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getTempFileURL(submission.annotated_image_url)
      .then((r) => setAnnotatedUrl(r.tempFileURL))
      .catch((e) => setErr(e instanceof Error ? e.message : "加载失败"));
  }, [submission.annotated_image_url]);

  const date = new Date(submission.submitted_at).toLocaleString("zh-CN");

  return (
    <li className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0">
          {err && <p className="text-sm text-destructive">{err}</p>}
          {annotatedUrl && (
            <a
              href={annotatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border border-border overflow-hidden max-w-[280px] hover:opacity-90"
            >
              <img
                src={annotatedUrl}
                alt="标注图"
                className="w-full h-auto max-h-48 object-contain"
              />
            </a>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs text-muted-foreground">
            题目 ID: {submission.question_id} · {date}
          </p>
          <p className="text-sm whitespace-pre-wrap break-words">
            {submission.thought_process || "—"}
          </p>
        </div>
      </div>
    </li>
  );
}
