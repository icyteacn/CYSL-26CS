// 文件路径: /cysl-web/mp-weixin/pages/records/records.js
const { fetchAll, recordsList, dateText } = require('../../utils/api.js');

const TYPES = ['全部', '支部团员大会', '支部委员会', '团小组会', '团课', '主题团日', '志愿活动', '立项活动', '其他'];

Page({
  data: { types: TYPES, type: '全部', list: [] },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '支部留痕 · 三会两制一课记录', path: '/pages/records/records' }; },
  async load(force) {
    await fetchAll(force);
    this._records = recordsList().map(r => ({ ...r, dateS: dateText(r.date) }));
    this.apply();
  },
  pick(e) {
    this.setData({ type: e.currentTarget.dataset.t });
    this.apply();
  },
  show(e) {
    const r = e.currentTarget.dataset.r;
    const parts = [
      `类型：${r.type || r.label || '-'}`,
      `时间：${r.dateS || '-'}`,
    ];
    if (r.location) parts.push(`地点：${r.location}`);
    if (r.attendees) parts.push(`应到：${r.expected && r.expected.length ? r.expected.length : r.attendees}人`);
    if (r.host) parts.push(`主持：${String(r.host).replace(/​/g, '')}`);
    if (r.summary) parts.push(`\n${r.summary}`);
    if (r.absent && r.absent.length) parts.push(`\n缺席：${r.absent.join('、')}`);
    wx.showModal({ title: r.title, content: parts.join('\n'), showCancel: false });
  },
  apply() {
    const t = this.data.type;
    const rs = this._records || [];
    this.setData({
      list: t === '全部' ? rs : rs.filter(r =>
        (r.type || r.label || '').includes(t)
        || (r.extraCats || []).some(c => String(c).includes(t))
        || (r.types || []).some(c => String(c).includes(t))),
    });
  },
});
