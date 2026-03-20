import MainRouteShell from "@/components/layout/MainRouteShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainRouteShell>{children}</MainRouteShell>;
}
