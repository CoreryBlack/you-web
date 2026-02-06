# You-Web 管理后台

> 简易加油站管理后台（前端基于 Vue 3 + Vite；后端为轻量 Express mock API）。

## 项目概览
- 前端：Vue 3、Pinia、Vue Router、Element Plus。主入口：[src/main.ts](src/main.ts)
- 后端（开发用）：Express + 内存 Mock 数据，位于 `server/`，用于本地开发与接口模拟。

## 快速开始
先安装依赖：

```bash
npm install
```

在开发中通常需要同时启动前端与后端（两个终端）：

前端（Vite 开发服务器，默认端口 5173）：

```bash
npm run dev
```

后端（Express mock API，默认端口 8080）：

```bash
npm run serve:api
```

Vite 开发服务器已在 `vite.config.ts` 中配置了 `/api` 代理，开发时会将 `/api` 请求转发到 `http://localhost:8080`，避免浏览器 CORS 问题。

## 可用脚本
- `npm run dev`：启动前端开发服务器（Vite）。
- `npm run build`：构建前端生产包。
- `npm run preview`：预览构建后的静态站点。
- `npm run lint`：运行 ESLint（`src` 下 `.ts` / `.vue` 文件）。
- `npm run serve:api`：启动本地 Express mock API（`server/index.js`）。

## 环境变量
- `PORT`：后端服务器端口，默认 `8080`。
- `JWT_SECRET`：用于签发/验证 JWT 的密钥，默认在 `server/lib/token.js` 中为 `you-uni-app-secret-key-2024`（请在生产中覆盖）。

示例（Windows Powershell）：

```powershell
$env:JWT_SECRET = 'your-production-secret'
$env:PORT = '8080'
npm run serve:api
```

## 后端与鉴权说明
- 后端为示例/开发用，使用 `server/data.js` 中的内存数据存储（非持久化）。
- JWT 签发与验证在 `server/lib/token.js`，默认过期时间 `24h`。为支持撤销，当前实现会把 token 存回对应用户对象（内存），并在验证时比对。
- 路由注册位于 `server/index.js`，路由目录为 `server/routes/`。

## 目录概览
- `src/`：前端源代码
  - `pages/`：各页面视图（如 `Login.vue`、`Users.vue` 等）
  - `router/`：路由配置
  - `services/api.ts`：前端 API 请求封装（Axios）
  - `stores/`：Pinia 状态管理
- `server/`：开发用 mock API
  - `routes/`：各模块路由
  - `lib/token.js`：JWT 帮助函数
  - `data.js`：内存数据
- `docs/`：项目文档（本仓库新增 `DEVELOPMENT.md`）

## 开发建议
- 本项目以 TypeScript + Vue 3 编写，建议使用 VS Code 并安装 Vetur / Volar、ESLint 插件以获得更好体验。
- 如果需要对后端做更真实的模拟，可替换内存 `data.js` 为 JSON 文件或 sqlite 以便持久化测试数据。

## 贡献与发布
- 本仓库为内部/示例项目。若要发布到线上，请：
  1. 替换或外部化 `JWT_SECRET`；
  2. 将后端改为持久化存储并添加生产级别错误处理与日志；
  3. 使用 CI 构建并将前端静态文件部署到 CDN 或由后端静态托管。

---
如需我把 README 翻译为英文，或补充 API 文档（列出所有路由与示例请求），告诉我即可。
