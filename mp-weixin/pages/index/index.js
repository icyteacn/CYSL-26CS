// 文件路径: /cysl-web/mp-weixin/pages/index/index.js
const { fetchAll, feedItems, recordsList, membersList, honorsList, volEntries, dateText } = require('../../utils/api.js');

Page({
  data: { items: [], counts: { records: 0, members: 0, honors: 0, hours: 0 }, loading: true },
  onShow() { this.load(); },
  async load() {
    this.setData({ loading: true });
    await fetchAll();
    this.setData({
      loading: false,
      items: feedItems().slice(0, 20).map(it => ({ ...it, dateS: dateText(it.date || it.at || it.time) })),
      counts: {
        records: recordsList().length,
        members: membersList().length,
        honors: honorsList().length,
        hours: volEntries().reduce((a, v) => a + (Number(v.hours) || 0), 0),
      },
    });
  },
});
