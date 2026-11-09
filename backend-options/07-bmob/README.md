# 07 · Bmob 后端云（国内备选）

## 定位
与 LeanCloud 同类的国内 BaaS，REST API 极简。作为 06 的备选。

## 免费额度 / 价格
- 免费版：API 调用 10 万次/月、存储 500MB、流量 1GB/月（具体以官网为准）
- 超出转付费约 ¥30/月起
- 费用：**¥0**（免费版，额度较紧但单文档同步够用）

## 国内可达性：✅ api2.bmob.cn 国内直连。

## 启用步骤
1. bmob.cn → 注册 → 创建应用 → 拿 `Application ID` / `REST API Key`
2. 数据管理 → 建表 `State`，字段 `doc`(Object)，手动加一条记录记 `objectId`
3. 表权限：读开放；写建议用 MasterKey（安全中心）代替 restKey，仅支委持有

## 接入
```js
Cloud.configure('bmob', { appId:'xxx', restKey:'xxx', objectId:'xxx' });
```
```java
CloudSync.Config c = CloudSync.bmob("appId","restKey","objectId");
```

## 优缺点
- ✅ 国内直达、上手快、有小程序/Android SDK
- ⚠️ 免费额度比 LeanCloud 紧；公司规模小，长期稳定性不如大厂方案
