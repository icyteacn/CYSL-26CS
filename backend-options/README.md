# 智团慧建 · 后端方案备选库（12 套）

> 用途：把 App/网站从「单设备纯前端」升级为「多设备共享数据」的备选后端。
> **全部方案均未启用**，代码与配置已预写好，需要哪套就按对应文件夹 README 配置。
> 启用任意方案都不影响现有纯前端功能——`shared/` 里的适配器按「缺省即关闭」设计。

## 数据模型共识（所有方案统一）

现有两端数据是一个 JSON 文档：
- 网站 `localStorage` 的 `DB` = `{members, records, volunteers, projects, honors}`
- App `Backup.bundle()` 导出同构 JSON
- 官方 feed 走 `data/feed.json`（支委写、全员读），已经是只读 API

所以后端抽象 = **一个 JSON 文档的读/写**：
- `pull()` → GET 返回 JSON 全量
- `push()` → PUT/POST JSON 全量（仅支委口令用户）
- 冲突策略：先简单「最后写入覆盖全量」；要精细合并用 App 现有「标题+日期去重合并」逻辑在客户端做

`shared/cloud-sync.js`（网站）与 `shared/CloudSync.java`（App）是这个抽象的通用实现，
大部分方案只改 `endpoint` 和 `headers` 即可复用。

## 方案速查表

| # | 方案 | 免费额度 | 国内可达性 | 启用难度 | 适合 |
|---|------|---------|-----------|---------|------|
| 01 | GitHub Contents API（扩展现有 feed） | 无限（公开仓） | ⚠️ 需代理/不稳定 | ★ 最低 | **首选·零新基建** |
| 02 | Cloudflare Workers + KV | 10万次/天 请求 | ✅ workers.dev 多数可通 | ★★ | 轻量 KV 首选 |
| 03 | Cloudflare Workers + D1(SQLite) | 500万行读/天 | ✅ | ★★★ | 想要真 SQL |
| 04 | Supabase (Postgres+REST) | 500MB DB | ⚠️ 不稳，可能要代理 | ★★ | 未来要权限/实时 |
| 05 | Firebase Realtime DB | 1GB+10GB/月流量 | ❌ 被墙 | ★★ | 有代理环境时 |
| 06 | LeanCloud 华北节点 | 开发版免费 | ✅ 国内直达 | ★★ | **国内免梯子首选** |
| 07 | Bmob 后端云 | 免费版额度有限 | ✅ 国内 | ★★ | 国内备选 |
| 08 | Vercel + Vercel KV | hobby 免费 | ⚠️ vercel.app 被墙需自有域名 | ★★ | 已有域名时 |
| 09 | MongoDB Atlas + App Services | 512MB | ⚠️ 不稳 | ★★★ | 想要 NoSQL |
| 10 | PocketBase + Oracle 永久免费 VPS | 永久免费主机 | ✅ 自建可达 | ★★★★ | **真后端·全功能** |
| 11 | Appwrite Cloud | 免费档 | ⚠️ 不稳 | ★★★ | 想要 BaaS 全家桶 |
| 12 | Gitee 仓库存储 | 无限（国内 GitHub） | ✅ 国内直达 | ★ | **01 的国内版** |
| 13 | Deno Deploy + Deno KV | 免费档 | ✅ 多数可通 | ★★ | 极简 KV 备选 |

## 推荐路线（务实版）

1. **第一步（现在就够用）**：`01-github-api` 或 `12-gitee`——只给支委一个 token，
   「编辑官方数据/推送留痕」直接写回仓库文件，零成本零新服务。
2. **第二步（要全员多设备同步个人留痕）**：`06-leancloud`（国内免梯子）
   或 `02-cloudflare-kv`。
3. **第三步（真要做账号体系/权限/审计）**：`10-pocketbase-vps`，
   Oracle 永久免费主机 + 单文件后端，导出 SQLite 随时可搬走，不被厂商锁死。

## 通用安全红线（所有方案通用）

- **写权限 token 绝不进网站公开 JS / 不进 git**。支委在自己浏览器/App 里粘贴一次，
  存 localStorage/SP，页面刷新不丢但不进代码。
- 成员侧永远只读：只读 endpoint 公开，写 endpoint + token 只有支委知道。
- 沿用现有口令门：写操作按钮先过 `Identity.gate`（App）/ `canEdit`（网站），
  再调 `push()`——「谁能写」不变，只是数据落点从本地换到云端。
- 任何方案启用前先 `导出 JSON 备份`，云端再写也不动本地副本，随时可回退纯前端。
- 价格均为截至编写时的免费档概况，**以各官网当时页面为准**。
