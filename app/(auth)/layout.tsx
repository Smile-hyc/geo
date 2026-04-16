export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wg-shell">
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_520px]">
        <section className="hidden border-r border-[#2b4635] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#a8c7b3]">
              GeoAnnotate
            </p>
            <h1 className="mt-4 max-w-[520px] font-['Jockey_One'] text-6xl leading-[0.9] text-[#ecfff0]">
              欢迎回到地理任务场
            </h1>
            <p className="mt-6 max-w-[520px] text-sm leading-7 text-[#bdd4c4]">
              登录后可在同一空间继续标注、审核与对战流程。
            </p>
          </div>
          <div className="wg-panel p-5 text-xs text-[#c5dbcf]">
            与主应用保持一致的界面壳层，减少卡片层级，提升导航对比与任务聚焦。
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}
