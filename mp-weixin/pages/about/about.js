// 文件路径: /cysl-web/mp-weixin/pages/about/about.js
const { fetchAll, cacheTime, SITE_URL } = require('../../utils/api.js');

Page({
  data: { refreshText: '点击同步' },
  onShow() {
    const t = cacheTime();
    if (t) this.setData({ refreshText: `上次 ${t}` });
  },
  async refresh() {
    this.setData({ refreshText: '同步中…' });
    const { state } = await fetchAll(true);
    this.setData({ refreshText: state ? `已更新 ${cacheTime()}` : '同步失败' });
  },
  copySite() { wx.setClipboardData({ data: SITE_URL }); },
});
