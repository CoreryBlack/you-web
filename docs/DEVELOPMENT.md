# 开发文档

本文档面向开发者，包含本地开发、调试与扩展后端路由的指引。

## 依赖与环境
- Node.js（建议 v18+）
- 项目依赖在 `package.json` 中声明，执行 `npm install` 安装。

## 本地运行（开发流程）
1. 安装依赖：

```bash
npm install
```

2. 在一个终端启动后端 mock API：

```bash
npm run serve:api
```

后端监听默认端口 `8080`，可通过 `PORT` 环境变量覆盖。

3. 在另一个终端启动前端开发服务器：

```bash
npm run dev
```

前端默认端口 `5173`，并在 `vite.config.ts` 中将 `/api` 请求代理到 `http://localhost:8080`。

## 后端结构与扩展
- `server/index.js`：应用入口，配置了 CORS、鉴权中间件并注册 `server/routes/` 下的路由模块。
- `server/data.js`：内存数据存储（示例数据），用于快速开发与调试。注意：数据不持久化。
- `server/lib/token.js`：JWT 签发/验证/撤销逻辑。默认 `JWT_SECRET` 可由环境变量 `JWT_SECRET` 覆盖。

添加新路由模块步骤：
1. 在 `server/routes/` 下创建新文件，例如 `reports.js`。
2. 导出一个 Express Router：

```javascript
const express = require('express')
const router = express.Router()

router.get('/summary', (req, res) => {
  res.json({ ok: true })
})

module.exports = router
```

3. 在 `server/index.js` 中注册：

```javascript
const reportsRoutes = require('./routes/reports')
app.use('/api/reports', reportsRoutes)
```

鉴权注意事项：
- `server/index.js` 在 `app.use('/api', ...)` 中添加了鉴权中间件。默认放行 `staff/login` 与 `staff/register` 路由，其他 `/api` 下的路由需要在请求头中包含 `Authorization: Bearer <token>`。
- token 验证逻辑位于 `server/lib/token.js`，若需要支持持久化的撤销/黑名单，请替换内存逻辑或集成 Redis。

## 前端开发提示
- API 请求定位在 `src/services/api.ts`（使用 Axios）。在调用接口时，默认会发送 `Authorization` 头（若已登录）。
- 使用 Pinia 管理状态，切分模块以保持 store 小而专注。
- 组件库：Element Plus。样式入口：`src/styles.css`。

## 构建与预览
- 构建命令：

```bash
npm run build
```

- 本地预览构建产物：

```bash
npm run preview
```

如果要将前端静态文件部署到后端，请在构建后把 `dist/` 内容放入后端静态路径，或让后端托管静态目录（非本项目内置）。

## 调试与常见问题
- CORS/代理：开发时请确保 Vite 的代理目标（`vite.config.ts`）与后端端口一致；生产环境通常移除代理。
- JWT 密钥：不要在仓库中提交生产密钥，请使用环境变量或密钥管理服务。
- 数据不持久：`server/data.js` 为内存数据，重启后丢失。对测试数据有要求时，请引入文件或 DB。

## 希望我帮忙的下一步示例
- 生成完整的 API 文档（列出每条路由、HTTP 方法、请求与响应示例）。
- 用 Swagger/OpenAPI 描述后端并生成客户端类型定义。
- 将后端替换为 sqlite 实现持久化并加入基本迁移脚本。
