// 文件路径: /cysl-web/mp-weixin/pages/study/study.js
// 学习资料：与网站 data/feed.json 的 study[] 同源（146条+周更）
const { fetchAll, studyList } = require('../../utils/api.js');

Page({
  data: { cats: ['全部'], cat: '全部', list: [], loading: true },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '学习资料 · 支部学习库', path: '/pages/study/study' }; },
  async load(force) {
    this.setData({ loading: true });
    await fetchAll(force);
    const all = studyList().map(s => ({
      c: s.c || s.category || '学习', t: s.t || s.title || '',
      s: s.s || s.src || '', b: s.b || s.desc || '', u: s.u || s.url || '',
    }));
    const cats = ['全部', ...new Set(all.map(x => x.c))];
    this._all = all;
    this.setData({ cats, loading: false });
    this.apply();
  },
  pick(e) { this.setData({ cat: e.currentTarget.dataset.c }); this.apply(); },
  apply() {
    const c = this.data.cat;
    this.setData({ list: c === '全部' ? this._all : this._all.filter(x => x.c === c) });
  },
  open(e) {
    const it = e.currentTarget.dataset.it;
    wx.showActionSheet({
      itemList: ['查看详情', '复制链接'],
      success: r => {
        if (r.tapIndex === 0) {
          wx.showModal({ title: it.t, content: `${it.c}\n${it.s}\n\n${it.b || ''}`, showCancel: false });
        } else if (it.u) {
          wx.setClipboardData({ data: it.u, success: () => wx.showToast({ title: '已复制链接' }) });
        }
      },
    });
  },
});
