import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminAnalyticsPage() {
  return (
    <ComingSoonPanel
      title="数据分析"
      description="这个占位页先把需求文档中的分析区域预留出来，同时保持当前应用可运行。"
      bullets={[
        "目前还没有图表实现。",
        "现有导出与排行榜数据可以作为后续仪表盘的种子数据。",
        "行为埋点和面向科研分析的事件统计仍待补齐。",
      ]}
    />
  );
}
