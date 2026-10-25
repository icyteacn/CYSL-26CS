/* ============================================================
   CYSL Studio 层 — 工作推进台 / 学习地图 / 立项成果中心 / 更多
   依赖 app.js 全局：DB FEED SPEC CATS CAT_ICON PSTATUS BRANCH
   st() specRows() index() realRecords() mergedVols() studyAll()
   esc fmt fmtYMD modal closeModal toast canEdit role ROLE_NAME
   ============================================================ */
'use strict';

/* ---------- 学习地图进度（localStorage 持久化） ---------- */
const LM_KEY='cysl_lm_done';
function lmDone(){try{return new Set(JSON.parse(localStorage.getItem(LM_KEY)||'[]'))}catch(e){return new Set()}}
function lmSave(s){localStorage.setItem(LM_KEY,JSON.stringify([...s]))}

/* ---------- SVG 进度环 ---------- */
function ringSVG(pct,txt,lab,size=92){const r=(size-10)/2,c=2*Math.PI*r,off=c*(1-Math.min(100,pct)/100);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/>
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#wg)" stroke-width="7"
    stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
    transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .8s"/>
  <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f6d9a0"/><stop offset="1" stop-color="#e8b45a"/></linearGradient></defs>
  <text x="${size/2}" y="${size/2-2}" text-anchor="middle" fill="#fff" font-size="16" font-weight="800">${txt}</text>
  <text x="${size/2}" y="${size/2+14}" text-anchor="middle" fill="rgba(255,255,255,.75)" font-size="9">${lab}</text></svg>`}

/* ============================================================
   工作推进台 —— 诊断→行动闭环
   ============================================================ */
function pgWorkbench(){const s=st(),rows=specRows(),pg=$('#pg');
  const todos=[];
  rows.filter(r=>r.pct<100).sort((a,b)=>a.pct-b.pct).slice(0,4).forEach(r=>
    todos.push({pri:'mid',icon:'📊',t:`「${r.name}」进度 ${r.n}/${r.quota}`,
      sub:`制度要求年 ${r.quota} 次 · 还差 ${r.quota-r.n} 次`,go:'#/records',act:'去留痕'}));
  s.reminders.forEach(r=>todos.push({pri:r.lvl==='bad'?'high':'mid',
    icon:r.lvl==='bad'?'🚨':'⏰',t:r.t,sub:r.sub,go:r.go,act:'处理'}));
  if(s.next){const d=Math.ceil((day0(s.next.date)-today())/864e5);
    todos.unshift({pri:'high',icon:'🗓',t:`${d===0?'今天':d+'天后'}有活动：「${s.next.title}」`,
      sub:`${fmtYMD(s.next.date)} · ${s.next.location||''} · 建议提前发通知+备好签到`,go:'#/record/'+s.next.id,act:'查看'});}
  const y=new Date().getFullYear(),volY=mergedVols().filter(v=>new Date(v.date).getFullYear()===y);
  if(volY.length<3)todos.push({pri:'low',icon:'♥',t:'志愿时长记录偏少',
    sub:`本年度仅 ${volY.length} 条 · 及时登记迎检有据`,go:'#/volunteer',act:'去登记'});
  const proj=DB.projects.filter(p=>p.status<2);
  proj.slice(0,2).forEach(p=>todos.push({pri:'low',icon:'🚀',t:`推进立项「${p.name}」`,
    sub:`当前进度 ${p.progress}% · ${PSTATUS[p.status]}`,go:'#/project/'+p.id,act:'查看'}));
  const order={high:0,mid:1,low:2};
  todos.sort((a,b)=>order[a.pri]-order[b.pri]);
  const idx=index();
  pg.innerHTML=`
  <div class="page-h"><h2>工作推进台</h2><span class="hint">制度缺口 · 证据待补 · 一键跳转处理</span></div>
  <div class="wb-hero">
    <div class="t">支部建设综合指数 ${idx}%</div>
    <div class="s">三会两制一课 ${rows.filter(r=>r.pct>=100).length}/${rows.length} 项达标 · 累计留痕 ${s.recCnt} 场 · 三件套完备 ${s.doneCnt} 场</div>
    <div class="wb-ring">${ringSVG(idx,idx+'%','综合指数')}
      <div style="flex:1;min-width:0">
        ${rows.slice(0,4).map(r=>`<div class="vrow" style="padding:4px 0"><span class="nm" style="color:#fff;opacity:.85;width:86px;font-size:11px">${r.name}</span>
          <span class="bar" style="background:rgba(255,255,255,.15)"><i style="width:${r.pct}%;background:linear-gradient(90deg,#f6d9a0,#e8b45a)"></i></span>
          <span class="hv" style="color:#f6d9a0;width:44px;font-size:11px">${r.n}/${r.quota}</span></div>`).join('')}
      </div></div></div>
  <div class="wb-sect">待办清单 · 按优先级排序（${todos.length}）</div>
  ${todos.length?todos.map(t=>`<div class="todo-item">
    <span class="pri ${t.pri}">${t.icon}</span>
    <span class="tx"><b>${esc(t.t)}</b><small>${esc(t.sub)}</small></span>
    <a class="go" href="${t.go}">${t.act||'处理'} ›</a></div>`).join('')
    :'<div class="empty"><span class="big">✅</span>全部达标，支部建设运行良好</div>'}
  <div class="wb-sect">快捷入口</div>
  <div class="grid g3">
    ${canEdit()?'<button class="btn" onclick="editRecord()">＋ 新建留痕</button>':'<a class="btn" href="#/records" style="text-align:center">🗂 浏览台账</a>'}
    <a class="btn ghost" href="#/impact" style="text-align:center">✦ 成果汇报中心</a>
    <a class="btn ghost" href="#/official" style="text-align:center">📣 官方公示</a>
  </div>`}

/* ============================================================
   学习地图 —— 专题路径 + 完成勾选
   ============================================================ */
function pgLearning(){const pg=$('#pg'),done=lmDone(),all=studyAll();
  const groups={};all.forEach(k=>{const c=k.c||'综合学习';(groups[c]=groups[c]||[]).push(k)});
  const tracks=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length);
  const icons={};
  const icoPool=['📚','🧭','🚩','⭐','📰','🎯','🌟','📜','🔖','✏️'];
  const icoOf=c=>icons[c]||(icons[c]=icoPool[Object.keys(icons).length%icoPool.length]);
  const totalDone=tracks.reduce((s,[c,items])=>s+items.filter(i=>done.has(i.t)).length,0);
  pg.innerHTML=`
  <div class="page-h"><h2>学习地图</h2><span class="hint">${all.length} 条官方资料 · ${tracks.length} 条路径 · 已学 ${totalDone} 篇</span></div>
  <div class="kpi-grid" style="margin-bottom:14px">
    <div class="kpi"><b>${tracks.length}</b><span>专题路径</span></div>
    <div class="kpi"><b>${all.length}</b><span>资料总数</span></div>
    <div class="kpi"><b>${totalDone}</b><span>已学完</span></div>
    <div class="kpi"><b>${all.length?Math.round(totalDone/all.length*100):0}%</b><span>完成率</span></div></div>
  ${tracks.map(([c,items],i)=>{const d=items.filter(x=>done.has(x.t)).length,pct=Math.round(d/items.length*100);
    return `<div class="lm-track ${i<1?'open':''}" id="lm-${i}">
    <div class="lm-head" onclick="document.getElementById('lm-${i}').classList.toggle('open')">
      <span class="ic" data-o="${icoOf(c)}" style="background:${pct>=100?'#e2f2e8':'#faf0da'}">${pct>=100?'✅':icoOf(c)}</span>
      <span class="tx"><b>${esc(c)}</b><small>${items.length} 篇 · 已学 ${d} 篇</small></span>
      <span class="pct">${pct}%</span><span class="arrow">›</span></div>
    <div class="lm-body">${items.map(k=>{const dn=done.has(k.t);
      return `<div class="lm-item ${dn?'done':''}" data-t="${esc(k.t)}">
      <span class="box" onclick="lmToggle(this.parentElement)">✓</span>
      <span class="tx" onclick="lmView(this.parentElement.dataset.t)"><b>${esc(k.t)}</b><small>${esc(k.s||'')}</small></span>
      ${k.u?`<a class="src" href="${esc(k.u)}" target="_blank" rel="noopener">原文 ↗</a>`:''}</div>`}).join('')}</div></div>`}).join('')}`}
window.lmToggle=el=>{const t=el.dataset.t,s=lmDone();s.has(t)?s.delete(t):s.add(t);lmSave(s);
  el.classList.toggle('done');
  const track=el.closest('.lm-track'),items=[...track.querySelectorAll('.lm-item')],
  dn=items.filter(i=>i.classList.contains('done')).length,tot=items.length;
  track.querySelector('.pct').textContent=Math.round(dn/tot*100)+'%';
  track.querySelector('.tx small').textContent=tot+' 篇 · 已学 '+dn+' 篇';
  const ic=track.querySelector('.ic');ic.textContent=dn===tot?'✅':ic.dataset.o;
  toast(s.has(t)?'已标记学完':'取消标记')};
window.lmView=t=>{const k=studyAll().find(x=>x.t===t);if(!k)return;
  modal(`<h3 style="margin-bottom:8px">${esc(k.t)}</h3>
  <div style="font-size:11.5px;color:var(--mut);margin-bottom:10px">${esc(k.c||'')} · ${esc(k.s||'')}</div>
  <div class="copy-block" style="max-height:50vh;overflow:auto">${esc(k.b||'（暂无摘要）')}</div>
  <div class="mrow" style="margin-top:14px">
    ${k.u?`<a class="btn" href="${esc(k.u)}" target="_blank" rel="noopener" style="flex:1;text-align:center">查看原文 ↗</a>`:''}
    <button class="btn ghost" onclick="closeModal()">关闭</button></div>`)};

/* ============================================================
   立项成果中心 —— 证据目录 + 汇报生成
   ============================================================ */
function pgImpact(){const s=st(),rows=specRows(),pg=$('#pg');
  const rec=realRecords(),vol=mergedVols(),study=studyAll();
  const photoAll=rec.reduce((n,r)=>n+(r.photos||0),0);
  const urlPhotos=rec.reduce((n,r)=>n+((r.photoUrls||[]).length),0);
  const ev=[
    {done:rows.filter(r=>r.pct>=100).length>=6,t:'「三会两制一课」制度留痕台账',
     sub:`${rows.filter(r=>r.pct>=100).length}/${rows.length} 项达标 · ${s.recCnt} 场活动全部可溯`,where:'#/records'},
    {done:photoAll+urlPhotos>0,t:'现场照片 / 影像证据库',
     sub:`本地照片 ${photoAll} 张 + 云端下发 ${urlPhotos} 张 · 随记录关联`,where:'#/records'},
    {done:s.doneCnt>0,t:'签到表+会议纪要+归档 三件套',
     sub:`${s.doneCnt}/${s.recCnt} 场完备 · 会后3日归档率 ${s.recCnt?Math.round(s.doneCnt/s.recCnt*100):0}%`,where:'#/records'},
    {done:vol.length>0,t:'志愿服务公示台账',
     sub:`${vol.length} 条 · 累计 ${s.volHours} 小时 · 可逐条溯源`,where:'#/volunteer'},
    {done:study.length>0,t:'组织学习资料库',
     sub:`${study.length} 篇官方学习资料 · 含学习地图进度追踪`,where:'#/learning'},
    {done:true,t:'数字化工具系统（本系统）',
     sub:'App 留痕+OTA自更新 · 会中工具箱 · 智慧团建导出助手 · 本工作台',where:'#/system'},
    {done:false,t:'结项报告定稿与路演材料',sub:'下方"生成汇报文本"可起草 · 配图建议用成果中心截图',where:null},
    {done:false,t:'成员使用反馈与案例',sub:'建议收集 3-5 条支委/团员使用体验作为佐证',where:null}];
  const doneN=ev.filter(e=>e.done).length;
  pg.innerHTML=`
  <div class="page-h"><h2>立项成果中心</h2><span class="hint">证据自动汇总 · 汇报一键生成 · 差距一目了然</span></div>
  <div class="impact-hero">
    <div class="stage">团立项 · 数字化支部建设体系</div>
    <h1>「智慧留痕」团支部数字化建设<br>全周期工作系统</h1>
    <div class="tags">${DB.projects.map(p=>`<span class="tag">🚀 ${esc(p.name.slice(0,14))} ${PSTATUS[p.status]}</span>`).join('')}
      <span class="tag">📡 feed v${FEED?FEED.version:'—'}</span></div></div>
  <div class="kpi-grid" style="margin-top:14px">
    <div class="kpi"><b>${s.recCnt}</b><span>留痕活动</span></div>
    <div class="kpi"><b>${s.doneCnt}</b><span>三件套完备</span></div>
    <div class="kpi"><b>${photoAll+urlPhotos}</b><span>照片证据</span></div>
    <div class="kpi"><b>${s.volHours}h</b><span>志愿时长</span></div>
    <div class="kpi"><b>${s.total}</b><span>覆盖成员</span></div>
    <div class="kpi"><b>${study.length}</b><span>学习资料</span></div>
    <div class="kpi"><b>${rows.filter(r=>r.pct>=100).length}/${rows.length}</b><span>制度达标</span></div>
    <div class="kpi"><b>${doneN}/${ev.length}</b><span>证据就绪</span></div></div>
  <div class="wb-sect">证据目录 · 点击跳转自查（${doneN}/${ev.length} 就绪）</div>
  <div class="card">${ev.map(e=>`<div class="ev-item">
    <span class="st ${e.done?'done':'todo'}">${e.done?'✓':'○'}</span>
    <span class="tx"><b>${esc(e.t)}</b><small>${esc(e.sub)}</small></span>
    ${e.where?`<a style="align-self:center;font-size:12px;color:var(--red-d);font-weight:600;padding:6px 10px;border-radius:9px;background:#fbeaea;flex-shrink:0" href="${e.where}">查看 ›</a>`:''}
  </div>`).join('')}</div>
  <div class="wb-sect">汇报材料生成</div>
  <div class="grid g3 noprint">
    <button class="btn" onclick="genImpact()">📄 生成立项汇报文本</button>
    <button class="btn ghost" onclick="copyLedger()">📋 复制台账摘要</button>
    <button class="btn line" onclick="window.print()">🖨 打印 / 存 PDF</button></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>系统功能清单（评审可逐项演示）</h3>
    <div class="copy-block">${impactFeatures()}</div></div>`}
function impactFeatures(){return [
 '【App 端 · 智团慧建】',
 '· 本地优先留痕台账：三会两制一课/主题团日/志愿/谈心谈话等 12 类，照片+附件+签到+纪要四联证据',
 '· 建设指数引擎：六维雷达 + 年度进度环形图，三件套质量系数加权，自动诊断薄弱维度',
 '· 洞察→行动闭环：缺席≥2次自动生成谈心谈话草稿；雷达弱项一键预填新活动',
 '· 会中工具箱：主持脚卡（时间戳→纪要骨架）、发言计时、表决计数',
 '· 智慧团建导出助手：记录一键排版为官方录入字段，复制即录',
 '· 排期助手：按课表冲突推荐开会时段，一键生成通知文案',
 '· OTA 自更新：多源竞速+分段并行下载，版本化 APK 发布链',
 '· 隐私设计：成员仅显示"政治面貌+尾号"，口令门控编辑，数据仅存本机',
 '',
 '【Web 端 · CYSL 工作台】',
 '· 支部建设工作台：综合指数、待办优先级、制度雷达、倒计时',
 '· 官方台账同步：feed 单向下发，App/网页免更新拉取',
 '· 学习地图：官方资料按专题路径组织，完成度持久化',
 '· 立项成果中心：证据自动清点、汇报文本生成、打印导出',
 '· 扫码签到：记录页生成二维码，成员手机签到实时入册',
 '· 深色模式 / 移动端全适配 / 打印友好'].join('\n')}
window.genImpact=()=>{const s=st(),rows=specRows();
  const txt=`${BRANCH}\n「智慧留痕」团支部数字化建设系统 · 立项成果汇报\n${'='.repeat(46)}\n生成时间：${fmt(Date.now())}\n\n一、建设背景\n  针对支部工作"留痕难、检查繁、工具散"痛点，自主研发覆盖\n  会前-会中-会后-平时的全周期数字化工作系统（App+Web 双端）。\n\n二、建设成效（系统实时统计）\n  · 留痕活动 ${s.recCnt} 场，三件套完备 ${s.doneCnt} 场\n  · "三会两制一课" ${rows.filter(r=>r.pct>=100).length}/${rows.length} 项制度达标\n${rows.map(r=>`    - ${r.name} ${r.n}/${r.quota} ${r.pct>=100?'✓':''}`).join('\n')}\n  · 志愿时长累计 ${s.volHours} 小时（${s.volCnt} 人次）\n  · 学习资料库 ${studyAll().length} 篇，覆盖 ${s.total} 名成员\n\n三、创新点\n  1. 本地优先+官方下发的双层数据架构：支委本地留痕，\n     上级经隐藏 feed 通道下发台账，免更新同步全端。\n  2. 洞察→行动闭环：指数诊断自动派生待办（缺席关怀、\n     制度缺口补录），杜绝"看了指数不知道干什么"。\n  3. 会中实时工具链：签到二维码、主持脚卡、计时表决，\n     会议纪要骨架随议程自动生成。\n  4. 与智慧团建协同而非替代：一键生成录入字段，复制即报。\n\n四、可演示清单\n  App：指数页/待办一键成稿/会中工具箱/OTA 自更新\n  Web：工作台/学习地图/本成果中心/扫码签到\n\n——本汇报由 CYSL 数字化工作台自动生成，数据实时可复核`;
  modal(`<h3>立项汇报文本</h3><div class="copy-block" style="max-height:52vh;overflow:auto">${esc(txt)}</div>
  <div class="mrow" style="margin-top:12px">
    <button class="btn" style="flex:1" onclick="navigator.clipboard.writeText(window.__imp).then(()=>toast('已复制'))">📋 复制全文</button>
    <button class="btn ghost" onclick="window.print()">🖨 打印</button>
    <button class="btn ghost" onclick="closeModal()">关闭</button></div>`);
  window.__imp=txt};

/* ============================================================
   更多 —— 全功能索引
   ============================================================ */
function pgMore(){const pg=$('#pg');
  const tiles=[['volunteer','♥','志愿服务','时长公示台账'],['projects','🚀','团立项','进度与材料'],
   ['party','🏛','推优入党','培养考察链'],['knowledge','📖','学习资料','制度与原文库'],
   ['calendar','📅','支部日历','月度视图'],['members','👥','成员名册','构成与工时'],
   ['official','📣','官方公示','公示与发布'],['system','⚙','体系建设','年报·荣誉·设置'],
   ['showcase','✦','名片展示','投屏汇报模式'],['checkin','📱','扫码签到','活动签到入口']];
  pg.innerHTML=`<div class="page-h"><h2>全部功能</h2><span class="hint">十个模块 · 点击直达</span></div>
  <div class="more-grid">${tiles.map(([k,i,n,d])=>`<a class="more-tile" href="#/${k}">
    <span class="i">${i}</span><b>${n}</b><span>${d}</span></a>`).join('')}</div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>关于本系统</h3>
  <div style="font-size:12.5px;line-height:1.8;color:var(--mut)">
  智团慧建（App）× CYSL 工作台（Web）双端联动 · 数据本地优先 · 官方 feed 单向下发<br>
  当前 feed 版本：v${FEED?FEED.version:'—'} · 记录 ${realRecords().length} 条 · 成员 ${DB.members.length} 人</div></div>`}

/* ---------- 路由注册 ---------- */
routes.workbench=pgWorkbench;routes.learning=pgLearning;
routes.impact=pgImpact;routes.more=pgMore;
