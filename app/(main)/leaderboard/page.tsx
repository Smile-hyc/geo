"use client";

import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { getLeaderboard } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface LeaderEntry {
  rank: number;
  username: string;
  points_balance: number;
  level: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];
const TABS = ["总积分", "周榜", "月榜", "胜率榜", "标注榜"];

export default function LeaderboardPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 纯 UI 交互的 Tab 状态
  const [activeTab, setActiveTab] = useState("总积分");

  useEffect(() => {
    getLeaderboard({ limit: 50 })
      .then((res) => setEntries(res.leaderboard))
      .catch((e) => setError(e instanceof Error ? e.message : "加载排行榜失败"))
      .finally(() => setLoading(false));
  }, []);

  // 计算当前用户的排名文本
  const myEntry = entries.find((e) => e.username === currentUser?.username);
  const myRankText = myEntry ? `第 ${myEntry.rank} 名` : "未上榜";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#EFF6FF] p-8 font-sans">
      <div className="max-w-[1088px] mx-auto">
        
        {/* 1. 顶部标题区域 */}
        <div className="mb-6">
          <h1 className="text-[30px] font-[700] text-[#1F2937] leading-[36px]">排行榜</h1>
          <p className="text-[16px] text-[#4B5563] mt-2">你的排名：{myRankText}</p>
        </div>

        {/* 2. 筛选 Tab 栏 */}
        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-lg w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[14px] font-[500] rounded-md transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-[#165DFF] shadow-sm"
                  : "text-[#4B5563] hover:text-[#1F2937]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 3. 排行榜主体列表 */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E5E6EB]/50 overflow-hidden">
          
          {/* 列表表头 */}
          <div className="flex items-center px-8 py-4 bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <div className="w-[100px] text-[16px] font-[500] text-[#86909C]">排名</div>
            <div className="flex-1 text-[16px] font-[500] text-[#86909C]">用户</div>
            <div className="w-[150px] text-[16px] font-[500] text-[#86909C] text-right pr-4">积分</div>
          </div>

          {/* 列表内容区域 */}
          <div className="flex flex-col relative min-h-[300px]">
            {/* 🟢 拦截判断：如果不是总积分榜，直接显示暂未接入 */}
            {activeTab !== "总积分" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#86909C] gap-2">
                <span className="text-[16px] font-[500] text-[#4E5969]">该榜单后端暂未接入</span>
                <span className="text-[13px] text-[#86909C]">程序员小哥正在努力开发中...</span>
              </div>
            ) : loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#86909C] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
                <p className="text-sm">加载数据中...</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-[#F53F3F]">
                {error}
              </div>
            ) : entries.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[#86909C]">
                暂无排名数据
              </div>
            ) : (
              entries.map((entry) => {
                const isMe = entry.username === currentUser?.username;
                
                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center px-8 py-4 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors ${
                      isMe ? "bg-[#165DFF]/[0.04] hover:bg-[#165DFF]/[0.06]" : ""
                    }`}
                  >
                    {/* 排名列 */}
                    <div className="w-[100px] flex items-center pl-1">
                      {entry.rank <= 3 ? (
                        <span className="text-[26px] drop-shadow-sm">{RANK_ICONS[entry.rank - 1]}</span>
                      ) : (
                        <div className="w-[32px] h-[32px] rounded-full bg-[#F2F3F5] flex items-center justify-center text-[#86909C] font-[700] text-[14px]">
                          {entry.rank}
                        </div>
                      )}
                    </div>

                    {/* 用户列 */}
                    <div className="flex-1 flex items-center gap-4">
                      {/* 头像 */}
                      <div
                        className={`w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 ${
                          isMe ? "bg-[#165DFF] text-white" : "bg-[#E5E7EB] text-[#86909C]"
                        }`}
                      >
                        <User className="w-[20px] h-[20px]" strokeWidth={2.5} />
                      </div>
                      
                      {/* 用户名 */}
                      <span
                        className={`text-[16px] font-[500] ${
                          isMe ? "text-[#165DFF]" : "text-[#1F2937]"
                        }`}
                      >
                        {entry.username}
                      </span>
                    </div>

                    {/* 积分列 */}
                    <div className="w-[150px] text-right flex items-baseline justify-end gap-1">
                      <span
                        className={`text-[18px] font-[600] ${
                          isMe ? "text-[#165DFF]" : "text-[#1D2129]"
                        }`}
                      >
                        {entry.points_balance.toLocaleString()}
                      </span>
                      <span
                        className={`text-[16px] font-[600] ${
                          isMe ? "text-[#165DFF]" : "text-[#1D2129]"
                        }`}
                      >
                        分
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}