"use client";

import { useState } from "react";
import { Settings, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskConfig {
  daily_task_limit: number;
  min_thought_length: number;
  base_reward_points: number;
  bbox_bonus_per_box: number;
  battle_win_bonus: number;
  quality_bonus: number;
}

const DEFAULT_CONFIG: TaskConfig = {
  daily_task_limit: 20,
  min_thought_length: 50,
  base_reward_points: 50,
  bbox_bonus_per_box: 5,
  battle_win_bonus: 200,
  quality_bonus: 30,
};

export default function AdminTasksPage() {
  const [config, setConfig] = useState<TaskConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (field: keyof TaskConfig, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) setConfig((prev) => ({ ...prev, [field]: num }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields: Array<{ key: keyof TaskConfig; label: string; desc: string }> = [
    { key: "daily_task_limit", label: "每日任务上限", desc: "每位用户每天最多完成的标注任务数" },
    { key: "min_thought_length", label: "最短思维链字数", desc: "思维链少于此字数将视为无效提交" },
    { key: "base_reward_points", label: "基础积分奖励", desc: "每次标注的基础积分" },
    { key: "bbox_bonus_per_box", label: "每个 BBox 加分", desc: "每标注一个矩形框额外获得的积分" },
    { key: "battle_win_bonus", label: "对战胜利奖励", desc: "击败 AI 获得的额外积分" },
    { key: "quality_bonus", label: "优质标注奖励", desc: "审核通过的标注额外获得的积分" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">任务配置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">积分与任务参数</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" /> 配置已保存
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ key, label, desc }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={config[key]}
                  onChange={(e) => update(key, e.target.value)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中…</> : <><Save className="h-4 w-4 mr-2" />保存配置</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• 此页面的配置当前保存在前端状态，实际生产环境需对接 <code>set-task-config</code> 云函数。</p>
          <p>• 修改积分参数将影响新提交的奖励，不会追溯历史记录。</p>
          <p>• 对战奖励仅在用户得分高于 AI 时发放。</p>
        </CardContent>
      </Card>
    </div>
  );
}
