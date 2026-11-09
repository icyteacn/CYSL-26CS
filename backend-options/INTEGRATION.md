# 启用时的接线指南（备选方案启用时照做）

> 01-github-api 已上线（v1.0.51）。本文说明「将来切换到其他方案时，挂钩点在哪」。

## 已上线架构（GitHub 方案，供对照）

**统一库 `data/state.json`**（canonical schema v1），App 与网页读写同一份：
- 网站 `assets/cloud-sync.js`（`Cloud` 对象）：pull/push/submit/review/setup，
  在 `index.html` 中先于 `app.js` 加载，启动时 `Cloud.pull(true)` 静默合并
- App `util/CloudSync.java`（HTTP 协议层）+ `util/CloudBundle.java`（Room↔canonical 转换）
  + `SystemFragment` 体系页「云端同步·GitHub」卡（拉取/推送/提交申请/审核申请/token）

**权限/审核**：拉取免配置；推送走支委 token 直写或编辑页兜底；成员「提交申请」写
`data/inbox/sub-*.json`（GitHub 自动 fork+PR）；支委「审核申请」并入+删除+回推。
token 存本机 SP/localStorage，不进代码。

## 切换到其他方案时的改动点

**网站端**：`assets/cloud-sync.js` 内的 `READ_URLS/API_URL/EDIT_URL/INBOX_*` 常量换成
新后端端点（`shared/cloud-sync.js` 的 preset 机制可直接复用——把 pull/push 内部实现
替换为 preset 的 req() 即可，submit/review 的 inbox 语义需在新后端上重建：
用一个 `inbox` 集合存申请，审核端读取+合并+删除）。

**App 端**：`SystemFragment.cloudCfg()` 一行换成目标方案的 `CloudSync.*()` 工厂
（`shared/CloudSync.java` 已含 gitee/worker/supabase/firebase/leancloud/bmob/
pocketbase/appwrite 全部 preset）；inbox 审核的 `INBOX_API/httpDelete` 需按新后端
的"集合列表+删除"接口重写约 40 行。

**不变量**（换后端也必须保持）：
- 拉取免配置、写要凭据、正式库不可被未授权端直接覆盖
- 合并按键去重只加不覆盖；canonical schema v1 字段名不动
- token 只存本机；成员端默认只读+申请通道

## 通用安全红线

- 写 token 绝不进代码/git；成员机不配 token 即只读
- 首次切换先「导出 JSON 备份」；旧后端数据建议先迁移合并再下线
