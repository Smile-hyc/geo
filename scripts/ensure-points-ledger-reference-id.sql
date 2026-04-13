-- 与 prisma/migrations/20260403000100_backend_foundation_base/migration.sql 对齐。
-- 缺此列时 admin 调整积分会报错：column "reference_id" of relation "points_ledger" does not exist
ALTER TABLE "points_ledger" ADD COLUMN IF NOT EXISTS "reference_id" TEXT;
