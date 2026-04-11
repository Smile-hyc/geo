"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, Plus, Trash2, Edit2, CheckCircle, Pencil, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
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
  deleted_at: string | null;
  created_at: string;
}

type ModalState =
  | null
  | { kind: "edit"; prize: Prize }
  | { kind: "stock"; prize: Prize };

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
  const [listError, setListError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    points_cost: "",
    image_url: "",
  });
  const [stockValue, setStockValue] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await adminListPrizes({
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setPrizes(res.prizes ?? []);
    } catch {
      setPrizes([]);
      setListError("加载奖品列表失败");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    loadPrizes();
  }, [loadPrizes]);

  const closeModal = () => {
    setModal(null);
    setModalError(null);
    setModalBusy(false);
  };

  const openEditModal = (prize: Prize) => {
    setModalError(null);
    setEditForm({
      name: prize.name,
      description: prize.description || "",
      points_cost: String(prize.points_cost),
      image_url: prize.image_url || "",
    });
    setModal({ kind: "edit", prize });
  };

  const openStockModal = (prize: Prize) => {
    setModalError(null);
    setStockValue(String(prize.stock));
    setModal({ kind: "stock", prize });
  };

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

  const handleSaveEdit = async () => {
    if (!modal || modal.kind !== "edit") return;
    const name = editForm.name.trim();
    const points_cost = parseInt(editForm.points_cost, 10);
    if (!name) {
      setModalError("请输入奖品名称");
      return;
    }
    if (isNaN(points_cost) || points_cost < 0) {
      setModalError("积分须为大于等于 0 的整数");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await adminUpdatePrize({
        prize_id: modal.prize.id,
        name,
        description: editForm.description.trim(),
        points_cost,
        image_url: editForm.image_url.trim(),
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      closeModal();
      await loadPrizes();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setModalBusy(false);
    }
  };

  const handleSaveStock = async () => {
    if (!modal || modal.kind !== "stock") return;
    const v = parseInt(stockValue, 10);
    if (isNaN(v) || v < 0) {
      setModalError("请输入大于等于 0 的整数库存");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await adminUpdatePrize({
        prize_id: modal.prize.id,
        stock: v,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      closeModal();
      await loadPrizes();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setModalBusy(false);
    }
  };

  const handleToggleActive = async (prize: Prize) => {
    setListError(null);
    try {
      await adminUpdatePrize({
        prize_id: prize.id,
        is_active: !prize.is_active,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await loadPrizes();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "上下架失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认从奖品列表中移除？历史兑换记录将保留。")) return;
    setListError(null);
    try {
      await adminDeletePrize({
        prize_id: id,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await loadPrizes();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "移除失败");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {listError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{listError}</p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">奖品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">添加和管理可兑换奖品</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/rewards/redemptions">兑换记录</Link>
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="gap-2 bg-[#165DFF] hover:bg-[#0E42C9] text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "取消" : "添加奖品"}
          </Button>
        </div>
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
                <Textarea
                  placeholder="奖品描述"
                  className="min-h-[88px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-[#165DFF] hover:bg-[#0E42C9] text-white transition-colors"
            >
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />添加中…</> : "添加奖品"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-semibold mb-3">已添加奖品（{prizes.length}）</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize) => {
              const removed = !!prize.deleted_at;
              return (
              <Card key={prize.id} className={`overflow-hidden ${removed ? "opacity-75" : ""}`}>
                <div className="aspect-video bg-accent/20 flex items-center justify-center overflow-hidden">
                  {prize.image_url ? (
                    <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{prize.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                        removed
                          ? "bg-muted text-muted-foreground"
                          : prize.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {removed ? "已移除" : prize.is_active ? "上架" : "下架"}
                    </span>
                  </div>
                  {prize.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{prize.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{prize.points_cost} 积分</span>
                    <span>·</span>
                    <span>库存 {prize.stock}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removed}
                      onClick={() => openEditModal(prize)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removed}
                      onClick={() => openStockModal(prize)}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      库存
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removed}
                      onClick={() => handleToggleActive(prize)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {prize.is_active ? "下架" : "上架"}
                    </Button>
                    {!removed && (
                      <button
                        type="button"
                        onClick={() => handleDelete(prize.id)}
                        className="p-2 rounded hover:bg-destructive/10 text-destructive"
                        title="从列表移除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      {modal?.kind === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg border-border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base">编辑奖品信息</CardTitle>
              <button type="button" className="rounded p-1 hover:bg-accent" onClick={closeModal} aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {modalError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{modalError}</p>
              )}
              <div className="space-y-2">
                <Label>名称 *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>积分 *</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.points_cost}
                  onChange={(e) => setEditForm((f) => ({ ...f, points_cost: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>图片 URL</Label>
                <Input
                  value={editForm.image_url}
                  onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  className="min-h-[88px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={closeModal} disabled={modalBusy}>
                  取消
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveEdit} 
                  disabled={modalBusy}
                  className="bg-[#165DFF] hover:bg-[#0E42C9] text-white transition-colors"
                >
                  {modalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {modal?.kind === "stock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal>
          <Card className="w-full max-w-md shadow-lg border-border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base">调整库存 · {modal.prize.name}</CardTitle>
              <button type="button" className="rounded p-1 hover:bg-accent" onClick={closeModal} aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {modalError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{modalError}</p>
              )}
              <p className="text-xs text-muted-foreground">当前库存：{modal.prize.stock}。可直接设为运营盘点后的数量。</p>
              <div className="space-y-2">
                <Label>新库存</Label>
                <Input
                  type="number"
                  min={0}
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={closeModal} disabled={modalBusy}>
                  取消
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveStock} 
                  disabled={modalBusy}
                  className="bg-[#165DFF] hover:bg-[#0E42C9] text-white transition-colors"
                >
                  {modalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}