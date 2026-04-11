"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle, Trash2, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#EFF6FF] p-8 font-sans">
      <div className="max-w-[1120px] mx-auto space-y-6">
        
        {/* 页面大标题 */}
        <h1 className="text-[24px] font-[700] text-[#111827] leading-[32px]">图片</h1>
        
        <Card className="rounded-[8px] border border-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-6">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-[20px] font-[600] text-[#111827] flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#111827]" /> 上传新图片
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {uploadError && (
              <p className="text-sm text-[#F53F3F] bg-[#F53F3F]/10 px-4 py-3 rounded-md">{uploadError}</p>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-[#00B42A] text-sm bg-[#00B42A]/10 px-4 py-3 rounded-md">
                <CheckCircle className="h-4 w-4" /> 上传成功
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[14px] font-[500] text-[#111827]">地理图片 (≤5MB)</Label>
                <div className="border border-[#EBE5EA] rounded-[8px] p-3 bg-white hover:border-[#165DFF] transition-colors">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={onFileChange} 
                    className="border-none shadow-none p-0 cursor-pointer text-[#6B7280]"
                  />
                </div>
                {previewUrl && (
                  <div className="mt-4 rounded-[8px] overflow-hidden border border-[#EBE5EA]">
                    <img src={previewUrl} alt="预览" className="w-full max-h-48 object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-[14px] font-[500] text-[#111827]">真实地点 *</Label>
                  <Input 
                    placeholder="例如：云南省大理市" 
                    value={trueLocation} 
                    onChange={(e) => setTrueLocation(e.target.value)} 
                    className="h-[38px] rounded-[8px] border-[#EBE5EA] bg-white placeholder:text-[#9CA3AF] focus-visible:ring-[#165DFF]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[14px] font-[500] text-[#111827]">纬度</Label>
                    <Input 
                      placeholder="25.6" 
                      value={lat} 
                      onChange={(e) => setLat(e.target.value)} 
                      className="h-[38px] rounded-[8px] border-[#EBE5EA] bg-white text-[#0A0A0A] focus-visible:ring-[#165DFF]"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[14px] font-[500] text-[#111827]">经度</Label>
                    <Input 
                      placeholder="100.2" 
                      value={lng} 
                      onChange={(e) => setLng(e.target.value)} 
                      className="h-[38px] rounded-[8px] border-[#EBE5EA] bg-white text-[#0A0A0A] focus-visible:ring-[#165DFF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[14px] font-[500] text-[#111827]">模式标签</Label>
              <div className="flex gap-3 flex-wrap">
                {MODE_OPTIONS.map((m) => {
                  const isActive = modes.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMode(m)}
                      className={`h-[36px] px-4 rounded-[4px] text-[14px] transition-colors ${
                        isActive ? "bg-[#165DFF] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {ANNOTATION_MODES.find((x) => x.id === m)?.name ?? m}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[14px] font-[500] text-[#111827]">难度 (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => {
                  const isActive = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`h-[48px] w-[48px] rounded-[4px] text-[14px] font-[500] transition-colors border ${
                        isActive ? "border-[#165DFF] text-[#165DFF] bg-blue-50/50" : "border-[#EBE5EA] text-[#4B5563] hover:bg-gray-50"
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !file || !trueLocation.trim()}
                className="h-[44px] px-8 bg-[#165DFF] hover:bg-[#0E42C9] text-white rounded-[4px] text-[14px] font-[500]"
              >
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中…</> : "上传图片"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[8px] border border-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-6">
          <CardHeader className="p-0 pb-6 flex flex-row flex-wrap items-center justify-between gap-2 border-b border-[#E5E6EB] mb-6">
            <CardTitle className="text-[20px] font-[600] text-[#111827]">
              已上传图片 ({images.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              显示已软删（可编辑恢复）
            </label>
            <Button variant="outline" size="sm" onClick={loadImages} disabled={loadingImages} className="border-[#EBE5EA] text-[#4E5969]">
                {loadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
          </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loadingImages ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#165DFF]" />
                <p className="text-[16px]">加载中...</p>
              </div>
            ) : images.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
                 <p className="text-[16px]">暂无上传的图片</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <Card
                key={img.id}
                className={`overflow-hidden border-[#EBE5EA] shadow-sm hover:shadow-md transition-shadow relative ${img.deleted_at ? "opacity-80 ring-1 ring-destructive/30" : ""}`}
              >
                    <div className="aspect-video bg-[#F2F3F5] overflow-hidden relative group">
                      {img.tempUrl ? (
                        <img src={img.tempUrl} alt={img.true_location} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#86909C] text-xs">无法加载</div>
                      )}
                      
                      
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setRestoreImage(!!img.deleted_at);
                            setEditImg({ ...img, image_meta_json: { ...(img.image_meta_json || {}) } });
                          }}
                          className="bg-black/60 hover:bg-[#165DFF] text-white rounded px-2 py-1.5 text-[12px] font-medium transition-colors backdrop-blur-sm"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(img.id)}
                          className="bg-black/60 hover:bg-[#F53F3F] text-white rounded p-1.5 transition-colors backdrop-blur-sm"
                          title="软删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-1 bg-white relative">
                      
                      {img.deleted_at && (
                        <div className="absolute top-0 right-0 bg-[#F53F3F]/10 text-[#F53F3F] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                          已软删
                        </div>
                      )}
                      <p className="text-[14px] font-[500] text-[#1D2129] truncate pr-8">{img.true_location}</p>
                      <p className="text-[12px] text-[#86909C]">
                        <span className="text-[#FF7D00]">{"★".repeat(img.difficulty)}</span> · {img.mode_tags.join(", ")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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