// 文件路径: /cysl-web/app-uniapp/utils/api.js
// 读取 canonical 后端：data/state.json（正式库）+ data/feed.json（公告/公开留痕兜底）
// 与网站/App 同一份数据（uni-app 团员端只读，不写正式库）
import { ref } from 'vue';

const REPO = 'icyteacn/CYSL-26CS';
const BRANCH = 'main';
export const SITE_URL = 'https://icyteacn.github.io/CYSL-26CS';
const SRC = p => [
  `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${p}`,
  `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
];

export const state = ref(null);   // {members,records,volunteers,projects,honors}
export const feed = ref(null);    // {notices,records,volunteers,schedule,...}
export const source = ref('');

const CK = 'cysl_state_v1', CF = 'cysl_feed_v1', CT = 'cysl_sync_t';

function req(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    uni.request({
      url, timeout, method: 'GET',
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

export async function fetchAll(force = false) {
  if (state.value && !force) return state.value;
  if (!state.value) {
    const cs = uni.getStorageSync(CK), cf = uni.getStorageSync(CF);
    if (cs) state.value = cs;
    if (cf) feed.value = cf;
    if (cs) source.value = 'cache';
  }
  const [s, f] = await Promise.all([pull('data/state.json'), pull('data/feed.json')]);
  if (s) { state.value = s; uni.setStorageSync(CK, s); }
  if (f) { feed.value = f; uni.setStorageSync(CF, f); }
  if (s || f) { source.value = 'live'; uni.setStorageSync(CT, Date.now()); }
  return state.value;
}
export function preload() { fetchAll().catch(() => {}); }

export const norm = v => (Array.isArray(v) ? v : []);

/** 公告：feed.notices 为主，兼容 items/feed/list */
export function feedItems() {
  const f = feed.value || {};
  const list = f.notices || f.items || f.feed || f.list || [];
  return Array.isArray(list) ? list : [];
}
/** 记录：state 优先，feed 兜底（当前 state.json 为空骨架时真实数据在 feed） */
export function recordsList() {
  const sr = norm(state.value && state.value.records);
  return sr.length ? sr : norm(feed.value && feed.value.records);
}
export function membersList() { return norm(state.value && state.value.members); }
export function honorsList() { return norm(state.value && state.value.honors); }
export function projectsList() {
  const sp = norm(state.value && state.value.projects);
  return sp.length ? sp : norm(feed.value && feed.value.projects);
}
function volsList() {
  const sv = norm(state.value && state.value.volunteers);
  return sv.length ? sv : norm(feed.value && feed.value.volunteers);
}
export function volByMember() {
  const map = {};
  volsList().forEach(v => {
    const n = v.memberName || v.member || v.name || '';
    if (n) map[n] = (map[n] || 0) + (Number(v.hours) || 0);
  });
  return map;
}
export function volEntries() { return volsList(); }

export function cacheTime() {
  const t = uni.getStorageSync(CT);
  if (!t) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function dateText(x) {
  if (!x) return '';
  if (typeof x === 'number') { const d = new Date(x); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  return String(x).slice(0, 10);
}
