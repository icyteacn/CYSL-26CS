# 08 · Vercel Serverless + Vercel KV (Upstash Redis)

## 定位
若前端将来搬到 Vercel 托管，顺手用其 KV/Edge Config 做状态存储；
或单独当 API 用。**前提：有自有域名**（vercel.app 域名国内被墙）。

## 免费额度 / 价格
- Serverless Functions：125,000 次/月
- Vercel KV (Upstash)：30,000 命令/月、256MB 免费
- 费用：**¥0**

## 国内可达性：⚠️ `*.vercel.app` 被墙；绑自有域名 + 其国内边缘节点后可通。

## 启用步骤
```bash
npm i -g vercel
cd 08-vercel-kv && vercel deploy
# Vercel 控制台 → Storage → Create KV → 连接到项目（自动注入 KV_REST_API_*）
# 设环境变量 WRITE_TOKEN
```
绑自有域名：Vercel → Domains → 加 `api.你的域名` → DNS CNAME 到 `cname.vercel-dns.com`。

## 文件
- `api/state.js` — Serverless Function，GET 读 / PUT 写（X-Write-Token）
- `vercel.json` — 路由声明

## 接入（同 worker 形态）
```js
Cloud.configure('worker', { base:'https://api.你的域名', token });
```
```java
CloudSync.Config c = CloudSync.worker("https://api.你的域名", token);
```

## 优缺点
- ✅ 与前端托管一体化、KV 快
- ⚠️ 必须有自有域名才适合国内；KV 月命令数免费档不算宽裕
