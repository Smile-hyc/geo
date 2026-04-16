import Link from "next/link";
import WikiSidebar from "@/components/wiki/WikiSidebar";
import WikiMobileNav from "@/components/wiki/WikiMobileNav";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wiki-doc wg-shell flex min-h-screen">
      <WikiSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="wg-stripe sticky top-0 z-20 border-b border-[#2c4a37] px-4 py-3">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#c2ddcb]">
                GeoAnnotate 知识库
              </p>
              <p className="text-sm text-[#d9ebde]">
                文档、流程与实验参考
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="rounded-md border border-[#345841] bg-[rgba(19,38,27,0.85)] px-3 py-1.5 text-[#d2e8da]"
              >
                落地页
              </Link>
              <Link
                href="/app/home"
                className="rounded-md border border-[#487257] bg-[rgba(36,87,52,0.85)] px-3 py-1.5 text-white"
              >
                应用首页
              </Link>
            </div>
          </div>
        </header>

        <div className="border-b border-[#2f4a3a] px-4 py-2 lg:hidden">
          <WikiMobileNav />
        </div>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10">
          <article className="wiki-article wg-panel px-6 py-7 lg:px-10">{children}</article>
        </main>
      </div>
    </div>
  );
}
