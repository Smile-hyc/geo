"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  History,
  Loader2,
  Pencil,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth";
import { getUserProfile, updateUsername } from "@/lib/cloudbase";

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
    <div className="space-y-4">
      <section className="wg-panel p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">账户</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[rgba(49,91,62,0.85)]">
            <User className="h-7 w-7 text-[#f0fff4]" />
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="max-w-[220px]"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold text-[#f2fff5]">{data.username}</h1>
                <button
                  onClick={() => {
                    setEditUsername(data.username);
                    setEditing(true);
                  }}
                  className="rounded-md border border-[#3f644c] bg-[rgba(20,37,27,0.82)] p-2 text-[#d4e8db]"
                  aria-label="编辑用户名"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-[#bdd4c5]">{data.email}</p>
            <p className="mt-1 text-xs text-[#9db8a7]">
              {data.role === "admin" ? "管理员账号" : "研究账号"}
            </p>
            {saveError ? <p className="mt-2 text-xs text-red-200">{saveError}</p> : null}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-[#d9eddf]" />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-200">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="等级" value={data.level} icon={<Star className="h-4 w-4 text-[#f8e08e]" />} />
        <Metric title="积分" value={data.points_balance} icon={<Wallet className="h-4 w-4 text-[#c2e4cf]" />} />
        <Metric title="标注数" value={data.annotation_count} icon={<ShieldCheck className="h-4 w-4 text-[#c2e4cf]" />} />
        <Metric title="对战数" value={data.battle_count} icon={<Trophy className="h-4 w-4 text-[#c2e4cf]" />} />
      </section>

      <section className="wg-panel p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">快捷入口</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <QuickLink href="/app/points" title="打开积分流水" icon={<Wallet className="h-4 w-4" />} />
          <QuickLink href="/app/history" title="打开历史记录" icon={<History className="h-4 w-4" />} />
          <QuickLink href="/app/leaderboard" title="打开排行榜" icon={<Trophy className="h-4 w-4" />} />
          {data.role === "admin" ? (
            <QuickLink href="/admin" title="打开管理后台" icon={<ShieldCheck className="h-4 w-4" />} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="wg-panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-[#a8c4b2]">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-xl font-semibold text-[#f2fff5]">{value}</p>
    </div>
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
      className="flex h-11 items-center justify-between rounded-md border border-[#385d46] bg-[rgba(18,35,25,0.82)] px-4 text-sm text-[#e7f7ec] transition hover:border-[#5a896c]"
    >
      <span className="flex items-center gap-2">
        {icon}
        {title}
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
