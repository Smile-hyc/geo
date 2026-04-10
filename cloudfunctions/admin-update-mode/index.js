"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");
const {
  parsePositiveInt,
  parseNonNegativeInt,
  assertEnum,
} = require("./_shared/validation");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

function parseBoolean(value, fieldName) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${fieldName} 必须为布尔值`);
}

exports.main = async (event, context) => {
  const data = getData(event);
  const client = await getPool().connect();

  try {
    await requireRole(client, event, context, ["admin"]);

    const hasId = data.id !== undefined && data.id !== null && data.id !== "";
    const hasCode = typeof data.code === "string" && data.code.trim();

    if (!hasId && !hasCode) {
      return fail("缺少 mode id 或 code");
    }

    let targetQuery = "";
    let targetValue;

    if (hasId) {
      targetQuery = "id = $1";
      targetValue = parsePositiveInt(data.id, "id");
    } else {
      targetQuery = "code = $1";
      targetValue = String(data.code).trim();
    }

    const existingResult = await client.query(
      `SELECT id FROM modes WHERE ${targetQuery} LIMIT 1`,
      [targetValue]
    );

    if (existingResult.rows.length === 0) {
      return fail("目标 mode 不存在");
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(String(data.name).trim());
    }
    if (data.description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(data.description ? String(data.description).trim() : null);
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${index++}`);
      values.push(parseBoolean(data.enabled, "enabled"));
    }
    if (data.allow_panorama !== undefined) {
      updates.push(`allow_panorama = $${index++}`);
      values.push(parseBoolean(data.allow_panorama, "allow_panorama"));
    }
    if (data.allow_single_image !== undefined) {
      updates.push(`allow_single_image = $${index++}`);
      values.push(parseBoolean(data.allow_single_image, "allow_single_image"));
    }
    if (data.show_true_location !== undefined) {
      updates.push(`show_true_location = $${index++}`);
      values.push(parseBoolean(data.show_true_location, "show_true_location"));
    }
    if (data.default_annotation_type !== undefined) {
      updates.push(`default_annotation_type = $${index++}`);
      values.push(
        assertEnum(
          data.default_annotation_type,
          ["bbox", "reasoning", "hybrid"],
          "default_annotation_type"
        )
      );
    }
    if (data.default_reward_points !== undefined) {
      updates.push(`default_reward_points = $${index++}`);
      values.push(
        parseNonNegativeInt(data.default_reward_points, "default_reward_points")
      );
    }

    if (updates.length === 0) {
      return fail("没有可更新的字段");
    }

    updates.push("updated_at = NOW()");
    values.push(existingResult.rows[0].id);

    const updateResult = await client.query(
      `UPDATE modes
       SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, code, name, description, enabled, allow_panorama, allow_single_image,
                 show_true_location, default_annotation_type, default_reward_points, created_at, updated_at`,
      values
    );

    const mode = updateResult.rows[0];
    return ok({
      mode: {
        id: mode.id,
        code: mode.code,
        name: mode.name,
        description: mode.description || "",
        enabled: mode.enabled,
        allow_panorama: mode.allow_panorama,
        allow_single_image: mode.allow_single_image,
        show_true_location: mode.show_true_location,
        default_annotation_type: mode.default_annotation_type,
        default_reward_points: Number(mode.default_reward_points) || 0,
        created_at: mode.created_at ? new Date(mode.created_at).toISOString() : "",
        updated_at: mode.updated_at ? new Date(mode.updated_at).toISOString() : "",
      },
    });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
