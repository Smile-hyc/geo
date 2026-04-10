"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth";
import { getTaskConfig, setTaskConfig } from "@/lib/cloudbase";

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
  const user = useAuthStore((state) => state.user);
  const [config, setConfig] = useState<TaskConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTaskConfig({
          cloudbase_uid: user?.uid,
          email: user?.email,
        });
        if (!cancelled) {
          setConfig(result.config ?? DEFAULT_CONFIG);
        }
      } catch (reason) {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "加载任务配置失败"
          );
          setConfig(DEFAULT_CONFIG);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  const update = (field: keyof TaskConfig, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setConfig((prev) => ({ ...prev, [field]: num }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const result = await setTaskConfig({
        ...config,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setConfig(result.config ?? config);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存配置失败");
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ key: keyof TaskConfig; label: string; desc: string }> = [
    {
      key: "daily_task_limit",
      label: "每日任务上限",
      desc: "每位用户每天最多完成的标注任务数",
    },
    {
      key: "min_thought_length",
      label: "最短思维链字数",
      desc: "思维链少于此字数将视为无效提交",
    },
    {
      key: "base_reward_points",
      label: "基础积分奖励",
      desc: "每次标注的基础积分",
    },
    {
      key: "bbox_bonus_per_box",
      label: "每个 BBox 加分",
      desc: "每标注一个矩形框额外获得的积分",
    },
    {
      key: "battle_win_bonus",
      label: "对战胜利奖励",
      desc: "击败 AI 获得的额外积分",
    },
    {
      key: "quality_bonus",
      label: "优质标注奖励",
      desc: "审核通过的标注额外获得的积分",
    },
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
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              配置已保存
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, desc }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={config[key]}
                    min={0}
                    disabled={saving}
                    onChange={(e) => update(key, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="mt-2 bg-[#165DFF] hover:bg-[#0E42C9] text-white transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>当前页面已接入后端配置读写，保存后会更新最新一条任务配置记录。</p>
          <p>这次改造只补基础配置接口，不调整 battle / annotation / rewards 的完整业务规则。</p>
          <p>后续如果要做配置生效联动，可以再逐步把相关业务函数改为读取 task_configs。</p>
        </CardContent>
      </Card>
    </div>
  );
}
