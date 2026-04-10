SELECT
  to_regclass('public.behavior_events') IS NOT NULL AS behavior_events_table_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'image_assets' AND column_name = 'image_meta_json'
  ) AS image_assets_image_meta_json_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'image_assets' AND column_name = 'deleted_at'
  ) AS image_assets_deleted_at_ok;
