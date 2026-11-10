// 文件路径: /cysl-web/mp-weixin/pages/index/index.js
const { fetchAll, feedItems, recordsList, membersList, honorsList, volEntries, scheduleList, projectsList, dateText } = require('../../utils/api.js');

Page({
  data: {
    items: [], upcoming: [], projects: [],
    counts: { records: 0, members: 0, honors: 0, hours: 0 },
    loading: true,
  },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '智团慧建 · 支部工作平台', path: '/pages/index/index' }; },
  go(e) { wx.navigateTo({ url: e.currentTarget.dataset.p }); },
  goRecords() { wx.switchTab({ url: '/pages/records/records' }); },
  onShareTimeline() { return { title: '智团慧建 · 支部工作平台' }; },
  async load(force) {
    this.setData({ loading: true });
    await fetchAll(force);
    this.setData({
      loading: false,
      items: feedItems().slice(0, 20).map(it => ({ ...it, dateS: dateText(it.date || it.at || it.time) })),
      upcoming: scheduleList().slice(0, 5).map(it => ({ ...it, dateS: dateText(it.date || it.at) })),
      projects: projectsList().slice(0, 5),
      counts: {
        records: recordsList().length,
        members: membersList().length,
        honors: honorsList().length,
        hours: volEntries().reduce((a, v) => a + (Number(v.hours) || 0), 0),
      },
    });
  },
});
