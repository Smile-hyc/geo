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

本项目有 4 个云函数：`getRandomQuestion`、`createQuestion`、`submitAnswer`、`listSubmissions`。

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

#### 3. 为每个云函数安装依赖

每个云函数目录下已有 `package.json`（含 `@cloudbase/node-sdk`），只需在各自目录执行一次 `npm install`，便于打包上传或 CLI 部署：

```bash
cd cloudfunctions/getRandomQuestion
npm install
cd ../createQuestion
npm install
cd ../submitAnswer
npm install
cd ../listSubmissions
npm install
cd ../..
```

（Windows 用户可在资源管理器中分别进入以上 4 个文件夹，在每个文件夹里打开终端执行 `npm install`。）

#### 4. 配置并部署

1. 在项目**根目录**用编辑器打开 `cloudbaserc.json`
2. 将第一行的 `"请替换为你的环境ID"` 改为你的**环境 ID**（第二步复制的），例如：
   ```json
   "envId": "geoannotate-1a2b3c4d",
   ```
3. 在项目**根目录**打开终端，执行：

```bash
tcb fn deploy
```

会按配置依次部署 4 个云函数。若只部署其中一个，可执行：

```bash
tcb fn deploy getRandomQuestion
tcb fn deploy createQuestion
tcb fn deploy submitAnswer
tcb fn deploy listSubmissions
```

部署成功会提示各函数部署完成。

---

### 方式 B：在控制台逐个创建并上传 ZIP

#### 1. 进入云函数列表

1. 打开 **https://console.cloud.tencent.com/tcb**
2. 左侧选 **「云函数」**（或「函数」）
3. 确认当前环境为你创建的环境

#### 2. 为每个函数准备 ZIP 包（含依赖）

以 `getRandomQuestion` 为例：

1. 在本地进入该函数目录并安装依赖（目录内已有 `package.json`）：
   ```bash
   cd cloudfunctions/getRandomQuestion
   npm install
   ```
2. 将该目录下**所有内容**（`index.js`、`package.json`、`node_modules` 等）打成 ZIP，且 **ZIP 解压后的根目录里就要有 `index.js`**（不要多包一层「getRandomQuestion」文件夹）。
3. 对 `createQuestion`、`submitAnswer`、`listSubmissions` 重复同样步骤：进入目录 → `npm install` → 打包该目录内容为一个 ZIP。

#### 3. 在控制台新建函数并上传

1. 点击 **「新建云函数」**
2. **函数名称** 填：`getRandomQuestion`（必须与上面 4 个名称完全一致）
3. **运行环境** 选：Node.js 16 或 18
4. 创建方式选 **「空白函数」** 或 **「本地上传」**
5. 在函数详情页选择 **「上传 ZIP 包」**，上传刚打的 ZIP
6. 点击 **「保存并安装依赖」**（若 ZIP 已含 node_modules 可只保存）
7. 对 `createQuestion`、`submitAnswer`、`listSubmissions` 重复新建并上传对应 ZIP

#### 4. 确认入口

云函数入口为 `index.main`，即根目录的 `index.js` 中的 `exports.main`，无需在控制台改（除非你改了文件名或导出）。

---

## 五、前端配置环境 ID

1. 在项目根目录复制环境变量示例：
   - Windows: `copy .env.example .env.local`
   - Mac/Linux: `cp .env.example .env.local`
2. 用编辑器打开 `.env.local`，填写：
   ```env
   NEXT_PUBLIC_CLOUDBASE_ENV_ID=你的环境ID
   ```
3. 保存后重启前端（`npm run dev`），前端会连到该环境的云函数与数据库。

---

## 六、云存储（可选，用于图片跨域）

若前端页面与图片域名不同（例如前端是 localhost，图片是云存储域名），画布导出可能因跨域被拦截。可在云开发控制台为**云存储**配置 CORS：

1. 进入 **云开发控制台 → 云存储**
2. 找到 **「跨域设置」** 或 **「CORS 配置」**
3. 添加规则：来源填你前端域名（如 `http://localhost:3000` 或线上域名），方法勾选 GET 等所需项，保存

---

## 七、自检清单

- [ ] 已在腾讯云开通云开发并创建环境  
- [ ] 已复制并保存「环境 ID」  
- [ ] 已创建集合 `Questions` 和 `Submissions`  
- [ ] 4 个云函数均已部署（CLI 或控制台 ZIP）  
- [ ] `.env.local` 中已配置 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`  
- [ ] 在管理后台上传一道题目后，玩家端能随机拉题并提交  

完成以上步骤后，GeoAnnotate 即可使用 CloudBase 正常运行。
