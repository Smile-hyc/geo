import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "识图寻境",
  description: "识图寻境：识图、寻境、地衡三位一体空间智能平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
