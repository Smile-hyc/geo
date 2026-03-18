import WikiSidebar from "@/components/wiki/WikiSidebar";
import WikiMobileNav from "@/components/wiki/WikiMobileNav";

/**
 * Wiki 文档布局：左侧目录树 + 右侧正文
 * 风格参考 Read the Docs / Swift 文档：白底或浅灰、经典文档布局、强调层级与可检索性
 */
export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wiki-doc flex min-h-[calc(100vh-3.5rem)] bg-[#fafafa] text-[#333]">
      <WikiSidebar />
      <div className="wiki-main flex-1 min-w-0 overflow-auto">
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
