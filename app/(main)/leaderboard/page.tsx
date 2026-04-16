"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, User } from "lucide-react";

import { getLeaderboard } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface LeaderEntry {
  rank: number;
  username: string;
  points_balance: number;
  level: number;
}

const RANK_ICONS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
const TABS = ["全局", "街景", "遥感", "地形", "混合"];

export default function LeaderboardPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    getLeaderboard({ limit: 50 })
      .then((res) => setEntries(res.leaderboard))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载排行榜失败。");
      })
      .finally(() => setLoading(false));
  }, []);

  const myEntry = useMemo(
    () => entries.find((entry) => entry.username === currentUser?.username),
    [entries, currentUser?.username]
  );

  return (
    <div className="space-y-4">
      <section className="wg-panel p-5">
        <h1 className="text-2xl font-semibold text-[#f2fff5]">排行榜</h1>
        <p className="mt-1 text-sm text-[#c1d6c8]">
          我的名次：{myEntry ? `#${myEntry.rank}` : "暂未上榜"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition",
                activeTab === tab
                  ? "border-[#5d8a6f] bg-[rgba(41,78,53,0.86)] text-white"
                  : "border-[#375a45] bg-[rgba(18,36,25,0.82)] text-[#cce0d2] hover:border-[#4f7b61]",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="wg-panel overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_140px] border-b border-[#2e4b3a] bg-[rgba(20,38,27,0.86)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#a8c4b2]">
          <span>名次</span>
          <span>用户</span>
          <span className="text-right">积分</span>
        </div>

        {activeTab !== TABS[0] ? (
          <div className="px-5 py-12 text-center text-sm text-[#afc6b6]">
            该分栏将在后端模式筛选就绪后接入。
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-[#b8d0c0]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center text-sm text-red-200">{error}</div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#afc6b6]">暂无排行榜数据。</div>
        ) : (
          <div>
            {entries.map((entry) => {
              const isMe = entry.username === currentUser?.username;
              return (
                <div
                  key={entry.rank}
                  className={[
                    "grid grid-cols-[110px_1fr_140px] items-center border-b border-[#274032] px-5 py-3 text-sm last:border-b-0",
                    isMe ? "bg-[rgba(34,70,47,0.65)]" : "bg-[rgba(13,25,18,0.68)]",
                  ].join(" ")}
                >
                  <div>
                    {entry.rank <= 3 ? (
                      <span className="text-xl">{RANK_ICONS[entry.rank - 1]}</span>
                    ) : (
                      <span className="text-[#c0d5c7]">#{entry.rank}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgba(55,91,66,0.85)]">
                      <User className="h-4 w-4 text-[#ebfff1]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#f2fff5]">{entry.username}</p>
                      <p className="text-xs text-[#a8c4b2]">等级 {entry.level}</p>
                    </div>
                  </div>

                  <div className="text-right text-base font-semibold text-[#f2fff5]">
                    {entry.points_balance.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
