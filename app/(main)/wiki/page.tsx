import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  FlaskConical,
  GitBranch,
  LibraryBig,
  Rocket,
  Wrench,
} from "lucide-react";

type WikiItem = {
  href: string;
  title: string;
  desc: string;
  icon: React.ElementType;
};

const START_ITEMS: WikiItem[] = [
  {
    href: "/wiki/getting-started/lab-intro",
    title: "实验室介绍",
    desc: "项目背景、目标与评估范围。",
    icon: Rocket,
  },
  {
    href: "/wiki/getting-started/reading-list",
    title: "阅读清单",
    desc: "核心参考资料与新人阅读顺序。",
    icon: BookOpen,
  },
  {
    href: "/wiki/getting-started/environment-setup",
    title: "环境配置",
    desc: "本地环境搭建与项目依赖说明。",
    icon: Wrench,
  },
  {
    href: "/wiki/getting-started/research-workflow",
    title: "科研流程",
    desc: "从标注到审核的完整流程。",
    icon: GitBranch,
  },
];

const RESOURCE_ITEMS: WikiItem[] = [
  {
    href: "/wiki/datasets",
    title: "数据集",
    desc: "图像集合、标签规范与来源说明。",
    icon: Database,
  },
  {
    href: "/wiki/tools",
    title: "工具",
    desc: "内部工具与使用参考。",
    icon: Wrench,
  },
  {
    href: "/wiki/experiments",
    title: "实验规范",
    desc: "实验记录、假设与结果总结。",
    icon: FlaskConical,
  },
  {
    href: "/wiki/glossary",
    title: "术语表",
    desc: "常用术语与快速释义。",
    icon: BookOpen,
  },
];

export default function WikiPage() {
  return (
    <div className="space-y-8 text-[#e6f7eb]">
      <section className="wg-panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#b8d6c2]">知识库</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <LibraryBig className="h-7 w-7 text-[#9bd0ad]" />
              GeoAnnotate 知识库
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#c5dacd]">
              用于入门、数据处理、标注流程与运营规范的结构化文档。
            </p>
          </div>
          <Link
            href="/wiki/faq"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#4a765b] bg-[rgba(31,66,44,0.85)] px-4 text-sm font-medium text-white"
          >
            常见问题
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <WikiGroup title="入门指南" items={START_ITEMS} />
        <WikiGroup title="资源中心" items={RESOURCE_ITEMS} />
      </section>
    </div>
  );
}

function WikiGroup({ title, items }: { title: string; items: WikiItem[] }) {
  return (
    <div className="wg-panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#effff4]">{title}</h2>
      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-md border border-[#355843] bg-[rgba(21,39,28,0.8)] p-4 transition hover:border-[#58866b] hover:bg-[rgba(29,53,38,0.88)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#f4fff7]">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-[#bad3c2]">{item.desc}</p>
                </div>
                <Icon className="h-4 w-4 text-[#9bcdb0] transition group-hover:text-white" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
