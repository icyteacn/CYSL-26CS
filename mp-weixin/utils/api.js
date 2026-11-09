// 文件路径: /cysl-web/mp-weixin/utils/api.js
// 读取 canonical 后端：data/state.json（正式库）+ data/feed.json（公告/公开留痕兜底）
const REPO = 'icyteacn/CYSL-26CS';
const BRANCH = 'main';
const SITE_URL = 'https://icyteacn.github.io/CYSL-26CS';
const SRC = p => [
  `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${p}`,
  `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
];
const CK = 'cysl_state_v1', CF = 'cysl_feed_v1', CT = 'cysl_sync_t';

let _state = null, _feed = null;

function req(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url, timeout: 15000, method: 'GET',
      success: r => (r.statusCode === 200 && r.data ? resolve(r.data) : reject(new Error('HTTP ' + r.statusCode))),
      fail: reject,
    });
  });
}
async function pull(path) {
  for (const u of SRC(path)) {
    try { return await req(u + '?t=' + Date.now()); } catch (e) { /* 下一源 */ }
  }
  return null;
}

async function fetchAll(force = false) {
  if (_state && !force) return { state: _state, feed: _feed };
  if (!_state) {
    _state = wx.getStorageSync(CK) || null;
    _feed = wx.getStorageSync(CF) || null;
  }
  const [s, f] = await Promise.all([pull('data/state.json'), pull('data/feed.json')]);
  if (s) { _state = s; wx.setStorageSync(CK, s); }
  if (f) { _feed = f; wx.setStorageSync(CF, f); }
  if (s || f) wx.setStorageSync(CT, Date.now());
  return { state: _state, feed: _feed };
}

const norm = v => (Array.isArray(v) ? v : []);
function feedItems() {
  const f = _feed || {};
  const list = f.notices || f.items || f.feed || f.list || [];
  return Array.isArray(list) ? list : [];
}
function recordsList() {
  const sr = norm(_state && _state.records);
  return sr.length ? sr : norm(_feed && _feed.records);
}
function membersList() { return norm(_state && _state.members); }
function honorsList() { return norm(_state && _state.honors); }
function volsList() {
  const sv = norm(_state && _state.volunteers);
  return sv.length ? sv : norm(_feed && _feed.volunteers);
}
function volByMember() {
  const map = {};
  volsList().forEach(v => {
    const n = v.memberName || v.member || v.name || '';
    if (n) map[n] = (map[n] || 0) + (Number(v.hours) || 0);
  });
  return map;
}
function cacheTime() {
  const t = wx.getStorageSync(CT);
  if (!t) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function dateText(x) {
  if (!x) return '';
  if (typeof x === 'number') { const d = new Date(x); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  return String(x).slice(0, 10);
}

module.exports = {
  SITE_URL, fetchAll, norm, feedItems, recordsList,
  membersList, honorsList, volByMember, volEntries: volsList, cacheTime, dateText,
};
