"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, LogIn, UserPlus, Globe, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Mesh Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/20 blur-[120px] rounded-full" />
      </div>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-lg border border-sky-100 group-hover:rotate-12 transition-transform">
            <span className="text-lg font-black text-primary">GA</span>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">GeoAnnotate</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="rounded-full">
              <LogIn className="mr-2 h-4 w-4" />
              登录
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="rounded-full px-8">
              立即加入
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-sm font-bold mb-8">
             <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
             下一代地理数据协作平台
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tight mb-8">
            标注、竞技<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">定义未来地图</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            GeoAnnotate 为标注者提供沉浸式的竞技体验。在这里，每一次点击都在构建智能世界的基石，每一份贡献都值得被奖赏。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app/home">
              <Button size="lg" className="rounded-full h-16 px-10 text-lg shadow-xl shadow-sky-200">
                进入应用
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/wiki">
              <Button size="lg" variant="outline" className="rounded-full h-16 px-10 text-lg border-2">
                查阅知识库
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl"
        >
          <FeatureCard 
            icon={Globe}
            title="全球协作"
            description="连接世界各地的标注者，共同维护高质量地理数据集。"
          />
          <FeatureCard 
            icon={Zap}
            title="即时竞技"
            description="与 AI 实时对战，在不断的博弈中提升标注精准度。"
          />
          <FeatureCard 
            icon={Shield}
            title="专家审核"
            description="多层级的人机协同审核机制，确保数据达到工业级标准。"
          />
        </motion.div>
      </main>

      <footer className="p-12 text-center text-slate-400 text-sm">
        © 2026 GeoAnnotate. 构建于地理智能之巅。
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left">
      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
