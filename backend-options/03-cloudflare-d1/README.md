# 03 · Cloudflare Workers + D1（SQLite）

## 定位
与 02 同构但落到真 SQLite——想要**结构化表**（members/records 分表、
SQL 查询、事务）而非单 JSON 时用。复杂度略高，推荐需求升级后再上。

## 免费额度 / 价格
- Workers：同 02（10万请求/天）
- D1：500 万行读/天，10 万行写/天，5GB 存储 免费
- 费用：**¥0**

## 国内可达性：同 02（✅ 多数可通）

## 启用步骤
```bash
wrangler d1 create cysl                    # 记下 database_id
wrangler d1 execute cysl --file=schema.sql
# wrangler.toml 填 database_id；wrangler secret put WRITE_TOKEN
wrangler deploy
```
API 形状与 02 相同（`/state` GET/PUT），接入代码与 02 完全一致——
只是把存储从 KV 换成 D1，见 `worker.js`。

## 文件
- `schema.sql` — state 单文档表 + 可选 records 明细表
- `worker.js` — 与 02 同 API，背后写 D1
- `wrangler.toml`

## 适合
想把「留痕记录」做成可 SQL 统计查询的真表（例如按月份聚合、三件套完备率）
而不只是文档存取时。
