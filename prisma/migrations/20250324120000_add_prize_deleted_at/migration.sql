-- AlterTable
ALTER TABLE "prizes" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
