# 06 · LeanCloud（华北节点）—— 国内免梯子首选 BaaS

## 定位
国内老牌 BaaS，有**中国节点**（需 ICP 备案域名？不需要——用其共享域名即可），
成员无需梯子直连。免费开发版对单支部够用。

## 免费额度 / 价格
- 开发版：每天 3 万次 API 请求、1GB 存储、云函数 128MB 内存
- 商用版约 ¥90/月起（支部场景用不到）
- 费用：**¥0**（开发版）

## 国内可达性：✅ 国内节点直连，免梯子。

## 启用步骤
1. console.leancloud.cn（注意是 .cn 国际版选华北节点/或用 leancloud.app 中国版）
   → 创建应用 → 拿 `AppID` / `AppKey` / `MasterKey`
2. 数据 → 创建 Class `State`，加一条记录，字段 `doc`（Object/JSON），记下 `objectId`
3. Class 权限：「所有用户」读开；写用 MasterKey（仅支委持有）或建 ACL 白名单
4. 绑定域名（可选）：用平台给的 `xxx.lc-cn-n1-shared.com` 共享域名即可，无需备案

## 接入
```js
Cloud.configure('leancloud', { appId:'xxx', appKey:'xxx', objectId:'xxx' });
// 写时把 appKey 换成 masterKey（支委侧）：cfg.write.headers['X-LC-Key']=masterKey
```
```java
CloudSync.Config c = CloudSync.leancloud("appId","appKey","objectId");
// 写：用 masterKey 建第二个 config
```

## 优缺点
- ✅ 国内免梯子、SDK 全、文档中文、带 ACL/用户体系可升级
- ⚠️ 开发版有请求频率限制（并发低，支部场景无感）
- ⚠️ MasterKey 等同数据库全权限，只存支委设备
