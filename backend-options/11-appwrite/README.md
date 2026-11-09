# 11 · Appwrite Cloud

## 定位
开源 BaaS 全家桶（Auth/DB/Storage/Functions）的托管版。
想要比 Supabase 更「交钥匙」的账号+数据库体验时用。

## 免费额度 / 价格
- Free 档：75,000 次请求/月、10GB 带宽、1 个项目 + 基础额度
- Pro $15/月起（用不到）
- 费用：**¥0**

## 国内可达性：⚠️ `cloud.appwrite.io` 国内不稳，可能需代理。

## 启用步骤
1. cloud.appwrite.io → 建项目 → 拿 `Endpoint` + `Project ID`
2. Databases → 建 database（记 `dbId`）→ 建 collection `State`（记 `colId`）
   → 加 attribute `doc`(String/JSON 类型)
3. Settings → API Keys → 生成 Server Key（写权限，仅支委持有）
4. 手动或脚本插入一条 `_id='state'` 的文档
5. 权限：collection 设 `read("any")`；写只允许 key

## 接入
```js
Cloud.configure('appwrite', {
  url:'https://cloud.appwrite.io/v1', project:'xxx', apiKey:'xxx',
  dbId:'xxx', colId:'xxx' });
```
```java
CloudSync.Config c = CloudSync.appwrite(
    "https://cloud.appwrite.io/v1","project","apiKey","dbId","colId");
```

## 优缺点
- ✅ 全家桶齐全（Auth/存储/函数），将来扩展空间大
- ⚠️ 免费档请求数较紧（7.5万/月，支部同步场景一般够）；国内不稳
