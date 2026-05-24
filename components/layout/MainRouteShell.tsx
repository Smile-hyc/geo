"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default function MainRouteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/wiki")) {
    return <>{children}</>;
  }

  const wideContent =
    pathname === "/app/battle" ||
    pathname === "/battle" ||
    pathname === "/app/annotate/mode" ||
    pathname === "/annotate/mode";

  return <AppShell wideContent={wideContent}>{children}</AppShell>;
}
