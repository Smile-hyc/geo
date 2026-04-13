-- 仅补齐 Role 4 / JSONL 导出所需结构（在「旧库无 _prisma_migrations」或全量迁移中途失败时使用）
-- 幂等：可重复执行

CREATE TABLE IF NOT EXISTS "behavior_events" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT,
    "user_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "event_payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "behavior_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "source_type" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "external_ref" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "image_meta_json" JSONB;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "behavior_events_event_type_created_at_idx" ON "behavior_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "behavior_events_user_id_created_at_idx" ON "behavior_events"("user_id", "created_at");

DO $$
BEGIN
    ALTER TABLE "behavior_events"
    ADD CONSTRAINT "behavior_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
