-- 与 prisma/migrations/20260403000100_backend_foundation_base/migration.sql 对齐。
-- 若从未执行过该迁移，admin 用户列表会因缺少列报错：column "status" does not exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
