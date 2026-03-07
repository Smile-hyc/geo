"use client";

import cloudbase from "@cloudbase/js-sdk";
import type { QuestionPublic, Submission } from "@/types/db";

const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";

let app: cloudbase.app.App | null = null;

function getApp(): cloudbase.app.App {
  if (!app) {
    if (!envId) throw new Error("NEXT_PUBLIC_CLOUDBASE_ENV_ID 未配置");
    app = cloudbase.init({ env: envId });
  }
  return app;
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

/** 获取随机一题（不包含答案） */
export async function getRandomQuestion(): Promise<QuestionPublic | null> {
  const result = await callFunction<{ question: QuestionPublic | null }>(
    "getRandomQuestion"
  );
  return result.question;
}

/** 提交答案（前端传 Base64，由云函数上传存储并写库） */
export async function submitAnswer(params: {
  question_id: string;
  annotated_image_base64: string;
  thought_process: string;
}): Promise<{ submission_id: string }> {
  return callFunction("submitAnswer", params);
}

/** 管理员：创建题目（原图 Base64 + 真实地点） */
export async function createQuestion(params: {
  original_image_base64: string;
  true_location: string;
}): Promise<{ question_id: string }> {
  return callFunction("createQuestion", params);
}

/** 管理员：获取提交列表 */
export async function listSubmissions(params?: {
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

/** 获取云存储文件的临时访问 URL（用于展示图片） */
export function getTempFileURL(fileID: string): Promise<{ tempFileURL: string }> {
  return getApp().getTempFileURL({ fileList: [fileID] }).then((res) => {
    const item = res.fileList?.[0];
    if (item?.tempFileURL) return { tempFileURL: item.tempFileURL };
    throw new Error((item as { message?: string })?.message || "获取临时链接失败");
  });
}
