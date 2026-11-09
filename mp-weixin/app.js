// 文件路径: /cysl-web/mp-weixin/app.js
App({
  onLaunch() {
    const { fetchAll } = require('./utils/api.js');
    fetchAll().catch(() => {});
  },
});
