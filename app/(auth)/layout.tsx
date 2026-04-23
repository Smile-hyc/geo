"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-sky-300/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-300/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 border border-sky-100">
              <Image
                src="/images/home/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">识图寻境</span>
          </div>

          <h1 className="text-6xl font-extrabold text-slate-900 leading-[1.1]">
            让图片会说位置<br />
            <span className="text-primary">让推理可追溯</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-md">
            加入识图寻境，体验从图片快速识别到高精度空间求证的完整流程，
            并参与持续进化的数据飞轮。
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "识图响应", value: "Low Cost" },
              { label: "寻境结果", value: "Traceable" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-3xl bg-white/50 border border-white/80 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
