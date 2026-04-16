import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoAnnotate",
  description: "GeoAnnotate 地理标注与竞技平台",
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
