import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-semibold text-foreground tracking-tight">
        GeoAnnotate
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        地理图片推理与标注 · 数据收集
      </p>
      <nav className="flex gap-4">
        <Link
          href="/play"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          开始答题
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition"
        >
          管理后台
        </Link>
      </nav>
    </main>
  );
}
