export const CORE_APP_ROUTES = [
  {
    href: "/app/home",
    label: "首页",
    description: "平台总览、个人概况与核心功能入口。",
  },
  {
    href: "/app/annotate/mode",
    label: "标注",
    description: "选择数据采集模式与标注流程。",
  },
  {
    href: "/app/battle",
    label: "对战",
    description: "配置人机对战并查看结果对比。",
  },
  {
    href: "/app/history",
    label: "历史记录",
    description: "查看过往标注、对战与积分变化。",
  },
  {
    href: "/app/rewards",
    label: "奖励兑换",
    description: "使用积分兑换奖品并查看库存状态。",
  },
  {
    href: "/app/leaderboard",
    label: "排行榜",
    description: "查看积分表现与对战结果排名。",
  },
] as const;
