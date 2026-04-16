"use client";

import { Bot, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  userScore: number;
  aiScore: number;
  currentRound: number;
  totalRounds: number;
}

export default function BattleScoreBoard({
  userScore,
  aiScore,
  currentRound,
  totalRounds,
}: Props) {
  const userLeading = userScore > aiScore;
  const aiLeading = aiScore > userScore;

  return (
    <div className="flex items-center gap-8 px-6 py-4 rounded-[2rem] bg-white shadow-xl border border-slate-100">
      {/* User Score */}
      <div className="flex flex-col items-center min-w-[80px]">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all duration-500",
          userLeading ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : "bg-slate-50 text-slate-400"
        )}>
          <User size={24} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">我方</span>
        <motion.span 
          key={userScore}
          initial={{ scale: 1.2, color: "#0ea5e9" }}
          animate={{ scale: 1, color: userLeading ? "#0ea5e9" : "#1e293b" }}
          className="text-3xl font-black tabular-nums"
        >
          {userScore}
        </motion.span>
      </div>

      {/* Progress & Divider */}
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
           <Trophy size={14} className="text-amber-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Round {currentRound} of {totalRounds}
           </span>
        </div>
        
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
           {userScore + aiScore > 0 ? (
             <>
                <div 
                  className="h-full bg-primary transition-all duration-700 ease-out" 
                  style={{ width: `${(userScore / (userScore + aiScore)) * 100}%` }}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-700 ease-out" 
                  style={{ width: `${(aiScore / (userScore + aiScore)) * 100}%` }}
                />
             </>
           ) : (
             <div className="h-full w-1/2 bg-slate-200 opacity-50" />
           )}
        </div>
        <div className="flex justify-between w-full mt-2">
           <span className="text-[8px] font-black text-primary uppercase">Player Edge</span>
           <span className="text-[8px] font-black text-rose-500 uppercase">AI Dominance</span>
        </div>
      </div>

      {/* AI Score */}
      <div className="flex flex-col items-center min-w-[80px]">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all duration-500",
          aiLeading ? "bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110" : "bg-slate-50 text-slate-400"
        )}>
          <Bot size={24} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI</span>
        <motion.span 
          key={aiScore}
          initial={{ scale: 1.2, color: "#f43f5e" }}
          animate={{ scale: 1, color: aiLeading ? "#f43f5e" : "#1e293b" }}
          className="text-3xl font-black tabular-nums"
        >
          {aiScore}
        </motion.span>
      </div>
    </div>
  );
}
