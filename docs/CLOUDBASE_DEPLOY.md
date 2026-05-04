# 腾讯云开发 CloudBase 部署步骤详解

本文档按顺序说明：如何获取环境 ID、创建数据库集合、部署云函数。

**控制台快速入口：**

| 功能       | 链接 |
|------------|------|
| 云开发总控（环境 / 环境 ID） | https://console.cloud.tencent.com/tcb |
| 云数据库（建集合）         | https://tcb.cloud.tencent.com （进入后左侧选「数据库」） |
| 云函数（新建 / 上传代码）   | https://tcb.cloud.tencent.com （进入后左侧选「云函数」） |

---

## 一、注册 / 登录腾讯云

1. 打开 [腾讯云官网](https://cloud.tencent.com/)
2. 使用微信或 QQ 登录；若无账号，先注册
3. 完成实名认证（云开发需实名）

---

## 二、开通云开发并获取「环境 ID」

### 2.1 进入云开发控制台

1. 在浏览器打开：**https://console.cloud.tencent.com/tcb**
2. 若首次使用，页面会提示开通「云开发 CloudBase」，勾选服务协议后点击 **「免费开通」** 或 **「立即使用」**
3. 按提示完成「服务角色授权」（允许 CloudBase 访问你的云资源），授权后会自动跳回控制台

### 2.2 创建环境

1. 在云开发控制台左侧或首页找到 **「环境」** 或 **「环境管理」**
2. 点击 **「新建环境」** 或 **「创建环境」**
3. 填写：
   - **环境名称**：例如 `geoannotate`（仅用于自己区分）
   - **环境地域**：选择离你用户近的，如「上海」
   - **套餐**：选 **「免费」** 即可用于开发与试用
4. 提交后等待约 1～2 分钟，环境创建完成

### 2.3 查看并复制「环境 ID」

1. 在 **环境列表** 中会看到刚建的环境
2. 在对应环境一行中，找到 **「环境 ID」** 列（一串英文+数字，例如 `geoannotate-xxxxx`）
3. **复制该环境 ID**，后面会用到：
   - 前端：填入项目根目录的 `.env.local` 中的 `NEXT_PUBLIC_CLOUDBASE_ENV_ID=这里粘贴环境ID`
   - 使用 CLI 部署云函数时：在 `cloudbaserc.json` 或命令参数里指定该环境 ID

> 若页面上没有直接写「环境 ID」，可点击该环境名称进入「环境概览」，在页面顶部或「设置」里会显示环境 ID。

---

## 三、创建数据库集合 Questions 和 Submissions

### 3.1 打开数据库

1. 在云开发控制台左侧菜单找到 **「数据库」**（或「云数据库」）
2. 在顶部选择你刚创建的环境（若当前已是该环境可跳过）
3. 进入该环境的数据库管理页

### 3.2 新建集合 Questions

1. 点击 **「新建集合」** 或 **「创建集合」**
2. **集合名称** 填写：`Questions`（注意大小写，与代码中一致）
3. 无需勾选「权限」等高级选项，直接确定
4. 列表中会出现集合 `Questions`

### 3.3 新建集合 Submissions

1. 再次点击 **「新建集合」**
2. **集合名称** 填写：`Submissions`
3. 确定后即可

> 云开发数据库为文档型（类似 MongoDB），无需预先建字段。代码写入 `original_image_url`、`true_location`、`created_at` 等字段时会自动存在。

---

## 四、部署云函数（两种方式任选其一）

云函数列表与运行时配置见项目根目录 **`cloudbaserc.json`**（`functions` 数组）。部署前请将其中 **`envId`** 改为你的环境 ID。

### 方式 A：使用 CloudBase CLI 一键部署（推荐）

#### 1. 安装 CloudBase CLI

在终端执行（需已安装 Node.js）：

```bash
npm i -g @cloudbase/cli
```

若安装较慢，可使用腾讯云镜像：

```bash
npm i -g @cloudbase/cli --registry=http://mirrors.cloud.tencent.com/npm/
```

安装后执行 `tcb -v` 能输出版本号即成功。

#### 2. 登录

```bash
tcb login
```

会打开浏览器，用腾讯云账号扫码登录并授权 CLI。

#### 3. 为各云函数安装依赖（首次或依赖变更时）

`cloudfunctions/` 下每个子目录对应一个函数；若该目录有 `package.json`，进入后执行 `npm install`。CLI 部署时若 `installDependency` 为 `true`，也会在云端安装依赖，但本地先 `npm install` 可减少部署失败。

#### 4. 配置并部署

1. 在项目**根目录**确认 `cloudbaserc.json` 中 **`envId`** 正确。
2. **（必选）** 各云函数仅打包自己的子目录，公共代码在 `cloudfunctions/_shared`。部署前在根目录执行一次 `npm run cloudfunctions:sync-shared`，将 `_shared` 复制进每个引用 `./_shared/...` 的函数目录。`submit-battle-round`、`geo-inference` 还会在**函数根目录**保留与 `_shared/hfSpace.js` 同步的 **`hfSpace.js`（纳入 Git）**，避免仅打包子目录时出现 `Cannot find module './hfSpace'` 或 `./_shared/hfSpace`。仍可执行 **`npm run cloudfunctions:verify-shared`** 做本地自检（通过后再 `tcb fn deploy`）。
3. 在项目**根目录**打开终端，执行：

```bash
tcb fn deploy
```

若只部署其中一个，函数名须与 `cloudbaserc.json` 里 `name` 一致，例如：

```bash
tcb fn deploy get-next-task
tcb fn deploy create-question
```

部署成功会提示各函数部署完成。

若批量部署时个别函数（常见为 `create-question`，依赖较多、包体较大）失败，且 CloudBase CLI 报 `e.message.includes is not a function`（属 CLI 处理非标准错误时的缺陷），可在同步与自检后对该函数单独使用 ZIP 上传：

```bash
tcb fn deploy create-question --deployMode zip --force --yes -e <你的环境ID>
```

---

### 方式 B：在控制台逐个创建并上传 ZIP

#### 1. 进入云函数列表

1. 打开 **https://console.cloud.tencent.com/tcb**
2. 左侧选 **「云函数」**（或「函数」）
3. 确认当前环境为你创建的环境

#### 2. 为每个函数准备 ZIP 包（含依赖）

任选一个目录，例如 `cloudfunctions/get-next-task`：

1. 若该函数的 `index.js` 含 `require("./_shared/...")`，须先执行 `npm run cloudfunctions:sync-shared`，或手动把 `cloudfunctions/_shared` 拷入该函数目录内再打 ZIP。
2. 进入该目录并执行 `npm install`（若有 `package.json`）。
3. 将该目录下**所有内容**打成 ZIP，**解压后根目录须有 `index.js`**（不要多包一层文件夹）。
4. 对其余 `cloudfunctions/` 子目录重复同样步骤。

#### 3. 在控制台新建函数并上传

1. **函数名称** 必须与 `cloudbaserc.json` 中对应项的 `name` 一致（注意连字符，如 `get-next-task`）。
2. **运行环境** 选：Node.js 16 或 18（与配置一致）。
3. 上传 ZIP，保存；若 ZIP 不含 `node_modules`，使用控制台「安装依赖」。

#### 4. 确认入口

云函数入口为 `index.main`，即 `index.js` 中的 `exports.main`。

---

## 五、前端配置环境变量

### 5.1 本地（`.env.local`）

1. 在项目根复制示例：`copy .env.example .env.local`（Windows）或 `cp .env.example .env.local`（Mac/Linux）。
2. 编辑 `.env.local`：
   - **必填**：`NEXT_PUBLIC_CLOUDBASE_ENV_ID` = 腾讯云云开发「环境 ID」（可与 [`cloudbaserc.json`](../cloudbaserc.json) 顶层 `envId` 一致）。
   - **若使用 Prisma**（`prisma generate`、`migrate`、`npm run db:seed`）：同时配置 `DATABASE_URL`（可用 Supabase 池化 6543）与 `DIRECT_URL`（Supabase 直连 5432），与 [`prisma/schema.prisma`](../prisma/schema.prisma) 中 `url` / `directUrl` 对应；格式见 [`.env.example`](../.env.example)。
3. `.env` 与 `.env.local` 均在 `.gitignore` 中，**勿提交仓库**。
4. 保存后**重启** `npm run dev`（Next 仅在进程启动时读取环境变量）。

### 5.2 线上（Vercel 等）

1. 项目 **Settings → Environment Variables** 中添加 **`NEXT_PUBLIC_CLOUDBASE_ENV_ID`**（名称勿拼错），值为同一云开发环境 ID；作用域勾选 **Production**（及 **Preview** 若需要）。
2. **推荐**：若构建或 CI 会执行 `npx prisma generate`，再添加 **`DATABASE_URL`**、**`DIRECT_URL`**（**不要**加 `NEXT_PUBLIC_` 前缀），与本地一致。
3. **重新部署**（Redeploy）使变量生效。不要把数据库密码写入任何 `NEXT_PUBLIC_*` 变量。

---

## 六、云存储（可选，用于图片跨域）

若前端页面与图片域名不同（例如前端是 localhost，图片是云存储域名），画布导出可能因跨域被拦截。可在云开发控制台为**云存储**配置 CORS：

1. 进入 **云开发控制台 → 云存储**
2. 找到 **「跨域设置」** 或 **「CORS 配置」**
3. 添加规则：来源填你前端域名（如 `http://localhost:3000` 或线上域名），方法勾选 GET 等所需项，保存

---

## 六（补充）、标注导出 JSONL 与环境变量

- 管理端 **「导出数据」** 与审核页导出均调用 `export-annotations`，成功时返回 **`{ jsonl: string }`**（纯文本，每行一个 JSON 对象），**不再**返回 `annotations` 数组；依赖旧 JSON 结构的脚本需自行改为读取 JSONL。
- **图片路径**：`image_path` 由 `JSONL_EXPORT_IMAGE_PATH_PREFIX`（云函数环境变量，默认云函数内为 `/data/geoannotate`）与相对路径拼接，或由 `image_meta_json.dataset_image_path` 覆盖（绝对路径则直接使用）。请在云上为导出函数配置与数据集一致的前缀。
- **必填校验**：缺 `lat`/`lng` 或 `image_meta_json.width`/`height` 时整批导出失败（需通过 `create-question` 上传或管理端编辑补全宽高）。
- **Role 4 其他函数**：需部署 `get-analytics-summary`、`get-analytics-timeseries`、`get-analytics-by-mode`（管理员看板）、`record-event`（埋点，需登录）。

---

## 六（补充 B）、多模型推理环境变量（`geo-inference` / `submit-battle-round`）

对战与云函数推理按 `ai_model_id` 路由（允许值与前端 [`features/battle/config.ts`](../features/battle/config.ts) 及云侧 [`cloudfunctions/_shared/modelRegistry.js`](../cloudfunctions/_shared/modelRegistry.js) 对齐）。部署或更新 `_shared` 后请在仓库根目录执行 **`npm run cloudfunctions:sync-shared`**，再部署 **`geo-inference`**、**`submit-battle-round`**。

`submit-battle-round` 需拉图并调用第三方多模态 API，**执行超时建议 ≥ 90 秒**（与根目录 [`cloudbaserc.json`](../cloudbaserc.json) 中配置一致）。若控制台仍为 15 秒，提交时会 `invoking task timed out`，请在 **函数配置 → 执行超时** 中改大并保存。

| 变量名 | 作用 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI 兼容接口 | 使用 ChatGPT（`openai-gpt-4o-mini` 等）时必填；**勿**写入 `NEXT_PUBLIC_*`。 |
| `OPENAI_BASE_URL` | OpenAI API 根路径 | 可选，默认 `https://api.openai.com/v1`（可改为代理或兼容网关）。 |
| `DEEPSEEK_API_KEY` | DeepSeek API | 使用 `deepseek-chat` / `deepseek-reasoner` 时必填。 |
| `DEEPSEEK_BASE_URL` 或 `DEEPSEEK_API_BASE_URL` | DeepSeek 根路径 | 可选，默认 `https://api.deepseek.com/v1`。 |
| `GEO_INFERENCE_SPACE_URL` / `GEO_INFERENCE_SPACE_ID` / `HF_TOKEN` 等 | HF Space | 与原有寻境 HF 链路一致；`research-baseline` 走 HF。 |
| `MOONSHOT_API_KEY` 或 `KIMI_API_KEY` | Kimi（月之暗面） | 使用 `kimi-vision` 等时必填。 |
| `MOONSHOT_BASE_URL` | Kimi API 根路径 | 可选，默认 `https://api.moonshot.cn/v1`。 |
| `ZHIPU_API_KEY` | 智谱 GLM | 使用 `glm-4v` 等时必填。 |
| `ZHIPU_BASE_URL` | 智谱 OpenAI 兼容根路径 | 可选，默认 `https://open.bigmodel.cn/api/paas/v4`。 |
| `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` | 通义（DashScope 兼容模式） | 使用 `qwen-vl` 等时必填。 |
| `QWEN_BASE_URL` 或 `DASHSCOPE_COMPAT_BASE_URL` | DashScope 兼容根路径 | 可选，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`。 |

新增模型 id 时须**同时**更新前端 `INFERENCE_MODELS` 与 `_shared/modelRegistry.js`，否则未知 id 会回退为 `research-baseline`。

### 在腾讯云控制台填写密钥（你手上有 Key 时按此做）

1. 打开 [云开发控制台](https://console.cloud.tencent.com/tcb)，选中你的环境。
2. 左侧进入 **云函数**，依次打开 **`geo-inference`** 与 **`submit-battle-round`**（两个函数都要配，对战回合与单题推理都会调路由）。
3. 进入函数 **函数配置** → **环境变量**（或「高级配置」里的环境变量），**新增**下表中的变量，值为各平台控制台复制的密钥（**不要**加引号；不要提交到 Git 或写进 `NEXT_PUBLIC_*`）。
4. 保存后对该函数执行一次 **部署/上传**（或「保存并安装依赖」），确保最新代码与变量一并生效。本地修改过 `_shared` 时先在仓库根目录执行 **`npm run cloudfunctions:sync-shared`**，再 **`tcb fn deploy geo-inference submit-battle-round`**（或控制台上传对应目录 ZIP）。

| 你文档里的用途 | 在云函数里填的变量名 | 说明 |
|----------------|----------------------|------|
| DeepSeek 识图 | `DEEPSEEK_API_KEY` | 可选：`DEEPSEEK_BASE_URL`（默认官方 v1） |
| 智谱 识图 | `ZHIPU_API_KEY` | 可选：`ZHIPU_BASE_URL` |
| Kimi 识图 | `MOONSHOT_API_KEY` 或 `KIMI_API_KEY` | 可选：`MOONSHOT_BASE_URL` |
| 通义 Qwen 识图 | `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` | 可选：`QWEN_BASE_URL` |

5. 前端仅需能连 CloudBase（`.env.local` / Vercel 里的 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`）；**无需**把上述 Key 配进 Next.js。

若密钥曾出现在截图、聊天或文档中，请到 **DeepSeek / 智谱 / 月之暗面 / 阿里云** 控制台 **作废并重新生成**，只把新 Key 配进云函数。

---

## 七、自检清单

- [ ] 已在腾讯云开通云开发并创建环境  
- [ ] 已复制并保存「环境 ID」  
- [ ] 已创建集合 `Questions` 和 `Submissions`  
- [ ] `cloudbaserc.json` 中列出的云函数均已部署（CLI 或控制台 ZIP）  
- [ ] `.env.local` 中已配置 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`  
- [ ] 前端托管（如 Vercel）已配置 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`（及构建需要时的 `DATABASE_URL`、`DIRECT_URL`）并已 Redeploy  
- [ ] 在管理后台上传一道题目后，玩家端能随机拉题并提交  

完成以上步骤后，GeoAnnotate 即可使用 CloudBase 正常运行。
