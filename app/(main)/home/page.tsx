"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crosshair, Brain, Swords, Trophy, Map, Zap, Database, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

const FEATURES = [
  {
    href: "/app/annotate/mode",
    title: "快速标注",
    description: "高效的单张影像标注流程，支持多种几何类型。",
    icon: Crosshair,
    color: "bg-sky-500",
    lightColor: "bg-sky-50",
    textColor: "text-sky-600",
  },
  {
    href: "/app/battle",
    title: "竞技对战",
    description: "在快节奏的多轮竞技中挑战 AI，提升标注精度。",
    icon: Swords,
    color: "bg-indigo-500",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
  },
  {
    href: "/app/inference",
    title: "推理任务",
    description: "利用大模型与地理空间推理技术，自动化验证与处理复杂标注。",
    icon: Brain,
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
];

export default function HomePage() {
  return (
    <div className="relative pb-20 pt-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-sky-200/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-blue-200/20 blur-[80px] rounded-full" />
      </div>

      <section className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-xs font-bold uppercase tracking-wider mb-6">
            <Zap size={14} className="fill-sky-600" />
            识图 · 寻境 · 地衡
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            识图寻境 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">空间智能平台</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
            面向图像地理定位与可信求证场景，提供从快速初判到高精度核验再到数据回流的完整能力链路，
            让空间推理更快、更准、更可审计。
          </p>
        </motion.div>
      </section>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {FEATURES.map((feature) => (
          <motion.div key={feature.href} variants={item}>
            <Link
              href={feature.href}
              className="group relative flex flex-col h-full p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-sky-100 transition-all duration-500 overflow-hidden"
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity", feature.color)} />

              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500", feature.lightColor, feature.textColor)}>
                <feature.icon size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {feature.description}
              </p>

              <div className="mt-auto flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">
                立即进入
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-20 p-8 rounded-[3rem] bg-sky-50 border border-sky-100 text-slate-900 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none text-sky-500">
          <Globe className="absolute -right-20 -bottom-20 w-80 h-80" />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-12 relative z-10">
          <StatItem icon={Map} label="识图任务量" value="128k+" />
          <StatItem icon={Database} label="活跃求证流" value="456" />
          <StatItem icon={Trophy} label="本月交付案例" value="1,240+" />
        </div>
      </motion.section>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-sky-100">
        <Icon size={20} className="text-sky-600" />
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
}
