import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminUsersPage() {
  return (
    <ComingSoonPanel
      title="User management"
      description="This page is scaffolded to match the requirement document, but the full RBAC and moderation workflow is not implemented yet."
      bullets={[
        "User list, role edits, and ban states are still pending.",
        "The current auth store already carries role and profile data.",
        "This is the right place to add reviewer, researcher, and admin controls next.",
      ]}
    />
  );
}
