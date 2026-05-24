"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { 
  Database, TrendingUp, ClipboardCheck, Award, 
  Ticket, Shield, BookOpen, BarChart2, 
  PenTool, Swords, UploadCloud, Trophy, 
  Inbox, Zap, Sparkles, ChevronRight, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// ================= 数据字典 =================
const STATS = [
  { title: "当前可用积分", value: 65, unit: "pts", icon: Database, color: "text-blue-500", bg: "bg-blue-100/50" },
  { title: "本周获得", value: 128, unit: "pts", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-100/50" },
  { title: "累计任务", value: 42, unit: "tasks", icon: ClipboardCheck, color: "text-purple-500", bg: "bg-purple-100/50" },
];

const REWARDS = [
  { id: 1, name: "高级视觉模型体验券", desc: "获得高级视觉模型的体验额度券", type: "模型额度", typeColor: "text-blue-600 bg-blue-50", stock: 6, cost: 100, icon: Ticket, iconColor: "text-blue-500", iconBg: "bg-blue-100/50" },
  { id: 2, name: "排行榜专属徽章", desc: "在主页展示高阶排位专属荣誉", type: "成就展示", typeColor: "text-amber-600 bg-amber-50", stock: 20, cost: 50, icon: Shield, iconColor: "text-amber-500", iconBg: "bg-amber-100/50" },
  { id: 3, name: "历史题库无限解锁", desc: "解锁全部历史题库与超详细解析", type: "数据权限", typeColor: "text-emerald-600 bg-emerald-50", stock: 10, cost: 80, icon: BookOpen, iconColor: "text-emerald-500", iconBg: "bg-emerald-100/50" },
  { id: 4, name: "对战复盘分析券", desc: "获取深度的单次对战复盘报告", type: "分析工具", typeColor: "text-purple-600 bg-purple-50", stock: 8, cost: 60, icon: BarChart2, iconColor: "text-purple-500", iconBg: "bg-purple-100/50" },
];

const POINTS_SOURCES = [
  { label: "有效标注", points: "+5 pts", icon: PenTool, color: "text-blue-500", bg: "bg-blue-100/50" },
  { label: "对战胜利", points: "+10 pts", icon: Swords, color: "text-emerald-500", bg: "bg-emerald-100/50" },
  { label: "高质量样本", points: "+15 pts", icon: UploadCloud, color: "text-purple-500", bg: "bg-purple-100/50" },
  { label: "Top 10% 榜单", points: "+50 pts", icon: Trophy, color: "text-amber-500", bg: "bg-amber-100/50" },
];

const TABS = ["全部", "模型额度", "徽章", "数据权限", "对战权益"];

// ================= 动画字典 =================
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 20 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ================= 黑科技：数字滚轮 =================
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const step = Math.max(Math.ceil((end - start) / 30), 1);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayValue.toLocaleString()}</>;
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("全部");
  const [shakeId, setShakeId] = useState<number | null>(null);
  const currentPoints = 65; 

  const triggerShake = (id: number) => {
    setShakeId(id);
    setTimeout(() => setShakeId(null), 500);
  };

  return (
    // 整体背景调亮，加入波点矩阵图案
    <div className="min-h-screen bg-slate-50 py-8 pb-24 relative overflow-hidden font-sans">
      
      {/* 💥 特效1：波点矩阵背景 (Pattern) */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      
      {/* 💥 特效2：巨型漂浮光晕 (Ambient Orbs) */}
      <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-sky-200/40 rounded-full blur-[100px] pointer-events-none" />
      <motion.div animate={{ x: [0, -40, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none" />

      {/* 容器缩小到 90% (max-w-[1150px]) */}
      <div className="max-w-[1150px] mx-auto px-6 relative z-10">
        
        {/* ================= 头部标题区 ================= */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-widest mb-4">
            <Zap size={14} className="fill-amber-500 text-amber-500" /> 
            全站积分权益中心
          </div>
          {/* 💥 特效3：彩虹流光渐变文字 */}
          <h1 className="text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            权益兑换
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            通过标注、对战和高质量数据贡献获取积分，并兑换模型额度、平台徽章与高级功能权限。
          </p>
        </motion.div>

        {/* ================= 顶部数据卡片 (4卡片布局回归) ================= */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {STATS.map((stat, idx) => (
            // 💥 特效4：3D 浮雕悬浮 & 巨大阴影
            <motion.div key={idx} variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}
              className="bg-white/80 backdrop-blur-md rounded-[1.5rem] p-6 border border-white shadow-sm hover:shadow-2xl hover:shadow-sky-100/50 transition-all group cursor-default relative overflow-hidden"
            >
              {/* 💥 特效5：卡片内的隐形巨型水印图案 */}
              <stat.icon size={100} strokeWidth={0.5} className="absolute -bottom-6 -right-6 text-slate-100 group-hover:text-sky-50 transition-colors duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10">
                {/* 💥 特效6：狂暴旋转放大的图标 */}
                <div className={cn("w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-lg", stat.bg, stat.color)}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-1">
                    {/* 💥 特效7：数字滚轮加载 */}
                    <span className="text-3xl font-black text-slate-800 tracking-tight"><AnimatedNumber value={stat.value} /></span>
                    <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* 等级卡片 (全亮色，不瞎眼) */}
          <motion.div variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-[1.5rem] p-6 border border-white shadow-sm hover:shadow-2xl hover:shadow-amber-200/40 transition-all relative overflow-hidden group cursor-default"
          >
            {/* 水印 */}
            <Award size={100} strokeWidth={0.5} className="absolute -bottom-6 -right-6 text-amber-200/40 group-hover:text-amber-200/60 transition-colors duration-500 pointer-events-none" />
            
            {/* 💥 特效8：不断闪烁的小星星 (Sparkles) */}
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-4 right-4 text-amber-400">
              <Sparkles size={16} className="fill-amber-400" />
            </motion.div>

            <div className="flex items-center gap-4 relative z-10">
              {/* 💥 特效9：常驻发光的金牌 */}
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300">
                <Award size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-600/60 mb-0.5">当前等级</p>
                <div className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1.5">Rookie</div>
                <p className="text-[10px] font-bold text-slate-500">
                  距 Contributor 差 <span className="text-amber-500">50 pts</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ================= 主体内容区 (8:4 经典比例) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= 左侧：权益列表 ================= */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-6 lg:p-8">
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">可兑换权益</h2>
              </div>

              {/* 💥 特效10：灵动岛 Tabs 飞梭背景 */}
              <div className="flex flex-wrap gap-2 mb-6 bg-slate-100/60 p-1.5 rounded-full inline-flex">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={cn("relative px-5 py-2 rounded-full text-xs font-bold transition-colors z-10", isActive ? "text-white" : "text-slate-500 hover:text-slate-800")}
                    >
                      {isActive && (
                        <motion.div layoutId="tab-bubble" className="absolute inset-0 bg-sky-500 rounded-full shadow-md shadow-sky-500/30 -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* 表头 */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-wider">
                <div className="col-span-6">权益名称</div>
                <div className="col-span-2 text-center">类型</div>
                <div className="col-span-4 text-right pr-2">消耗积分 / 操作</div>
              </div>

              {/* 列表 */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                {REWARDS.map((reward) => (
                  // 💥 特效11：流光边框扫射 + 行级悬浮放大
                  <motion.div key={reward.id} variants={fadeUp} whileHover={{ scale: 1.015, y: -2 }}
                    className="grid grid-cols-12 gap-4 px-4 py-4 items-center bg-white border border-slate-100 rounded-[1.2rem] hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 group"
                  >
                    {/* 名称与图标 */}
                    <div className="col-span-6 flex items-center gap-4">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6", reward.iconBg, reward.iconColor)}>
                        <reward.icon size={22} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 mb-0.5 group-hover:text-sky-600 transition-colors">{reward.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium line-clamp-1">{reward.desc}</div>
                      </div>
                    </div>
                    
                    {/* 类型 */}
                    <div className="col-span-2 flex justify-center">
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap", reward.typeColor)}>
                        {reward.type}
                      </span>
                    </div>

                    {/* 积分与按钮 (明牌展示) */}
                    <div className="col-span-4 flex justify-end items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-black text-slate-800 group-hover:text-sky-600 transition-colors">{reward.cost} <span className="text-[10px] font-bold text-slate-400 uppercase">pts</span></div>
                        <div className="text-[10px] font-bold text-slate-400">余 {reward.stock}</div>
                      </div>
                      
                      {currentPoints < reward.cost ? (
                        // 💥 特效12：点击错误剧烈震动
                        <motion.button 
                          animate={shakeId === reward.id ? { x: [-5, 5, -5, 5, 0] } : {}} onClick={() => triggerShake(reward.id)}
                          className="h-9 px-4 rounded-full bg-slate-50 text-slate-400 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
                        >
                          <Lock size={12} /> 不足
                        </motion.button>
                      ) : (
                        // 💥 特效13：动态位移箭头 & 果冻点击
                        <motion.button whileTap={{ scale: 0.9 }} className="h-9 px-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-500/20 transition-all flex items-center gap-1 group/btn">
                          兑换 <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* ================= 右侧：侧边栏面板 ================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 积分来源 */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-6 relative overflow-hidden group">
              <PenTool size={120} strokeWidth={0.5} className="absolute -bottom-6 -right-6 text-slate-100 group-hover:text-sky-50 transition-colors duration-500 pointer-events-none" />
              <h3 className="text-sm font-black text-slate-800 mb-5 relative z-10">获取途径</h3>
              <div className="space-y-3 relative z-10">
                {POINTS_SOURCES.map((source, idx) => (
                  <motion.div key={idx} whileHover={{ x: 6, backgroundColor: "rgba(248, 250, 252, 1)" }} className="flex items-center justify-between p-2 rounded-xl transition-all cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-[0.6rem] flex items-center justify-center", source.bg, source.color)}>
                        <source.icon size={16} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600">{source.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{source.points}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 等级进度 */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-6 relative overflow-hidden group">
              <TrendingUp size={100} strokeWidth={0.5} className="absolute -bottom-4 -right-4 text-slate-100 group-hover:text-amber-50 transition-colors duration-500 pointer-events-none" />
              <h3 className="text-sm font-black text-slate-800 mb-4 relative z-10">成长进度</h3>
              <div className="flex items-center justify-between text-xs font-bold mb-3 relative z-10">
                <span className="text-amber-500">Rookie</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">Contributor</span>
              </div>
              
              {/* 💥 特效14：动态斑马线流动进度条 */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2 relative z-10">
                <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full relative overflow-hidden" 
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
                </motion.div>
              </div>
              <div className="text-right text-[11px] font-bold text-slate-400 relative z-10">20 / 50 pts</div>
            </motion.div>

            {/* 空状态记录 */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-6 text-center h-[200px] flex flex-col items-center justify-center group">
              {/* 💥 特效15：心跳脉冲状态图标 */}
              <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300 group-hover:text-sky-400 group-hover:bg-sky-50 transition-all relative">
                <Inbox size={26} strokeWidth={1.5} />
                <span className="absolute top-0 right-0 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white"></span></span>
              </motion.div>
              <p className="text-sm font-bold text-slate-700 mb-1">暂无兑换记录</p>
              <p className="text-[11px] font-medium text-slate-400 max-w-[160px]">
                所有的积分消耗记录将在此处显示。
              </p>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
}
