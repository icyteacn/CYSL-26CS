# 10 · PocketBase + Oracle Cloud 永久免费 VPS —— 真后端终极方案

## 定位
单文件 Go 后端：SQLite + REST + 文件存储 + 内置 Admin UI + 可扩展 JS hooks。
跑在 **Oracle Cloud Always Free**（永久免费 ARM 主机）上 = 0 元真后端。
想要账号、权限、文件上传、未来扩展（甚至把网站也托管了）一步到位。

## 免费额度 / 价格
- Oracle Always Free：4 OCPU ARM + 24GB 内存 + 200GB 存储 + 10TB/月流量 **永久免费**
- PocketBase 开源免费（MIT）
- 费用：**¥0/月**，唯一成本是一次性配置时间

## 国内可达性：✅ VPS IP 国内直连（选日本/韩国机房延迟低）。

## 启用步骤
1. cloud.oracle.com → 免费注册 → Create VM → 选 `VM.Standard.A1.Flex`（ARM）
   + Ubuntu/Oracle Linux → 分配 4OCPU/24GB → 公网 IP
2. 上传并跑 PocketBase：
   ```bash
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.x/pocketbase_0.22.x_linux_arm64.zip
   unzip ... && chmod +x pocketbase
   ./pocketbase serve --http=0.0.0.0:8090
   # 生产化：写 systemd unit + 反代 https（Caddy 一键：caddy reverse-proxy --from api.你的域名 --to :8090）
   ```
3. 浏览器开 `http://IP:8090/_/` → 建管理员 → 建 collection `state`
   （字段：`doc` JSON）→ 添加一条记录记 `recordId`
4. 建 API Rules：read 公开；write 用 superuser token 或建 `_superusers` 账号 token
5. （可选）`pb_hooks/state_hooks.pb.js` 启用钩子：写前自动备份旧版本

## 接入
```js
Cloud.configure('pocketbase', {
  url:'http://你的IP:8090', recordId:'xxx',
  token: localStorage.cysl_token });   // superuser/api token
```
```java
CloudSync.Config c = CloudSync.pocketbase("http://你的IP:8090","recordId","token");
```

## 优缺点
- ✅ 真账号/权限/文件上传/Admin UI，一次到位不被厂商锁
- ✅ SQLite 单文件备份 = 拷一个文件
- ⚠️ 要自己会一点运维（防火墙、systemd、域名+HTTPS）
- ⚠️ Oracle 免费机偶尔被回收闲置资源，做快照备份

## 文件
- `pocketbase.service` — systemd 单元模板
- `hooks_example.pb.js` — 写前自动备份钩子（放 `pb_hooks/`）
