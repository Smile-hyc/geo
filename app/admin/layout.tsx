"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  ListTodo, 
  ClipboardCheck, 
  Gift, 
  Cpu, 
  BarChart2, 
  Download,
  type LucideIcon
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";
import { ADMIN_NAV_ITEMS } from "@/features/admin/navigation";

// 🟢 智能图标匹配：根据菜单名称自动分配精美图标
const getIconForLabel = (label: string): LucideIcon => {
  switch (label) {
    case "仪表盘": return LayoutDashboard;
    case "用户": return Users;
    case "图片": return ImageIcon;
    case "任务配置": return ListTodo;
    case "审核": return ClipboardCheck;
    case "奖励": return Gift;
    case "AI 模型": return Cpu;
    case "分析": return BarChart2;
    case "导出": return Download;
    default: return LayoutDashboard;
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const logout = useAuthStore((state) => state.logout);

  // 完美保留原有鉴权逻辑
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/app/home");
    }
  }, [loading, router, user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore and still clear local state
    }
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FE]">
      {/* 🟢 左侧侧边栏：宽度 256px，纯白背景，精致边框 */}
      <aside className="w-[256px] border-r border-[#E5E6EB] bg-white flex flex-col flex-shrink-0 z-10">
        
        {/* 1. 顶部 Logo 区域 */}
        <div className="h-[105px] flex flex-col justify-center px-6 border-b border-[#E5E6EB]">
          <h1 className="text-[18px] font-[500] leading-[28px] text-[#4E5969]">
            GEOANNOTATE <br />
            管理后台
          </h1>
        </div>

        {/* 2. 中间导航菜单区域 */}
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col">
          {ADMIN_NAV_ITEMS.map((item) => {
            // 完美保留原有的高亮判断逻辑
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            // 如果你的 ADMIN_NAV_ITEMS 里自带了 icon，就用你的；如果没有，就用我上面写的智能匹配
            const Icon = (item as any).icon || getIconForLabel(item.label);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center h-[48px] px-6 text-[16px] transition-colors ${
                  active
                    ? "bg-[#165DFF] text-white font-[500]" // 选中态：纯蓝底白字
                    : "text-[#4E5969] hover:bg-[#F2F3F5]"  // 未选中态：深灰字，悬浮微灰底
                }`}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 3. 底部退出登录区域 */}
        <div className="h-[81px] border-t border-[#E5E6EB] flex items-center px-4 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full h-[48px] px-4 rounded-[8px] text-[16px] text-[#4E5969] hover:bg-[#F2F3F5] hover:text-[#1D2129] transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 右侧主内容区域 */}
      <main className="flex-1 overflow-auto h-screen relative">
        {children}
      </main>
    </div>
  );
}