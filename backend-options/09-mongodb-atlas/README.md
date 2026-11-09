# 09 · MongoDB Atlas + App Services（Functions）

## 定位
真 MongoDB 文档库，Atlas 免费 M0 集群 512MB。
> ⚠️ **注意**：Atlas Data API 已于 2024 年宣布弃用（2025-09-30 起停用）。
> 现在要用 HTTP 访问需开 **App Services 的 HTTPS Endpoint**（自定义函数），
> 或者 Atlas SQL/驱动 + 自建中转。写函数示例见 `function.js`。

## 免费额度 / 价格
- M0 集群 512MB、每月 5GB 出站流量 免费（永久免费档）
- App Services（原 Realm）HTTPS endpoint 调用含在免费档内
- 费用：**¥0**

## 国内可达性：⚠️ `*.mongodb.net` 国内不稳，多数需代理。

## 启用步骤
1. cloud.mongodb.com → 建 M0 集群（区域选新加坡延迟低）
2. App Services → Create App → 绑定集群
3. HTTPS Endpoints → New Endpoint → 回调指到 `function.js` 代码（粘贴进编辑器）
4. Authentication → 开 API Key 登录，生成 key（写操作用；读可匿名开）

## 接入
App Services endpoint URL 形如 `https://.../app/xxx/endpoint/state`——
它不是标准 REST 表，走自定义函数，见 `function.js`。接入沿用 worker 形态：
```js
Cloud.configure('worker', { base:'https://你的endpoint前缀', token });
```

## 优缺点
- ✅ 真文档库，将来想存附件/复杂查询可扩展
- ⚠️ Data API 弃用后接入变绕（必须写 App Services 函数）；国内不稳
