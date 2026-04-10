"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuestion, deleteImage, getTempFileURL, callFunction } from "@/lib/cloudbase";

import { ANNOTATION_MODES } from "@/lib/modes";

const MODE_OPTIONS = ANNOTATION_MODES.map((m) => m.id);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface ImageAsset {
  id: number;
  storage_url: string;
  true_location: string;
  mode_tags: string[];
  difficulty: number;
  created_at: string;
  tempUrl?: string;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  /** 为 true 时 list-images 传入 include_deleted，便于查看与恢复软删图片 */
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [editImg, setEditImg] = useState<ImageAsset | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [restoreImage, setRestoreImage] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [trueLocation, setTrueLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [modes, setModes] = useState<string[]>(["street_view"]);
  const [difficulty, setDifficulty] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const loadImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const res = await callFunction<{ images: ImageAsset[] }>("list-images", {
        limit: 30,
        ...(includeDeleted ? { include_deleted: true } : {}),
      });
      const list = res.images ?? [];
      const withUrls = await Promise.all(
        list.map(async (img) => {
          try {
            if (img.storage_url.startsWith("cloud://") || img.storage_url.startsWith("cos://")) {
              const r = await getTempFileURL(img.storage_url);
              return { ...img, tempUrl: r.tempFileURL };
            }
            return { ...img, tempUrl: img.storage_url };
          } catch {
            return img;
          }
        })
      );
      setImages(withUrls);
    } catch {
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, [includeDeleted]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (!f) return;
    if (!f.type.startsWith("image/")) { setUploadError("请选择图片文件"); return; }
    if (f.size > MAX_FILE_BYTES) { setUploadError("图片不超过 5MB"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file || !trueLocation.trim()) {
      setUploadError("请选择图片并填写真实地点");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const base64 = await fileToBase64(file);
      await createQuestion({
        original_image_base64: base64,
        true_location: trueLocation.trim(),
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        mode_tags: modes,
        difficulty,
      });
      setFile(null);
      setTrueLocation("");
      setLat("");
      setLng("");
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      setUploadSuccess(true);
      await loadImages();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该图片？此操作不可撤销。")) return;
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  const toggleMode = (mode: string) => {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">图片管理</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> 上传新图片
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadError && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{uploadError}</p>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" /> 上传成功
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>地理图片（≤5MB）</Label>
              <Input type="file" accept="image/*" onChange={onFileChange} />
              {previewUrl && (
                <img src={previewUrl} alt="预览" className="rounded-lg max-h-40 object-contain border border-border" />
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>真实地点 *</Label>
                <Input placeholder="例如：云南省大理市" value={trueLocation} onChange={(e) => setTrueLocation(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>纬度</Label>
                  <Input placeholder="25.6" value={lat} onChange={(e) => setLat(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>经度</Label>
                  <Input placeholder="100.2" value={lng} onChange={(e) => setLng(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>模式标签</Label>
                <div className="flex gap-2 flex-wrap">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMode(m)}
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                        modes.includes(m) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {ANNOTATION_MODES.find((x) => x.id === m)?.name ?? m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>难度（1-5）</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`h-8 w-8 rounded border text-sm font-medium transition-colors ${
                        difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file || !trueLocation.trim()}>
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中…</> : "上传图片"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold">已上传图片（{images.length}）</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              显示已软删（可编辑恢复）
            </label>
            <Button variant="outline" size="sm" onClick={loadImages} disabled={loadingImages}>
              {loadingImages ? <Loader2 className="h-3 w-3 animate-spin" /> : "刷新"}
            </Button>
          </div>
        </div>
        {loadingImages ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <Card
                key={img.id}
                className={`overflow-hidden ${img.deleted_at ? "opacity-80 ring-1 ring-destructive/30" : ""}`}
              >
                <div className="aspect-video bg-accent/20 overflow-hidden relative group">
                  {img.tempUrl ? (
                    <img src={img.tempUrl} alt={img.true_location} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无法加载</div>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除图片"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <CardContent className="p-2 space-y-1">
                  <p className="text-xs font-medium truncate">{img.true_location}</p>
                  <p className="text-xs text-muted-foreground">
                    {"★".repeat(img.difficulty)} · {img.mode_tags.join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
