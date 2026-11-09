# 启用时的接线指南（到时照做，不是现在要改）

> 本文件只说明「将来启用某方案时，把适配器接在哪几个现成挂钩点」。
> 现在不需要改任何线上代码——以下都是将来的接线说明。

## 网站端（CYSL-26CS-web）

1. `shared/cloud-sync.js` → 拷到 `assets/cloud-sync.js`，
   `index.html` 在 `assets/app.js` **之前**加 `<script src="assets/cloud-sync.js"></script>`。
2. **首次配置**（控制台或设置页做一次）：
   ```js
   Cloud.configure('<方案preset名>', {/* 见各 README */});
   localStorage.cysl_token = '支委token';   // 写权限才需要，成员机不设
   ```
3. **拉取挂钩**：在现有 `fetchFeed()` 完成后加一行
   `Cloud.pull().then(r=>{ if(r){ /*按现有 merge 逻辑合并进 DB*/ save(); render(); }});`
   ——推荐复用 app.js 里「导入 JSON 恢复/多设备合并」已有的去重合并函数。
4. **推送挂钩**：在现有「导出 JSON 备份」按钮旁加「☁ 推送到云端」，
   onClick 先走 `canEdit()`/管理口令，再 `Cloud.push()`。
5. token 管理入口：系统页加一个「云端同步」卡，放 粘贴token/立即拉取/推送 三个控件即可。

## App 端（LeagueTrace）

1. `shared/CloudSync.java` → 拷到 `app/.../util/CloudSync.java`（已按包名写好）。
2. 在 `SystemFragment`（体系页）加「云端同步」卡：
   - 「粘贴写 token」→ `sp.edit().putString("cloud_token",...)`
   - 「拉取云端」→ `App.get().io().execute(() -> { JSONObject r = CloudSync.pull(cfg); ... 走 Backup.restore 类似逻辑 })`
   - 「推送本地到云端」→ `Identity.gate(...)` 通过后 `CloudSync.push(cfg, Backup.bundle(db)转JSONObject)`
3. `Config` 对象从 SP 里存的方案参数重建（方案名+endpoint+token），不进代码。

## 通用原则（再强调）

- **默认关闭**：`Cloud.enabled()`/`pull()` 未配置返回 null，纯前端路径不受影响。
- **只读默认开、写要口令**：成员设备不配置 token → 自动只读。
- **先本地备份再首推**：首次 push 前手动 `导出 JSON 备份` 保底。
- **冲突**：单文档「最后写覆盖」够用；要细粒度用现有「标题+日期」合并逻辑。
