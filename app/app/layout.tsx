import AppShell from "@/components/layout/AppShell";

export default function CoreAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
