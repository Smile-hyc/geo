"use client";

import cloudbase from "@cloudbase/js-sdk";
import type { QuestionPublic, Submission } from "@/types/db";
import { useAuthStore } from "@/lib/auth";

const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";

let app: cloudbase.app.App | null = null;

export function getApp(): cloudbase.app.App {
  if (!app) {
    if (!envId) throw new Error("NEXT_PUBLIC_CLOUDBASE_ENV_ID 未配置");
    app = cloudbase.init({ env: envId });
  }
  return app;
}

/** 获取 Auth 实例 */
export function getAuth() {
  return getApp().auth({ persistence: "local" });
}

/** CloudBase Auth：邮箱登录 */
export async function signInWithEmail(email: string, password: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = getAuth() as any;
  const result = await auth.signInWithPassword({ email, password });
  if (result?.error) {
    const code = result.error.code || result.error.status || "";
    const msg = result.error.message || result.error.msg || "登录失败";
    throw new Error(code ? `[${code}] ${msg}` : msg);
  }
  return auth.getLoginState();
}

/** CloudBase Auth：邮箱注册第一步 - 发送验证码，返回 verifyOtp 回调（null 表示无需验证直接已登录） */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ verifyOtp: ((token: string) => Promise<void>) | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = getAuth() as any;
  const result = await auth.signUp({ email, password });
  if (result?.error) {
    const msg = result.error.message || "注册失败，请重试";
    throw new Error(msg);
  }

  if (result?.data?.verifyOtp) {
    const originalVerify = result.data.verifyOtp;
    const verifyOtp = async (token: string) => {
      const r = await originalVerify({ email, token, type: "signup" });
      if (r?.error) throw new Error(r.error.message || "验证码错误，请重试");
    };
    return { verifyOtp };
  }

  // 无需 OTP，尝试直接登录
  await auth.signInWithPassword({ email, password });
  return { verifyOtp: null };
}

/** CloudBase Auth：退出登录 */
export async function signOut() {
  await getAuth().signOut();
}

/** CloudBase Auth：获取当前登录状态 */
export async function getLoginState() {
  return getAuth().getLoginState();
}

/** 忘记密码：发送邮箱验证码（邮箱必须已注册） */
export async function sendPasswordResetCode(email: string): Promise<{ verification_id: string }> {
  const auth = getAuth() as { getVerification: (opts: { email: string; target?: string }) => Promise<{ verification_id: string; is_user?: boolean }> };
  const res = await auth.getVerification({ email, target: "USER" });
  return { verification_id: res.verification_id };
}

/** 忘记密码：验证验证码并重置密码 */
export async function resetPasswordWithCode(
  email: string,
  verification_id: string,
  verification_code: string,
  new_password: string
): Promise<void> {
  const auth = getAuth() as {
    verify: (opts: { verification_id: string; verification_code: string }) => Promise<{ verification_token: string }>;
    resetPassword: (opts: { email: string; new_password: string; verification_token: string }) => Promise<void>;
  };
  const verifyRes = await auth.verify({ verification_id, verification_code });
  await auth.resetPassword({
    email,
    new_password,
    verification_token: verifyRes.verification_token,
  });
}

/** 调用云函数 */
export async function callFunction<T = unknown>(
  name: string,
  data?: Record<string, unknown>
): Promise<T> {
  const payload = { ...(data || {}) };
  const currentUser = useAuthStore.getState().user;

  if (currentUser) {
    if (payload.cloudbase_uid === undefined) {
      payload.cloudbase_uid = currentUser.uid;
    }
    if (payload.email === undefined) {
      payload.email = currentUser.email;
    }
  }

  const res = await getApp().callFunction({ name, data: payload });
  const result = res.result as T & { errMsg?: string } | undefined;
  // #region agent log
  try {
    const em = typeof result?.errMsg === "string" ? result.errMsg : "";
    if (/Cannot find module/i.test(em) && em.includes("hfSpace")) {
      fetch("http://127.0.0.1:7629/ingest/9cacff90-c744-456c-9c2a-be8ca2fff40b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "742b80",
        },
        body: JSON.stringify({
          sessionId: "742b80",
          hypothesisId: "H-remote-scf-hf-require",
          location: "lib/cloudbase.ts:callFunction",
          message: "errMsg mentions hf Space path",
          data: { fn: name, snippet: em.slice(0, 320) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
  } catch {
    /* debug */
  }
  // #endregion
  if (result?.errMsg) throw new Error(result.errMsg);
  if (result !== undefined && result !== null) return result as T;
  throw new Error((res as { errMsg?: string }).errMsg || "云函数调用失败");
}

/** 同步用户信息到 PostgreSQL */
export async function syncUserToDb(params: {
  username: string;
  email: string;
  cloudbase_uid?: string;
}): Promise<{ user_id: number; role: string; username: string; points_balance: number; level: number }> {
  return callFunction("auth-sync", params);
}

/** 获取下一个标注任务 */
export async function getNextTask(params?: {
  mode?: string;
}): Promise<{
  task:
    | {
        id: number;
        storage_url: string;
        mode_tags: string[];
        difficulty: number;
        lat?: number | null;
        lng?: number | null;
        true_location?: string | null;
      }
    | null;
}> {
  return callFunction("get-next-task", params || {});
}

/** 提交标注 */
export async function submitAnnotation(params: {
  image_id: number;
  mode_type: string;
  annotation_type?: string;
  thought_text: string;
  final_answer: string;
  confidence: number;
  cloudbase_uid?: string;
  email?: string;
  annotated_image_base64?: string;
  bboxes?: Array<{
    x: number; y: number; width: number; height: number;
    label_type: string; explanation?: string;
  }>;
}): Promise<{ record_id: number; reward: number }> {
  return callFunction("submit-annotation", params);
}

/** 管理员：创建题目（原图 Base64 + 真实地点） */
export async function createQuestion(params: {
  original_image_base64: string;
  true_location: string;
  lat?: number;
  lng?: number;
  mode_tags?: string[];
  difficulty?: number;
  original_filename?: string;
}): Promise<{ question_id: number }> {
  return callFunction("create-question", params);
}

/** 管理员：删除图片 */
export async function deleteImage(image_id: number): Promise<{ success: boolean }> {
  return callFunction("delete-image", { image_id });
}

/** 更新用户名 */
export async function updateUsername(params: {
  new_username: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ username: string }> {
  return callFunction("update-username", params);
}

/** 获取用户信息 */
export async function getUserProfile(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  user: {
    id: number; username: string; email: string; role: string;
    points_balance: number; level: number;
    annotation_count: number; battle_count: number;
  }
}> {
  return callFunction("get-user-profile", params || {});
}

/** 获取排行榜 */
export async function getLeaderboard(params?: {
  limit?: number;
}): Promise<{
  leaderboard: Array<{ rank: number; username: string; points_balance: number; level: number }>
}> {
  return callFunction("get-leaderboard", params || {});
}

/** 创建对战 Session */
export async function createBattle(params: {
  mode_type: string;
  time_limit_sec: number;
  round_count: number;
  ai_model_id?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ session_id: number }> {
  return callFunction("create-battle", params);
}

/** 提交对战轮次猜测 */
export async function submitBattleRound(params: {
  session_id: number;
  round_index: number;
  user_guess_lat: number;
  user_guess_lng: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  user_score: number;
  ai_score: number;
  true_lat: number;
  true_lng: number;
  distance_km: number;
  ai_distance_km?: number;
  ai_guess_lat?: number;
  ai_guess_lng?: number;
  ai_guess_source?: string;
  session_ended: boolean;
}> {
  return callFunction("submit-battle-round", params);
}

/** 获取对战结果 */
export async function getBattleResult(params: {
  session_id: number;
}): Promise<{
  session: {
    id: number;
    ai_model_id: string;
    mode_type: string;
    time_limit_sec: number;
    user_total_score: number;
    ai_total_score: number;
    winner: string | null;
    round_count: number;
    status?: string;
  };
  rounds: Array<{
    round_index: number;
    image_storage_url: string;
    user_guess_lat: number | null;
    user_guess_lng: number | null;
    ai_guess_lat: number | null;
    ai_guess_lng: number | null;
    user_score: number;
    ai_score: number;
    true_lat: number;
    true_lng: number;
    round_winner_type?: string | null;
    elapsed_ms?: number | null;
  }>;
}> {
  return callFunction("get-battle-result", params);
}

/** 管理员：获取标注记录列表 */
export async function listSubmissions(params?: {
  limit?: number;
  offset?: number;
  quality_status?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  submissions: Array<{
    id: number;
    username: string;
    mode_type: string;
    thought_text: string;
    final_answer: string;
    confidence: number;
    quality_status: string;
    created_at: string;
    image_storage_url: string;
    annotated_image_url?: string | null;
    last_review_score?: number | null;
    last_review_comments?: string | null;
    last_reviewed_at?: string | null;
    last_reviewer_username?: string | null;
    bboxes?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      label_type: string;
      explanation: string;
    }>;
  }>;
  total: number;
}> {
  return callFunction("list-submissions", params || {});
}

/** 获取云存储文件的临时访问 URL（用于展示图片） */
export function getTempFileURL(fileID: string): Promise<{ tempFileURL: string }> {
  return getApp().getTempFileURL({ fileList: [fileID] }).then((res) => {
    const item = res.fileList?.[0];
    if (item?.tempFileURL) return { tempFileURL: item.tempFileURL };
    throw new Error((item as { message?: string })?.message || "获取临时链接失败");
  });
}

/** 获取随机一题（兼容旧版） */
export async function getRandomQuestion(): Promise<QuestionPublic | null> {
  const result = await callFunction<{ question: QuestionPublic | null }>(
    "getRandomQuestion"
  );
  return result.question;
}

/** 管理员：获取提交列表（兼容旧版） */
export async function listSubmissionsLegacy(params?: {
  limit?: number;
  offset?: number;
  question_id?: string;
}): Promise<{ submissions: Submission[] }> {
  const result = await callFunction<{ submissions: Submission[] }>(
    "listSubmissions",
    params || {}
  );
  return result;
}

/** 提交答案（兼容旧版 PlayContent） */
export async function submitAnswer(params: {
  question_id: string;
  annotated_image_base64: string;
  thought_process: string;
}): Promise<{ submission_id: string }> {
  return callFunction("submitAnswer", params);
}

/** 获取可兑换奖品列表 */
export async function listPrizes(params?: { limit?: number }): Promise<{
  prizes: Array<{
    id: number;
    name: string;
    description: string;
    points_cost: number;
    stock: number;
    image_url: string | null;
  }>;
}> {
  return callFunction("list-prizes", params || {});
}

/** 兑换奖品 */
export async function redeemPrize(params: {
  prize_id: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  success: boolean;
  prize_name: string;
  points_spent: number;
  balance_after: number;
}> {
  return callFunction("redeem-prize", params);
}

/** 管理员：获取所有奖品 */
export async function adminListPrizes(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  prizes: Array<{
    id: number;
    name: string;
    description: string;
    points_cost: number;
    stock: number;
    image_url: string | null;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
  }>;
}> {
  return callFunction("admin-list-prizes", params || {});
}

/** 管理员：分页查询兑换记录 */
export async function adminListRedemptions(params?: {
  limit?: number;
  offset?: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  redemptions: Array<{
    id: number;
    user_id: number;
    prize_id: number;
    points_spent: number;
    username: string;
    email: string;
    prize_name: string;
    prize_removed: boolean;
    created_at: string;
  }>;
  total: number;
}> {
  return callFunction("admin-list-redemptions", params || {});
}

/** 管理员：添加奖品 */
export async function adminCreatePrize(params: {
  name: string;
  description?: string;
  points_cost: number;
  stock?: number;
  image_url?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ prize_id: number }> {
  return callFunction("admin-create-prize", params);
}

/** 管理员：更新奖品 */
export async function adminUpdatePrize(params: {
  prize_id: number;
  name?: string;
  description?: string;
  points_cost?: number;
  stock?: number;
  image_url?: string;
  is_active?: boolean;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ success: boolean }> {
  return callFunction("admin-update-prize", params);
}

/** 管理员：删除奖品 */
export async function adminDeletePrize(params: {
  prize_id: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ success: boolean }> {
  return callFunction("admin-delete-prize", params);
}

/** 管理员：更新图片元数据 */
export async function adminUpdateImage(params: {
  image_id: number;
  true_location?: string;
  lat?: number | null;
  lng?: number | null;
  mode_tags?: string[];
  difficulty?: number;
  source_type?: string;
  external_ref?: string;
  country?: string;
  region?: string;
  city?: string;
  is_active?: boolean;
  clear_deleted?: boolean;
  image_meta_json?: Record<string, unknown>;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ image: Record<string, unknown> }> {
  return callFunction("admin-update-image", params);
}

export type AdminUserRow = {
  id: number;
  cloudbase_uid: string;
  username: string;
  email: string;
  role: string;
  status: string;
  points_balance: number;
  level: number;
  last_login_at: string | null;
  created_at: string;
};

/** 管理员：用户列表 */
export async function adminListUsers(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  return callFunction("admin-list-users", params || {});
}

/** 管理员：修改用户角色 */
export async function adminUpdateUserRole(params: {
  user_id: number;
  role: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ user: Pick<AdminUserRow, "id" | "username" | "email" | "role"> }> {
  return callFunction("admin-update-user-role", params);
}

/** 管理员：设置用户状态 */
export async function adminSetUserStatus(params: {
  user_id: number;
  status: "active" | "suspended";
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ user: Pick<AdminUserRow, "id" | "username" | "email" | "status"> }> {
  return callFunction("admin-set-user-status", params);
}

/** 管理员：调整积分（写入 points_ledger） */
export async function adminAdjustUserPoints(params: {
  user_id: number;
  delta: number;
  reason?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ user_id: number; points_balance: number }> {
  return callFunction("admin-adjust-user-points", params);
}

type SkippedRecord = { record_id: number; image_id: number; reason: string };
type ExportAnnotationsResult = { jsonl?: string; skipped?: SkippedRecord[]; success?: boolean; errMsg?: string };

/** 管理员/审核员：导出标注为 JSONL（每行一个 JSON） */
export async function exportAnnotations(params?: {
  quality_status?: "approved" | "pending" | "rejected";
  limit?: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ jsonl: string; skipped: SkippedRecord[] }> {
  const res = await callFunction<ExportAnnotationsResult>("export-annotations", params || {});
  if (typeof res.jsonl === "string") return { jsonl: res.jsonl, skipped: res.skipped || [] };
  throw new Error("导出失败：响应中无 JSONL 正文");
}

/** 行为埋点（需登录） */
export async function recordEvent(params: {
  event_type: string;
  event_payload_json?: Record<string, unknown>;
  session_id?: string;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ ok: boolean }> {
  return callFunction("record-event", params);
}

/** AI 地理推理（云函数 geo-inference；未配置 GPU 时为占位结果） */
export type GeoInferenceResult = {
  address: string;
  chain_of_thought: string;
  source?: "stub" | "remote";
  model_ref?: string;
  latitude?: number;
  longitude?: number;
};

export async function runGeoInference(params: {
  image_base64: string;
  mime_type?: string;
  prompt?: string;
  max_new_tokens?: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<GeoInferenceResult> {
  return callFunction<GeoInferenceResult>("geo-inference", params);
}

/** 管理端：分析汇总 */
export async function getAnalyticsSummary(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  total_users: number;
  total_images: number;
  total_annotations: number;
  pending_reviews: number;
  by_quality: { quality_status: string; count: number }[];
}> {
  return callFunction("get-analytics-summary", params || {});
}

/** 管理端：按日标注量 */
export async function getAnalyticsTimeseries(params?: {
  days?: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ series: { day: string; count: number }[] }> {
  return callFunction("get-analytics-timeseries", params || {});
}

/** 管理端：按模式统计 */
export async function getAnalyticsByMode(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{ modes: { mode_type: string; count: number }[] }> {
  return callFunction("get-analytics-by-mode", params || {});
}

/** 获取当前任务配置 */
export async function getTaskConfig(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  config: {
    daily_task_limit: number;
    min_thought_length: number;
    base_reward_points: number;
    bbox_bonus_per_box: number;
    battle_win_bonus: number;
    quality_bonus: number;
  };
}> {
  return callFunction("get-task-config", params || {});
}

/** 更新当前任务配置 */
export async function setTaskConfig(params: {
  daily_task_limit: number;
  min_thought_length: number;
  base_reward_points: number;
  bbox_bonus_per_box: number;
  battle_win_bonus: number;
  quality_bonus: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  success: boolean;
  config: {
    daily_task_limit: number;
    min_thought_length: number;
    base_reward_points: number;
    bbox_bonus_per_box: number;
    battle_win_bonus: number;
    quality_bonus: number;
  };
}> {
  return callFunction("set-task-config", params);
}

/** 获取已启用模式列表 */
export async function getModes(params?: {
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  modes: Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    enabled: boolean;
    allow_panorama: boolean;
    allow_single_image: boolean;
    show_true_location: boolean;
    default_annotation_type: string;
    default_reward_points: number;
    created_at: string;
    updated_at: string;
  }>;
}> {
  return callFunction("get-modes", params || {});
}

/** 管理员更新模式配置 */
export async function adminUpdateMode(params: {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  allow_panorama?: boolean;
  allow_single_image?: boolean;
  show_true_location?: boolean;
  default_annotation_type?: string;
  default_reward_points?: number;
  cloudbase_uid?: string;
  email?: string;
}): Promise<{
  success: boolean;
  mode: {
    id: number;
    code: string;
    name: string;
    description: string;
    enabled: boolean;
    allow_panorama: boolean;
    allow_single_image: boolean;
    show_true_location: boolean;
    default_annotation_type: string;
    default_reward_points: number;
    created_at: string;
    updated_at: string;
  };
}> {
  return callFunction("admin-update-mode", params);
}
