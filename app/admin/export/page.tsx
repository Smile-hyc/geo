"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportAnnotations } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const QUALITY_OPTIONS = [
  { value: undefined, label: "全部" },
  { value: "approved" as const, label: "已通过" },
  { value: "pending" as const, label: "待审核" },
  { value: "rejected" as const, label: "已拒绝" },
];

export default function AdminExportPage() {
  const user = useAuthStore((s) => s.user);
  const [qualityFilter, setQualityFilter] = useState<"approved" | "pending" | "rejected" | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
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
<<<<<<< feature/role4-admin
      if (skipped.length > 0) {
        const details = skipped
          .map((s) => `记录 ${s.record_id}（图片 ${s.image_id}）：${s.reason}`)
          .join("\n");
        alert(`导出完成，但跳过了 ${skipped.length} 条不完整记录：\n${details}`);
      }
      try {
        await recordEvent({
          event_type: "admin_export_jsonl",
          event_payload_json: { quality_filter: qualityFilter ?? "all", limit: 5000, skipped_count: skipped.length },
          cloudbase_uid: user?.uid,
          email: user?.email,
        });
      } catch {
        /* 埋点失败不影响导出 */
      }
=======
>>>>>>> develop
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">导出数据</h1>
        <p className="text-muted-foreground text-sm mt-1">导出标注记录为 JSON 文件</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">标注数据导出</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">筛选条件</p>
            <div className="flex flex-wrap gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setQualityFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    qualityFilter === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出 JSON
          </Button>
          <p className="text-xs text-muted-foreground">
<<<<<<< feature/role4-admin
            每行一条完整记录；平台字段在 other 内。缺经纬度或图片宽高的记录将被跳过（不中断导出），可在上传或 admin 中补全。图片绝对路径前缀可由环境变量 JSONL_EXPORT_IMAGE_PATH_PREFIX 配置。
=======
            导出包含思维过程、BBox、答案等完整标注信息的 JSON 文件，最多 5000 条。
>>>>>>> develop
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
