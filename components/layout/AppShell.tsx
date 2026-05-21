"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  fullBleed = false,
  /** 对战配置等需要更宽主内容区的页面（避免三栏内表格横向滚动） */
  wideContent = false,
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
  wideContent?: boolean;
}) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        <Navbar />
        <main
          className={cn(
            "pt-24 min-h-screen",
            fullBleed ? "pt-0" : "px-4 pb-12 sm:px-6 lg:px-8"
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "mx-auto w-full",
              fullBleed ? "" : wideContent ? "max-w-[min(100%,1820px)]" : "max-w-7xl"
            )}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  );
}
