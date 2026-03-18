/**
 * Wiki 目录结构（与 wiki.docx 建议一致）
 * 管理员可在此维护侧边栏与层级
 */
export interface WikiNavItem {
  title: string;
  href: string;
  children?: WikiNavItem[];
}

export const WIKI_NAV: WikiNavItem[] = [
  {
    title: "首页",
    href: "/wiki",
  },
  {
    title: "入门",
    href: "/wiki/getting-started",
    children: [
      { title: "实验室介绍", href: "/wiki/getting-started/lab-intro" },
      { title: "环境配置", href: "/wiki/getting-started/environment-setup" },
      { title: "阅读清单", href: "/wiki/getting-started/reading-list" },
      { title: "科研流程", href: "/wiki/getting-started/research-workflow" },
    ],
  },
  {
    title: "数据集",
    href: "/wiki/datasets",
  },
  {
    title: "工具",
    href: "/wiki/tools",
  },
  {
    title: "实验规范",
    href: "/wiki/experiments",
  },
  {
    title: "常见问题",
    href: "/wiki/faq",
  },
  {
    title: "术语表",
    href: "/wiki/glossary",
  },
];
