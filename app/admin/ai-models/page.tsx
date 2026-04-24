"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAiModelsPage() {
  // 使用本地 State 来管理 UI 交互，等待后续接入真实后端
  const [isSaving, setIsSaving] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    modelName: "识图大模型 v2.0",
    precision: 80,
    batchSize: "32",
    learningRate: "0.001",
  });

  // 模拟保存动作
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("UI 配置已记录！等待后端 API 接入后即可真实生效。");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* 标题区域 */}
        <div className="mb-6">
          <h1 className="text-[24px] font-[700] text-[#1D2129]">AI 模型</h1>
          <p className="text-[14px] text-[#86909C] mt-1">管理和配置 AI 模型参数</p>
        </div>

        {/* 上半部分：分栏表单配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左侧：模型选择 */}
          <Card className="rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-[16px] font-[700] text-[#1D2129]">模型选择</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              
              {/* 下拉选择 */}
              <div className="space-y-2">
                <Label className="text-[13px] text-[#4E5969] font-medium">当前模型</Label>
                <div className="relative">
                  <select
                    className="w-full h-[40px] px-3 border border-[#E5E6EB] rounded-[6px] text-[14px] text-[#1D2129] outline-none focus:border-[#165DFF] focus:ring-1 focus:ring-[#165DFF]/20 appearance-none bg-white cursor-pointer"
                    value={modelConfig.modelName}
                    onChange={(e) => setModelConfig({ ...modelConfig, modelName: e.target.value })}
                  >
                    <option value="识图大模型 v2.0">识图大模型 v2.0</option>
                    <option value="识图大模型 v1.5">识图大模型 v1.5</option>
                    <option value="Experimental Model">Experimental Beta</option>
                  </select>
                  {/* 自定义下拉箭头 */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86909C]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 精度滑块 */}
              <div className="space-y-4 pt-2">
                <Label className="text-[13px] text-[#4E5969] font-medium">模型精度</Label>
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={modelConfig.precision}
                    onChange={(e) => setModelConfig({ ...modelConfig, precision: parseInt(e.target.value) })}
                    className="w-full h-[6px] bg-[#F2F3F5] rounded-full appearance-none cursor-pointer accent-[#165DFF]"
                    style={{
                      background: `linear-gradient(to right, #165DFF ${modelConfig.precision}%, #F2F3F5 ${modelConfig.precision}%)`
                    }}
                  />
                  <div className="flex justify-between text-[12px] text-[#86909C]">
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 右侧：性能参数 */}
          <Card className="rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-[16px] font-[700] text-[#1D2129]">性能参数</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              
              <div className="space-y-2">
                <Label className="text-[13px] text-[#4E5969] font-medium">批处理大小</Label>
                <Input
                  type="number"
                  className="h-[40px] text-[14px] border-[#E5E6EB] focus-visible:ring-[#165DFF]"
                  value={modelConfig.batchSize}
                  onChange={(e) => setModelConfig({ ...modelConfig, batchSize: e.target.value })}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[13px] text-[#4E5969] font-medium">学习率</Label>
                <Input
                  type="text"
                  className="h-[40px] text-[14px] border-[#E5E6EB] focus-visible:ring-[#165DFF]"
                  value={modelConfig.learningRate}
                  onChange={(e) => setModelConfig({ ...modelConfig, learningRate: e.target.value })}
                />
              </div>

            </CardContent>
          </Card>

        </div>

        {/* 下半部分：模型状态概览 */}
        <Card className="rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-none">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-[16px] font-[700] text-[#1D2129]">模型状态</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-8 space-y-6 mt-2">
            
            {/* 状态指示器 */}
            <div className="flex items-center gap-2 text-[13px] text-[#4E5969]">
              <div className="w-2 h-2 rounded-full bg-[#00B42A] shadow-[0_0_4px_rgba(0,180,42,0.4)]"></div>
              <span>在线</span>
              <span className="mx-2 text-[#E5E6EB]">|</span>
              <span>最后更新: 今天 15:30</span>
            </div>

            {/* GPU 进度条 */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#1D2129] font-medium">GPU 使用率</span>
                <span className="font-[600] text-[#1D2129]">65%</span>
              </div>
              <div className="h-[8px] w-full bg-[#F2F3F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#165DFF] rounded-full transition-all duration-500" style={{ width: '65%' }} />
              </div>
            </div>

            {/* 内存 进度条 */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#1D2129] font-medium">内存使用率</span>
                <span className="font-[600] text-[#1D2129]">42%</span>
              </div>
              <div className="h-[8px] w-full bg-[#F2F3F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#00B42A] rounded-full transition-all duration-500" style={{ width: '42%' }} />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 底部操作按钮群 */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#165DFF] hover:bg-[#0E42C9] text-white h-[40px] px-8 rounded-[4px] font-[500] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            保存配置
          </Button>
          
          <Button
            variant="outline"
            className="h-[40px] px-8 border-[#E5E6EB] text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5] rounded-[4px] font-[500]"
          >
            重置
          </Button>
          
          <Button
            variant="outline"
            className="h-[40px] px-8 border-[#E5E6EB] text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5] rounded-[4px] font-[500]"
          >
            重启模型
          </Button>
        </div>

      </div>
    </div>
  );
}
