# 01 · GitHub Contents API（扩展现有 feed 模式）

## 定位
现在 feed.json 已是「只读 API」，本方案给它补上**写通道**：支委 token 通过
GitHub API 直接提交文件，全端 pull 时即生效。**零新服务、零成本，改动最小**。

## 免费额度 / 价格
- 公开仓无限读写；API 限额 5000 次/小时（认证用户）——支部用量远低于此
- 私有仓同样免费；费用：**¥0**

## 国内可达性
⚠️ github.com / api.github.com 国内不稳定（本项目已实测间歇性阻断）。
对策：支委写操作时走代理；成员拉取走 **jsdelivr CDN**（国内可通）：
`https://cdn.jsdelivr.net/gh/OWNER/REPO@main/data/state.json`
注意 jsdelivr 有缓存延迟（数分钟～数小时），急用可 `@` 带 commit hash。

## 启用步骤
1. GitHub → Settings → Developer settings → Personal access tokens (classic)
   生成 token，勾 `repo`（或 fine-grained 只给该仓 `Contents: Read and write`）
2. 在仓里建 `data/state.json`（首次可为 `{}`）
3. token 只给支委：网站设置页/App 设置页粘贴一次存 localStorage/SP

## 接入
**网站**（shared/cloud-sync.js）：
```js
Cloud.configure('github', {
  owner:'icyteacn', repo:'CYSL-26CS', branch:'main',
  path:'data/state.json',
  token: localStorage.cysl_token   // 支委粘贴后存入
});
// 成员只读（无 token 也建议指 CDN）：
cfg.read.url = 'https://cdn.jsdelivr.net/gh/icyteacn/CYSL-26CS@main/data/state.json';
```
**App**（shared/CloudSync.java）：
```java
CloudSync.Config c = CloudSync.github("icyteacn","CYSL-26CS","main",
    "data/state.json", token);
JSONObject remote = CloudSync.pull(c);   // IO 线程
CloudSync.push(c, backupJson);           // 支委 gate 通过后
```

## 优缺点
- ✅ 零成本、版本历史免费（每次 push 都是一个 commit，天然审计/回滚）
- ✅ 和现有「feed.json 下发」同一套路，心智零负担
- ⚠️ 支委写需要代理环境；token 泄露 = 仓库可写（用 fine-grained 降权）
- ⚠️ 不适合高频写（每次写 = 一个 commit），按「会后推一次」节奏正好

## 适用场景
支委 1-2 人写、全支部读——和现状完全吻合，**推荐第一站**。
