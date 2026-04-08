"use strict";

/** Minimal ISO 3166-1 alpha-2 → alpha-3 (extend as needed). */
const ISO2_TO_ISO3 = {
  CN: "CHN",
  TW: "TWN",
  US: "USA",
  GB: "GBR",
  FR: "FRA",
  DE: "DEU",
  JP: "JPN",
  KR: "KOR",
  IN: "IND",
  RU: "RUS",
  BR: "BRA",
  AU: "AUS",
  CA: "CAN",
  MX: "MEX",
  ES: "ESP",
  IT: "ITA",
  NL: "NLD",
  SE: "SWE",
  NO: "NOR",
  FI: "FIN",
  PL: "POL",
  TR: "TUR",
  EG: "EGY",
  ZA: "ZAF",
  NG: "NGA",
  AR: "ARG",
  CL: "CHL",
  CO: "COL",
  TH: "THA",
  VN: "VNM",
  ID: "IDN",
  MY: "MYS",
  SG: "SGP",
  PH: "PHL",
  NZ: "NZL",
  PT: "PRT",
  CH: "CHE",
  AT: "AUT",
  BE: "BEL",
  GR: "GRC",
  CZ: "CZE",
  IE: "IRL",
  IL: "ISR",
  SA: "SAU",
  AE: "ARE",
};

/** alpha-2 → UN M.49-style continent code */
const ISO2_TO_CONTINENT = {
  CN: "AS",
  HK: "AS",
  MO: "AS",
  TW: "AS",
  JP: "AS",
  KR: "AS",
  IN: "AS",
  TH: "AS",
  VN: "AS",
  ID: "AS",
  MY: "AS",
  SG: "AS",
  PH: "AS",
  IL: "AS",
  SA: "AS",
  AE: "AS",
  TR: "AS",
  RU: "EU",
  US: "NA",
  CA: "NA",
  MX: "NA",
  BR: "SA",
  AR: "SA",
  CL: "SA",
  CO: "SA",
  GB: "EU",
  FR: "EU",
  DE: "EU",
  ES: "EU",
  IT: "EU",
  NL: "EU",
  SE: "EU",
  NO: "EU",
  FI: "EU",
  PL: "EU",
  PT: "EU",
  CH: "EU",
  AT: "EU",
  BE: "EU",
  GR: "EU",
  CZ: "EU",
  IE: "EU",
  ZA: "AF",
  NG: "AF",
  EG: "AF",
  AU: "OC",
  NZ: "OC",
  UN: "UN",
};

const CONTINENT_CODE_TO_NAME = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
  UN: "Unknown",
};

function normalizeIso2(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const u = raw.trim().toUpperCase();
  if (u.length !== 2) return null;
  if (u === "HK" || u === "MO") return "CN";
  return u;
}

function pickCountryIso2(imageRow) {
  const meta = imageRow.image_meta_json && typeof imageRow.image_meta_json === "object" ? imageRow.image_meta_json : {};
  const fromMeta = meta.ISO_2 || meta.iso_2;
  if (typeof fromMeta === "string" && fromMeta.trim()) return normalizeIso2(fromMeta);
  if (typeof imageRow.country === "string") {
    const c = imageRow.country.trim();
    if (c.length === 2) return normalizeIso2(c);
  }
  return null;
}

function inferIso2FromCountryName(name) {
  if (!name || typeof name !== "string") return null;
  const n = name.trim().toLowerCase();
  const map = {
    china: "CN",
    "hong kong": "CN",
    macau: "CN",
    "united states": "US",
    "united kingdom": "GB",
    japan: "JP",
    france: "FR",
    germany: "DE",
    india: "IN",
  };
  return map[n] ? normalizeIso2(map[n]) : null;
}

function extFromStorageUrl(url) {
  if (!url || typeof url !== "string") return "jpg";
  const lower = url.toLowerCase();
  if (lower.endsWith(".png") || lower.includes(".png")) return "png";
  if (lower.endsWith(".jpeg") || lower.includes(".jpeg")) return "jpeg";
  if (lower.endsWith(".webp")) return "webp";
  return "jpg";
}

function buildImageName(imageRow) {
  const meta =
    imageRow.image_meta_json && typeof imageRow.image_meta_json === "object" ? imageRow.image_meta_json : {};
  if (typeof meta.original_filename === "string" && meta.original_filename.trim()) {
    return meta.original_filename.trim().slice(0, 512);
  }
  const ext = extFromStorageUrl(imageRow.storage_url);
  return `image_${imageRow.image_id}.${ext}`;
}

function buildImagePath(imageRow, pathPrefix) {
  const meta =
    imageRow.image_meta_json && typeof imageRow.image_meta_json === "object" ? imageRow.image_meta_json : {};
  if (typeof meta.dataset_image_path === "string" && meta.dataset_image_path.trim()) {
    const p = meta.dataset_image_path.trim();
    if (/^[/\\]|[a-zA-Z]:\\/.test(p)) return p;
    const pre = pathPrefix.endsWith("/") ? pathPrefix.slice(0, -1) : pathPrefix;
    return `${pre}/${p.replace(/^\/+/, "")}`;
  }
  const ext = extFromStorageUrl(imageRow.storage_url);
  const rel = `images/${imageRow.image_id}.${ext}`;
  const pre = pathPrefix.endsWith("/") ? pathPrefix.slice(0, -1) : pathPrefix;
  return `${pre}/${rel}`;
}

function buildImageShape(imageRow) {
  const meta =
    imageRow.image_meta_json && typeof imageRow.image_meta_json === "object" ? imageRow.image_meta_json : {};
  const w = parseInt(meta.width, 10);
  const h = parseInt(meta.height, 10);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return [h, w];
  return null;
}

function buildGtBbox(imageRow) {
  const meta =
    imageRow.image_meta_json && typeof imageRow.image_meta_json === "object" ? imageRow.image_meta_json : {};
  const latR = meta.gt_latitude_range != null ? parseFloat(meta.gt_latitude_range) : null;
  const lngR = meta.gt_longitude_range != null ? parseFloat(meta.gt_longitude_range) : null;
  const out = {};
  if (Number.isFinite(latR)) out.gt_latitude_range = latR;
  if (Number.isFinite(lngR)) out.gt_longitude_range = lngR;
  return out;
}

/**
 * @param {object} row - merged annotation + image fields
 * @param {object} ctx - { bboxes, review, pathPrefix }
 */
function rowToJsonlObject(row, ctx) {
  const pathPrefix =
    typeof process.env.JSONL_EXPORT_IMAGE_PATH_PREFIX === "string"
      ? process.env.JSONL_EXPORT_IMAGE_PATH_PREFIX
      : "/data/geoannotate";

  const lat = row.lat != null ? parseFloat(row.lat) : null;
  const lng = row.lng != null ? parseFloat(row.lng) : null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`记录 ${row.id}：缺少有效 gt_latitude/gt_longitude（图片 ${row.image_id}）`);
  }

  const imageShape = buildImageShape(row);
  if (!imageShape) {
    throw new Error(
      `记录 ${row.id}：缺少 image_meta_json.width/height（图片 ${row.image_id}），请在上传或 admin 中补全`
    );
  }

  let iso2 = pickCountryIso2(row);
  if (!iso2 && row.country) iso2 = inferIso2FromCountryName(row.country);
  if (!iso2) iso2 = "UN";

  const continentCode = ISO2_TO_CONTINENT[iso2] || "UN";
  const iso3 = ISO2_TO_ISO3[iso2] || null;

  const meta =
    row.image_meta_json && typeof row.image_meta_json === "object" ? row.image_meta_json : {};
  const nameField = typeof meta.name === "string" ? meta.name : row.true_location || "";

  const source = row.source_type && String(row.source_type).trim() ? String(row.source_type).trim() : "geoannotate";
  const sourceId =
    row.external_ref && String(row.external_ref).trim() ? String(row.external_ref).trim() : String(row.image_id);

  const gtBbox = buildGtBbox(row);

  const line = {
    image_name: buildImageName(row),
    image_path: buildImagePath(row, pathPrefix),
    gt_latitude: lat,
    gt_longitude: lng,
    image_shape: imageShape,
    source,
    source_id: sourceId,
    continent_code: continentCode,
    ISO_2: iso2,
    gt_bbox: gtBbox,
    gt_text: typeof meta.gt_text === "string" ? meta.gt_text : "",
    name: nameField || "",
    continent: CONTINENT_CODE_TO_NAME[continentCode] || "",
    country: row.country && String(row.country).trim() ? String(row.country).trim() : "",
    ISO_3: iso3,
    original_url: row.storage_url || "",
    other: {
      record_id: row.id,
      user_id: row.user_id,
      username: row.username,
      image_id: row.image_id,
      mode_type: row.mode_type,
      thought_text: row.thought_text || "",
      final_answer: row.final_answer || "",
      confidence: row.confidence ?? 50,
      quality_status: row.quality_status,
      annotated_image_url: row.annotated_image_url || null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
      bboxes: ctx.bboxes || [],
      last_review_score: ctx.last_review_score,
      last_review_comments: ctx.last_review_comments,
      last_reviewed_at: ctx.last_reviewed_at,
      last_reviewer_username: ctx.last_reviewer_username,
    },
  };

  return line;
}

module.exports = {
  normalizeIso2,
  rowToJsonlObject,
};
