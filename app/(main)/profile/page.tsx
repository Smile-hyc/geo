"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  History as HistoryIcon,
  Loader2,
  Pencil,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Wallet,
  Settings,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth";
import { getUserProfile, updateUsername } from "@/lib/cloudbase";
import { cn } from "@/lib/utils";

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
  const storeUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
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
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载个人资料失败。");
      })
      .finally(() => setLoading(false));
  }, [storeUser?.uid, storeUser?.email]);

  const handleSaveUsername = async () => {
    const name = editUsername.trim();
    if (!name || name.length < 2) {
      setSaveError("用户名至少需要 2 个字符。");
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
      setProfile((prev) => (prev ? { ...prev, username: res.username } : null));
      setEditing(false);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "更新用户名失败。");
    } finally {
      setSaving(false);
    }
  };

  const data = profile ?? {
    username: storeUser?.username ?? "-",
    email: storeUser?.email ?? "-",
    role: storeUser?.role ?? "user",
    points_balance: storeUser?.points_balance ?? 0,
    level: storeUser?.level ?? 1,
    annotation_count: 0,
    battle_count: 0,
  };

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-10">
      <section>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary/30 border-4 border-white">
              {data.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-primary">
              <BadgeCheck size={20} fill="currentColor" className="text-white fill-primary" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-48 h-10 rounded-xl"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveUsername} disabled={saving} className="rounded-xl">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "保存"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">{data.username}</h1>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8 rounded-xl border-slate-200"
                    onClick={() => {
                      setEditUsername(data.username);
                      setEditing(true);
                    }}
                  >
                    <Pencil size={14} className="text-slate-400" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
               <span className="flex items-center gap-1.5"><Mail size={14} /> {data.email}</span>
               <span className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  {data.role === "admin" ? "管理员" : "研究员"}
               </span>
            </div>
            {saveError && <p className="text-xs font-bold text-red-500">{saveError}</p>}
          </div>

          <div className="flex gap-2">
             <Button variant="outline" className="rounded-full px-6">
                <Settings size={18} className="mr-2" />
                设置
             </Button>
          </div>
        </div>
      </section>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="当前等级" value={data.level} icon={<Star size={20} />} color="text-amber-500" bgColor="bg-amber-50" />
        <Metric title="账户积分" value={data.points_balance} icon={<Wallet size={20} />} color="text-sky-500" bgColor="bg-sky-50" />
        <Metric title="累计识图" value={data.annotation_count} icon={<ShieldCheck size={20} />} color="text-emerald-500" bgColor="bg-emerald-50" />
        <Metric title="寻境局数" value={data.battle_count} icon={<Trophy size={20} />} color="text-indigo-500" bgColor="bg-indigo-50" />
      </section>

      <section>
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="px-8 pt-8">
             <CardTitle className="text-xl font-black text-slate-800">快速导航</CardTitle>
             <CardDescription>直达您的核心任务与历史记录</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 grid gap-4 sm:grid-cols-2">
            <QuickLink href="/app/points" title="积分流水明细" icon={<Wallet size={18} />} />
            <QuickLink href="/app/history" title="任务历史记录" icon={<HistoryIcon size={18} />} />
            <QuickLink href="/app/leaderboard" title="全球实时排行" icon={<Trophy size={18} />} />
            {data.role === "admin" && (
              <QuickLink href="/admin" title="管理后台入口" icon={<ShieldCheck size={18} />} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  color,
  bgColor
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", bgColor, color)}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="font-bold text-slate-700 group-hover:text-slate-900">{title}</span>
      </div>
      <ArrowRight size={18} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
    </Link>
  );
}

