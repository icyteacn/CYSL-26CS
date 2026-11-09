// 文件路径: /cysl-web/mp-weixin/pages/members/members.js
const { fetchAll, norm, volByMember, dateText } = require('../../utils/api.js');

Page({
  data: { members: [], honors: [] },
  onShow() { this.load(); },
  async load() {
    const { state } = await fetchAll();
    const vol = volByMember();
    this.setData({
      members: norm(state && state.members).map(m => ({ ...m, hours: vol[m.name] || 0 })),
      honors: norm(state && state.honors).map(h => ({ ...h, dateS: dateText(h.date) })),
    });
  },
});
