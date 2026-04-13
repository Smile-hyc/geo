"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { exportAnnotations, recordEvent } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const QUALITY_OPTIONS = [
  { value: undefined, label: "全部数据" },
  { value: "approved" as const, label: "仅已通过" },
  { value: "pending" as const, label: "仅待审核" },
  { value: "rejected" as const, label: "仅已拒绝" },
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
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* 标题区域 */}
        <div className="mb-6">
          <h1 className="text-[24px] font-[700] text-[#1D2129]">数据导出</h1>
          <p className="text-[14px] text-[#86909C] mt-1">导出标注数据和报告</p>
        </div>

        {/* 核心导出选项卡片 */}
        <div className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E5E6EB] p-8 space-y-10">
          
          <h2 className="text-[18px] font-[700] text-[#1D2129]">导出选项</h2>

          {/* 卡片式单选框区域 */}
          <div className="space-y-4">
            <Label className="text-[14px] font-[500] text-[#4E5969]">选择导出数据状态 (默认格式: JSONL)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUALITY_OPTIONS.map((opt) => {
                const isSelected = qualityFilter === opt.value;
                return (
                  <div
                    key={opt.label}
                    onClick={() => setQualityFilter(opt.value)}
                    className={`relative flex items-center p-4 rounded-[8px] border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[#165DFF] bg-[#F4F7FE]"
                        : "border-[#E5E6EB] bg-white hover:border-[#165DFF]/50"
                    }`}
                  >
                    {/* 模拟原生单选框 (Radio) 样式 */}
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 shrink-0 transition-colors ${
                      isSelected ? "border-[#165DFF]" : "border-[#C9CDD4]"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#165DFF]" />}
                    </div>
                    <span className={`text-[14px] font-[500] ${isSelected ? "text-[#165DFF]" : "text-[#1D2129]"}`}>
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 提示信息说明 */}
          <div className="bg-[#F7F8FA] p-5 rounded-[8px] text-[13px] text-[#86909C] leading-relaxed border border-[#E5E6EB]/50">
            每行一条完整记录；平台字段在 other 内。缺经纬度或图片宽高的记录将被跳过（不中断导出），可在上传或 admin 中补全。图片绝对路径前缀可由环境变量 <code className="bg-white px-1 py-0.5 rounded text-[#4E5969]">JSONL_EXPORT_IMAGE_PATH_PREFIX</code> 配置。
          </div>

          {/* 底部操作按钮 */}
          <div className="pt-6 border-t border-[#E5E6EB] flex items-center gap-4">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-[#165DFF] hover:bg-[#0E42C9] text-white h-[40px] px-8 rounded-[4px] font-[500] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  正在导出...
                </>
              ) : (
                "开始导出"
              )}
            </Button>
            <Button
              variant="outline"
              disabled={exporting}
              onClick={() => setQualityFilter(undefined)}
              className="h-[40px] px-8 border-[#E5E6EB] text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5] rounded-[4px] font-[500]"
            >
              重置选项
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}