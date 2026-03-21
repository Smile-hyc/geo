import Link from "next/link";
import WikiSidebar from "@/components/wiki/WikiSidebar";
import WikiMobileNav from "@/components/wiki/WikiMobileNav";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wiki-doc flex min-h-screen bg-[#fafafa] text-[#333]">
      <WikiSidebar />
      <div className="wiki-main flex-1 min-w-0 overflow-auto">
        <div className="border-b border-[#e1e4e8] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7d8590]">
                GeoAnnotate Wiki
              </p>
              <p className="text-sm text-[#57606a]">
                面向入门、流程、数据集与工具的公开文档。
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-[#57606a] hover:bg-[#f3f4f6]"
              >
                首页
              </Link>
              <Link
                href="/app/home"
                className="rounded-md bg-[#0969da] px-3 py-1.5 text-white"
              >
                打开平台
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:hidden border-b border-[#e1e4e8] bg-white px-4 py-2">
          <WikiMobileNav />
        </div>
        <article className="wiki-article max-w-4xl mx-auto px-6 py-8 lg:px-10">
          {children}
        </article>
      </div>
    </div>
  );
}
