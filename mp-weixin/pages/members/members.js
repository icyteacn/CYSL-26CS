// 文件路径: /cysl-web/mp-weixin/pages/members/members.js
const { fetchAll, membersList, honorsList, volByMember, dateText } = require('../../utils/api.js');

Page({
  data: { members: [], honors: [] },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '支部成员与荣誉墙', path: '/pages/members/members' }; },
  async load(force) {
    await fetchAll(force);
    const vol = volByMember();
    this.setData({
      members: membersList().map(m => ({
        ...m,
        initial: (m.name || '?').slice(0, 1),
        hours: vol[m.name] || 0,
      })),
      honors: honorsList().map(h => ({ ...h, dateS: dateText(h.date) })),
    });
  },
});
