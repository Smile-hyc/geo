"use strict";

const tcb = require("@cloudbase/node-sdk");

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();

/**
 * 管理员获取提交列表
 * 入参：{ limit?: number, offset?: number, question_id?: string }
 * 出参：{ submissions: Submission[] }
 */
exports.main = async (event) => {
  const limit = Math.min(Math.max(Number(event.limit) || 50, 1), 100);
  const offset = Math.max(Number(event.offset) || 0, 0);
  const question_id = event.question_id;

  let query = db.collection("Submissions").orderBy("submitted_at", "desc").limit(limit).skip(offset);
  if (question_id) {
    query = db.collection("Submissions").where({ question_id }).orderBy("submitted_at", "desc").limit(limit).skip(offset);
  }
  const { data } = await query.get();
  const list = data || [];
  const submissions = list.map((d) => ({
    _id: d._id,
    question_id: d.question_id,
    annotated_image_url: d.annotated_image_url,
    thought_process: d.thought_process,
    submitted_at: d.submitted_at,
  }));
  return { submissions };
};
