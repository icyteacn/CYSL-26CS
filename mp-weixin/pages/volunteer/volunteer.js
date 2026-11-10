// 文件路径: /cysl-web/mp-weixin/pages/volunteer/volunteer.js
// 志愿工时：与网站 data/feed.json 的 volunteers[] 同源
const { fetchAll, volEntries, volByMember, dateText } = require('../../utils/api.js');

Page({
  data: { board: [], list: [], total: 0, loading: true },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '志愿工时公示', path: '/pages/volunteer/volunteer' }; },
  async load(force) {
    this.setData({ loading: true });
    await fetchAll(force);
    const entries = volEntries().map(v => ({
      member: v.member || v.memberName || v.name || '',
      hours: Number(v.hours) || 0,
      activity: v.activity || v.title || '志愿服务',
      dateS: dateText(v.date || v.at),
    }));
    const by = volByMember();
    const board = Object.keys(by).map(k => ({ name: k, hours: by[k] }))
      .sort((a, b) => b.hours - a.hours);
    this.setData({
      loading: false,
      list: entries.sort((a, b) => (b.dateS || '').localeCompare(a.dateS || '')),
      board,
      total: entries.reduce((s, x) => s + x.hours, 0),
    });
  },
});
