"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      const jsonl = await exportAnnotations({
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
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {listError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{listError}</p>
      )}
      {reviewError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{reviewError}</p>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">标注审核</h1>
        <p className="text-sm text-muted-foreground">共 {total} 条</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {{ all: "全部", pending: "待审核", approved: "已通过", rejected: "已拒绝" }[s]}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadData()}
          disabled={loading || !authHydrated || !user}
          className="ml-auto"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "刷新"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport(filter === "all" ? undefined : (filter as "approved" | "pending" | "rejected"))}
          disabled={exporting}
          className="gap-1.5"
        >
          {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          导出 JSONL
        </Button>
      </div>

      {!authHydrated || loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {submissions.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">暂无记录</CardContent></Card>
          )}
          {submissions.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{sub.username} · {sub.mode_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sub.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    sub.quality_status === "approved" ? "border-green-400/40 text-green-400 bg-green-400/10" :
                    sub.quality_status === "rejected" ? "border-red-400/40 text-red-400 bg-red-400/10" :
                    "border-yellow-400/40 text-yellow-400 bg-yellow-400/10"
                  }`}>
                    {{ pending: "待审核", approved: "已通过", rejected: "已拒绝" }[sub.quality_status] ?? sub.quality_status}
                  </span>
                </div>

                {sub.last_reviewer_username && (
                  <div className="text-xs rounded-md border border-border bg-muted/20 px-3 py-2 space-y-1">
                    <p className="font-medium text-muted-foreground">最近审核</p>
                    <p>
                      {sub.last_reviewer_username}
                      {sub.last_reviewed_at &&
                        ` · ${new Date(sub.last_reviewed_at).toLocaleString("zh-CN")}`}
                      {sub.last_review_score != null && ` · 质量分 ${sub.last_review_score}/5`}
                    </p>
                    {sub.last_review_comments && (
                      <p className="text-muted-foreground whitespace-pre-wrap">{sub.last_review_comments}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  {sub.tempImageUrl && (
                    <img src={sub.tempImageUrl} alt="原图" className="h-24 w-36 object-cover rounded-lg border border-border flex-shrink-0" />
                  )}
                  {sub.tempAnnotatedUrl && (
                    <img src={sub.tempAnnotatedUrl} alt="标注图" className="h-24 w-36 object-cover rounded-lg border border-primary/30 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">思维过程</p>
                      <p className="text-sm whitespace-pre-wrap mt-0.5 max-h-48 overflow-y-auto rounded border border-border p-2 bg-muted/30">{sub.thought_text || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">答案：{sub.final_answer || "—"} · 置信度：{sub.confidence}%</p>
                  </div>
                </div>

                {(sub.bboxes && sub.bboxes.length > 0) && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">BBox 标注（{sub.bboxes.length} 个）</p>
                    <div className="rounded border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="text-left py-1.5 px-2 font-medium">序号</th>
                            <th className="text-left py-1.5 px-2 font-medium">标签</th>
                            <th className="text-left py-1.5 px-2 font-medium">坐标 (x, y)</th>
                            <th className="text-left py-1.5 px-2 font-medium">尺寸 (w×h)</th>
                            <th className="text-left py-1.5 px-2 font-medium">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.bboxes.map((b, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="py-1.5 px-2">{i + 1}</td>
                              <td className="py-1.5 px-2">{b.label_type || "—"}</td>
                              <td className="py-1.5 px-2 font-mono">({b.x.toFixed(1)}, {b.y.toFixed(1)})</td>
                              <td className="py-1.5 px-2 font-mono">{b.width.toFixed(1)}×{b.height.toFixed(1)}</td>
                              <td className="py-1.5 px-2 max-w-64 break-words">{b.explanation || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {sub.quality_status === "pending" && (
                  <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/10">
                    <p className="text-xs font-medium text-muted-foreground">审核信息（写入审计表）</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">质量分 1–5（可选）</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          placeholder="不填则无分数"
                          value={getDraft(sub.id).score}
                          onChange={(e) => setDraftField(sub.id, { score: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">备注（可选，拒绝时建议填写原因）</Label>
                      <Textarea
                        className="min-h-[72px] text-sm"
                        placeholder="审核说明、拒绝原因等"
                        value={getDraft(sub.id).comment}
                        onChange={(e) => setDraftField(sub.id, { comment: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-green-400 border-green-400/40 hover:bg-green-400/10"
                        onClick={() => handleReview(sub.id, "approved")}
                        disabled={actionLoading === sub.id}
                      >
                        {actionLoading === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-400 border-red-400/40 hover:bg-red-400/10"
                        onClick={() => handleReview(sub.id, "rejected")}
                        disabled={actionLoading === sub.id}
                      >
                        <XCircle className="h-3 w-3" /> 拒绝
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
