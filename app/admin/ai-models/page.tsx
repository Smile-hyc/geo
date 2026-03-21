import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminAiModelsPage() {
  return (
    <ComingSoonPanel
      title="AI 模型注册表"
      description="这个路由已经建好，用于匹配需求文档中的后台信息架构；真正的 provider registry 和适配器管理仍是后续工作。"
      bullets={[
        "当前对战流程仍然沿用云函数里的模拟 provider 逻辑。",
        "新的对战配置页已经把 AI 对手选择暴露成扩展入口。",
        "下一步应持久化 provider endpoint、版本、鉴权配置与限流设置。",
      ]}
    />
  );
}
