# GeoAnnotate 项目结构详细说明

## 1. 项目当前整体架构

当前项目不是传统意义上的“纯前后端分仓”，而是一个 **单仓库混合结构**：

- 浏览器端页面与交互使用 Next.js
- 服务端逻辑主要使用 CloudBase 云函数
- 数据结构和数据库模式由 Prisma 管理

从职责上看，可以拆成四层：

1. 前端层
2. 后端层
3. 前后端连接层
4. 共享配置层

---

## 2. 前端层

前端层主要负责：

- 页面展示
- 用户交互
- 标注框绘制
- 地图展示
- 登录与注册
- 管理后台页面
- Wiki 页面壳与导航

### 2.1 主要目录

- `app/`
- `components/`
- `app/globals.css`
- `tailwind.config.ts`
- `next.config.js`

### 2.2 页面路由结构

#### 根页面

- `app/page.tsx`
  - 项目落地页
  - 用于区分 `/wiki` 和 `/app`

#### 核心应用页面

- `app/(main)/`
  - 核心平台页面的主要实现位置
  - 包含首页、标注、对战、历史、积分、奖励、排行榜、用户中心、Wiki

#### 认证页面

- `app/(auth)/`
  - 登录页
  - 注册页
  - 找回密码页

#### 管理后台

- `app/admin/`
  - 管理端页面
  - 包含图片管理、审核、奖励、导出等

#### 新路由分区

- `app/app/`
- `app/auth/`

这两个目录更多是**新的 URL 入口层**，很多文件只是转发到原有页面实现。

也就是说：

- 用户访问 `/app/home`
- 实际页面逻辑仍主要写在 `app/(main)/home/page.tsx`

所以后续真正要改页面内容，优先去改：

- `app/(main)/...`
- `app/(auth)/...`

### 2.3 前端组件目录

- `components/layout/`
  - 导航栏、整体页面壳、路由壳
- `components/annotation/`
  - 标注相关组件，如 BBox、思维输入等
- `components/map/`
  - 地图显示、位置显示、地图选择
- `components/battle/`
  - 对战计时器、计分板
- `components/wiki/`
  - Wiki 侧边栏、移动端导航
- `components/ui/`
  - 通用 UI 组件

### 2.4 前端常见修改位置

#### 改首页

- `app/page.tsx`
- `app/(main)/home/page.tsx`

#### 改标注相关界面

- `app/(main)/annotate/mode/page.tsx`
- `app/(main)/annotate/page.tsx`
- `components/annotation/BBoxCanvas.tsx`
- `components/annotation/ThoughtInput.tsx`
- `components/map/LocationMap.tsx`

#### 改 AI 对战界面

- `app/(main)/battle/page.tsx`
- `app/(main)/battle/[sessionId]/play/page.tsx`
- `app/(main)/battle/[sessionId]/result/page.tsx`
- `components/battle/CountdownTimer.tsx`
- `components/battle/BattleScoreBoard.tsx`

#### 改管理后台界面

- `app/admin/...`

#### 改导航和整体框架

- `components/layout/Navbar.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/MainRouteShell.tsx`
- `app/admin/layout.tsx`
- `app/(main)/wiki/layout.tsx`

#### 改整体样式

- `app/globals.css`
- `tailwind.config.ts`

---

## 3. 后端层

当前项目的后端不是独立 NestJS / FastAPI 服务，而是以 **CloudBase 云函数** 作为主要后端执行层。

### 3.1 主要目录

- `cloudfunctions/`
- `prisma/`

### 3.2 后端负责的内容

- 任务分发
- 标注提交
- 用户信息读取
- AI 对战创建
- AI 对战结果读取
- 奖励与积分逻辑
- 排行榜与历史数据读取
- 管理后台数据处理

### 3.3 云函数目录说明

#### 标注相关

- `cloudfunctions/get-next-task/`
  - 获取下一条标注任务
- `cloudfunctions/submit-annotation/`
  - 提交标注内容

#### 对战相关

- `cloudfunctions/create-battle/`
  - 创建 AI 对战 session
- `cloudfunctions/submit-battle-round/`
  - 提交某一轮用户猜测
- `cloudfunctions/get-battle-result/`
  - 获取对战结果

#### 用户与积分

- `cloudfunctions/get-user-profile/`
- `cloudfunctions/get-user-history/`
- `cloudfunctions/get-points-history/`
- `cloudfunctions/get-leaderboard/`

#### 管理后台

- `cloudfunctions/list-images/`
- `cloudfunctions/delete-image/`
- `cloudfunctions/list-submissions/`
- `cloudfunctions/review-annotation/`
- `cloudfunctions/export-annotations/`
- `cloudfunctions/admin-create-prize/`
- `cloudfunctions/admin-update-prize/`
- `cloudfunctions/admin-delete-prize/`

### 3.4 数据库层

数据库结构主要在：

- `prisma/schema.prisma`

这里定义了用户、图片、标注记录、标注框、对战、积分、奖励等表结构。

如果要改数据库结构，优先改：

- `prisma/schema.prisma`

如果改了字段，通常还要同步改：

- 对应云函数
- `lib/cloudbase.ts`
- 相关前端页面

---

## 4. 前后端连接层

前端和后端之间并不是页面直接访问数据库，而是通过统一的调用层转发到云函数。

这个连接层最重要的文件是：

- `lib/cloudbase.ts`

### 4.1 它的作用

- 封装 CloudBase SDK 初始化
- 封装登录、注册、找回密码
- 封装云函数调用
- 给前端页面提供统一的方法名

例如：

- 前端标注页调用 `submitAnnotation()`
- `submitAnnotation()` 内部再调用云函数 `submit-annotation`

### 4.2 什么时候需要改它

如果你做了以下事情，通常就要改 `lib/cloudbase.ts`：

- 后端新增了云函数
- 后端改了参数结构
- 后端改了返回字段
- 前端需要新的接口封装

---

## 5. 配置与共享层

这部分不直接属于前端界面，也不属于后端业务逻辑，但它决定了项目的整体骨架。

### 5.1 主要目录和文件

- `features/`
- `types/`
- `lib/modes.ts`
- `package.json`
- `tsconfig.json`
- `next.config.js`

### 5.2 各部分作用

#### `features/annotation/`

用于管理标注模式、标注类型等配置。

#### `features/battle/`

用于管理对战模式、AI 对手、回合数、时间等配置。

#### `features/admin/`

用于管理后台导航和结构配置。

#### `features/platform/`

用于平台入口与路由结构说明。

#### `types/`

用于放共享类型定义。

#### `lib/modes.ts`

用于统一导出模式相关配置，供页面和组件复用。

---

## 6. 如何判断一个文件该归到哪里

可以用下面的方法快速判断：

### 属于前端的文件

如果它主要负责：

- 渲染页面
- 处理点击、输入、交互
- 显示地图
- 显示组件
- 控制布局

那它基本属于前端。

典型位置：

- `app/`
- `components/`

### 属于后端的文件

如果它主要负责：

- 查数据库
- 写数据库
- 处理权限
- 计算积分
- 返回接口数据

那它基本属于后端。

典型位置：

- `cloudfunctions/`
- `prisma/`

### 属于连接层的文件

如果它主要负责：

- 调用云函数
- 封装接口请求
- 把前端参数转成后端参数

那它属于连接层。

典型位置：

- `lib/cloudbase.ts`

### 属于共享配置的文件

如果它主要负责：

- 存模式配置
- 存导航配置
- 存共享类型
- 存工程配置

那它属于共享配置层。

典型位置：

- `features/`
- `types/`
- `lib/modes.ts`

---

## 7. 后续维护时的建议

为了减少混乱，后续修改时可以遵循下面的规则：

1. 改页面样式和布局，优先改 `app/(main)` 和 `components`
2. 改接口调用方式，改 `lib/cloudbase.ts`
3. 改业务处理逻辑，改 `cloudfunctions`
4. 改数据库结构，改 `prisma/schema.prisma`
5. 改模式、导航、路由等全局规则，改 `features`

---

## 8. 一句话总结

当前项目可以简单理解为：

- `app/ + components/` = 前端
- `cloudfunctions/ + prisma/` = 后端
- `lib/cloudbase.ts` = 前后端连接层
- `features/ + types/ + 配置文件` = 项目框架与共享配置

如果后续要把说明同步到 GitHub README，建议将本文件压缩成简版，再把更详细的版本单独放在 `docs/` 中长期维护。
