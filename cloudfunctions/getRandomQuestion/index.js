"use strict";

const tcb = require("@cloudbase/node-sdk");

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();

/**
 * 随机返回一题（不包含答案 true_location）
 * 入参：无
 * 出参：{ question: { _id, original_image_url } | null }
 */
exports.main = async () => {
  const { data } = await db.collection("Questions").limit(100).get();
  if (!data || data.length === 0) return { question: null };
  const doc = data[Math.floor(Math.random() * data.length)];
  return {
    question: {
      _id: doc._id,
      original_image_url: doc.original_image_url,
    },
  };
};
