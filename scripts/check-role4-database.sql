-- Role 4 / 基础库自检：在 Supabase「SQL Editor」、psql、DBeaver 中执行。
--
-- 如何判断「情况 1」还是「情况 2」：
--   A) 先执行下面「① 结构检查」。三个结果全为 true → 库结构已满足 Role 4（≈ 情况 1），通常无需再 migrate。
--   B) 再执行「② Prisma 迁移表」。若报错 "relation _prisma_migrations does not exist" → 从未用 Prisma 管理过（≈ 情况 2），
--      在项目根用直连库配好 DATABASE_URL 后执行：npx prisma migrate deploy
--   C) 若 ① 有 false → 缺列/缺表（≈ 情况 2），优先 prisma migrate deploy；若报 P3005（非空库无基线）
--      或整包迁移 SQL 中途失败，可用幂等补丁：scripts/apply-role4-supabase-patch.sql
--      （Prisma：`DATABASE_URL` 暂设为直连后执行 prisma db execute --file ...）
--      本地复查：`node scripts/verify-role4-pg.mjs`
--
-- 提示：本地 npx prisma migrate status 若报 P1017 / 连接被关闭，可换直连串；或只用本脚本在网页 SQL 里检查。

-- ① 结构检查（必跑；不应报错）
SELECT
  to_regclass('public.behavior_events') IS NOT NULL AS behavior_events_table_ok,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'image_assets'
      AND column_name = 'image_meta_json'
  ) AS image_assets_image_meta_json_ok,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'image_assets'
      AND column_name = 'deleted_at'
  ) AS image_assets_deleted_at_ok;

-- ② Prisma 迁移历史（若库中无此表会报错，按上面 B 处理）
SELECT migration_name, finished_at
FROM "_prisma_migrations"
ORDER BY finished_at;
