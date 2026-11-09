# 02 · Cloudflare Workers + KV

## 定位
Serverless KV，一个 Worker 提供 `GET/PUT /state`。免费额度对支部场景绰绰有余，
workers.dev 域名国内多数可通（如自绑域名更稳）。

## 免费额度 / 价格
- Workers：100,000 请求/天 免费
- KV：100,000 读/天，1,000 写/天，1GB 存储 免费
- 费用：**¥0**（超出后 $5/月起付套餐才计费）

## 国内可达性
✅ `*.workers.dev` 国内多数地区可直连；个别运营商抽风可绑自有域名彻底解决。

## 启用步骤
```bash
npm i -g wrangler
wrangler login
wrangler kv:namespace create STATE        # 记下返回的 id
cd 02-cloudflare-kv
# 编辑 wrangler.toml 填入 kv id
wrangler secret put WRITE_TOKEN           # 设置写口令（支委用）
wrangler deploy                            # 得到 https://xxx.workers.dev
```

## 接入
```js
Cloud.configure('worker', {
  base:'https://你的worker.workers.dev',
  token: localStorage.cysl_token           // = WRITE_TOKEN
});
```
```java
CloudSync.Config c = CloudSync.worker("https://你的worker.workers.dev", token);
```

## 文件
- `worker.js` — GET/PUT /state，PUT 校验 X-Write-Token
- `wrangler.toml` — KV 绑定模板

## 优缺点
- ✅ 国内免梯子概率最高、零运维、免费额度足
- ✅ 读写同一 endpoint，协议极简
- ⚠️ KV 是最终一致（写入后全球传播最长 60s），支部场景无感
