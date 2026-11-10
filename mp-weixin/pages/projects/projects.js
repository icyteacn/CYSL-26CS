// 文件路径: /cysl-web/mp-weixin/pages/projects/projects.js
// 立项一览：与网站 data/state.json（兜底 feed/种子）同源
const { fetchAll, projectsList, dateText } = require('../../utils/api.js');

Page({
  data: { list: [], loading: true },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
  onShareAppMessage() { return { title: '支部立项一览', path: '/pages/projects/projects' }; },
  async load(force) {
    this.setData({ loading: true });
    await fetchAll(force);
    this.setData({
      loading: false,
      list: projectsList().map(p => ({
        ...p,
        statusText: typeof p.status === 'number' ? ['筹备中', '进行中', '已结项'][p.status] || '进行中' : (p.status || '进行中'),
        startS: dateText(p.startMillis || p.startDate || p.start),
        endS: dateText(p.endMillis || p.endDate || p.end),
      })),
    });
  },
  show(e) {
    const p = e.currentTarget.dataset.p;
    wx.showModal({
      title: p.name || '立项',
      content: `类别：${p.category || '-'}\n进度：${p.progress || 0}%（${p.statusText}）\n周期：${p.startS || '?'} ~ ${p.endS || '?'}\n\n目标：${p.target || '-'}\n\n方案：${p.plan || '-'}`,
      showCancel: false,
    });
  },
});
