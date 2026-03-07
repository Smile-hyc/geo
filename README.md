# GeoAnnotate

地理图片推理与标注数据收集应用（类图寻 GeoGuessr，侧重数据回收）。

## 技术栈

- **前端**: Next.js 14 (App Router) + React + Tailwind CSS + shadcn/ui + react-konva
- **后端**: 腾讯云开发 CloudBase（云函数 + 云数据库 + 云存储）

## 本地开发

1. 安装依赖：`npm install`
2. 复制环境变量：`cp .env.example .env.local`，填入 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`
3. 启动：`npm run dev`

## CloudBase 配置

详细步骤见 **[docs/CLOUDBASE_DEPLOY.md](docs/CLOUDBASE_DEPLOY.md)**，包含：获取环境 ID、创建 Questions / Submissions 集合、CLI 与控制台两种方式部署云函数。

简要步骤：

1. 在 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb) 创建环境，记下 **环境 ID**，填入 `.env.local` 的 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`。
2. 在控制台「数据库」中新建集合：`Questions`、`Submissions`。
3. 部署云函数：在项目根目录修改 `cloudbaserc.json` 中的 `envId` 后执行 `tcb fn deploy`（需先 `npm i -g @cloudbase/cli` 并 `tcb login`）；或按文档在控制台逐个上传 ZIP。
4. 云存储需配置 CORS（若前端与图片非同源），以便画布导出图片。

## 路由

- `/` 首页
- `/play` 玩家答题与标注
- `/admin` 管理后台（上传题目、查看提交）

## 数据模型

- **Questions**: `_id`, `original_image_url`(fileID), `true_location`, `created_at`
- **Submissions**: `_id`, `question_id`, `annotated_image_url`(fileID), `thought_process`, `submitted_at`
