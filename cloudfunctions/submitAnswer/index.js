"use strict";

const tcb = require("@cloudbase/node-sdk");

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();

const STORAGE_PREFIX = "submissions/";
const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB，避免请求体过大

/**
 * 玩家提交答案：Base64 标注图上传云存储，写入 Submissions 集合
 * 入参：{ question_id: string, annotated_image_base64: string, thought_process: string }
 * 出参：{ submission_id: string }
 */
exports.main = async (event) => {
  const { question_id, annotated_image_base64, thought_process } = event;
  if (!question_id || typeof annotated_image_base64 !== "string" || typeof thought_process !== "string") {
    return { errMsg: "缺少 question_id、annotated_image_base64 或 thought_process" };
  }
  const base64Length = annotated_image_base64.length;
  const estimatedBytes = (base64Length * 3) / 4;
  if (estimatedBytes > MAX_BASE64_SIZE) {
    return { errMsg: "标注图片过大，请缩小画布或降低质量后重试" };
  }

  const buffer = Buffer.from(annotated_image_base64, "base64");
  const cloudPath = `${STORAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const uploadResult = await app.uploadFile({
    cloudPath,
    fileContent: buffer,
  });
  const fileID = uploadResult.fileID;
  if (!fileID) {
    return { errMsg: "上传标注图失败" };
  }

  const doc = {
    question_id,
    annotated_image_url: fileID,
    thought_process: thought_process.trim(),
    submitted_at: Date.now(),
  };
  const addResult = await db.collection("Submissions").add(doc);
  const submission_id = addResult.id;
  if (!submission_id) {
    return { errMsg: "写入数据库失败" };
  }
  return { submission_id };
};
