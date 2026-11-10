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
// 成员兜底：state.json 的 members 为空时，用网站同款脱敏名册（政治面貌+学号尾号，无真实姓名）
const ROSTER = [
  [50,'共青团员'],[51,'中共党员'],[52,'共青团员'],[53,'群众'],[55,'中共党员'],[56,'群众'],
  [57,'共青团员'],[58,'中共党员'],[59,'共青团员'],[60,'群众'],[61,'共青团员'],[62,'共青团员'],
  [63,'共青团员'],[64,'共青团员'],[65,'中共党员'],[66,'共青团员'],[67,'共青团员'],[68,'群众'],
  [69,'共青团员'],[70,'群众'],[71,'群众'],[72,'共青团员'],[73,'共青团员'],[74,'群众'],[75,'共青团员'],
  [77,'中共党员'],[77,'共青团员'],[78,'群众'],[79,'共青团员'],[80,'中共党员'],[81,'共青团员'],
  [82,'共青团员'],[84,'共青团员'],[85,'共青团员'],
];
function membersList() {
  const s = norm(_state && _state.members);
  if (s.length) return s;
  return ROSTER.map(([tail, pol], i) => ({
    id: i + 1,
    name: (pol.includes('党员') ? '党员' : pol.includes('群众') ? '群众' : '团员') + tail,
    sid: String(tail), political: pol, role: '',
  }));
}
function honorsList() { return norm(_state && _state.honors); }
// 立项兜底：feed/state 均无时用网站同款种子立项
const SEED_PROJECT = {
  id: 1, name: '"智慧留痕"——基于数字化平台的先进团支部建设维护体系构建',
  category: '组织建设', status: '进行中', progress: 30,
  target: '围绕"三会两制一课"制度落实，建成一套"低负担、全自动、强留痕"的团支部数字化建设维护体系：以"支部留痕"App与配套网页工作台为载体，实现活动留痕标准化、签到统计自动化、建设情况可视化、迎检材料一键生成。',
  plan: '分四阶段推进：体系搭建（9月）→ 全员应用（10-12月）→ 深化运行（次年3-5月）→ 总结推广（次年6月）。预期"三会两制一课"留痕覆盖率100%，形成数字化团支部建设SOP与可视化看板。',
  outcome: '',
};
function projectsList() {
  const sp = norm(_state && _state.projects);
  if (sp.length) return sp;
  const fp = norm(_feed && _feed.projects);
  return fp.length ? fp : [SEED_PROJECT];
}
function scheduleList() { return norm(_feed && _feed.schedule); }
function studyList() { return norm(_feed && _feed.study); }
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
  membersList, honorsList, projectsList, scheduleList, studyList,
  volByMember, volEntries: volsList, cacheTime, dateText,
};
