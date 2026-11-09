/* ============================================================
 * cloud-sync.js — 云端同步（GitHub 仓 data/state.json 作为后端存储）
 * ============================================================
 * 读：jsdelivr CDN（国内可通）→ 失败回退 raw.githubusercontent.com
 * 写：localStorage.cysl_ghtoken 有值 → GitHub API 直写（全自动）
 *     无 token → 复制 JSON + 打开仓库编辑页（零配置：粘贴+提交两步）
 * 合并：按业务键去重（记录=标题+日期，志愿=成员+活动+日期，成员=姓名，
 *       立项=名称，荣誉=标题+日期）——多端新增不互踩。
 * ============================================================ */
const Cloud = (() => {
  const REPO = 'icyteacn/CYSL-26CS';
  const PATH = 'data/state.json';
  const BRANCH = 'main';
  const READ_URLS = [
    `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${PATH}`,
    `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PATH}`,
  ];
  const API_URL = `https://api.github.com/repos/${REPO}/contents/${PATH}`;
  const EDIT_URL = `https://github.com/${REPO}/edit/${BRANCH}/${PATH}`;
  const token = () => localStorage.getItem('cysl_ghtoken') || '';

  async function fetchRemote() {
    for (const u of READ_URLS) {
      try {
        const r = await fetch(u + '?t=' + Date.now());
        if (r.ok) return await r.json();
      } catch (e) { /* 下一个源 */ }
    }
    return null;
  }

  /* 业务键去重合并：远端有而本地没有的补进来，返回新增条数 */
  function mergeRemote(remote) {
    if (!remote || typeof remote !== 'object') return 0;
    let add = 0;
    const into = (arr, key, src) => {
      if (!Array.isArray(src)) return;
      const have = new Set(arr.map(key));
      src.forEach(item => {
        if (!have.has(key(item))) { item.id = item.id || nextId(arr); arr.push(item); add++; }
      });
    };
    into(DB.records, r => (r.title || '') + '|' + (r.date || ''), remote.records);
    into(DB.volunteers, v => (v.member || v.memberName || '') + '|' + (v.activity || '') + '|' + (v.date || ''), remote.volunteers);
    into(DB.members, m => (m.name || '') + '|' + (m.studentId || ''), remote.members);
    into(DB.projects, p => (p.name || ''), remote.projects);
    into(DB.honors, h => (h.title || '') + '|' + (h.date || ''), remote.honors);
    return add;
  }

  async function pull(silent) {
    const remote = await fetchRemote();
    if (!remote) { if (!silent) toast('云端拉取失败：网络不可达'); return null; }
    const add = mergeRemote(remote);
    if (add > 0) { save(); if (typeof nav === 'function') nav(); }
    if (!silent) toast(add > 0 ? `已同步：从云端新增 ${add} 条` : '已是最新，无新增');
    return add;
  }

  async function push() {
    const payload = JSON.stringify(DB);
    const t = token();
    if (!t) { // 零配置兜底：复制 + 打开编辑页
      try { await navigator.clipboard.writeText(payload); } catch (e) {}
      window.open(EDIT_URL, '_blank');
      toast('已复制数据并打开提交页：粘贴替换内容后点 Commit 即上云');
      return;
    }
    try {
      // 先取当前 sha（GitHub 更新文件必须带 sha）
      let sha;
      const cur = await fetch(API_URL, { headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' } });
      if (cur.ok) sha = (await cur.json()).sha;
      const body = { message: 'sync: state via web', branch: BRANCH, content: btoa(unescape(encodeURIComponent(payload))) };
      if (sha) body.sha = sha;
      const r = await fetch(API_URL, { method: 'PUT', headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { toast('已推送到云端 ✓'); return; }
      const j = await r.json().catch(() => ({}));
      toast('推送失败：' + (j.message || ('HTTP ' + r.status)) + '（检查 token 权限）');
    } catch (e) { toast('推送失败：' + e.message); }
  }

  function setup() {
    modal(`<h3>☁ 云端同步 · GitHub</h3>
      <div style="font-size:12.5px;color:var(--mut);line-height:1.7">
      数据存 <code>data/state.json</code>（本仓库内）。<br>
      · <b>拉取</b>：任何设备免配置，自动合并新增数据。<br>
      · <b>推送</b>：粘贴一次写 token 后一键直写；不设 token 则复制JSON并打开提交页（点Commit即可）。<br>
      token 仅保存于本机浏览器，不写入代码。</div>
      <div class="field"><label>写 token（GitHub PAT，仅支委填）</label>
      <input id="f-tk" type="password" placeholder="留空 = 用提交页方式"></div>
      <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveCloudToken()">保存</button></div>`);
  }
  window.saveCloudToken = () => {
    const v = $('#f-tk').value.trim();
    if (v) localStorage.setItem('cysl_ghtoken', v);
    else localStorage.removeItem('cysl_ghtoken');
    closeModal(); toast(v ? 'token 已保存（仅本机）' : '已清除 token，推送将走提交页');
  };

  return { pull, push, setup, hasToken: () => !!token() };
})();
window.Cloud = Cloud;

/* 网站端全局入口 */
window.cloudPull = () => Cloud.pull(false);
window.cloudPush = () => Cloud.push();
window.cloudSetup = () => Cloud.setup();
