# 项目结构说明（README 精简版）

## 项目结构概览

本项目当前采用 **Next.js 前端 + CloudBase 云函数后端 + PostgreSQL/Prisma 数据层** 的结构。

整体上可以分为 4 类：

1. 前端页面与交互
2. 后端云函数与数据库逻辑
3. 前后端连接层
4. 配置与共享模块

## 1. 前端

前端主要负责页面展示、用户交互、标注绘制、地图展示、登录注册、管理后台界面以及 Wiki 页面壳。

主要目录：

- `app/`
- `components/`
- `app/globals.css`
- `tailwind.config.ts`
- `next.config.js`

其中：

- `app/(main)/`：核心应用页面的实际实现
- `app/(auth)/`：登录、注册、找回密码页面的实际实现
- `app/admin/`：管理后台页面
- `app/(main)/wiki/`：Wiki 页面
- `app/app/`、`app/auth/`：新的路由映射层

如果要改前端界面，通常优先改：

- `app/(main)/...`
- `app/(auth)/...`
- `components/...`

## 2. 后端

后端当前主要由 **CloudBase 云函数** 承担，而不是传统的 Next.js API Route。

主要目录：

- `cloudfunctions/`
- `prisma/`

后端负责：

- 任务分发
- 标注提交
- AI 对战创建与结算
- 用户资料读取
- 积分、奖励、排行榜
- 数据库存取

如果要改业务逻辑或接口处理，通常改：

- `cloudfunctions/...`
- `prisma/schema.prisma`

## 3. 前后端连接层

前端和后端之间的桥梁主要是：

- `lib/cloudbase.ts`

它的作用是：

- 前端页面调用这里的方法
- 这里统一去调用 CloudBase 云函数
- 统一封装接口参数和返回结构

如果后端接口字段变了，通常要同时修改：

- `cloudfunctions/...`
- `lib/cloudbase.ts`

## 4. 配置与共享模块

主要目录/文件：

- `features/`
- `types/`
- `lib/modes.ts`
- `package.json`
- `tsconfig.json`

它们主要负责：

- 模式配置
- 对战配置
- 管理后台导航配置
- 共享类型
- 工程配置

## 常见修改位置

### 改前端页面

- `app/(main)/home/page.tsx`
- `app/(main)/annotate/page.tsx`
- `app/(main)/annotate/mode/page.tsx`
- `app/(main)/battle/page.tsx`
- `app/(main)/battle/[sessionId]/play/page.tsx`
- `app/(main)/battle/[sessionId]/result/page.tsx`
- `app/admin/...`

### 改导航和整体布局

- `components/layout/Navbar.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/MainRouteShell.tsx`

### 改样式

- `app/globals.css`
- `tailwind.config.ts`

### 改接口调用

- `lib/cloudbase.ts`

### 改后端逻辑

- `cloudfunctions/...`

### 改数据库结构

- `prisma/schema.prisma`

## 一句话总结

- `app/ + components/`：前端
- `cloudfunctions/ + prisma/`：后端
- `lib/cloudbase.ts`：前后端连接层
- `features/ + types/ + 配置文件`：共享配置与项目框架
