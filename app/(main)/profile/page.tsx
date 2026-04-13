"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, MapPin, Swords, Coins, Star, Loader2, Pencil, ShieldCheck, ArrowRight, History, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth";
import { getUserProfile, updateUsername } from "@/lib/cloudbase";

// 复用你之前的全局按钮样式
const secondaryButtonStyle = "rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600 hover:text-blue-600 active:scale-95 inline-flex items-center gap-2";
const adminButtonStyle = "rounded-2xl border-2 border-transparent bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-1 active:scale-95 inline-flex items-center gap-2";

interface ProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  points_balance: number;
  level: number;
  annotation_count: number;
  battle_count: number;
}

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserProfile({
      cloudbase_uid: storeUser?.uid,
      email: storeUser?.email,
    })
      .then((res) => setProfile(res.user as ProfileData))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [storeUser?.uid, storeUser?.email]);

  const handleSaveUsername = async () => {
    const name = editUsername.trim();
    if (!name || name.length < 2) {
      setSaveError("用户名至少 2 个字符");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await updateUsername({
        new_username: name,
        cloudbase_uid: storeUser?.uid,
        email: storeUser?.email,
      });
      setUser(storeUser ? { ...storeUser, username: res.username } : null);
      setProfile((p) => (p ? { ...p, username: res.username } : null));
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const data = profile ?? {
    username: storeUser?.username ?? "—",
    email: storeUser?.email ?? "—",
    role: storeUser?.role ?? "user",
    points_balance: storeUser?.points_balance ?? 0,
    level: storeUser?.level ?? 1,
    annotation_count: 0,
    battle_count: 0,
  };

  return (
    <div className="h-full w-full bg-[linear-gradient(180deg,#f8fafc,#eff6ff_100%)] px-6 py-8 md:px-16 lg:px-24 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-[800px] flex flex-col gap-8 pb-12">
        
        {/* Header Section */}
        <header className="shrink-0 text-center md:text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
            Account Center
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            个人中心与<span className="text-blue-600 ml-2">账号概况。</span>
          </h1>
        </header>

        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Area */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 transition-transform group-hover:scale-105">
                <User className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-md">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 text-center md:text-left min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center md:justify-start">
                    <Input
                      className="max-w-[200px] rounded-xl border-2 border-blue-100 focus:border-blue-600 transition-all"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="新用户名"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveUsername} disabled={saving} className="rounded-xl bg-blue-600 font-bold">
                      {saving ? "保存中" : "确认"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="rounded-xl text-slate-400">
                      取消
                    </Button>
                  </div>
                  {saveError && <p className="text-[10px] font-bold text-rose-500 uppercase">{saveError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{data.username}</h2>
                  <button
                    onClick={() => { setEditUsername(data.username); setEditing(true); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <p className="mt-1 text-sm font-medium text-slate-400">{data.email}</p>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-lg bg-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {data.role === "admin" ? "Platform Admin" : "Active Researcher"}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Verified Account
                </span>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Star className="text-amber-500" />} label="当前等级" value={`Lv.${data.level}`} bgColor="bg-amber-50" />
          <StatCard icon={<Coins className="text-blue-600" />} label="总积分额" value={data.points_balance.toLocaleString()} bgColor="bg-blue-50" />
          <StatCard icon={<MapPin className="text-emerald-500" />} label="累计标注" value={data.annotation_count} bgColor="bg-emerald-50" />
          <StatCard icon={<Swords className="text-rose-500" />} label="对战参与" value={data.battle_count} bgColor="bg-rose-50" />
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/app/points" className={secondaryButtonStyle + " justify-between group"}>
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>查询积分明细</span>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
            
            <Link href="/app/history" className={secondaryButtonStyle + " justify-between group"}>
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>回顾历史记录</span>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>

            <Link href="/app/leaderboard" className={secondaryButtonStyle + " justify-between group md:col-span-2"}>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>查看全球排行榜</span>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
          </div>

          {data.role === "admin" && (
            <Link href="/admin" className={adminButtonStyle + " w-full justify-center mt-4"}>
              <ShieldCheck className="h-5 w-5" />
              进入平台管理后台
            </Link>
          )}
        </section>

        {/* Footer info */}
        <footer className="mt-auto py-6 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center text-slate-400">
          <p className="text-[10px]">© 2026 <span className="font-bold text-slate-500">GeoAnnotate Platform</span></p>
          <div className="hidden md:block h-px flex-1 mx-6 bg-slate-200/50"></div>
          <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-300">Member Directory</p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string | number; bgColor: string }) {
  return (
    <div className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-md">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}