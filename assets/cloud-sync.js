/* ============================================================
 * cloud-sync.js — 云端同步（GitHub 仓统一后端）
 * ============================================================
 * 数据模型：data/state.json = canonical 统一库，App 与网页读写同一份
 *   （App 侧经 CloudBundle 在 Room 实体与 canonical 间自动转换）。
 * 权限模型：
 *   · 拉取 — 全员免配置（jsdelivr CDN，失败回退 raw）
 *   · 推送 — 支委：token 直写 / 编辑页提交，直接发布正式库
 *   · 申请 — 成员：本地数据 → data/inbox/sub-*.json（GitHub 自动走 fork+PR）
 *   · 审核 — 支委：拉取 inbox 申请合并入库 + 删除申请文件 + 推回正式库
 *   写权限最终由 GitHub 仓库权限把关，前端仅做引导。
 * 合并：按业务键去重（记录=标题+日期，志愿=成员+活动+日期，成员=姓名+尾号，
 *       立项=名称，荣誉=标题+日期）——只加不覆盖，多端新增不互踩。
 * ============================================================ */
const Cloud = (() => {
  const REPO = 'icyteacn/CYSL-26CS';
  const PATH = 'data/state.json';
  const BRANCH = 'main';
  const INBOX_DIR = 'data/inbox';
  const READ_URLS = [
    `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${PATH}`,
    `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PATH}`,
  ];
  const API_URL = `https://api.github.com/repos/${REPO}/contents/${PATH}`;
  const INBOX_API = `https://api.github.com/repos/${REPO}/contents/${INBOX_DIR}`;
  const EDIT_URL = `https://github.com/${REPO}/edit/${BRANCH}/${PATH}`;
  const INBOX_NEW = `https://github.com/${REPO}/new/${BRANCH}/${INBOX_DIR}`;
  const token = () => localStorage.getItem('cysl_ghtoken') || '';
  const headers = t => ({ Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' });

  /* canonical 推送载荷：DB 本体 + 元信息（不污染本地存储结构） */
  function payload() {
    return JSON.stringify(Object.assign({}, DB, {
      v: 1, exportedAt: Date.now(), source: 'cysl-web',
    }));
  }

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
    into(DB.volunteers, v => (v.member || v.memberName || '') + '|' + (v.activity || '') + '|' + dayKey(v.date), remote.volunteers);
    into(DB.members, m => (m.name || '') + '|' + (m.studentId || ''), remote.members);
    into(DB.projects, p => (p.name || ''), remote.projects);
    into(DB.honors, h => (h.title || '') + '|' + (h.date || ''), remote.honors);
    return add;
  }
  /* 志愿者按日历日去重（与 App 端 yyyyMMdd 口径一致，防毫秒差异重复） */
  function dayKey(d) {
    const t = new Date(typeof d === 'number' ? d : Date.parse(d) || 0);
    return isNaN(t) ? String(d) : t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
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
    const t = token();
    if (!t) { // 零配置兜底：复制 + 打开编辑页
      try { await navigator.clipboard.writeText(payload()); } catch (e) {}
      window.open(EDIT_URL, '_blank');
      toast('已复制数据并打开提交页：粘贴替换内容后点 Commit 即上云');
      return;
    }
    try {
      let sha;
      const cur = await fetch(API_URL, { headers: headers(t) });
      if (cur.ok) sha = (await cur.json()).sha;
      const body = { message: 'sync: state via web', branch: BRANCH, content: btoa(unescape(encodeURIComponent(payload()))) };
      if (sha) body.sha = sha;
      const r = await fetch(API_URL, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers(t)), body: JSON.stringify(body) });
      if (r.ok) { toast('已推送到云端 ✓'); return; }
      const j = await r.json().catch(() => ({}));
      toast('推送失败：' + (j.message || ('HTTP ' + r.status)) + '（检查 token 权限）');
    } catch (e) { toast('推送失败：' + e.message); }
  }

  /* ---------- 成员端：提交变更申请到 data/inbox/ ---------- */
  async function submit() {
    const name = 'sub-' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '.json';
    modal(`<h3>📮 提交云端申请</h3>
      <div style="font-size:12.5px;color:var(--mut);line-height:1.7">
      把你的本地数据提交为一条「变更申请」<code>${INBOX_DIR}/${name}</code>。<br>
      · 无仓库写权限时 GitHub 会自动引导你 fork 并发起 PR，支委审核合并后数据才进入正式库。<br>
      · 支委也可直接在管理端点「审核申请」一键并入。<br>
      <b>不会直接覆盖云端现有数据。</b></div>
      <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button>
      <button class="btn" onclick="doCloudSubmit('${name}')">复制并打开提交页</button></div>`);
  }
  window.doCloudSubmit = async name => {
    closeModal();
    try { await navigator.clipboard.writeText(payload()); } catch (e) {}
    window.open(`${INBOX_NEW}?filename=${name}`, '_blank');
    toast('已复制数据：在打开的页面粘贴为文件内容并提交（将生成 PR 待支委合并）');
  };

  /* ---------- 支委端：审核 inbox 申请（需 token） ---------- */
  async function review() {
    const t = token();
    if (!t) { toast('审核需要先在「云端设置」配置写 token'); return; }
    toast('正在获取待审申请…');
    try {
      const r = await fetch(INBOX_API, { headers: headers(t) });
      if (!r.ok) { toast('无法列出 inbox：' + r.status); return; }
      const files = (await r.json()).filter(f => f.name.endsWith('.json'));
      if (!files.length) { toast('没有待审申请'); return; }
      let add = 0, done = 0, fail = 0;
      for (const f of files) {
        try {
          const raw = await (await fetch(f.download_url)).json();
          add += mergeRemote(raw);
          const del = await fetch(f.url, {
            method: 'DELETE', headers: Object.assign({ 'Content-Type': 'application/json' }, headers(t)),
            body: JSON.stringify({ message: '审核合并 ' + f.name, sha: f.sha, branch: BRANCH }),
          });
          del.ok ? done++ : fail++;
        } catch (e) { fail++; }
      }
      save();
      // 把合并后的本地库推回正式库
      let pushed = false;
      try {
        let sha; const cur = await fetch(API_URL, { headers: headers(t) });
        if (cur.ok) sha = (await cur.json()).sha;
        const body = { message: 'sync: merge inbox reviews', branch: BRANCH, content: btoa(unescape(encodeURIComponent(payload()))) };
        if (sha) body.sha = sha;
        pushed = (await fetch(API_URL, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers(t)), body: JSON.stringify(body) })).ok;
      } catch (e) {}
      if (typeof nav === 'function') nav();
      toast(`已审 ${done} 份（并入 ${add} 条）${fail ? '，失败 ' + fail : ''}${pushed ? '，已同步云端' : '，云端推送失败请手动推送'}`);
    } catch (e) { toast('审核失败：' + e.message); }
  }

  function setup() {
    modal(`<h3>☁ 云端同步 · GitHub</h3>
      <div style="font-size:12.5px;color:var(--mut);line-height:1.7">
      统一库 <code>data/state.json</code>，App 与网页同一套数据。<br>
      · <b>拉取</b>：任何设备免配置，自动合并新增数据。<br>
      · <b>推送/审核</b>：支委持写 token 一键直写；不设 token 则复制JSON并打开提交页。<br>
      · <b>提交申请</b>：成员数据进 <code>data/inbox/</code>，支委审核并入后才发布。<br>
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

  return { pull, push, submit, review, setup, hasToken: () => !!token() };
})();
window.Cloud = Cloud;

/* 网站端全局入口 */
window.cloudPull = () => Cloud.pull(false);
window.cloudPush = () => Cloud.push();
window.cloudSubmit = () => Cloud.submit();
window.cloudReview = () => Cloud.review();
window.cloudSetup = () => Cloud.setup();
