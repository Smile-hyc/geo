"use strict";

const tcb = require("@cloudbase/node-sdk");

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();

const STORAGE_PREFIX = "questions/";

/**
 * 管理员上传题目：Base64 原图上传云存储，并写入 Questions 集合
 * 入参：{ original_image_base64: string, true_location: string }
 * 出参：{ question_id: string }
 */
exports.main = async (event) => {
  const { original_image_base64, true_location } = event;
  if (!original_image_base64 || typeof true_location !== "string" || !true_location.trim()) {
    return { errMsg: "缺少 original_image_base64 或 true_location" };
  }
  const buffer = Buffer.from(original_image_base64, "base64");
  const ext = "jpg";
  const cloudPath = `${STORAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const uploadResult = await app.uploadFile({
    cloudPath,
    fileContent: buffer,
  });
  const fileID = uploadResult.fileID;
  if (!fileID) {
    return { errMsg: "上传云存储失败" };
  }

  const doc = {
    original_image_url: fileID,
    true_location: true_location.trim(),
    created_at: Date.now(),
  };
  const addResult = await db.collection("Questions").add(doc);
  const question_id = addResult.id;
  if (!question_id) {
    return { errMsg: "写入数据库失败" };
  }
  return { question_id };
};
