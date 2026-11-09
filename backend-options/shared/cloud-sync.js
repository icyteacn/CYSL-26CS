/* ============================================================
 * cloud-sync.js — 网站端通用云端同步适配器（默认关闭，不影响纯前端）
 * ============================================================
 * 用法：
 *   1. 把本文件拷到 CYSL-26CS-web/assets/cloud-sync.js
 *   2. index.html 在 app.js 之前加 <script src="assets/cloud-sync.js"></script>
 *   3. 在 app.js 里（或控制台一次）设置：
 *        Cloud.configure('github', {owner:'icyteacn',repo:'CYSL-26CS',
 *          path:'data/state.json', token:localStorage.cysl_token});
 *      （token 由支委在设置页粘贴一次，不进代码不进 git）
 *   4. 拉取：await Cloud.pull()   // 远端JSON → 合并进 DB → save()
 *      推送：await Cloud.push()   // DB → 远端（支委口令验证后再调）
 *
 * 每个方案的 PRESET 只填「怎么读/怎么写」，协议差异收敛在此。
 * 各方案 README 里给出对应 PRESET 名与需要填的字段。
 * ============================================================ */
const Cloud = (() => {
  let cfg = null;                    // {preset, read:{url,headers}, write:{url,method,headers}}
  let sha = null;                    // GitHub/Gitee 写回需要带当前文件 sha

  const PRESETS = {
    /* —— 01/12 GitHub & Gitee：单个 JSON 文件读写 —— */
    github: c => ({
      read:  { url:`https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch||'main'}/${c.path}` },
      write: { url:`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.path}`,
               method:'PUT',
               headers:{ Authorization:`Bearer ${c.token}`, Accept:'application/vnd.github+json' },
               body: data => ({ message:'chore: update state via app', branch:c.branch||'main',
                                content: b64(JSON.stringify(data)), sha }) },
      beforeWrite: async w => { const r=await fetch(w.url,{headers:w.headers});
                                if(r.ok) sha=(await r.json()).sha; },
      parseWrite: r => r.content && (sha = r.content.sha),
    }),
    gitee: c => ({
      read:  { url:`https://gitee.com/${c.owner}/${c.repo}/raw/${c.branch||'master'}/${c.path}` },
      write: { url:`https://gitee.com/api/v5/repos/${c.owner}/${c.repo}/contents/${c.path}`,
               method:'PUT',
               headers:{ 'Content-Type':'application/json' },
               body: data => ({ access_token:c.token, message:'chore: update state via app',
                                branch:c.branch||'master',
                                content: b64(JSON.stringify(data)), sha }) },
      beforeWrite: async w => { const r=await fetch(w.url+`?access_token=${c.token}`);
                                if(r.ok) sha=(await r.json()).sha; },
      parseWrite: r => r.content && (sha = r.content.sha),
    }),
    /* —— 02/03 Cloudflare Worker：自建 /state 端点（见各方案 worker.js） —— */
    worker: c => ({
      read:  { url:`${c.base}/state` },
      write: { url:`${c.base}/state`, method:'PUT',
               headers:{ 'X-Write-Token': c.token, 'Content-Type':'application/json' },
               body: data => data },
    }),
    /* —— 04 Supabase：表 state(id=1, doc jsonb) —— */
    supabase: c => ({
      read:  { url:`${c.url}/rest/v1/state?id=eq.1&select=doc`,
               headers:{ apikey:c.anonKey, Authorization:`Bearer ${c.anonKey}` },
               unwrap: j => j[0] && j[0].doc },
      write: { url:`${c.url}/rest/v1/state`, method:'POST',
               headers:{ apikey:c.anonKey, Authorization:`Bearer ${c.anonKey}`,
                         'Content-Type':'application/json',
                         Prefer:'resolution=merge-duplicates,return=minimal' },
               body: data => ({ id:1, doc:data, updated_at:new Date().toISOString() }) },
    }),
    /* —— 05 Firebase RTDB —— */
    firebase: c => ({
      read:  { url:`${c.url}/state.json` },
      write: { url:`${c.url}/state.json?auth=${c.token}`, method:'PUT',
               headers:{'Content-Type':'application/json'}, body: data => data },
    }),
    /* —— 06 LeanCloud / 07 Bmob：一个 class 一行 doc —— */
    leancloud: c => ({
      read:  { url:`${c.base||'https://'+c.appId.slice(0,8)+'.lc-cn-n1-shared.com'}/1.1/classes/State/${c.objectId}`,
               headers:{ 'X-LC-Id':c.appId, 'X-LC-Key':c.appKey },
               unwrap: j => j.doc },
      write: { url:`${c.base||'https://'+c.appId.slice(0,8)+'.lc-cn-n1-shared.com'}/1.1/classes/State/${c.objectId}`,
               method:'PUT',
               headers:{ 'X-LC-Id':c.appId, 'X-LC-Key':c.masterKey||c.appKey,
                         'Content-Type':'application/json' },
               body: data => ({ doc:data }) },
    }),
    bmob: c => ({
      read:  { url:`https://api2.bmob.cn/1/classes/State/${c.objectId}`,
               headers:{ 'X-Bmob-Application-Id':c.appId,'X-Bmob-REST-API-Key':c.restKey },
               unwrap: j => j.doc },
      write: { url:`https://api2.bmob.cn/1/classes/State/${c.objectId}`, method:'PUT',
               headers:{ 'X-Bmob-Application-Id':c.appId,'X-Bmob-REST-API-Key':c.restKey,
                         'Content-Type':'application/json' },
               body: data => ({ doc:data }) },
    }),
    /* —— 10/11 PocketBase / Appwrite：集合里固定一条记录 —— */
    pocketbase: c => ({
      read:  { url:`${c.url}/api/collections/state/records/${c.recordId}?fields=doc`,
               unwrap: j => j.doc },
      write: { url:`${c.url}/api/collections/state/records/${c.recordId}`,
               method:'PATCH',
               headers:{ Authorization:`Bearer ${c.token}`,'Content-Type':'application/json' },
               body: data => ({ doc:data }) },
    }),
    appwrite: c => ({
      read:  { url:`${c.url}/v1/databases/${c.dbId}/collections/${c.colId}/documents/state`,
               headers:{ 'X-Appwrite-Project':c.project, 'X-Appwrite-Key':c.apiKey },
               unwrap: j => j.doc },
      write: { url:`${c.url}/v1/databases/${c.dbId}/collections/${c.colId}/documents/state`,
               method:'PATCH',
               headers:{ 'X-Appwrite-Project':c.project, 'X-Appwrite-Key':c.apiKey,
                         'Content-Type':'application/json' },
               body: data => ({ data:{ doc:data } }) },
    }),
    /* —— 08 Vercel/13 Deno：同样走 worker 形态，用 preset 'worker' —— */
  };

  function b64(s){ return btoa(unescape(encodeURIComponent(s))); }
  async function req(w){
    const opt = { method: w.method||'GET', headers: Object.assign({}, w.headers) };
    if (w.body) opt.body = typeof w.body === 'function'
      ? JSON.stringify(w.body(window.DB)) : JSON.stringify(w.body);
    if (opt.body && !opt.headers['Content-Type']) opt.headers['Content-Type']='application/json';
    const r = await fetch(w.url, opt);
    if (!r.ok) throw new Error(w.method||'GET'+' '+w.url+' → HTTP '+r.status);
    return r.status===204 ? null : r.json();
  }

  return {
    /** 选方案并填参数；返回 false 表示未配置（纯前端模式） */
    configure(preset, params){
      if(!PRESETS[preset]) throw new Error('未知方案 '+preset);
      cfg = PRESETS[preset](params); cfg._preset = preset;
      return true;
    },
    enabled(){ return !!cfg; },
    async pull(){
      if(!cfg) return null;
      const j = await req(cfg.read);
      return cfg.read.unwrap ? cfg.read.unwrap(j) : j;
    },
    async push(){
      if(!cfg) throw new Error('Cloud 未配置');
      if (cfg.beforeWrite) await cfg.beforeWrite(cfg.write);
      const j = await req(cfg.write);
      if (cfg.parseWrite) cfg.parseWrite(j);
      return j;
    },
    /** 一键：拉远端→按现有 mergeDB 思路合并→写回（粗略，正式启用请细化） */
    async sync(){
      const remote = await this.pull();
      if (remote && window.mergeRemoteDB) window.mergeRemoteDB(remote);   // 接入点：app.js 合并函数
      return this.push();
    },
  };
})();
window.Cloud = Cloud;
