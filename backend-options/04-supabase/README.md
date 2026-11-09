# 04 · Supabase（Postgres + 自动 REST API）

## 定位
开箱即用的 Postgres + PostgREST + Auth + Realtime。想要**真数据库、行级权限、
未来接成员登录**时选它。免费档对单支部完全够。

## 免费额度 / 价格
- Postgres 500MB，5GB 带宽/月，Realtime 200 并发，Auth 5万 MAU 免费
- 项目闲置 7 天暂停（发请求即唤醒，或用 GitHub Action 每 3 天 ping 一次保活）
- 费用：**¥0**；超档 Pro $25/月（用不到）

## 国内可达性
⚠️ supabase.co 国内不稳定，部分地区需代理。若全支部都要直连，选 06 LeanCloud。

## 启用步骤
1. supabase.com → New project → 拿 `URL` 与 `anon public key`
2. SQL Editor 里跑 `schema.sql`（建 state 表 + 行级安全：读开放、写需 service key）
3. 写操作改用 `service_role` key（**只给支委**，绝不可进公开 JS；或改走 05 类
   Edge Function/Worker 代理写，把 service key 藏后端）

## 接入
```js
Cloud.configure('supabase', { url:'https://xxx.supabase.co', anonKey:'eyJ...' });
```
```java
CloudSync.Config c = CloudSync.supabase("https://xxx.supabase.co", anonKey);
```
> 用 anonKey 只能读；写时请用 `service_role` key 替换（仅支委侧配置）。

## 文件
- `schema.sql` — state 表 + RLS 策略 + 触发器自动维护 updated_at

## 优缺点
- ✅ 真 Postgres，将来要分表/权限/订阅推送都接得住
- ⚠️ 国内可达性一般；RLS 配错会拒绝写（按 schema.sql 建即可）
