import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminAnalyticsPage() {
  return (
    <ComingSoonPanel
      title="Analytics"
      description="This placeholder page reserves the analytics area requested by the document while keeping the current app runnable."
      bullets={[
        "No charts are implemented yet.",
        "Export and leaderboard data already exist and can seed future dashboards.",
        "Behavior tracking and research-oriented event analytics are still pending.",
      ]}
    />
  );
}
