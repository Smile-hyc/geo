"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, Plus, Trash2, Edit2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminListPrizes,
  adminCreatePrize,
  adminUpdatePrize,
  adminDeletePrize,
} from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface Prize {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminPrizesPage() {
  const user = useAuthStore((s) => s.user);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    points_cost: "",
    stock: "0",
    image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListPrizes({
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setPrizes(res.prizes ?? []);
    } catch {
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    loadPrizes();
  }, [loadPrizes]);

  const handleSubmit = async () => {
    const name = form.name.trim();
    const points_cost = parseInt(form.points_cost, 10);
    if (!name) {
      setError("请输入奖品名称");
      return;
    }
    if (isNaN(points_cost) || points_cost < 0) {
      setError("积分兑换需大于等于 0");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await adminCreatePrize({
        name,
        description: form.description.trim() || undefined,
        points_cost,
        stock: parseInt(form.stock, 10) || 0,
        image_url: form.image_url.trim() || undefined,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setSuccess(true);
      setForm({ name: "", description: "", points_cost: "", stock: "0", image_url: "" });
      setShowForm(false);
      await loadPrizes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (prize: Prize) => {
    try {
      await adminUpdatePrize({
        prize_id: prize.id,
        is_active: !prize.is_active,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await loadPrizes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失败");
    }
  };

  const handleUpdateStock = async (prize: Prize, newStock: number) => {
    if (newStock < 0) return;
    try {
      await adminUpdatePrize({
        prize_id: prize.id,
        stock: newStock,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await loadPrizes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该奖品？已兑换记录将保留。")) return;
    try {
      await adminDeletePrize({
        prize_id: id,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await loadPrizes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">奖品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">添加和管理可兑换奖品</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {showForm ? "取消" : "添加奖品"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">添加奖品</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" /> 添加成功
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>奖品名称 *</Label>
                <Input
                  placeholder="例如：定制周边礼品"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>积分兑换 *</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="100"
                  value={form.points_cost}
                  onChange={(e) => setForm((f) => ({ ...f, points_cost: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>库存数量</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="10"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>图片 URL（可选）</Label>
                <Input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>奖品描述（可选）</Label>
                <Input
                  placeholder="奖品描述"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />添加中…</> : "添加奖品"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-semibold mb-3">已添加奖品（{prizes.length}）</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize) => (
              <Card key={prize.id} className="overflow-hidden">
                <div className="aspect-video bg-accent/20 flex items-center justify-center overflow-hidden">
                  {prize.image_url ? (
                    <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{prize.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        prize.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prize.is_active ? "上架" : "下架"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{prize.points_cost} 积分</span>
                    <span>·</span>
                    <span>库存 {prize.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleActive(prize)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {prize.is_active ? "下架" : "上架"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const v = prompt("请输入新库存数量", String(prize.stock));
                        if (v !== null) handleUpdateStock(prize, parseInt(v, 10) || 0);
                      }}
                    >
                      改库存
                    </Button>
                    <button
                      onClick={() => handleDelete(prize.id)}
                      className="p-2 rounded hover:bg-destructive/10 text-destructive"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
