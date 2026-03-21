import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoAnnotate | 地理推理标注",
  description: "地理图片推理与标注数据收集",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
