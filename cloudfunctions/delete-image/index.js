"use strict";

const tcb = require("@cloudbase/node-sdk");
const { withTransaction } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

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

exports.main = async (event, context) => {
  const data = getData(event);
  const image_id = parseInt(data.image_id, 10);

  if (!image_id || isNaN(image_id)) {
    return fail("缺少有效的 image_id");
  }

  try {
    const storageUrl = await withTransaction(async (client) => {
      await requireRole(client, event, context, ["admin"]);

      const selectResult = await client.query(
        "SELECT storage_url FROM image_assets WHERE id = $1",
        [image_id]
      );

      if (selectResult.rows.length === 0) {
        throw new Error("图片不存在");
      }

      const currentStorageUrl = selectResult.rows[0].storage_url;

      await client.query(
        `DELETE FROM annotation_bboxes
         WHERE record_id IN (SELECT id FROM annotation_records WHERE image_id = $1)`,
        [image_id]
      );
      await client.query("DELETE FROM annotation_records WHERE image_id = $1", [image_id]);
      await client.query("DELETE FROM battle_rounds WHERE image_id = $1", [image_id]);
      await client.query("DELETE FROM image_assets WHERE id = $1", [image_id]);

      return currentStorageUrl;
    });

    if (
      storageUrl &&
      (storageUrl.startsWith("cloud://") || storageUrl.startsWith("cos://"))
    ) {
      try {
        const app = getApp(context);
        await app.deleteFile({ fileList: [storageUrl] });
      } catch (_) {
        // Ignore cloud storage cleanup errors so DB deletion stays authoritative.
      }
    }

    return ok();
  } catch (error) {
    return fail(error);
  }
};
