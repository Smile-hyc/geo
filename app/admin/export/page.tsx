"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportAnnotations, recordEvent } from "@/lib/cloudbase";
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
      try {
        await recordEvent({
          event_type: "admin_export_jsonl",
          event_payload_json: { quality_filter: qualityFilter ?? "all", limit: 5000 },
          cloudbase_uid: user?.uid,
          email: user?.email,
        });
      } catch {
        /* 埋点失败不影响导出 */
      }
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
        <p className="text-muted-foreground text-sm mt-1">导出标注记录为 JSONL（每行一条 JSON，含 GeoBench 对齐字段）</p>
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
            下载 JSONL
          </Button>
          <p className="text-xs text-muted-foreground">
            每行一条完整记录；平台字段在 other 内。缺经纬度或图片宽高时会整批报错。图片绝对路径前缀可由环境变量 JSONL_EXPORT_IMAGE_PATH_PREFIX 配置。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
