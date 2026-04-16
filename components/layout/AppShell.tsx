import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppShell({
  children,
  fullBleed = false,
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <AuthGuard>
      <div className="wg-shell">
        <div className="mx-auto flex min-h-screen w-full flex-col">
          <Navbar />
          <main className={fullBleed ? "wg-content" : "wg-content px-4 py-4 sm:px-6 lg:px-8"}>
            {fullBleed ? (
              children
            ) : (
              <div className="mx-auto w-full max-w-[1700px]">{children}</div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
