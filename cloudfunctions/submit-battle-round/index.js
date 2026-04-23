"use strict";

const http = require("http");
const https = require("https");
const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");
const { URL } = require("url");
const {
  isValidCoordinatePair,
  predictGeoAgentFromBuffer,
} = require("./_shared/hfSpace");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2,
        idleTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432", 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
        max: 2,
        idleTimeoutMillis: 10000,
      }
);

const DEFAULT_BATTLE_PROMPT =
    '你是地理定位对战中的 GeoAgent。请分析图片并给出唯一最佳猜测。请尽量用简体中文输出；如果返回 JSON，请只使用键 "address"、"chain_of_thought"、"latitude"、"longitude"，并确保值使用简体中文。';
const DEFAULT_MAX_NEW_TOKENS = 1024;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_BODY_MAX = 8 * 1024 * 1024;

let cbApp = null;

function getApp(context) {
  if (!cbApp) {
    const options = { env: tcb.SYMBOL_CURRENT_ENV };
    if (context) {
      options.context = context;
    }
    cbApp = tcb.init(options);
  }
  return cbApp;
}

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcScore(distKm) {
  return Math.max(0, Math.round(5000 - distKm * 2));
}

function normalizePrompt(value, modeType) {
  const base =
    typeof value === "string" && value.trim()
      ? value.trim()
      : DEFAULT_BATTLE_PROMPT;
  return modeType && typeof modeType === "string" && modeType.trim()
    ? `${base} Current battle mode: ${modeType.trim()}.`
    : base;
}

function normalizeMaxNewTokens(value) {
  const parsed =
    typeof value === "number" ? value : parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_NEW_TOKENS;
  return Math.min(4096, Math.max(64, parsed));
}

function selectTransport(protocol) {
  return protocol === "http:" ? http : https;
}

function requestBuffer(urlString, options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const url = new URL(urlString);
    const transport = selectTransport(url.protocol);

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "http:" ? 80 : 443),
        path: url.pathname + url.search,
        method: options.method || "GET",
      },
      (res) => {
        const chunks = [];
        let size = 0;

        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > options.maxBodyBytes) {
            if (!settled) {
              settled = true;
              req.destroy();
              reject(new Error("Remote response body is too large."));
            }
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          if (settled) return;
          settled = true;
          resolve({
            status: res.statusCode || 0,
            headers: res.headers || {},
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    req.setTimeout(options.timeoutMs, () => {
      if (!settled) {
        settled = true;
        req.destroy();
        reject(new Error("Remote request timed out."));
      }
    });

    req.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    req.end();
  });
}

function escapeLikeValue(value) {
  return String(value).replace(/[\\%_]/g, "\\$&");
}

function buildLocationCandidates(text) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const candidates = [];

  if (normalized) {
    candidates.push(normalized);
  }

  for (const part of normalized.split(/[\n,，;；|/]+/)) {
    const candidate = part.trim();
    if (candidate && candidate.length >= 2) {
      candidates.push(candidate);
    }
  }

  return Array.from(new Set(candidates)).slice(0, 8);
}

async function resolveCoordinatesFromDatabase(client, text) {
  const candidates = buildLocationCandidates(text);

  for (const candidate of candidates) {
    const like = `%${escapeLikeValue(candidate)}%`;
    const result = await client.query(
      `SELECT lat, lng
       FROM image_assets
       WHERE deleted_at IS NULL
         AND lat IS NOT NULL
         AND lng IS NOT NULL
         AND (
           LOWER(true_location) = LOWER($1)
           OR LOWER(COALESCE(city, '')) = LOWER($1)
           OR LOWER(COALESCE(region, '')) = LOWER($1)
           OR LOWER(COALESCE(country, '')) = LOWER($1)
           OR true_location ILIKE $2 ESCAPE '\\'
           OR COALESCE(city, '') ILIKE $2 ESCAPE '\\'
           OR COALESCE(region, '') ILIKE $2 ESCAPE '\\'
           OR COALESCE(country, '') ILIKE $2 ESCAPE '\\'
         )
       ORDER BY
         CASE
           WHEN LOWER(true_location) = LOWER($1) THEN 0
           WHEN LOWER(COALESCE(city, '')) = LOWER($1) THEN 1
           WHEN LOWER(COALESCE(region, '')) = LOWER($1) THEN 2
           WHEN LOWER(COALESCE(country, '')) = LOWER($1) THEN 3
           WHEN true_location ILIKE $2 ESCAPE '\\' THEN 4
           WHEN COALESCE(city, '') ILIKE $2 ESCAPE '\\' THEN 5
           WHEN COALESCE(region, '') ILIKE $2 ESCAPE '\\' THEN 6
           WHEN COALESCE(country, '') ILIKE $2 ESCAPE '\\' THEN 7
           ELSE 8
         END,
         created_at DESC
       LIMIT 1`,
      [candidate, like]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const latitude = Number(row.lat);
      const longitude = Number(row.lng);
      if (isValidCoordinatePair(latitude, longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
}

async function resolveStorageUrl(storageUrl, context) {
  if (!storageUrl || typeof storageUrl !== "string") {
    throw new Error("Round image is missing.");
  }

  if (/^https?:\/\//i.test(storageUrl)) {
    return storageUrl;
  }

  if (storageUrl.startsWith("cloud://") || storageUrl.startsWith("cos://")) {
    const app = getApp(context);
    const response = await app.getTempFileURL({ fileList: [storageUrl] });
    const item = response?.fileList?.[0];
    if (item?.tempFileURL) {
      return String(item.tempFileURL);
    }
  }

  throw new Error("Failed to resolve round image URL.");
}

async function downloadImageBuffer(urlString, redirectCount) {
  const response = await requestBuffer(urlString, {
    method: "GET",
    timeoutMs: DOWNLOAD_TIMEOUT_MS,
    maxBodyBytes: DOWNLOAD_BODY_MAX,
  });

  if (
    response.status >= 300 &&
    response.status < 400 &&
    response.headers.location &&
    redirectCount < 3
  ) {
    const redirected = new URL(response.headers.location, urlString).toString();
    return downloadImageBuffer(redirected, redirectCount + 1);
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to download round image: HTTP ${response.status}`);
  }

  return response.body;
}

async function loadBattleImage(storageUrl, context) {
  const resolvedUrl = await resolveStorageUrl(storageUrl, context);
  return downloadImageBuffer(resolvedUrl, 0);
}

function shouldUseRemoteInference(aiModelId) {
  const id =
    typeof aiModelId === "string" && aiModelId.trim()
      ? aiModelId.trim().toLowerCase()
      : "";
  return id !== "" && id !== "mock-v1";
}

function clampLatitude(value) {
  return Math.max(-89.9, Math.min(89.9, value));
}

function wrapLongitude(value) {
  let longitude = value;
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  return longitude;
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMockAiGuess(trueLat, trueLng, seed) {
  const hash = hashText(seed);
  const latOffset = ((hash % 10000) / 10000 - 0.5) * 10;
  const lngOffset =
    (((Math.floor(hash / 10000) % 10000) / 10000) - 0.5) * 10;

  return {
    latitude: clampLatitude(trueLat + latOffset),
    longitude: wrapLongitude(trueLng + lngOffset),
    source: "mock",
  };
}

async function inferAiGuess(client, storageUrl, context, options) {
  const imageBuffer = await loadBattleImage(storageUrl, context);
  const prompt = normalizePrompt(
    process.env.GEO_BATTLE_PROMPT,
    options.modeType
  );
  const maxNewTokens = normalizeMaxNewTokens(
    process.env.GEO_BATTLE_MAX_NEW_TOKENS
  );

  const predicted = await predictGeoAgentFromBuffer({
    buffer: imageBuffer,
    prompt,
    maxNewTokens,
  });

  let latitude = predicted.latitude;
  let longitude = predicted.longitude;

  if (!isValidCoordinatePair(latitude, longitude)) {
    const resolved = await resolveCoordinatesFromDatabase(
      client,
      predicted.address || predicted.chain_of_thought
    );
    if (resolved) {
      latitude = resolved.latitude;
      longitude = resolved.longitude;
    }
  }

  if (!isValidCoordinatePair(latitude, longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    address: predicted.address,
    chain_of_thought: predicted.chain_of_thought,
    source: predicted.source || "hf-space",
    model_ref: predicted.model_ref,
  };
}

exports.main = async (event, context) => {
  const data = getData(event);
  const {
    session_id,
    round_index,
    user_guess_lat,
    user_guess_lng,
    elapsed_ms,
    cloudbase_uid: clientUid,
    email: clientEmail,
  } = data;

  const cloudbaseUid =
    context?.userInfo?.openId ||
    context?.userInfo?.uid ||
    (clientUid && String(clientUid).trim()) ||
    "";
  const email = clientEmail && String(clientEmail).trim();

  if (!cloudbaseUid && !email) {
    return { errMsg: "User identity is missing." };
  }
  if (session_id == null || round_index == null) {
    return { errMsg: "Missing required battle parameters." };
  }

  const client = await pool.connect();

  try {
    let userResult;
    if (cloudbaseUid) {
      userResult = await client.query(
        "SELECT id FROM users WHERE cloudbase_uid = $1",
        [cloudbaseUid]
      );
    }
    if ((!userResult || userResult.rows.length === 0) && email) {
      userResult = await client.query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);
    }
    if (!userResult || userResult.rows.length === 0) {
      return { errMsg: "User record not found." };
    }
    const userId = userResult.rows[0].id;

    await client.query("BEGIN");

    const roundResult = await client.query(
      `SELECT br.id,
              br.truth_lat,
              br.truth_lng,
              br.completed,
              br.image_id,
              ia.storage_url,
              bs.user_id,
              bs.ai_model_id,
              bs.mode_type,
              bs.user_total_score,
              bs.ai_total_score,
              bs.round_count
       FROM battle_rounds br
       JOIN battle_sessions bs ON bs.id = br.session_id
       JOIN image_assets ia ON ia.id = br.image_id
       WHERE br.session_id = $1 AND br.round_index = $2
       FOR UPDATE`,
      [session_id, round_index]
    );

    if (roundResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { errMsg: "Battle round not found." };
    }

    const round = roundResult.rows[0];

    if (round.user_id !== userId) {
      await client.query("ROLLBACK");
      return { errMsg: "This battle session does not belong to the user." };
    }

    if (round.completed) {
      await client.query("ROLLBACK");
      return { errMsg: "This round has already been submitted." };
    }

    const trueLat = Number(round.truth_lat);
    const trueLng = Number(round.truth_lng);
    if (!Number.isFinite(trueLat) || !Number.isFinite(trueLng)) {
      await client.query("ROLLBACK");
      return { errMsg: "Round truth coordinates are missing." };
    }

    const userLat = Number(user_guess_lat);
    const userLng = Number(user_guess_lng);
    if (!isValidCoordinatePair(userLat, userLng)) {
      await client.query("ROLLBACK");
      return { errMsg: "User guess coordinates are invalid." };
    }

    const userDist = haversineKm(userLat, userLng, trueLat, trueLng);
    const userScore = calcScore(userDist);

    let aiGuess = createMockAiGuess(
      trueLat,
      trueLng,
      `${session_id}:${round_index}:${round.image_id}:${round.ai_model_id || ""}`
    );
    let aiElapsedMs = 0;

    if (shouldUseRemoteInference(round.ai_model_id)) {
      const startedAt = Date.now();
      try {
        const inferred = await inferAiGuess(client, round.storage_url, context, {
          modeType: round.mode_type,
        });
        if (
          inferred &&
          isValidCoordinatePair(inferred.latitude, inferred.longitude)
        ) {
          aiGuess = inferred;
        }
      } catch (_) {
        // Best effort only. Mock fallback keeps the battle flow alive.
      } finally {
        aiElapsedMs = Date.now() - startedAt;
      }
    }

    const aiDist = haversineKm(
      aiGuess.latitude,
      aiGuess.longitude,
      trueLat,
      trueLng
    );
    const aiScore = calcScore(aiDist);

    let roundWinnerType = "draw";
    if (userScore > aiScore) roundWinnerType = "user";
    else if (aiScore > userScore) roundWinnerType = "ai";

    await client.query(
      `UPDATE battle_rounds
       SET user_guess_lat = $1,
           user_guess_lng = $2,
           ai_guess_lat = $3,
           ai_guess_lng = $4,
           user_distance_km = $5,
           ai_distance_km = $6,
           user_score = $7,
           ai_score = $8,
           completed = true,
           round_winner_type = $9,
           elapsed_ms = $10,
           elapsed_ms_ai = $11,
           submitted_at = NOW()
       WHERE session_id = $12 AND round_index = $13`,
      [
        userLat,
        userLng,
        aiGuess.latitude,
        aiGuess.longitude,
        userDist,
        aiDist,
        userScore,
        aiScore,
        roundWinnerType,
        elapsed_ms || null,
        aiElapsedMs || null,
        session_id,
        round_index,
      ]
    );

    const newUserTotal = parseInt(round.user_total_score, 10) + userScore;
    const newAiTotal = parseInt(round.ai_total_score, 10) + aiScore;
    const totalRounds = parseInt(round.round_count, 10);
    const sessionEnded = Number(round_index) >= totalRounds;

    let winner = null;
    if (sessionEnded) {
      winner =
        newUserTotal > newAiTotal
          ? "user"
          : newUserTotal < newAiTotal
            ? "ai"
            : "draw";
    }

    await client.query(
      `UPDATE battle_sessions
       SET user_total_score = $1,
           ai_total_score = $2,
           winner = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        newUserTotal,
        newAiTotal,
        winner,
        sessionEnded ? "finished" : "active",
        session_id,
      ]
    );

    await client.query("COMMIT");

    return {
      user_score: userScore,
      ai_score: aiScore,
      true_lat: trueLat,
      true_lng: trueLng,
      distance_km: Math.round(userDist),
      ai_distance_km: Math.round(aiDist),
      ai_guess_lat: aiGuess.latitude,
      ai_guess_lng: aiGuess.longitude,
      ai_guess_source: aiGuess.source || "mock",
      session_ended: sessionEnded,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    return {
      errMsg:
        error && error.message
          ? String(error.message)
          : "Failed to submit the battle round.",
    };
  } finally {
    client.release();
  }
};
