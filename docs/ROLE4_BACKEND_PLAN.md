# 4 号位后台运营：计划说明（已按 JSONL 导出规范调整）

本文档在原「用户 / 图片 / 统计 / 导出 / 埋点」分工基础上，**重点修订第 4 项「数据导出」**：交付物为 **JSONL**（每行一个独立 JSON 对象），字段与类型需符合下列规范；实现时需与现有 [`cloudfunctions/export-annotations/index.js`](../cloudfunctions/export-annotations/index.js) 及 [`app/admin/export/page.tsx`](../app/admin/export/page.tsx) 对齐或演进。

---

## 一、JSONL 行 schema（与需求图对齐）

每张需求图在「是否必需」上略有出入，以下合并为**实现基线**（必需项取并集；冲突处标出并需产品拍板）。

### 1. 文件与路径

| 字段 | 类型 | 必需 | 说明 | 与当前库对照 |
|------|------|------|------|----------------|
| `image_name` | `str` | 是 | 含扩展名，如 jpg/png/jpeg | 需从 `storage_url` 或规则生成文件名；无则 `image_{id}.jpg` |
| `image_path` | `str` | 是 | 规范示例为 **NFS 绝对路径** | 本平台多为 `cloud://` / HTTPS；建议：**可配置前缀** + 逻辑路径，或约定填 `storage_url` 并在文档声明与 Geobench 示例的差异 |
| `original_url` | `str` | 否* | 原图或元数据 URL | *第一幅图列出；建议用 `image_assets.storage_url` |

### 2. 地理与形状

| 字段 | 类型 | 必需 | 说明 | 与当前库对照 |
|------|------|------|------|----------------|
| `gt_latitude` | `float` | 是 | **EPSG:4326**；若源为 GCJ-02/BD-09 须转换 | `image_assets.lat`；需约定入库坐标系并加转换管线 |
| `gt_longitude` | `float` | 是 | 同上 | `image_assets.lng` |
| `gt_bbox` | `dict` | 部分必需 | `gt_latitude_range`、`gt_longitude_range` 为 **float**；边界语义为 `gt_lat ± range/2` | **当前库无直接字段**；可由业务规则（固定裕度、任务配置）或 `image_meta_json` 扩展生成 |
| `gt_text` | `str` | 否 | OpenCage 结构化地址 | **需接入 OpenCage**（或导出时批量补算）；也可用 `true_location` 作临时占位并标注 `provenance` |
| `name` | `str` | 否 | 图中有主体时可填 | 可由 `final_answer` 或标注中的地标名推导，或留空 |
| `image_shape` | `[int,int]` | 是 | `(height, width)` | **当前表无宽高**；需：上传时写入 `image_meta_json`、或导出时拉取文件头、或云函数内探测（成本高） |

### 3. 来源与地理编码

| 字段 | 类型 | 必需 | 说明 | 与当前库对照 |
|------|------|------|------|----------------|
| `source` | `str` | 是 | 大数据集名，如 `osv_5m` | `image_assets.source_type` 或常量如 `geoannotate` |
| `source_id` | `str` | 是 | 原数据集条目 ID | `image_assets.external_ref` 或 `String(image_assets.id)` |
| `continent` | `str` | 否/第二图无√ | 洲/大洋英文名 | 依赖逆地理或 OpenCage |
| `continent_code` | `str` | 是 | 大洲短码，如 `AS` | 同上 |
| `country` | `str` | 否 | 国家名；港澳等特殊地区需规范 | `image_assets.country` 或解析结果 |
| `ISO_2` | `str` | 是 | 两位国别码；**HK、MO 须规范为 `CN`** | 需映射层，禁止直接输出 HK/MO |
| `ISO_3` | `str` | 否 | 三位国别码 | 可由 ISO_2 查表 |

### 4. 其它

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `other` | `dict` | 否 | 扩展信息，如 `{"weather":"..."}` |

**可选扩展（不替代规范字段）**：若仍以「标注工单」为主，可将 `record_id`、`quality_status`、`bboxes` 等放入 `other` 或并列顶层键，但须在团队内固定一种 JSONL 行结构，避免下游解析混乱。

---

## 二、与现状的差距（基于 develop）

| 项 | 现状 | 目标 |
|----|------|------|
| 格式 | API 返回 `annotations` **数组**，前端下载 **单个 JSON** | **JSONL**，每行一条；`Content-Type` / 文件名 `.jsonl` |
| 字段名 | `record_id`、`image_storage_url`、`lat`/`lng` 等 | 必须提供规范中的 `gt_*`、`image_name`、`image_path`、`source`、`source_id`、`continent_code`、`ISO_2`、`image_shape` 等 |
| 坐标 | 未声明/未统一 4326 与源坐标系 | 明确 **WGS84** 与 GCJ-02/BD-09 **转换** |
| 地址 | `true_location` 文本 | 规范优先 **OpenCage** 结构化 `gt_text` |
| 法域 | 无 ISO 规范化 | **HK/MO → CN** |
| 尺寸 | 无 | **image_shape** 需补齐数据源 |
| bbox 语义 | 有像素 bboxes，无经纬度 range dict | **gt_bbox** 字典需单独设计 |

---

## 三、粒度与产品线说明（需产品确认）

规范示例偏 **图库/地理条目**（`image_name` + `image_path`）。当前导出以 **`annotation_records` 为主表**。

- **方案 A（推荐起步）**：一行对应 **一条已导出条件的标注记录**，图像级字段从 `image_assets` 重复填充；`name` 可用模型输出地名。
- **方案 B**：按 `image_id` 去重，一行一图，标注进 `other.annotations` 数组。

请在开工前选定 A/B，避免返工。

---

## 四、实现步骤（调正后的「4. 导出」任务）

1. **契约**  
   - 在文档中固定 JSONL **单行 JSON 的键顺序**（无序也可，但键名必须与规范一致）。  
   - 定义 `format: "geobench-jsonl-v1"` 或 `export_mode` 查询参数，保留旧版 `json` 以兼容。

2. **云函数**  
   - 扩展 `export-annotations` 增加 `format=jsonl`（或新函数 `export-annotations-jsonl`），返回：  
     - 要么 `body` 为 **字符串**（整块 JSONL text）+ `total_lines`；  
     - 或大对象拆开 **流式**（CloudBase 若限制响应体积，需分片或仅 URL 导出——按平台限制定）。  
   - 组装每行对象：SELECT 补充 `image_assets.country`、`external_ref`、`source_type`、`image_meta_json`；  
   - 实现 `normalizeIso2`（HK/MO→CN）；  
   - 可选：`geocodeRow`（OpenCage，注意 key 与速率）；  
   - 可选：`toWgs84`（若 `image_meta_json.coord_sys` 标明 gcj/bd）。

3. **前端**  
   - [`app/admin/export/page.tsx`](../app/admin/export/page.tsx)：增加「导出 JSONL」；Blob 使用 `text/plain` 或 `application/x-ndjson`，文件扩展名 `.jsonl`。  
   - 若响应为字符串，用 `new Blob([text], { type: "application/x-ndjson" })`。

4. **数据补齐**  
   - 上传链路 / `create-question`：写入 `width`、`height`（及可选 `coord_sys`）到 `image_meta_json`，满足 `image_shape`。  
   - 管理端或批处理：对历史图片补跑尺寸与逆地理（可异步任务，非 MVP 可 Manual）。

5. **验证**  
   - 抽样：每行 `JSON.parse` 成功；必需键非 null；`ISO_2` 不为 HK/MO；纬度 [-90,90]、经度 [-180,180]。

6. **可选导出**（Role4 原文）  
   - `export-battles` / `export-users` / `export-points-ledger` 仍保留为后续；**不要求**与 Geobench JSONL 同 schema，除非另有规范。

---

## 五、其余模块（简要，未改 Role4 原意）

| 模块 | 状态与方向 |
|------|------------|
| 1 用户管理 | `admin-list-users` 等 + 替换 admin users 占位页 |
| 2 图片管理 | `list-images` 过滤软删、`delete-image` 引用保护+软删、`admin-update-image` |
| 3 统计分析 | `get-analytics-summary` / `timeseries` / `by-mode` + analytics 页 |
| 5 埋点 | `record-event` + `behavior_events` 写入 |

---

## 六、依赖与环境变量（建议）

- `OPENCAGE_API_KEY`（若启用 `gt_text` / 洲国字段）  
- `GEO_COORD_DEFAULT_SYS`（`wgs84` | `gcj02` 等）  
- `EXPORT_IMAGE_PATH_PREFIX`（填 `image_path` 前缀）  
- OpenCage / 坐标转换库选型需在仓库 `package.json` 与 CloudBase 体积限制下确认  

---

*文档版本：随 JSONL 规范引入而建立；与代码不一致时以已部署云函数与 PR 为准。*
