import ComingSoonPanel from "@/components/common/ComingSoonPanel";

export default function AdminAiModelsPage() {
  return (
    <ComingSoonPanel
      title="AI model registry"
      description="The route now exists so the admin IA matches the requirement document. The actual provider registry and adapter management remain future work."
      bullets={[
        "Current battle flow still uses the existing mock provider path in cloud functions.",
        "The new battle config page already exposes AI opponent selection as a framework hook.",
        "Next step: persist provider endpoint, version, auth config, and rate limit settings.",
      ]}
    />
  );
}
