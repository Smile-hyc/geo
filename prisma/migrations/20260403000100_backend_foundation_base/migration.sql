-- CreateTable
CREATE TABLE IF NOT EXISTS "annotation_tasks" (
    "id" SERIAL NOT NULL,
    "image_id" INTEGER NOT NULL,
    "mode_type" TEXT NOT NULL,
    "annotation_type" TEXT NOT NULL DEFAULT 'bbox',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reward_points" INTEGER NOT NULL DEFAULT 50,
    "source_type" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_records" (
    "id" SERIAL NOT NULL,
    "annotation_record_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "review_status" TEXT NOT NULL,
    "review_score" INTEGER,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "modes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allow_panorama" BOOLEAN NOT NULL DEFAULT false,
    "allow_single_image" BOOLEAN NOT NULL DEFAULT true,
    "show_true_location" BOOLEAN NOT NULL DEFAULT false,
    "default_annotation_type" TEXT NOT NULL DEFAULT 'bbox',
    "default_reward_points" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_configs" (
    "id" SERIAL NOT NULL,
    "daily_task_limit" INTEGER NOT NULL DEFAULT 20,
    "min_thought_length" INTEGER NOT NULL DEFAULT 50,
    "base_reward_points" INTEGER NOT NULL DEFAULT 50,
    "bbox_bonus_per_box" INTEGER NOT NULL DEFAULT 5,
    "battle_win_bonus" INTEGER NOT NULL DEFAULT 200,
    "quality_bonus" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "behavior_events" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT,
    "user_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "event_payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "source_type" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "external_ref" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "image_meta_json" JSONB;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "image_assets" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "annotation_records" ADD COLUMN IF NOT EXISTS "task_id" INTEGER;
ALTER TABLE "annotation_records" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "annotation_records" ADD COLUMN IF NOT EXISTS "quality_score" INTEGER;

-- AlterTable
ALTER TABLE "battle_sessions" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3);
ALTER TABLE "battle_sessions" ADD COLUMN IF NOT EXISTS "finished_at" TIMESTAMP(3);
ALTER TABLE "battle_sessions" ADD COLUMN IF NOT EXISTS "winner_type" TEXT;

-- AlterTable
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "ground_truth_lat" DOUBLE PRECISION;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "ground_truth_lng" DOUBLE PRECISION;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "user_distance_km" DOUBLE PRECISION;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "ai_distance_km" DOUBLE PRECISION;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "round_winner_type" TEXT;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "elapsed_ms_user" INTEGER;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "elapsed_ms_ai" INTEGER;
ALTER TABLE "battle_rounds" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "points_ledger" ADD COLUMN IF NOT EXISTS "reference_id" TEXT;

-- AlterTable
ALTER TABLE "prize_redemptions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "prize_redemptions" ADD COLUMN IF NOT EXISTS "fulfilled_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "modes_code_key" ON "modes"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "annotation_tasks_image_id_idx" ON "annotation_tasks"("image_id");
CREATE INDEX IF NOT EXISTS "annotation_tasks_mode_type_status_idx" ON "annotation_tasks"("mode_type", "status");
CREATE INDEX IF NOT EXISTS "annotation_tasks_enabled_status_idx" ON "annotation_tasks"("enabled", "status");
CREATE INDEX IF NOT EXISTS "annotation_records_user_id_created_at_idx" ON "annotation_records"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "annotation_records_quality_status_created_at_idx" ON "annotation_records"("quality_status", "created_at");
CREATE INDEX IF NOT EXISTS "annotation_records_task_id_idx" ON "annotation_records"("task_id");
CREATE INDEX IF NOT EXISTS "annotation_bboxes_record_id_idx" ON "annotation_bboxes"("record_id");
CREATE INDEX IF NOT EXISTS "review_records_annotation_record_id_created_at_idx" ON "review_records"("annotation_record_id", "created_at");
CREATE INDEX IF NOT EXISTS "review_records_reviewer_id_created_at_idx" ON "review_records"("reviewer_id", "created_at");
CREATE INDEX IF NOT EXISTS "battle_sessions_user_id_created_at_idx" ON "battle_sessions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "battle_rounds_session_id_round_index_idx" ON "battle_rounds"("session_id", "round_index");
CREATE INDEX IF NOT EXISTS "points_ledger_user_id_created_at_idx" ON "points_ledger"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "prize_redemptions_user_id_created_at_idx" ON "prize_redemptions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "modes_enabled_idx" ON "modes"("enabled");
CREATE INDEX IF NOT EXISTS "task_configs_created_at_idx" ON "task_configs"("created_at");
CREATE INDEX IF NOT EXISTS "behavior_events_event_type_created_at_idx" ON "behavior_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "behavior_events_user_id_created_at_idx" ON "behavior_events"("user_id", "created_at");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "annotation_tasks"
    ADD CONSTRAINT "annotation_tasks_image_id_fkey"
    FOREIGN KEY ("image_id") REFERENCES "image_assets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "annotation_records"
    ADD CONSTRAINT "annotation_records_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "annotation_tasks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "review_records"
    ADD CONSTRAINT "review_records_annotation_record_id_fkey"
    FOREIGN KEY ("annotation_record_id") REFERENCES "annotation_records"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "review_records"
    ADD CONSTRAINT "review_records_reviewer_id_fkey"
    FOREIGN KEY ("reviewer_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "behavior_events"
    ADD CONSTRAINT "behavior_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
