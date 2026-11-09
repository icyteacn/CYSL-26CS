// 文件路径: /cysl-web/mp-weixin/pages/records/records.js
const { fetchAll, norm, dateText } = require('../../utils/api.js');

const TYPES = ['全部', '支部团员大会', '支部委员会', '团小组会', '团课', '主题团日', '志愿活动', '立项活动', '其他'];

Page({
  data: { types: TYPES, type: '全部', list: [] },
  onShow() { this.load(); },
  async load() {
    const { state } = await fetchAll();
    this._records = norm(state && state.records).map(r => ({ ...r, dateS: dateText(r.date) }));
    this.apply();
  },
  pick(e) {
    this.setData({ type: e.currentTarget.dataset.t });
    this.apply();
  },
  apply() {
    const t = this.data.type;
    const rs = this._records || [];
    this.setData({
      list: t === '全部' ? rs : rs.filter(r =>
        (r.type || r.label || '').includes(t) || (r.extraCats || []).some(c => String(c).includes(t))),
    });
  },
});
