"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { listSubmissions, getTempFileURL, callFunction, exportAnnotations } from "@/lib/cloudbase";
import { useAuthStore, useAuthStoreHydrated } from "@/lib/auth";

interface BBoxItem {
  x: number;
  y: number;
  width: number;
  height: number;
  label_type: string;
  explanation: string;
}

interface Submission {
  id: number;
  username: string;
  mode_type: string;
  thought_text: string;
  final_answer: string;
  confidence: number;
  quality_status: string;
  annotated_image_url: string | null;
  image_storage_url: string;
  created_at: string;
  last_review_score?: number | null;
  last_review_comments?: string | null;
  last_reviewed_at?: string | null;
  last_reviewer_username?: string | null;
  bboxes?: BBoxItem[];
  tempAnnotatedUrl?: string;
  tempImageUrl?: string;
}

const STATUS_FILTER = ["all", "pending", "approved", "rejected"];

type Draft = { comment: string; score: string };

export default function AdminReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStoreHydrated();
  const fetchGenRef = useRef(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const getDraft = (id: number): Draft =>
    drafts[id] ?? { comment: "", score: "" };

  const setDraftField = (id: number, partial: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraft(id), ...partial },
    }));
  };

  const loadData = useCallback(async () => {
    if (!authHydrated) return;
    if (!user || (!user.uid && !user.email)) {
      setLoading(false);
      setListError(null);
      setSubmissions([]);
      setTotal(0);
      return;
    }
    const { uid: cloudbase_uid, email } = user;
    const gen = ++fetchGenRef.current;
    setLoading(true);
    setListError(null);
    try {
      const res = await listSubmissions({
        limit: 30,
        quality_status: filter === "all" ? undefined : filter,
        cloudbase_uid,
        email,
      });
      if (gen !== fetchGenRef.current) return;
      const list = (res.submissions as unknown as Submission[]) ?? [];
      setTotal(res.total ?? 0);

      const withUrls = await Promise.all(
        list.map(async (sub) => {
          let tempAnnotatedUrl: string | undefined;
          let tempImageUrl: string | undefined;
          try {
            if (sub.annotated_image_url) {
              const r = await getTempFileURL(sub.annotated_image_url);
              tempAnnotatedUrl = r.tempFileURL;
            }
          } catch { /* ignore */ }
          try {
            if (sub.image_storage_url) {
              const r = await getTempFileURL(sub.image_storage_url);
              tempImageUrl = r.tempFileURL;
            }
          } catch { /* ignore */ }
          return { ...sub, tempAnnotatedUrl, tempImageUrl };
        })
      );
      if (gen !== fetchGenRef.current) return;
      setSubmissions(withUrls);
    } catch (e) {
      if (gen !== fetchGenRef.current) return;
      setSubmissions([]);
      setListError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [authHydrated, filter, user?.uid, user?.email]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runReview = async (id: number, status: "approved" | "rejected") => {
    setReviewError(null);
    setActionLoading(id);
    const d = getDraft(id);
    const scoreRaw = d.score.trim();
    let review_score: number | undefined;
    if (scoreRaw) {
      const n = parseInt(scoreRaw, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 5) review_score = n;
    }
    try {
      await callFunction("review-annotation", {
        record_id: id,
        quality_status: status,
        comments: d.comment.trim() || undefined,
        review_score: review_score ?? undefined,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                quality_status: status,
                last_reviewer_username: user?.username ?? s.last_reviewer_username,
                last_review_score: review_score ?? null,
                last_review_comments: d.comment.trim() || null,
                last_reviewed_at: new Date().toISOString(),
              }
            : s
        )
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "审核失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = (id: number, status: "approved" | "rejected") => {
    void runReview(id, status);
  };

  const handleExport = async (qualityFilter?: "approved" | "pending" | "rejected") => {
    setExporting(true);
    try {
      const { jsonl, skipped } = await exportAnnotations({
        quality_status: qualityFilter,
        limit: 5000,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      const blob = new Blob([jsonl], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `geoannotate-export-${qualityFilter || "all"}-${new Date().toISOString().slice(0, 10)}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      if (skipped.length > 0) {
        const details = skipped
          .map((s) => `记录 ${s.record_id}（图片 ${s.image_id}）：${s.reason}`)
          .join("\n");
        alert(`导出完成，但跳过了 ${skipped.length} 条不完整记录：\n${details}`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* 错误提示 */}
        {listError && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">{listError}</p>
        )}
        {reviewError && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">{reviewError}</p>
        )}

        {/* 核心白底卡片容器 */}
        <div className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E5E6EB] p-6 md:p-8">
          
          {/* 头部：标题与操作 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-[20px] font-[700] text-[#1D2129]">标注审核</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-[36px] border-[#E5E6EB] text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5]"
                onClick={() => void loadData()}
                disabled={loading || !authHydrated || !user}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                刷新
              </Button>
              <Button
                variant="outline"
                className="h-[36px] border-[#E5E6EB] text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5]"
                onClick={() => handleExport(filter === "all" ? undefined : (filter as "approved" | "pending" | "rejected"))}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                导出 JSON
              </Button>
            </div>
          </div>

          {/* 纯净版 Tab 栏 */}
          <div className="flex items-center gap-2 border-b border-[#E5E6EB] pb-4 mb-6">
            {STATUS_FILTER.map((s) => {
              const isActive = filter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-[4px] text-[14px] transition-colors ${
                    isActive 
                      ? "bg-[#E8F3FF] text-[#165DFF] font-[500]" 
                      : "text-[#4E5969] hover:bg-[#F2F3F5]"
                  }`}
                >
                  {{ all: "全部", pending: "待审核", approved: "已通过", rejected: "已拒绝" }[s]}
                </button>
              );
            })}
            <span className="ml-auto text-[13px] text-[#86909C]">共 {total} 条记录</span>
          </div>

          {/* 列表主体 */}
          {!authHydrated || loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-20 text-center text-[#86909C] text-[14px]">暂无记录</div>
          ) : (
            <div className="space-y-6">
              {submissions.map((sub) => (
                <div key={sub.id} className="border border-[#E5E6EB] rounded-[8px] overflow-hidden">
                  
                  {/* Item 头部信息 */}
                  <div className="px-6 py-4 flex items-start justify-between bg-white border-b border-[#E5E6EB]">
                    <div>
                      <h3 className="text-[16px] font-[600] text-[#1D2129]">
                        {sub.username} · {sub.mode_type}
                      </h3>
                      <p className="text-[13px] text-[#86909C] mt-1">
                        {new Date(sub.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-[500] ${
                      sub.quality_status === "approved" ? "bg-[#DCFCE7] text-[#166534]" :
                      sub.quality_status === "rejected" ? "bg-[#FEE2E2] text-[#EF4444]" :
                      "bg-[#FFF7E8] text-[#FF7D00]"
                    }`}>
                      {{ pending: "待审核", approved: "已通过", rejected: "已拒绝" }[sub.quality_status] ?? sub.quality_status}
                    </span>
                  </div>

                  {/* Item 内容区域 */}
                  <div className="p-6 bg-white space-y-6">
                    
                    {/* 图片预览展示 (保留功能) */}
                    {(sub.tempImageUrl || sub.tempAnnotatedUrl) && (
                      <div className="flex gap-4">
                        {sub.tempImageUrl && (
                          <div className="space-y-1.5">
                            <p className="text-[12px] text-[#86909C]">原图</p>
                            <img src={sub.tempImageUrl} alt="原图" className="h-32 w-auto max-w-[240px] object-cover rounded-[6px] border border-[#E5E6EB]" />
                          </div>
                        )}
                        {sub.tempAnnotatedUrl && (
                          <div className="space-y-1.5">
                            <p className="text-[12px] text-[#86909C]">标注图</p>
                            <img src={sub.tempAnnotatedUrl} alt="标注图" className="h-32 w-auto max-w-[240px] object-cover rounded-[6px] border border-[#165DFF]/30" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 思维过程与结果 */}
                    <div>
                      <p className="text-[13px] text-[#4E5969] mb-2 font-medium">思维过程</p>
                      <div className="bg-[#F7F8FA] p-4 rounded-[6px] text-[14px] text-[#4E5969] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {sub.thought_text || "—"}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-[14px] text-[#1D2129]">
                      <span className="font-medium mr-2">答案：</span> {sub.final_answer || "—"} 
                      <span className="mx-4 text-[#E5E6EB]">|</span>
                      <span className="font-medium mr-2">置信度：</span> {sub.confidence}%
                    </div>

                    {/* BBox 标注表格 */}
                    {(sub.bboxes && sub.bboxes.length > 0) && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-[#4E5969] font-medium">Bounding Box 标注</p>
                        <div className="rounded-[6px] border border-[#E5E6EB] overflow-hidden">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#F7F8FA] text-[#86909C] border-b border-[#E5E6EB]">
                              <tr>
                                <th className="px-4 py-2.5 font-[500]">序号</th>
                                <th className="px-4 py-2.5 font-[500]">标签</th>
                                <th className="px-4 py-2.5 font-[500]">坐标 (x, y)</th>
                                <th className="px-4 py-2.5 font-[500]">尺寸 (w×h)</th>
                                <th className="px-4 py-2.5 font-[500]">说明</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E6EB]">
                              {sub.bboxes.map((b, i) => (
                                <tr key={i} className="text-[#1D2129]">
                                  <td className="px-4 py-3">{i + 1}</td>
                                  <td className="px-4 py-3 font-medium">{b.label_type || "—"}</td>
                                  <td className="px-4 py-3 font-mono text-[#4E5969]">({b.x.toFixed(1)}, {b.y.toFixed(1)})</td>
                                  <td className="px-4 py-3 font-mono text-[#4E5969]">{b.width.toFixed(1)}×{b.height.toFixed(1)}</td>
                                  <td className="px-4 py-3 text-[#4E5969] break-words">{b.explanation || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 历史审核记录展示 */}
                    {sub.last_reviewer_username && (
                      <div className="bg-[#F2F3F5] rounded-[6px] p-4 text-[13px] text-[#4E5969] space-y-1">
                        <p className="font-medium text-[#1D2129]">最近审核记录</p>
                        <p>审核人：{sub.last_reviewer_username} &nbsp;·&nbsp; 时间：{sub.last_reviewed_at && new Date(sub.last_reviewed_at).toLocaleString("zh-CN")}</p>
                        {sub.last_review_score != null && <p>质量评分：{sub.last_review_score} / 5</p>}
                        {sub.last_review_comments && <p className="mt-1 text-[#1D2129]">评语：{sub.last_review_comments}</p>}
                      </div>
                    )}

                    {/* 待审核操作区 (完美还原实心通过/拒绝按钮) */}
                    {sub.quality_status === "pending" && (
                      <div className="mt-6 pt-6 border-t border-[#E5E6EB] space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[13px] text-[#4E5969]">质量分 1–5（可选）</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              placeholder="不填则无分数"
                              className="h-[36px] text-[13px] focus-visible:ring-[#165DFF]"
                              value={getDraft(sub.id).score}
                              onChange={(e) => setDraftField(sub.id, { score: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[13px] text-[#4E5969]">备注说明（可选，拒绝时建议填写原因）</Label>
                          <Textarea
                            className="min-h-[80px] text-[13px] focus-visible:ring-[#165DFF]"
                            placeholder="填写审核说明或拒绝原因..."
                            value={getDraft(sub.id).comment}
                            onChange={(e) => setDraftField(sub.id, { comment: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                          <Button
                            className="h-[36px] px-8 bg-[#00B42A] hover:bg-[#009A22] text-white rounded-[4px] border-none font-medium transition-colors"
                            onClick={() => handleReview(sub.id, "approved")}
                            disabled={actionLoading === sub.id}
                          >
                            {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "通过"}
                          </Button>
                          <Button
                            className="h-[36px] px-8 bg-[#F53F3F] hover:bg-[#D93636] text-white rounded-[4px] border-none font-medium transition-colors"
                            onClick={() => handleReview(sub.id, "rejected")}
                            disabled={actionLoading === sub.id}
                          >
                            {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "拒绝"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}