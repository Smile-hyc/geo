"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, MapPin, Swords, Coins, Star, Loader2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-username">用户名</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="2-20 个字符"
                      maxLength={20}
                    />
                    <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                      {saving ? "保存中…" : "保存"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setSaveError(null); }}>
                      取消
                    </Button>
                  </div>
                  {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{data.username}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditUsername(data.username);
                      setEditing(true);
                    }}
                    title="修改用户名"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-muted-foreground text-sm">{data.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">
                  {data.role === "admin" ? "管理员" : "普通用户"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          label="等级"
          value={`Lv.${data.level}`}
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-yellow-400" />}
          label="积分"
          value={data.points_balance.toLocaleString()}
        />
        <StatCard
          icon={<MapPin className="h-5 w-5 text-blue-400" />}
          label="标注次数"
          value={data.annotation_count}
        />
        <StatCard
          icon={<Swords className="h-5 w-5 text-red-400" />}
          label="对战次数"
          value={data.battle_count}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" asChild>
          <Link href="/points">积分明细</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/history">历史记录</Link>
        </Button>
        <Button variant="outline" asChild className="col-span-2">
          <Link href="/app/leaderboard">排行榜</Link>
        </Button>
      </div>

      {data.role === "admin" && (
        <Button variant="destructive" className="w-full" asChild>
          <Link href="/admin">进入管理后台</Link>
        </Button>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
