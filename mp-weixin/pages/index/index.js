// 文件路径: /cysl-web/mp-weixin/pages/index/index.js
const { fetchAll, feedItems, norm, dateText } = require('../../utils/api.js');

Page({
  data: { items: [], counts: { records: 0, members: 0, honors: 0, hours: 0 }, loading: true },
  onShow() { this.load(); },
  async load() {
    this.setData({ loading: true });
    const { state } = await fetchAll();
    const s = state || {};
    const hours = norm(s.volunteers).reduce((a, v) => a + (Number(v.hours) || 0), 0);
    this.setData({
      loading: false,
      items: feedItems().slice(0, 20).map(it => ({ ...it, dateS: dateText(it.date || it.at || it.time) })),
      counts: {
        records: norm(s.records).length, members: norm(s.members).length,
        honors: norm(s.honors).length, hours,
      },
    });
  },
});
