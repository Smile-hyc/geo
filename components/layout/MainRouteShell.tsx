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

  return <AppShell>{children}</AppShell>;
}
