import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,#2563eb33,transparent_65%)] pointer-events-none" />
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 bg-background text-foreground">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
