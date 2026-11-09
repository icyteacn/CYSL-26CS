# 13 · Deno Deploy + Deno KV

## 定位
Deno Deploy 自带 Deno KV（全局分布的 KV 存储），比 CF KV 还省事——
代码里 `Deno.openKv()` 直接用，不用建命名空间。

## 免费额度 / 价格
- Deno Deploy Free：100 万请求/月、100GB 带宽
- Deno KV：450MB 存储、每天读 450KB / 写 45KB 内免费（单文档同步远低于此）
- 费用：**¥0**

## 国内可达性：✅ `*.deno.dev` 多数地区可直连；也可用 deno.com 自定义域名。

## 启用步骤
```bash
# 本地装 deno（或用 GitHub Action 部署）
deno --version
cd 13-deno-kv
deno deploy                       # 或 deployctl
# 第一次会建项目，拿 https://xxx.deno.dev
# 项目环境变量 WRITE_TOKEN=支委口令
```

## 文件
- `main.ts` — GET/PUT /state（X-Write-Token），与 worker 形态同 API

## 接入
```js
Cloud.configure('worker', { base:'https://xxx.deno.dev', token });
```
```java
CloudSync.Config c = CloudSync.worker("https://xxx.deno.dev", token);
```

## 优缺点
- ✅ 免建 KV 命名空间、代码最短、国内多数可达
- ⚠️ Deno KV 免费档写配额偏低（45KB/天），但单文档同步绰绰有余
