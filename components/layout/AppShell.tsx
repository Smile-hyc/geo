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
        <div className="mx-auto flex min-h-screen w-full flex-col">
          <Navbar />
          <main className="flex-1 bg-transparent text-foreground">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
