import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminUsersPage() {
  return (
    <ComingSoonPanel
      title="用户管理"
      description="这个页面已经按需求文档预留出来，但完整的权限控制与审核流程还没有实现。"
      bullets={[
        "用户列表、角色编辑和封禁状态仍待实现。",
        "当前鉴权状态里已经带有角色与基础个人信息。",
        "后续可以在这里补 reviewer、researcher 和 admin 的控制能力。",
      ]}
    />
  );
}
