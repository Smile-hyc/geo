"use client";

import cloudbase from "@cloudbase/js-sdk";
import type { QuestionPublic, Submission } from "@/types/db";

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
  const res = await getApp().callFunction({ name, data });
  const result = res.result as T & { errMsg?: string } | undefined;
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
}): Promise<{ task: { id: number; storage_url: string; mode_tags: string[]; difficulty: number } | null }> {
  return callFunction("get-next-task", params || {});
}

/** 提交标注 */
export async function submitAnnotation(params: {
  image_id: number;
  mode_type: string;
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
}): Promise<{ question_id: number }> {
  return callFunction("create-question", params);
}

/** 管理员：删除图片 */
export async function deleteImage(image_id: number): Promise<{ success: boolean }> {
  return callFunction("delete-image", { image_id });
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
  session_ended: boolean;
}> {
  return callFunction("submit-battle-round", params);
}

/** 获取对战结果 */
export async function getBattleResult(params: {
  session_id: number;
}): Promise<{
  session: {
    id: number; mode_type: string; user_total_score: number;
    ai_total_score: number; winner: string; round_count: number;
  };
  rounds: Array<{
    round_index: number; image_storage_url: string;
    user_guess_lat: number; user_guess_lng: number;
    ai_guess_lat: number; ai_guess_lng: number;
    user_score: number; ai_score: number;
    true_lat: number; true_lng: number;
  }>;
}> {
  return callFunction("get-battle-result", params);
}

/** 管理员：获取标注记录列表 */
export async function listSubmissions(params?: {
  limit?: number;
  offset?: number;
  quality_status?: string;
}): Promise<{
  submissions: Array<{
    id: number; username: string; mode_type: string;
    thought_text: string; final_answer: string;
    quality_status: string; created_at: string;
    image_storage_url: string;
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
    created_at: string;
  }>;
}> {
  return callFunction("admin-list-prizes", params || {});
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
