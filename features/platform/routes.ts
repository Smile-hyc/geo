export const CORE_APP_ROUTES = [
  {
    href: "/app/home",
    label: "Home",
    description: "Platform home, profile snapshot, and task entry points.",
  },
  {
    href: "/app/annotate/mode",
    label: "Annotate",
    description: "Choose mode and annotation flow for data collection.",
  },
  {
    href: "/app/battle",
    label: "Battle",
    description: "Configure human-vs-AI sessions and compare outcomes.",
  },
  {
    href: "/app/history",
    label: "History",
    description: "Review past annotations, battles, and earned points.",
  },
  {
    href: "/app/rewards",
    label: "Rewards",
    description: "Redeem points and inspect reward inventory status.",
  },
  {
    href: "/app/leaderboard",
    label: "Leaderboard",
    description: "Track high performers across points and battle outcomes.",
  },
] as const;
