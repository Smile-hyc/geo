"use strict";

const DEFAULT_TASK_CONFIG = Object.freeze({
  daily_task_limit: 20,
  min_thought_length: 50,
  base_reward_points: 50,
  bbox_bonus_per_box: 5,
  battle_win_bonus: 200,
  quality_bonus: 30,
});

function normalizeTaskConfig(row) {
  return {
    daily_task_limit: Number(row?.daily_task_limit) || DEFAULT_TASK_CONFIG.daily_task_limit,
    min_thought_length: Number(row?.min_thought_length) || DEFAULT_TASK_CONFIG.min_thought_length,
    base_reward_points: Number(row?.base_reward_points) || DEFAULT_TASK_CONFIG.base_reward_points,
    bbox_bonus_per_box: Number(row?.bbox_bonus_per_box) || DEFAULT_TASK_CONFIG.bbox_bonus_per_box,
    battle_win_bonus: Number(row?.battle_win_bonus) || DEFAULT_TASK_CONFIG.battle_win_bonus,
    quality_bonus: Number(row?.quality_bonus) || DEFAULT_TASK_CONFIG.quality_bonus,
  };
}

async function getCurrentTaskConfig(client) {
  const result = await client.query(
    `SELECT daily_task_limit, min_thought_length, base_reward_points,
            bbox_bonus_per_box, battle_win_bonus, quality_bonus
     FROM task_configs
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return { ...DEFAULT_TASK_CONFIG };
  }

  return normalizeTaskConfig(result.rows[0]);
}

module.exports = {
  getCurrentTaskConfig,
};
