"use strict";

const { getPool } = require("./_shared/db");
const { requireLogin } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");

const DEFAULT_MODES = [
  {
    code: "streetview",
    name: "Street View",
    description: "Single-image street-level geo-localization tasks.",
    enabled: true,
    allow_panorama: true,
    allow_single_image: true,
    show_true_location: false,
    default_annotation_type: "bbox",
    default_reward_points: 50,
  },
  {
    code: "remote_sensing",
    name: "Remote Sensing",
    description: "Aerial or satellite interpretation tasks.",
    enabled: true,
    allow_panorama: false,
    allow_single_image: true,
    show_true_location: false,
    default_annotation_type: "bbox",
    default_reward_points: 50,
  },
  {
    code: "map",
    name: "Map",
    description: "Map-based image and clue interpretation tasks.",
    enabled: true,
    allow_panorama: false,
    allow_single_image: true,
    show_true_location: false,
    default_annotation_type: "reasoning",
    default_reward_points: 50,
  },
  {
    code: "terrain_map",
    name: "Terrain Map",
    description: "Terrain or topography focused map tasks.",
    enabled: true,
    allow_panorama: false,
    allow_single_image: true,
    show_true_location: false,
    default_annotation_type: "reasoning",
    default_reward_points: 50,
  },
  {
    code: "hybrid",
    name: "Hybrid",
    description: "Mixed-mode tasks combining clues from multiple sources.",
    enabled: true,
    allow_panorama: true,
    allow_single_image: true,
    show_true_location: false,
    default_annotation_type: "hybrid",
    default_reward_points: 50,
  },
];

exports.main = async (event, context) => {
  const client = await getPool().connect();
  try {
    await requireLogin(client, event, context);

    for (const mode of DEFAULT_MODES) {
      await client.query(
        `INSERT INTO modes
           (code, name, description, enabled, allow_panorama, allow_single_image, show_true_location, default_annotation_type, default_reward_points, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (code) DO NOTHING`,
        [
          mode.code,
          mode.name,
          mode.description,
          mode.enabled,
          mode.allow_panorama,
          mode.allow_single_image,
          mode.show_true_location,
          mode.default_annotation_type,
          mode.default_reward_points,
        ]
      );
    }

    const result = await client.query(
      `SELECT id, code, name, description, enabled, allow_panorama, allow_single_image,
              show_true_location, default_annotation_type, default_reward_points, created_at, updated_at
       FROM modes
       WHERE enabled = true
       ORDER BY id ASC`
    );

    const modes = (result.rows || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || "",
      enabled: row.enabled,
      allow_panorama: row.allow_panorama,
      allow_single_image: row.allow_single_image,
      show_true_location: row.show_true_location,
      default_annotation_type: row.default_annotation_type,
      default_reward_points: Number(row.default_reward_points) || 0,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : "",
    }));

    return ok({ modes });
  } catch (error) {
    return fail(error, { modes: [] });
  } finally {
    client.release();
  }
};
