import Link from "next/link";
import { ArrowRight, BookOpen, LogIn, UserPlus } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="wg-shell">
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-[#2e4a39] pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#3d654d] bg-[rgba(37,77,51,0.78)]">
              <span className="text-sm font-semibold text-[#f4fff7]">GA</span>
            </div>
            <span className="text-lg font-semibold text-[#ecfff1]">GeoAnnotate</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#3e644c] bg-[rgba(21,38,27,0.86)] px-4 text-sm text-[#d5e9dd]"
            >
              <LogIn className="h-4 w-4" />
              {"\u767b\u5f55"}
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#497359] bg-[rgba(36,87,52,0.9)] px-4 text-sm text-white"
            >
              <UserPlus className="h-4 w-4" />
              {"\u6ce8\u518c"}
            </Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#afccb9]">
              {"\u5730\u7406\u667a\u80fd\u5e73\u53f0"}
            </p>
            <h1 className="mt-4 font-['Jockey_One'] text-[clamp(3.6rem,10vw,7.2rem)] leading-[0.84] text-[#f2fff5]">
              {"\u6807\u6ce8\u4e0e\u5bf9\u6218"}
              <br />
              {"\u4e00\u7ad9\u5f0f\u5165\u53e3"}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#c2d8c9]">
              {"\u5728\u540c\u4e00\u4e2a\u5de5\u4f5c\u7a7a\u95f4\u4e2d\u5b8c\u6210\u6807\u6ce8\u4efb\u52a1\u3001AI \u5bf9\u6218\u3001\u79ef\u5206\u7ba1\u7406\u548c\u77e5\u8bc6\u5e93\u67e5\u9605\u3002"}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app/home"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-[#4a775c] bg-[rgba(36,87,52,0.9)] px-5 text-sm font-semibold text-white"
              >
                {"\u8fdb\u5165\u5e94\u7528"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/wiki"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-[#3f644c] bg-[rgba(20,37,27,0.82)] px-5 text-sm font-semibold text-[#deefe4]"
              >
                {"\u6253\u5f00\u77e5\u8bc6\u5e93"}
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#355843] bg-[rgba(14,27,19,0.78)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#a8c4b2]">
              {"\u529f\u80fd\u6982\u89c8"}
            </p>
            <ul className="mt-5 space-y-3 text-sm text-[#d6eadc]">
              <li>{"\u4efb\u52a1\u5206\u914d\u4e0e\u6807\u6ce8\u5ba1\u6838\u6d41\u7a0b"}</li>
              <li>{"\u591a\u56de\u5408 AI \u5bf9\u6218\u4e0e\u5b9e\u65f6\u8ba1\u5206"}</li>
              <li>{"\u79ef\u5206\u8bb0\u5f55\u4e0e\u5956\u52b1\u5151\u6362"}</li>
              <li>{"\u5b9e\u9a8c\u6587\u6863\u4e0e\u64cd\u4f5c\u6307\u5357"}</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
