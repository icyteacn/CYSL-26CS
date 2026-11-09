# 12 · Gitee 仓库存储 —— 01 的国内版

## 定位
与方案 01 同一套路，但用 **Gitee**（国内 GitHub）。国内直连免梯子，
适合「不想要任何新服务、只要支委能写、全员能读」的场景。

## 免费额度 / 价格
- 公开仓免费，私有仓免费
- API 调用限额：5000 次/天（够用）
- 费用：**¥0**

## 国内可达性：✅ gitee.com 国内直连。

## 启用步骤
1. gitee.com → 建仓 `cysl-state`（公开或私有）
2. 建 `data/state.json` 文件（内容 `{}`）
3. 我的 → 私人令牌 → 生成 `projects` 权限 token（写用，支委持）
4. 读：公开仓 `raw` 链接无需 token；私有仓加 `?access_token=`（只读 token 给成员）

## 接入
```js
Cloud.configure('gitee', {
  owner:'你的gitee用户名', repo:'cysl-state', branch:'master',
  path:'data/state.json', token: localStorage.cysl_token });
```
```java
CloudSync.Config c = CloudSync.gitee("owner","cysl-state","master",
    "data/state.json","token");
```

## 优缺点
- ✅ 国内免梯子、零成本、版本历史自带
- ⚠️ 公开仓数据裸奔（脱敏数据无所谓；敏感数据上私有仓+只读token）
- ⚠️ Gitee 有审核机制，个别被误判的仓库可能临时限制 raw 访问（低概率）
