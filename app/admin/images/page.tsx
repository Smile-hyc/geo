"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuestion, deleteImage, getTempFileURL, callFunction, adminUpdateImage } from "@/lib/cloudbase";

import { ANNOTATION_MODES } from "@/lib/modes";

const MODE_OPTIONS = ANNOTATION_MODES.map((m) => m.id);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface ImageAsset {
  id: number;
  storage_url: string;
  true_location: string;
  lat?: number | null;
  lng?: number | null;
  mode_tags: string[];
  difficulty: number;
  created_at: string;
  deleted_at?: string | null;
  source_type?: string | null;
  external_ref?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  image_meta_json?: Record<string, unknown>;
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
    if (!confirm("确认将该图片标记为删除？（软删除，关联标注保留）")) return;
    try {
      await deleteImage(id);
      await loadImages();
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
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreImage(!img.deleted_at);
                        setEditImg({ ...img, image_meta_json: { ...(img.image_meta_json || {}) } });
                      }}
                      className="bg-black/60 hover:bg-primary text-white rounded p-1 text-[10px] px-1.5"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(img.id)}
                      className="bg-black/60 hover:bg-destructive text-white rounded p-1"
                      title="软删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-2 space-y-1">
                  {img.deleted_at && (
                    <p className="text-[10px] text-red-400">已软删</p>
                  )}
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

      {editImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-base">编辑图片 #{editImg.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <Label>真实地点</Label>
                <Input value={editImg.true_location} onChange={(e) => setEditImg({ ...editImg, true_location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>纬度</Label>
                  <Input
                    value={editImg.lat ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditImg({
                        ...editImg,
                        lat: v === "" ? null : Number.isNaN(parseFloat(v)) ? editImg.lat : parseFloat(v),
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>经度</Label>
                  <Input
                    value={editImg.lng ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditImg({
                        ...editImg,
                        lng: v === "" ? null : Number.isNaN(parseFloat(v)) ? editImg.lng : parseFloat(v),
                      });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>source（数据集名）</Label>
                  <Input
                    value={editImg.source_type ?? ""}
                    onChange={(e) => setEditImg({ ...editImg, source_type: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>source_id / external_ref</Label>
                  <Input
                    value={editImg.external_ref ?? ""}
                    onChange={(e) => setEditImg({ ...editImg, external_ref: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>国家 country</Label>
                <Input
                  value={editImg.country ?? ""}
                  onChange={(e) => setEditImg({ ...editImg, country: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>主体名 name（进 image_meta_json）</Label>
                <Input
                  value={String((editImg.image_meta_json?.name as string) ?? "")}
                  onChange={(e) =>
                    setEditImg({
                      ...editImg,
                      image_meta_json: { ...editImg.image_meta_json, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>dataset_image_path（JSONL）</Label>
                <Input
                  value={String((editImg.image_meta_json?.dataset_image_path as string) ?? "")}
                  onChange={(e) =>
                    setEditImg({
                      ...editImg,
                      image_meta_json: { ...editImg.image_meta_json, dataset_image_path: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>gt lat range（度）</Label>
                  <Input
                    value={String((editImg.image_meta_json?.gt_latitude_range as string) ?? "")}
                    onChange={(e) =>
                      setEditImg({
                        ...editImg,
                        image_meta_json: {
                          ...editImg.image_meta_json,
                          gt_latitude_range: e.target.value === "" ? undefined : parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>gt lng range（度）</Label>
                  <Input
                    value={String((editImg.image_meta_json?.gt_longitude_range as string) ?? "")}
                    onChange={(e) =>
                      setEditImg({
                        ...editImg,
                        image_meta_json: {
                          ...editImg.image_meta_json,
                          gt_longitude_range: e.target.value === "" ? undefined : parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
              {editImg.deleted_at && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={restoreImage}
                    onChange={(e) => setRestoreImage(e.target.checked)}
                  />
                  恢复图片（清除 deleted_at）
                </label>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditImg(null);
                    setRestoreImage(false);
                  }}
                  disabled={editSaving}
                >
                  取消
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setEditSaving(true);
                      await adminUpdateImage({
                        image_id: editImg.id,
                        true_location: editImg.true_location,
                        lat: editImg.lat ?? undefined,
                        lng: editImg.lng ?? undefined,
                        mode_tags: editImg.mode_tags,
                        difficulty: editImg.difficulty,
                        source_type: editImg.source_type ?? undefined,
                        external_ref: editImg.external_ref ?? undefined,
                        country: editImg.country ?? undefined,
                        region: editImg.region ?? undefined,
                        city: editImg.city ?? undefined,
                        clear_deleted: restoreImage,
                        image_meta_json: { ...(editImg.image_meta_json || {}) },
                      });
                      setEditImg(null);
                      setRestoreImage(false);
                      await loadImages();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "保存失败");
                    } finally {
                      setEditSaving(false);
                    }
                  }}
                  disabled={editSaving}
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
