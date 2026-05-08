-- 对战数据科研/分析用 SQL 示例（只读导出思路）
-- 使用前请根据合规要求脱敏：下列查询已省略 user 表直连，可按需再排除可识别字段。

-- 1) 仅会话级汇总（无用户标识）：按模式、时间与胜负分布
SELECT
  bs.id AS session_id,
  bs.mode_type,
  bs.ai_model_id,
  bs.round_count,
  bs.user_total_score,
  bs.ai_total_score,
  bs.winner,
  bs.winner_type,
  bs.status,
  bs.started_at,
  bs.finished_at,
  bs.created_at
FROM battle_sessions AS bs
WHERE bs.created_at >= NOW() - INTERVAL '90 days'
ORDER BY bs.id;

-- 2) 回合级明细（仍含 session_id，便于与会话表关联；不含 user_id）
SELECT
  br.session_id,
  br.round_index,
  br.user_score,
  br.ai_score,
  br.user_distance_km,
  br.ai_distance_km,
  br.round_winner_type,
  br.elapsed_ms,
  br.elapsed_ms_ai,
  br.submitted_at
FROM battle_rounds AS br
WHERE br.session_id IN (
  SELECT id FROM battle_sessions WHERE created_at >= NOW() - INTERVAL '90 days'
)
ORDER BY br.session_id, br.round_index;

-- 3) 可选：仅匿名会话键（示例：对 session_id 做哈希，需在应用层或扩展中计算）
-- SELECT encode(digest(bs.id::text || '站点密钥', 'sha256'), 'hex') AS anon_session_key, ...
