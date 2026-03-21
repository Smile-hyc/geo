import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-transparent text-foreground">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,#60a5fa33,transparent_70%)] pointer-events-none" />
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 bg-transparent text-foreground">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
