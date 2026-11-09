# 05 · Firebase Realtime Database

## 定位
Google BaaS 经典方案：RTDB 本身就是「一个 JSON 树」，与我们的数据模型天然一致。
**但 google.com 系域名国内被墙**，仅适合全员有代理环境时用，否则跳过。

## 免费额度 / 价格（Spark 计划）
- RTDB：1GB 存储、10GB/月下载流量、100 并发连接
- Firestore 另有额度（本方案用 RTDB 更贴合单文档模型）
- 费用：**¥0**

## 国内可达性：❌ `*.firebaseio.com` 国内不可直连，须代理。

## 启用步骤
1. console.firebase.google.com → 建项目 → Realtime Database → 选区域
   （新加坡 `asia-southeast1` 延迟最低）
2. 规则（最小安全：公开读、认证写）：
   ```json
   { "rules": { "state": { ".read": true, ".write": "auth != null" } } }
   ```
   写入走 legacy Database Secret：`?auth=DATABASE_SECRET`
   （项目设置 → Service accounts → Database secrets 生成；secret 会使 auth 非空并放行写）。
   ⚠️ 不要用 `newData.child('某字段') === '口令'` 这类"写体藏口令"规则——我们的写体是整库 JSON，
   没有预留口令字段，规则会恒拒写。
3. 接入（写入 URL 带 `?auth=`）：
   ```js
   Cloud.configure('firebase', { url:'https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app', token:'DATABASE_SECRET' });
   ```
   ```java
   CloudSync.Config c = CloudSync.firebase("https://xxx...firebasedatabase.app", "SECRET");
   ```

## 优缺点
- ✅ 天然 JSON 树、SDK 成熟、可升级实时订阅
- ❌ 国内不可达是硬伤；规则语法有学习成本
