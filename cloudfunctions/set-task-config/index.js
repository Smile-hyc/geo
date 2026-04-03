"use strict";

const { withTransaction } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");
const { parseNonNegativeInt } = require("../_shared/validation");
const { getCurrentTaskConfig } = require("../_shared/config");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);

  try {
    const config = await withTransaction(async (client) => {
      await requireRole(client, event, context, ["admin"]);

      const payload = {
        daily_task_limit: parseNonNegativeInt(data.daily_task_limit, "daily_task_limit"),
        min_thought_length: parseNonNegativeInt(data.min_thought_length, "min_thought_length"),
        base_reward_points: parseNonNegativeInt(data.base_reward_points, "base_reward_points"),
        bbox_bonus_per_box: parseNonNegativeInt(data.bbox_bonus_per_box, "bbox_bonus_per_box"),
        battle_win_bonus: parseNonNegativeInt(data.battle_win_bonus, "battle_win_bonus"),
        quality_bonus: parseNonNegativeInt(data.quality_bonus, "quality_bonus"),
      };

      const latestResult = await client.query(
        "SELECT id FROM task_configs ORDER BY updated_at DESC, id DESC LIMIT 1"
      );

      if (latestResult.rows.length > 0) {
        await client.query(
          `UPDATE task_configs
           SET daily_task_limit = $1,
               min_thought_length = $2,
               base_reward_points = $3,
               bbox_bonus_per_box = $4,
               battle_win_bonus = $5,
               quality_bonus = $6,
               updated_at = NOW()
           WHERE id = $7`,
          [
            payload.daily_task_limit,
            payload.min_thought_length,
            payload.base_reward_points,
            payload.bbox_bonus_per_box,
            payload.battle_win_bonus,
            payload.quality_bonus,
            latestResult.rows[0].id,
          ]
        );
      } else {
        await client.query(
          `INSERT INTO task_configs
             (daily_task_limit, min_thought_length, base_reward_points, bbox_bonus_per_box, battle_win_bonus, quality_bonus, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            payload.daily_task_limit,
            payload.min_thought_length,
            payload.base_reward_points,
            payload.bbox_bonus_per_box,
            payload.battle_win_bonus,
            payload.quality_bonus,
          ]
        );
      }

      return getCurrentTaskConfig(client);
    });

    return ok({ config });
  } catch (error) {
    return fail(error);
  }
};
