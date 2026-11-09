# 智团慧建 · iOS App（uni-app）

> uni-app 源码，HBuilderX 云打包 iOS。与 `mp-weixin/` 完全独立。

## 功能

- 动态：feed.json 公告 + 全量统计（留痕/成员/荣誉/志愿时长）
- 留痕：records 按类型筛选（三会两制一课/主题团日/志愿/立项）
- 成员：成员名册（**不显示学号**）+ 志愿时长 + 荣誉墙
- 数据：读 canonical `data/state.json` + `data/feed.json`（jsDelivr/raw 双源+缓存）
- **团员端只读**：不写正式库、不内置 token——写入仍在网页版/App 支委端

## iOS 打包

HBuilderX 打开本目录 → manifest.json 填 appid + iOS 证书 → 发行·云打包·iOS。
需 `static/icon.png`（1024²）。
