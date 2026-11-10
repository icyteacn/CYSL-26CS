# 客户端上架部署清单 · 智团慧建（CYSL-26CS）

> 双端源码已就绪（`app-uniapp/` iOS、`mp-weixin/` 微信小程序）。团员端**只读**：读 `data/state.json` + `data/feed.json`，无任何写凭据。

## 一、微信小程序（约 15 分钟）

1. [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册小程序 → 拿 **AppID** → AppID 已填 `wx313c28f3fdf79289` → 开发者工具直接导入 `mp-weixin/`。
2. **request 合法域名**（开发设置 → 服务器域名）：
   - `https://icyteacn.github.io`
   - `https://cdn.jsdelivr.net`
   - `https://raw.githubusercontent.com`
3. 上传 → 版本管理提审。类目建议「教育 > 教育信息服务」。

## 二、iOS App —— 已完成（H5 免费路线）

**H5 产物已构建并铺进仓根 `app/`**，随 `pages.yml` 整仓部署自动上线：

- iOS 使用：Safari 打开 **https://icyteacn.github.io/CYSL-26CS/app/** → 分享 →「添加到主屏幕」。
- 重新构建：`cd app-uniapp && npm install && npm run build:h5`；本地预览 `npm run dev:h5`。
- 正式 ipa（App Store/TestFlight）才需 Apple 开发者 $99/年，暂不启用。

## 三、支委写权限（state.json 入库，约 5 分钟）

> 成员端零配置（只读公开数据）。支委要「推送到云端/审核申请」，配一次 PAT：

1. GitHub → 右上角头像 → Settings → Developer settings → **Personal access tokens → Fine-grained tokens** → Generate new token。
2. 配置：**Repository access = Only select repositories → 选 `icyteacn/CYSL-26CS`**；**Permissions → Contents = Read and write**（其余全部默认 None）；过期时间选 90 天或自定义。
3. 生成后复制 `github_pat_...` → 打开网页版「体系」页 → 云端同步卡 →「同步设置/云端写 token」粘贴保存。
4. 之后「推送到云端」一键直写 `data/state.json`；「审核申请」可读 `data/inbox/` 并合并。**token 只存本机浏览器，不入代码不入仓库。**
5. 不配也能用：点「推送到云端」会自动复制 JSON + 打开 GitHub 编辑页，粘贴提交即可（需浏览器已登录 GitHub）。

## 四、后端备选（默认关闭）

`backend-options/` 13 套方案（含本仓 01-github 已接通版 + CF/LeanCloud/PocketBase 等），按各 README 启用。

---
*数据契约与权限模型见 `README.md`「移动客户端」章与 `backend-options/README.md`。*
