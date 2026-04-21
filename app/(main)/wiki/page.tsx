import Link from "next/link";
import {
  ArrowRight,
  Database,
  FlaskConical,
  GitBranch,
  LibraryBig,
  Rocket,
  Wrench,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-12">
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <LibraryBig size={14} />
              知识库中心
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              GeoAnnotate Wiki
            </h1>
            <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
              用于入门、数据处理、标注流程与运营规范的结构化文档。在这里您可以找到关于平台的一切技术细节。
            </p>
          </div>
          <Link href="/wiki/faq">
            <Button className="rounded-full shadow-lg shadow-sky-100 px-6">
              常见问题
              <HelpCircle size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <WikiGroup title="入门指南" items={START_ITEMS} />
        <WikiGroup title="资源中心" items={RESOURCE_ITEMS} />
      </div>
    </div>
  );
}

function WikiGroup({ title, items }: { title: string; items: WikiItem[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
        <span className="w-8 h-1 bg-primary rounded-full" />
        {title}
      </h2>
      <div className="grid gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block"
            >
              <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group-hover:translate-x-1 group-hover:bg-sky-50/30">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-primary transition-colors mt-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
