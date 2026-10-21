/* ============================================================
 * CYSL · 团支部数字化建设体系工作台
 * 纯静态 SPA：localStorage 数据层 + 哈希路由 + Canvas 图表
 * 隐私设计：默认占位姓名、口令锁、脱敏模式、数据不出本机
 * ============================================================ */
'use strict';

/* ================= 常量 ================= */
const DB_KEY='cysl_db_v1', AUTH_KEY='cysl_auth', SET_KEY='cysl_set';
const BRANCH='计算机与网络空间安全学院2026级硕士研究生1班团支部';
const CATS=['支部团员大会','支部委员会','团小组会','团员教育评议','年度团籍注册','团课','主题团日','志愿活动','推优入党','谈心谈话','立项活动','其他'];
const CAT_ICON={'支部团员大会':'🏛️','支部委员会':'📋','团小组会':'👥','团员教育评议':'⭐','年度团籍注册':'🪪','团课':'📖','主题团日':'🚩','志愿活动':'💗','推优入党':'🌟','谈心谈话':'💬','立项活动':'🚀','其他':'📌'};
const SPEC=[ /* 制度 → 年度要求次数（0=按需） */
 ['支部团员大会','团员大会',4],['支部委员会','支委会',12],['团小组会','团小组会',6],
 ['团员教育评议','教育评议',1],['年度团籍注册','团籍注册',1],['团课','团课',4],
 ['主题团日','主题团日',4],['谈心谈话','谈心谈话',4]];
const PSTATUS=['申报中','进行中','已结项','获评优秀'];
const DEFAULT_CODE='cysl26'; // 初始管理口令（README 注明，可在"体系"页修改）
const SITE=location.origin+location.pathname;

/* ================= 工具 ================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>{const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmtYMD=t=>fmt(t).replaceAll('-','.');
const day0=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const today=()=>day0(Date.now());
const uid=()=>Date.now()+Math.floor(Math.random()*1e4);
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
function toast(msg){const d=document.createElement('div');d.className='tst';d.textContent=msg;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2400)}
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}

/* ================= 数据层 ================= */
function seed(){
  const members=[];
  const roles=['团支部书记','副书记','组织委员','宣传委员'];
  const ROSTER=[[50,'共青团员'],[51,'中共党员'],[52,'共青团员'],[53,'群众'],[55,'中共党员'],[56,'群众'],
    [57,'共青团员'],[58,'中共党员'],[59,'共青团员'],[60,'群众'],[61,'共青团员'],[62,'共青团员'],
    [63,'共青团员'],[64,'共青团员'],[65,'中共党员'],[66,'共青团员'],[67,'共青团员'],[68,'群众'],
    [69,'共青团员'],[70,'群众'],[71,'群众'],[72,'共青团员'],[73,'共青团员'],[74,'群众'],[75,'共青团员'],
    [77,'中共党员'],[77,'共青团员'],[78,'群众'],[79,'共青团员'],[80,'中共党员'],[81,'共青团员'],
    [82,'共青团员'],[84,'共青团员'],[85,'共青团员']];
  ROSTER.forEach(([tail,pol],i)=>{
    const kind=pol.includes('党员')?'党员':pol.includes('群众')?'群众':'团员';
    members.push({id:i+1,name:kind+tail,sid:String(tail),political:pol,role:''})});
  const Y=2025; // 示例学年（2025-2026），全部为可编辑模板
  const R=(cat,mm,dd,title,summary,extra={})=>({id:uid()+Math.floor(Math.random()*1e3),category:cat,title,
    date:new Date(Y+(mm>=9?0:1),mm-1,dd).getTime(),location:'【示例】旗山校区',attendees:0,
    host:'________',summary,signin:false,minutes:false,synced:false,archived:false,photos:0,projectId:0,...extra});
  const records=[
    R('支部团员大会',9,20,'【示例】秋季学期第一次支部团员大会','【示例模板】传达上级团组织工作要求，讨论本学期支部建设计划。请按实际召开情况填写。',{signin:true,minutes:true,attendees:26}),
    R('支部团员大会',12,20,'【示例】秋季学期第二次支部团员大会','【示例模板】年度工作总结与民主议事。请按实际填写。'),
    R('支部团员大会',3,15,'【示例】春季学期支部团员大会','【示例模板】新学期工作部署。请按实际填写。'),
    R('支部团员大会',6,14,'【示例】学年总结支部团员大会','【示例模板】学年工作评议。请按实际填写。'),
    R('支部委员会',9,6,'【示例】9月支委会','【示例模板】月度支委会例会。请按实际填写。',{signin:true,minutes:true}),
    R('支部委员会',10,11,'【示例】10月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',11,8,'【示例】11月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',12,6,'【示例】12月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',1,10,'【示例】1月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',3,7,'【示例】3月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',4,11,'【示例】4月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',5,9,'【示例】5月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('支部委员会',6,6,'【示例】6月支委会','【示例模板】月度支委会例会。请按实际填写。'),
    R('团小组会',10,18,'【示例】团小组专题学习会','【示例模板】以团小组为单位开展学习研讨。请按实际填写。'),
    R('团员教育评议',12,27,'【示例】年度团员教育评议','【示例模板】对照团员先进性评价标准开展评议。请按实际填写。'),
    R('年度团籍注册',1,8,'【示例】年度团籍注册','【示例模板】组织全体团员完成年度团籍注册。请按实际填写。'),
    R('团课',10,25,'【示例】主题团课：党的创新理论学习','【示例模板】邀请老师/支书讲授团课。请按实际填写。'),
    R('团课',11,22,'【示例】主题团课：团章团史学习','【示例模板】请按实际填写。'),
    R('团课',4,18,'【示例】主题团课：青年使命与担当','【示例模板】请按实际填写。'),
    R('团课',5,16,'【示例】主题团课：网络安全与青年责任','【示例模板】结合专业特色开展。请按实际填写。'),
    R('主题团日',10,15,'【示例】"网络安全为人民"主题团日','【示例模板】参考学院网络安全宣传周活动形式开展。请按实际填写。',{signin:true,minutes:true,attendees:30}),
    R('主题团日',3,22,'【示例】"学雷锋"志愿服务主题团日','【示例模板】请按实际填写。'),
    R('主题团日',5,4,'【示例】"五四精神传承"主题团日','【示例模板】请按实际填写。'),
    R('志愿活动',11,1,'【示例】校园文明引导志愿服务','【示例模板】请按实际填写。'),
    R('谈心谈话',10,30,'【示例】支委与团员谈心谈话','【示例模板】支委分工联系团员开展谈心谈话。请按实际填写。'),
    R('推优入党',4,25,'【示例】推优入党评议','【示例模板】按程序开展推优入党工作。请按实际填写。'),
    R('立项活动',9,28,'【示例】"智慧留痕"立项启动会','【示例模板】支部工作立项启动部署。请按实际填写。',{signin:true,minutes:true,projectId:1}),
  ];
  const projects=[{id:1,name:'"智慧留痕"——基于数字化平台的先进团支部建设维护体系构建',category:'组织建设',
    status:1,progress:30,startMillis:new Date(Y,8,1).getTime(),endMillis:new Date(Y+1,5,30).getTime(),
    target:'围绕"三会两制一课"制度落实，建成一套"低负担、全自动、强留痕"的团支部数字化建设维护体系：以"支部留痕"App与配套网页工作台为载体，实现活动留痕标准化、签到统计自动化、建设情况可视化、迎检材料一键生成。',
    basis:'【立项依据】\n一、上级要求：《中国共产主义青年团支部工作条例（试行）》明确"三会两制一课"制度要求，校院团委持续推进团支部标准化、规范化建设，鼓励运用信息化手段提升基层团务效能。\n二、现实痛点：传统留痕依赖纸质签到、手工台账与分散的照片存储，存在"记录散、归档慢、核查难"三大问题；支委重复劳动多，团员青年配合意愿低。\n三、支部特色：本支部为计算机与网络空间安全专业研究生团支部，具备将专业技术转化为团建效能的独特优势；成员普遍熟悉信息化工具，数字化留痕接受度高、推广阻力小。\n四、可行性：App采用本地化存储保障隐私安全，网页工作台支持大屏展示与数据互通，技术栈成熟、维护成本低、可复制推广。',
    plan:'【实施方案】分四阶段推进：\n第一阶段·体系搭建（9月）：完成数字化留痕体系设计，部署App与网页工作台，制定《支部留痕操作规范》，明确"三件套"标准（签到表+会议记录+现场照片）与3日归档时限。\n第二阶段·全员应用（10-12月）：支部委员带头，全体团员活动全程数字化签到留痕；每月支委会检查留痕完整度，首页"规范度提醒"自动巡检缺口；志愿服务时长随活动同步登记。\n第三阶段·深化运行（次年3-5月）：活动日历、扫码签到、倒计时提醒全面启用；结合主题团日、团课形成"活动-留痕-统计-展示"闭环；展示屏用于支部大会、迎检汇报等场景。\n第四阶段·总结推广（次年6月）：一键生成年度建设报告，整理留痕证据链参加校级立项评审与"百佳/三十佳"支部评选；面向全院团支部输出可复制经验。\n【预期成果】①"三会两制一课"留痕覆盖率100%；②形成数字化团支部建设SOP一份；③支部建设指数可视化看板一套；④迎检材料生成时间由数日缩短至分钟级。\n【保障措施】支委分工负责制+每月自查+隐私安全设计（数据本地存储、占位姓名、口令权限分级）。',
    outcome:'',createdAt:Date.now()}];
  return{members,records,volunteers:[],projects,honors:[],createdAt:Date.now()};
}
let DB=null;
function load(){try{DB=JSON.parse(localStorage.getItem(DB_KEY))}catch(e){}if(!DB||!DB.members){DB=seed();save()}}
function save(){localStorage.setItem(DB_KEY,JSON.stringify(DB));emit()}
const emit=debounce(()=>{if(cur==='dashboard')render(pgDash)},400);
const nextId=a=>a.reduce((m,x)=>Math.max(m,x.id||0),0)+1;

/* ================= 身份/口令 ================= */
const SET=()=>{try{return JSON.parse(localStorage.getItem(SET_KEY))||{}}catch(e){return{}}};
function setSet(k,v){const s=SET();s[k]=v;localStorage.setItem(SET_KEY,JSON.stringify(s))}
const auth=()=>{try{return JSON.parse(sessionStorage.getItem(AUTH_KEY))}catch(e){return null}};
const role=()=>(auth()||{}).role||'guest';
const canEdit=()=>role()==='committee';
const ROLE_NAME={committee:'团支书/委员',member:'共青团员',youth:'青年群众',guest:'访客'};
async function codeOK(input){const s=SET();const h=await sha(input);return s.codeHash?h===s.codeHash:input===DEFAULT_CODE}
function mask(n){if(!SET().privacy)return n;return n.replace(/^(\S)/,'$1**')}

/* ================= 统计 ================= */
function st(){
  const now=Date.now();
  const rec=DB.records,vol=DB.volunteers;
  const comp=m=>m.political!=='群众'&&m.political!=='境外线上团员',yout=m=>m.political==='群众';
  const done=r=>r.signin&&r.minutes&&r.archived;
  const cnt=(cat,yr)=>rec.filter(r=>r.category===cat&&new Date(r.date).getFullYear()===yr).length;
  const yr=new Date().getFullYear();
  const next=rec.filter(r=>r.date>=today()).sort((a,b)=>a.date-b.date)[0];
  const reminders=[];
  rec.forEach(r=>{if(!(r.signin&&r.minutes))reminders.push({t:`「${r.title}」三件套待补全`,sub:fmtYMD(r.date)+' · '+r.category,lvl:'bad',go:'#/record/'+r.id})});
  const mo=new Date().getMonth();
  if(!rec.some(r=>r.category==='支部委员会'&&new Date(r.date).getMonth()===mo&&new Date(r.date).getFullYear()===yr))
    reminders.push({t:'本月支部委员会尚未开展',sub:'制度要求每月不少于1次',lvl:'warn',go:'#/records'});
  const q=Math.floor(mo/3);
  [['支部团员大会','支部团员大会'],['团课','团课']].forEach(([c,n])=>{
    if(!rec.some(r=>r.category===c&&Math.floor(new Date(r.date).getMonth()/3)===q&&new Date(r.date).getFullYear()===yr))
      reminders.push({t:`本季度「${n}」待开展`,sub:'制度要求每季度不少于1次',lvl:'warn',go:'#/records'});});
  rec.forEach(r=>{if(r.signin&&r.minutes&&!r.synced)reminders.push({t:`「${r.title}」未同步智慧团建`,sub:fmtYMD(r.date),lvl:'warn',go:'#/record/'+r.id})});
  return{memberCnt:DB.members.filter(comp).length,youthCnt:DB.members.filter(yout).length,
    total:DB.members.length,recCnt:rec.length,photoCnt:rec.reduce((s,r)=>s+(r.photos||0),0),
    volHours:vol.reduce((s,v)=>s+v.hours,0),volCnt:vol.length,
    doneCnt:rec.filter(done).length,next,reminders:reminders.slice(0,8),yr,cnt};
}
function specRows(){const y=new Date().getFullYear();
  return SPEC.map(([name,cat,quota])=>{const n=DB.records.filter(r=>r.category===cat&&new Date(r.date).getFullYear()===y).length;
    return{name,cat,quota,n,pct:quota?Math.min(100,Math.round(n/quota*100)):100}})}
function index(){const rows=specRows();const six=rows.slice(0,6);
  const pct=six.reduce((s,r)=>s+r.pct,0)/six.length;
  const complete=DB.records.length?DB.records.filter(r=>r.signin&&r.minutes&&r.archived).length/DB.records.length*100:0;
  return Math.round(pct*.7+complete*.3)}

/* ================= 图表 ================= */
function ring(cv,pct,size=170){const c=cv.getContext('2d'),w=cv.width=cv.height=(size*devicePixelRatio);
  cv.style.width=cv.style.height=size+'px';c.scale(devicePixelRatio,devicePixelRatio);
  const cx=size/2,r=cx-13,lw=12;c.lineCap='round';
  c.strokeStyle='#efe3d8';c.lineWidth=lw;c.beginPath();c.arc(cx,cx,r,0,7);c.stroke();
  const g=c.createLinearGradient(0,0,size,size);g.addColorStop(0,'#e8b45a');g.addColorStop(1,'#c62828');
  c.strokeStyle=g;c.beginPath();c.arc(cx,cx,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(100,pct)/100);c.stroke();
  c.fillStyle='#8f1d22';c.font='800 '+(size*.21)+'px system-ui';c.textAlign='center';c.textBaseline='middle';
  c.fillText(Math.round(pct),cx,cx-6);c.font='11px system-ui';c.fillStyle='#8a7b76';c.fillText('建设指数',cx,cx+size*.15)}
function radar(cv,vals,size=200){const c=cv.getContext('2d');cv.width=cv.height=size*devicePixelRatio;
  cv.style.width=cv.style.height=size+'px';c.scale(devicePixelRatio,devicePixelRatio);
  const cx=size/2,cy=size/2,r=size/2-30,n=vals.length;
  for(let ring=1;ring<=4;ring++){c.beginPath();for(let i=0;i<=n;i++){const a=-Math.PI/2+i*2*Math.PI/n,rr=r*ring/4;
    c[i?'lineTo':'moveTo'](cx+rr*Math.cos(a),cy+rr*Math.sin(a))}c.strokeStyle='#eee0d4';c.stroke()}
  for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;c.beginPath();c.moveTo(cx,cy);
    c.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));c.strokeStyle='#eee0d4';c.stroke()}
  c.beginPath();vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,rr=r*Math.min(100,v)/100;
    c[i?'lineTo':'moveTo'](cx+rr*Math.cos(a),cy+rr*Math.sin(a))});c.closePath();
  c.fillStyle='rgba(198,40,40,.16)';c.fill();c.strokeStyle='#c62828';c.lineWidth=2;c.stroke();
  vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,rr=r*Math.min(100,v)/100;
    c.beginPath();c.arc(cx+rr*Math.cos(a),cy+rr*Math.sin(a),3,0,7);c.fillStyle='#8f1d22';c.fill()});
  c.fillStyle='#6b5a50';c.font='10.5px system-ui';c.textAlign='center';
  vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;c.fillText(['大会','支委','小组','评议','注册','团课'][i],
    cx+(r+16)*Math.cos(a),cy+(r+15)*Math.sin(a)+3)})}
function bars(cv,items,h=170){const c=cv.getContext('2d');cv.width=cv.clientWidth*devicePixelRatio;cv.height=h*devicePixelRatio;
  cv.style.height=h+'px';c.scale(devicePixelRatio,devicePixelRatio);const W=cv.clientWidth;
  if(!items.length)return;const max=Math.max(...items.map(i=>i.v),1),nw=86,vw=44;
  const bw=W-nw-vw-16,ih=Math.min(20,(h-10)/items.length-4);
  items.forEach((it,i)=>{const y=6+i*((h-12)/items.length);
    c.fillStyle='#5a4a42';c.font='11.5px system-ui';c.textAlign='right';c.textBaseline='middle';
    c.fillText(it.n.length>6?it.n.slice(0,6):it.n,nw-8,y+ih/2);
    c.fillStyle='#efe6dc';rr(c,nw,y,bw,ih,ih/2);c.fill();
    const w=Math.max(4,bw*it.v/max);const g=c.createLinearGradient(nw,0,nw+bw,0);
    g.addColorStop(0,'#e8b45a');g.addColorStop(1,'#c62828');c.fillStyle=g;rr(c,nw,y,w,ih,ih/2);c.fill();
    c.fillStyle='#8f1d22';c.font='700 11.5px system-ui';c.textAlign='left';
    c.fillText((+it.v.toFixed(1))+'',nw+w+8,y+ih/2)})}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function qrURL(text,sz=200){return 'https://api.qrserver.com/v1/create-qr-code/?size='+sz+'x'+sz+'&margin=8&data='+encodeURIComponent(text)}
function qrImg(text,sz=200){return `<img src="${qrURL(text,sz)}" onerror="this.outerHTML='<div style=&quot;font-size:11px;word-break:break-all;padding:8px&quot;>${esc(text)}</div>'" alt="QR">`}

/* ================= 路由 ================= */
let cur='dashboard';
const routes={dashboard:pgDash,records:pgRecords,record:pgRecord,calendar:pgCalendar,
  volunteer:pgVol,projects:pgProjects,project:pgProject,members:pgMembers,system:pgSystem,checkin:pgCheckin,
  party:pgParty,knowledge:pgKnowledge,official:pgOfficial};
/* 深色主题 */
document.documentElement.dataset.theme=localStorage.getItem('cysl_theme')||'light';
window.toggleTheme=()=>{const d=document.documentElement;
  d.dataset.theme=d.dataset.theme==='dark'?'light':'dark';
  localStorage.setItem('cysl_theme',d.dataset.theme);nav()};
/* 数字滚动 */
window.countUp=el=>{const txt=el.textContent;const m=txt.match(/[\d.]+/);if(!m)return;
  const target=parseFloat(m[0]);const suf=txt.slice(m.index+m[0].length);const pre=txt.slice(0,m.index);
  const t0=performance.now(),dur=700;
  const step=t=>{const p=Math.min(1,(t-t0)/dur);const e=1-Math.pow(1-p,3);
    el.textContent=pre+(target%1?(target*e).toFixed(1):Math.round(target*e))+suf;
    if(p<1)requestAnimationFrame(step);else el.classList.add('num-done')};
  requestAnimationFrame(step)};
window.initFx=()=>{document.querySelectorAll('.hero .n b,.card.stat .v').forEach(countUp);
  const tb=document.querySelector('.topbar');let tt=document.getElementById('toTop');
  if(!tt){tt=document.createElement('button');tt.id='toTop';tt.innerHTML='↑';
    tt.onclick=()=>scrollTo({top:0,behavior:'smooth'});document.body.appendChild(tt)}
  addEventListener('scroll',()=>{tb&&tb.classList.toggle('slim',scrollY>40);
    tt.classList.toggle('on',scrollY>420)},{passive:true})};
function greet(){const h=new Date().getHours();
  return h<6?'夜深了':h<9?'早上好':h<12?'上午好':h<14?'中午好':h<18?'下午好':'晚上好'}
function nav(){const h=location.hash.slice(2)||'dashboard';const[name,arg]=h.split('/');
  if(!auth()){renderLock();return}
  cur=routes[name]?name:'dashboard';
  if(name==='showcase'){renderShowcase();return}
  render(()=>routes[cur](arg||decodeURIComponent(location.hash.split('?')[1]||'')))}
function render(fn){const app=$('#app');
  app.innerHTML=topbar()+`<main><div class="page" id="pg"></div></main>`+navbar();
  fn&&fn();window.scrollTo(0,0);initFx()}
function topbar(){return`<div class="topbar"><div class="brand"><span class="flag">⚑</span><div><div>CYSL 支部工作台</div>
  <div class="sub">${BRANCH}</div></div></div><div class="sp"></div>
  <span class="role-chip">${ROLE_NAME[role()]}</span>
  <button class="tbtn" onclick="toggleTheme()" title="切换深色/浅色">${document.documentElement.dataset.theme==='dark'?'☀️':'🌙'}</button>
  <a class="tbtn" href="#/calendar">📅</a>
  <a class="tbtn gold" href="#/showcase" target="_self">✦ 名片</a>
  <button class="tbtn" onclick="logout()">⇥</button></div>`}
function navbar(){const I=[['dashboard','⌂','首页'],['records','🗂','留痕'],['volunteer','♥','志愿'],['projects','🚀','立项'],['party','🏛','入党'],['knowledge','📖','学习'],['members','👥','成员'],['system','⚙','体系']];
  return`<div class="nav" style="overflow-x:auto">${I.map(([k,i,n])=>`<a href="#/${k}" class="${cur===k?'on':''}" style="flex-shrink:0"><span class="i">${i}</span>${n}</a>`).join('')}</div>`}
window.logout=()=>{sessionStorage.removeItem(AUTH_KEY);location.hash='#/dashboard';renderLock()};

/* ================= 锁屏 ================= */
function renderLock(){$('#app').innerHTML=`<div class="lock"><div class="lockbox">
  <div class="flag">⚑</div><h2>CYSL · 支部数字化工作台</h2>
  <p>${BRANCH}<br>通用团支部数字化建设体系 · 数据仅存本机 · 隐私脱敏</p>
  <button class="btn red big" style="width:100%" onclick="enterAs('member')">✊ 团员 · 青年群众 进入</button>
  <div class="lockroles">
    <button class="m-gray" onclick="toggleCode()">🔐 支委 / 支书 管理入口</button>
  </div>
  <div id="codebox" style="display:none;margin-top:10px">
    <input id="code" type="password" maxlength="20" placeholder="管理口令" autocomplete="off">
    <button class="btn" style="width:100%;margin-top:8px;background:#6b6560" onclick="unlock()">以管理身份进入</button>
  </div>
  <p style="margin-top:16px;font-size:10.5px;opacity:.5">管理口令由支委掌握，可在"体系"页修改 · 数据仅存本机</p>
  </div></div>`;const i=$('#code');i&&i.addEventListener('keydown',e=>{if(e.key==='Enter')unlock()})}
window.toggleCode=()=>{const b=$('#codebox');b.style.display=b.style.display==='none'?'block':'none';$('#code')&&$('#code').focus()};
window.enterAs=r=>{sessionStorage.setItem(AUTH_KEY,JSON.stringify({role:r,ts:Date.now()}));nav()};
window.unlock=async()=>{const v=$('#code').value.trim();
  if(await codeOK(v)){sessionStorage.setItem(AUTH_KEY,JSON.stringify({role:'committee',ts:Date.now()}));nav()}
  else toast('口令不正确')};

/* ================= 首页 ================= */
function pgDash(){const s=st(),pg=$('#pg');
  const diff=s.next?Math.max(0,Math.ceil((day0(s.next.date)-today())/864e5)):null;
  pg.innerHTML=`
  <div class="hero"><div class="greet">${greet()} · ${ROLE_NAME[role()]}</div><h1>以数字化体系，筑先进团支部</h1>
    <div class="branch">${BRANCH} · 团支部数字化建设体系</div>
    <div class="nums">
      <div class="n"><b>${s.memberCnt}</b><span>在册团员</span></div>
      <div class="n"><b>${s.youthCnt}</b><span>青年群众</span></div>
      <div class="n"><b>0</b><span>境外线上团员</span></div>
      <div class="n"><b>${s.recCnt}</b><span>留痕活动</span></div>
    </div></div>
  ${rolePanel(s)}
  <div class="grid g3" style="margin-top:14px">
    <div class="card hl"><h3><span class="dot"></span>支部建设指数</h3>
      <div class="ring-wrap"><canvas class="chart" id="ring"></canvas>
      <div class="legend">${specRows().slice(0,6).map(r=>`<div class="li"><span class="sw" style="background:${r.pct>=100?'#2e7d4f':r.pct>0?'#e8b45a':'#d8c8bc'}"></span>${r.name} ${r.n}/${r.quota}</div>`).join('')}</div></div></div>
    <div class="card hl"><h3><span class="dot"></span>三会两制一课 · 雷达</h3>
      <canvas class="chart" id="radar" style="margin:0 auto;max-width:220px"></canvas></div>
    <div class="card hl" style="background:linear-gradient(135deg,#8f1d22,#5e1216);color:#fff">
      <h3 style="color:#f6d9a0">⏳ 下次活动倒计时</h3>
      ${s.next?`<div style="font-size:13px;opacity:.9;margin-bottom:12px">${esc(s.next.title)}<br><span style="font-size:11.5px;opacity:.65">${fmtYMD(s.next.date)} · ${esc(s.next.location)}</span></div>
      <div class="cd">${['天','时','分','秒'].map(u=>`<div class="cell"><b id="cd-${u}">--</b><span>${u}</span></div>`).join('')}</div>`
      :`<div class="empty" style="color:rgba(255,255,255,.7);padding:24px 0"><span class="big">📅</span>暂无计划中的活动<br>${canEdit()?'<a class="btn sm" style="margin-top:10px" href="#/records">去安排</a>':''}</div>`}
    </div>
  </div>
  <div class="grid g4" style="margin-top:14px" id="official-card">
    <a class="card" href="#/party"><h3><span class="dot"></span>🏛 入党日程</h3><div style="font-size:12px;color:var(--mut)">全流程·五批次·材料清单</div></a>
    <a class="card" href="#/knowledge"><h3><span class="dot"></span>📚 团务知识库</h3><div style="font-size:12px;color:var(--mut)">三会两制一课·团章·推优</div></a>
    <a class="card" href="#/official"><h3><span class="dot"></span>📣 官方公告</h3><div style="font-size:12px;color:var(--mut)" id="official-hint">支委发布·自动同步</div></a>
    <a class="card" href="#/calendar"><h3><span class="dot"></span>📅 活动日历</h3><div style="font-size:12px;color:var(--mut)">月历视图·当日明细</div></a>
  </div>
  <div class="grid g4" style="margin-top:14px">
    ${[['🗂',s.recCnt,'留痕活动','#/records'],['♥',s.volHours,'志愿服务时长','#/volunteer'],
       ['📷',s.photoCnt,'照片留痕','#/records'],['✓',s.doneCnt+'/'+s.recCnt,'三件套完备','#/system']]
      .map(([i,v,l])=>`<a class="card stat" href="${l}"><span class="ico">${i}</span><span class="v">${v}</span><span class="l">${l}</span></a>`).join('')}
  </div>
  <div class="grid g3" style="margin-top:14px">
    <div class="card"><h3><span class="dot"></span>月度留痕趋势 <span class="chip">近12月</span></h3>
      <div class="bars">${(()=>{const ms=[];const now=new Date();
        for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);
          ms.push({k:d.getFullYear()+'-'+(d.getMonth()+1),l:(d.getMonth()+1)+'月',n:0})}
        DB.records.forEach(r=>{const d=new Date(r.date);const k=d.getFullYear()+'-'+(d.getMonth()+1);
          const m=ms.find(x=>x.k===k);if(m)m.n++});
        const mx=Math.max(1,...ms.map(m=>m.n));
        return ms.map((m,i)=>`<div class="b ${i===11?'hi':''}" title="${m.l}：${m.n}条"><i style="height:${Math.round(m.n/mx*100)}%"></i><span>${i===11?'本月':m.l}</span></div>`).join('')})()}</div>
      <div style="font-size:11px;color:var(--mut);margin-top:4px">柱高=当月留痕条数 · 悬停看明细</div></div>
    <div class="card"><h3><span class="dot"></span>志愿工时 TOP5</h3>
      ${(()=>{const agg={};DB.volunteers.forEach(v=>{agg[v.name]=(agg[v.name]||0)+v.hours});
        const top=Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const mx=Math.max(1,...top.map(x=>x[1]));
        return top.length?top.map(([n,h])=>`<div class="hbar"><span class="nm">${esc(mask(n))}</span>
          <span class="tr"><i style="width:${Math.round(h/mx*100)}%"></i></span>
          <span class="hv">${h}h</span></div>`).join(''):'<div class="empty" style="padding:20px">暂无志愿数据</div>'})()}</div>
    <div class="card"><h3><span class="dot"></span>类别分布</h3>
      ${(()=>{const g={'三会':0,'两制':0,'一课':0,'拓展':0};
        DB.records.forEach(r=>{const c=r.category||'';g[/大会|委员会|小组/.test(c)?'三会':/评议|注册/.test(c)?'两制':/团课/.test(c)?'一课':'拓展']++});
        const mx=Math.max(1,...Object.values(g));
        return Object.entries(g).map(([k,n])=>`<div class="hbar"><span class="nm">“${k}”</span>
          <span class="tr"><i style="width:${Math.round(n/mx*100)}%"></i></span>
          <span class="hv">${n}条</span></div>`).join('')})()}
      <div style="font-size:11px;color:var(--mut);margin-top:6px">对照《团支部工作条例》频次要求自查</div></div>
  </div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>支部动态 <a href="#/records" style="margin-left:auto;font-size:12px;font-weight:400">全部 ›</a></h3>
    <div class="feed-strip">${DB.records.slice().sort((a,b)=>b.date-a.date).slice(0,8).map(r=>`
      <a class="feed-card" href="#/record/${r.id}"><div class="fd">${fmtYMD(r.date).slice(5)} · ${esc(r.category||'')}</div>
      <div class="ft">${esc(mask(r.title))}</div>
      <div class="fm">${r.location?'📍'+esc(r.location)+' · ':''}${r.attendees||0}人到会</div></a>`).join('')
      ||'<div class="empty" style="padding:16px">暂无动态</div>'}</div></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>团务直达 <span class="chip">官方平台</span></h3>
    <div class="linkgrid">
      ${[['⚑','智慧团建','组织关系·团籍管理','https://zhtj.youth.cn/zhtj/'],
         ['♥','志愿汇','志愿服务记录认证','https://www.zyh365.com/'],
         ['📚','青年大学习','网上主题团课','https://www.gqt.org.cn/'],
         ['🏛','共青团中央','官方门户','https://www.gqt.org.cn/'],
         ['📰','中国青年报','青年舆论阵地','https://www.cyol.com/'],
         ['🎓','学习强国','理论学习中心','https://www.xuexi.cn/']]
        .map(([i,t,s2,u])=>`<a href="${u}" target="_blank" rel="noopener"><span class="li-ic">${i}</span><span><b>${t}</b><small>${s2}</small></span></a>`).join('')}
    </div></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3><span class="dot"></span>规范度提醒 <span class="chip ${s.reminders.length?'red':'green'}">${s.reminders.length||'全部达标'}</span></h3>
      ${s.reminders.length?s.reminders.map(r=>`<div class="rem ${r.lvl}" onclick="location.hash='${r.go}'">
        <span class="ic">${r.lvl==='bad'?'⚠':'◔'}</span><span class="t">${esc(r.t)}<br><small>${esc(r.sub)}</small></span><span>›</span></div>`).join('')
      :'<div class="empty"><span class="big">✅</span>各项留痕规范运转良好</div>'}</div>
    <div class="card"><h3><span class="dot"></span>最近留痕</h3>
      ${DB.records.slice().sort((a,b)=>b.date-a.date).slice(0,5).map(r=>rowHTML(r)).join('')||'<div class="empty"><span class="big">🗂</span>暂无留痕</div>'}
      <div style="text-align:center;margin-top:8px"><a class="btn ghost sm" href="#/records">查看全部 ›</a></div></div>
  </div>`;

/** 角色差异化面板：支委看「管理速览」，团员/群众看「我的支部生活」 */
function rolePanel(s){
  if(role()==='committee'){
    const miss=DB.records.filter(r=>!(r.signin&&r.minutes&&r.photos&&r.photos.length)).length;
    const unsynced=DB.records.filter(r=>!r.synced).length;
    const canSign=DB.records.filter(r=>day0(r.date)>=today()-3*864e5).length;
    return `<div class="card role-panel" style="border-left:4px solid var(--red)"><h3><span class="dot"></span>🛠 支委管理速览</h3>
      <div class="rp-grid">
        <a class="rp-item" href="#/records"><b>${miss}</b><span>缺三件套记录</span></a>
        <a class="rp-item" href="#/records"><b>${unsynced}</b><span>未同步智慧团建</span></a>
        <a class="rp-item" href="#/system"><b>${s.reminders.length}</b><span>规范度提醒</span></a>
        <a class="rp-item" href="#/members"><b>${s.memberCnt+s.youthCnt}</b><span>成员管理</span></a>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <a class="btn sm" href="#/records">＋ 记一条留痕</a>
        <a class="btn ghost sm" href="#/volunteer">＋ 录志愿工时</a>
        <a class="btn ghost sm" href="#/official">📣 查看官方公告</a>
      </div></div>`;
  }
  const canSign=DB.records.filter(r=>day0(r.date)>=today()-3*864e5&&day0(r.date)<=today()+7*864e5).length;
  return `<div class="card role-panel" style="border-left:4px solid #e8b45a"><h3><span class="dot"></span>✊ 我的支部生活</h3>
    <div class="rp-grid">
      <a class="rp-item" href="#/records"><b>${canSign}</b><span>近期可签到活动</span></a>
      <a class="rp-item" href="#/calendar"><b>${s.next?Math.max(0,Math.ceil((day0(s.next.date)-today())/864e5))+' 天':'—'}</b><span>距下次活动</span></a>
      <a class="rp-item" href="#/party"><b>${s.volHours}</b><span>支部累计工时</span></a>
      <a class="rp-item" href="#/knowledge"><b>5批次</b><span>入党批次日历</span></a>
    </div>
    <div style="font-size:12px;color:var(--mut);margin-top:10px">💡 活动前打开页面点「扫码签到」即完成留痕；工时与成长记录由支委统一登记，可在「志愿」页查看支部排名。</div></div>`;
}
  ring($('#ring'),index());radar($('#radar'),specRows().slice(0,6).map(r=>r.pct));
  if(s.next){const end=day0(s.next.date)+9*36e5;const tick=()=>{let d=Math.max(0,end-Date.now());
    const u={天:d/864e5|0,时:d/36e5%24|0,分:d/6e4%60|0,秒:d/1e3%60|0};
    Object.entries(u).forEach(([k,v])=>{const e=$('#cd-'+k);if(e)e.textContent=String(v).padStart(2,'0')})};
    tick();const iv=setInterval(tick,1e3);if(!window.__cd)window.__cd=iv;else{clearInterval(window.__cd);window.__cd=iv}}
}
function rowHTML(r){return`<a class="row" href="#/record/${r.id}">
  <span class="cat" style="background:#f5ece4">${CAT_ICON[r.category]||'📌'}</span>
  <span class="tt"><b>${esc(r.title)}</b><small>${fmtYMD(r.date)} · ${esc(r.location)} · ${r.attendees||0}人</small>
  <span class="badges">${r.signin?'<span class="bd y">签到</span>':'<span class="bd">签到</span>'}
  ${r.minutes?'<span class="bd y">记录</span>':'<span class="bd">记录</span>'}
  ${r.archived?'<span class="bd y">归档</span>':'<span class="bd">归档</span>'}
  ${r.synced?'<span class="bd y">已同步</span>':''}</span></span>
  <span class="end">›</span></a>`}

/* ================= 留痕列表/详情/编辑 ================= */
let recFilter={cat:'',q:''};
function pgRecords(){const pg=$('#pg');
  pg.innerHTML=`<div class="page-h"><h2>留痕台账</h2><span class="hint">"三件套"留痕标准 · 点击记录看详情</span></div>
  <div class="chips"><button class="fchip ${!recFilter.cat?'on':''}" onclick="setCat('')">全部</button>
  ${CATS.map(c=>`<button class="fchip ${recFilter.cat===c?'on':''}" onclick="setCat('${c}')">${c}</button>`).join('')}</div>
  <div class="search"><input id="rq" placeholder="搜索标题 / 地点 / 摘要…" value="${esc(recFilter.q)}" oninput="recFilter.q=this.value;listRecords()">
  <a class="btn ghost" href="#/calendar">📅 月历</a></div>
  <div class="card" id="rl"></div>
  ${canEdit()?'<button class="fab" onclick="editRecord(0)">＋</button>':''}`;
  listRecords()}
window.setCat=c=>{recFilter.cat=c;pgRecords()};
function listRecords(){const q=recFilter.q.toLowerCase();
  const list=DB.records.filter(r=>(!recFilter.cat||r.category===recFilter.cat)&&
    (!q||(r.title+r.location+(r.summary||'')).toLowerCase().includes(q))).sort((a,b)=>b.date-a.date);
  $('#rl').innerHTML=list.map(r=>rowHTML(r)).join('')||'<div class="empty"><span class="big">🗂</span>没有匹配的留痕记录</div>'}
function pgRecord(id){const r=DB.records.find(x=>x.id==id),pg=$('#pg');
  if(!r){pg.innerHTML='<div class="empty">记录不存在</div>';return}
  const proj=DB.projects.find(p=>p.id===r.projectId);
  const pct=[r.signin,r.minutes,r.archived].filter(Boolean).length/3*100;
  pg.innerHTML=`<div class="page-h"><a href="#/records">‹</a><h2 style="flex:1">${esc(r.title)}</h2>
  ${canEdit()?`<button class="btn ghost sm" onclick="editRecord(${r.id})">编辑</button>
  <button class="btn danger sm" onclick="delRecord(${r.id})">删除</button>`:''}</div>
  <div class="grid g2">
    <div class="card">
      <span class="chip red">${CAT_ICON[r.category]||''} ${r.category}</span>
      ${r.title.includes('【示例】')?'<span class="chip gold" style="margin-left:6px">示例模板</span>':''}
      <dl class="kv"><dt>日期</dt><dd>${fmtYMD(r.date)}</dd><dt>地点</dt><dd>${esc(r.location)}</dd>
      <dt>主持人</dt><dd>${esc(r.host||'________')}</dd><dt>到会人数</dt><dd>${r.attendees||0} 人</dd>
      <dt>照片留痕</dt><dd>${r.photos||0} 张</dd>
      ${proj?`<dt>关联立项</dt><dd><a href="#/project/${proj.id}">${esc(proj.name)}</a></dd>`:''}</dl>
      <div class="sect">留痕完整度 ${Math.round(pct)}%</div>
      <div class="pbar"><i style="width:${pct}%"></i></div>
      <div class="badges" style="margin-top:12px;gap:8px">
        ${[['signin','签到表'],['minutes','会议记录'],['archived','3日内归档'],['synced','智慧团建同步']]
          .map(([k,n])=>`<span class="bd ${r[k]?'y':''}" style="font-size:11.5px;padding:4px 10px">${r[k]?'✓':'○'} ${n}</span>`).join('')}</div>
      <div class="sect">活动摘要</div><div class="paper">${esc(r.summary||'（未填写）')}</div></div>
    <div>
      <div class="card"><h3><span class="dot"></span>扫码签到</h3>
        <div style="text-align:center"><div class="sc-qr" style="display:inline-flex">${qrImg(SITE+'#/checkin?e='+r.id,170)}<span>成员扫码 → 自动签到</span></div>
        <div style="margin-top:10px;font-size:11.5px;color:var(--mut);word-break:break-all">${SITE}#/checkin?e=${r.id}</div>
        ${canEdit()?`<button class="btn ghost sm" style="margin-top:10px" onclick="onsite(${r.id})">现场签到 +1</button>`:''}</div></div>
      <div class="card" style="margin-top:14px"><h3><span class="dot"></span>签到名单</h3>
        <div id="ci">${checkinList(r.id)||'<div class="empty" style="padding:16px">暂无签到记录<br><small>成员扫码后将出现在这里</small></div>'}</div></div>
    </div></div>`}
function checkinList(rid){const l=(DB.checkins||[]).filter(c=>c.rid===rid);
  return l.map(c=>`<div class="vrow"><span class="nm">${esc(c.name)}</span><span style="font-size:12px;color:var(--mut)">${fmt(c.ts)} ${new Date(c.ts).toTimeString().slice(0,5)}</span></div>`).join('')}
window.onsite=id=>{const r=DB.records.find(x=>x.id==id);r.attendees=(r.attendees||0)+1;save();pgRecord(id);toast('已登记 1 人到场')};
window.delRecord=id=>{if(!confirm('删除该留痕记录？'))return;DB.records=DB.records.filter(r=>r.id!=id);save();location.hash='#/records';toast('已删除')};
window.editRecord=id=>{const r=id?DB.records.find(x=>x.id==id):{category:CATS[0],title:'',date:today(),location:'',attendees:0,host:'',summary:'',photos:0,projectId:0};
  modal(`<h3>${id?'编辑':'新建'}留痕</h3>
  <div class="field"><label>活动类型</label><select id="f-cat">${CATS.map(c=>`<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
  <div class="field"><label>标题</label><input id="f-title" value="${esc(r.title)}"></div>
  <div class="grid g2"><div class="field"><label>日期</label><input id="f-date" type="date" value="${fmt(r.date)}"></div>
  <div class="field"><label>地点</label><input id="f-loc" value="${esc(r.location)}"></div></div>
  <div class="grid g2"><div class="field"><label>主持人</label><input id="f-host" value="${esc(r.host||'')}"></div>
  <div class="field"><label>到会人数</label><input id="f-att" type="number" min="0" value="${r.attendees||0}"></div></div>
  <div class="grid g2"><div class="field"><label>照片数</label><input id="f-ph" type="number" min="0" value="${r.photos||0}"></div>
  <div class="field"><label>关联立项</label><select id="f-proj"><option value="0">无</option>${DB.projects.map(p=>`<option value="${p.id}" ${r.projectId===p.id?'selected':''}>${esc(p.name.slice(0,18))}…</option>`).join('')}</select></div></div>
  <div class="field"><label>活动摘要</label><textarea id="f-sum" rows="4">${esc(r.summary||'')}</textarea></div>
  <div class="chips">${[['signin','签到表'],['minutes','会议记录'],['archived','已归档'],['synced','智慧团建同步']]
    .map(([k,n])=>`<button class="fchip ${r[k]?'on':''}" data-k="${k}" onclick="this.classList.toggle('on')">${n}</button>`).join('')}</div>
  <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveRecord(${id||0})">保存</button></div>`)};
window.saveRecord=id=>{const g=i=>$('#'+i).value.trim();
  const t=g('f-title');if(!t){toast('请填写标题');return}
  const flags={};$$('#modal-root .fchip[data-k]').forEach(c=>flags[c.dataset.k]=c.classList.contains('on'));
  const o={category:g('f-cat'),title:t,date:new Date(g('f-date')+'T00:00:00').getTime()||today(),location:g('f-loc'),
    host:g('f-host'),attendees:+g('f-att')||0,photos:+g('f-ph')||0,projectId:+g('f-proj')||0,summary:g('f-sum'),...flags};
  if(id){Object.assign(DB.records.find(r=>r.id==id),o)}else DB.records.push({id:nextId(DB.records),...o});
  save();closeModal();if(cur==='record')pgRecord(id||DB.records[DB.records.length-1].id);else listRecords();toast('已保存')};

/* ================= 月历 ================= */
let calYm=null,calSel=null;
function pgCalendar(){const pg=$('#pg');const now=new Date();calYm=calYm||[now.getFullYear(),now.getMonth()];
  pg.innerHTML=`<div class="page-h"><a href="#/records">‹</a><h2>活动日历</h2><span class="hint">点有标记的日期查看当日活动</span></div>
  <div class="card"><div class="cal-head"><button class="btn ghost sm" onclick="calShift(-1)">‹ 上月</button>
  <b id="calt"></b><button class="btn ghost sm" onclick="calShift(1)">下月 ›</button></div>
  <div class="cal-grid" id="calg"></div></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span><span id="cald">当日活动</span></h3><div id="call"></div></div>`;
  drawCal()}
window.calShift=d=>{calYm[1]+=d;if(calYm[1]<0){calYm[1]=11;calYm[0]--}if(calYm[1]>11){calYm[1]=0;calYm[0]++}drawCal()};
window.calPick=t=>{calSel=calSel===t?null:t;drawCal()};
function drawCal(){const[y,m]=calYm;$('#calt').textContent=`${y}年${m+1}月`;
  const first=new Date(y,m,1),dow=(first.getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  const days=new Set(DB.records.map(r=>day0(r.date)));
  let h=['一','二','三','四','五','六','日'].map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for(let i=0;i<dow;i++)h+='<div class="cal-cell dim"></div>';
  for(let d=1;d<=dim;d++){const t=new Date(y,m,d).getTime();
    h+=`<div class="cal-cell ${t===today()?'today':''} ${t===calSel?'sel':''}" onclick="calPick(${t})">${d}${days.has(t)?'<span class="dotp"></span>':''}</div>`}
  $('#calg').innerHTML=h;
  const list=DB.records.filter(r=>day0(r.date)===(calSel??today()));calSel===undefined;
  $('#cald').textContent=calSel?fmtYMD(calSel)+' 的活动':(list.length?'今日活动':'当日活动');
  $('#call').innerHTML=(calSel!=null||list.length?list:DB.records.filter(r=>day0(r.date)===today()))
    .map(r=>rowHTML(r)).join('')||'<div class="empty" style="padding:16px">当日无留痕活动</div>'}

/* ================= 志愿服务 ================= */
function pgVol(){const pg=$('#pg');const s=st();
  const byM={};DB.volunteers.forEach(v=>{byM[v.memberId]=(byM[v.memberId]||0)+v.hours});
  const rows=DB.members.map(m=>({m,h:byM[m.id]||0})).sort((a,b)=>b.h-a.h);
  pg.innerHTML=`<div class="page-h"><h2>志愿服务</h2><span class="hint">时长排行与服务明细 · 数据按实登记</span>
  ${canEdit()?'<button class="btn sm" style="margin-left:auto" onclick="editVol(0)">＋ 记时长</button>':''}</div>
  <div class="grid g3">
    <div class="card stat"><span class="ico">♥</span><span class="v">${s.volHours}</span><span class="l">累计志愿时长（小时）</span></div>
    <div class="card stat"><span class="ico">✋</span><span class="v">${s.volCnt}</span><span class="l">服务人次</span></div>
    <div class="card stat"><span class="ico">👥</span><span class="v">${s.total?(s.volHours/s.total).toFixed(1):0}</span><span class="l">人均时长</span></div></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>时长排行 TOP10</h3>
    <canvas class="chart" id="vchart" ${rows.some(r=>r.h>0)?'':'style="display:none"'}></canvas>
    ${rows.some(r=>r.h>0)?'':'<div class="empty"><span class="big">📊</span>暂无志愿时长记录<br><small>按实登记后自动生成排行</small></div>'}</div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>成员明细</h3>
    ${rows.map(({m,h})=>`<a class="vrow" href="#/members"><span class="nm">${esc(mask(m.name))}</span>
    <span class="bar"><i style="width:${Math.min(100,h/Math.max(1,rows[0].h)*100)}%"></i></span>
    <span class="hv">${h} h</span></a>`).join('')}</div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>服务记录</h3>
    ${DB.volunteers.slice().sort((a,b)=>b.date-a.date).map(v=>{const m=DB.members.find(x=>x.id===v.memberId);
    return`<div class="row"><span class="cat" style="background:#fbeaea">💗</span>
    <span class="tt"><b>${esc(v.title)}</b><small>${esc(mask(m?m.name:'—'))} · ${fmtYMD(v.date)}</small></span>
    <span class="end"><b style="color:var(--red-d)">${v.hours}h</b>${canEdit()?` <button class="btn ghost sm" onclick="delVol(${v.id})">删</button>`:''}</span></div>`}).join('')
    ||'<div class="empty"><span class="big">💗</span>暂无记录</div>'}</div>`;
  const c=$('#vchart');if(c)bars(c,rows.filter(r=>r.h>0).slice(0,10).map(r=>({n:mask(r.m.name),v:r.h})),Math.max(120,Math.min(10,rows.filter(r=>r.h>0).length)*26))}
window.delVol=id=>{if(!confirm('删除该条记录？'))return;DB.volunteers=DB.volunteers.filter(v=>v.id!=id);save();pgVol()};
window.editVol=()=>{modal(`<h3>登记志愿时长</h3>
  <div class="field"><label>成员</label><select id="f-m">${DB.members.map(m=>`<option value="${m.id}">${esc(m.name)}（${m.political}）</option>`).join('')}</select></div>
  <div class="field"><label>服务内容</label><input id="f-vt" placeholder="如：校园文明引导志愿服务"></div>
  <div class="grid g2"><div class="field"><label>时长（小时）</label><input id="f-h" type="number" min="0.5" step="0.5" value="2"></div>
  <div class="field"><label>日期</label><input id="f-d" type="date" value="${fmt(Date.now())}"></div></div>
  <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveVol()">保存</button></div>`)};
window.saveVol=()=>{const t=$('#f-vt').value.trim();if(!t){toast('请填写服务内容');return}
  DB.volunteers.push({id:nextId(DB.volunteers),memberId:+$('#f-m').value,title:t,hours:+$('#f-h').value||0,
    date:new Date($('#f-d').value+'T00:00:00').getTime()});save();closeModal();pgVol();toast('已登记')};

/* ================= 立项 ================= */
function pgProjects(){const pg=$('#pg');
  pg.innerHTML=`<div class="page-h"><h2>团支部立项</h2><span class="hint">立项申报 → 推进 → 结项 → 证据链</span></div>
  ${DB.projects.map(p=>{const links=DB.records.filter(r=>r.projectId===p.id);
    return`<a class="card" href="#/project/${p.id}" style="display:block;margin-bottom:12px">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="flex:1;font-size:15px">${esc(p.name)}</b>
    <span class="chip ${p.status===3?'gold':p.status===2?'green':'red'}">${PSTATUS[p.status]}</span></div>
    <div style="font-size:12px;color:var(--mut);margin:8px 0">${esc(p.category)} · ${fmtYMD(p.startMillis)} ~ ${fmtYMD(p.endMillis)} · 关联留痕 ${links.length} 条</div>
    <div class="pbar"><i style="width:${p.progress}%"></i></div></a>`}).join('')
  ||'<div class="empty"><span class="big">🚀</span>暂无立项</div>'}
  ${canEdit()?'<button class="fab" onclick="editProject(0)">＋</button>':''}`}
function pgProject(id){const p=DB.projects.find(x=>x.id==id),pg=$('#pg');
  if(!p){pg.innerHTML='<div class="empty">立项不存在</div>';return}
  const links=DB.records.filter(r=>r.projectId===id).sort((a,b)=>a.date-b.date);
  pg.innerHTML=`<div class="page-h"><a href="#/projects">‹</a><h2 style="flex:1">${esc(p.name)}</h2>
  ${canEdit()?`<button class="btn ghost sm" onclick="editProject(${p.id})">编辑</button>
  <button class="btn danger sm" onclick="delProject(${p.id})">删除</button>`:''}</div>
  <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip red">${esc(p.category)}</span>
  <span class="chip gold">${PSTATUS[p.status]}</span><span class="chip">${fmtYMD(p.startMillis)} ~ ${fmtYMD(p.endMillis)}</span></div>
  <div style="margin:14px 0 6px;font-size:12px;color:var(--mut)">完成进度 ${p.progress}%</div>
  <div class="pbar"><i style="width:${p.progress}%"></i></div>
  ${p.target?`<div class="sect">项目目标</div><div class="paper">${esc(p.target)}</div>`:''}
  ${p.basis?`<div class="sect">立项依据</div><div class="paper">${esc(p.basis)}</div>`:''}
  ${p.plan?`<div class="sect">实施方案</div><div class="paper">${esc(p.plan)}</div>`:''}
  ${p.outcome?`<div class="sect">阶段成果</div><div class="paper">${esc(p.outcome)}</div>`:''}</div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>证据链 · 关联留痕（${links.length}）</h3>
  ${links.map(r=>rowHTML(r)).join('')||'<div class="empty" style="padding:16px">暂无关联留痕，编辑活动记录时可关联本立项</div>'}</div>`}
window.delProject=id=>{if(!confirm('删除该立项？关联记录将解除关联'))return;
  DB.records.forEach(r=>{if(r.projectId==id)r.projectId=0});DB.projects=DB.projects.filter(p=>p.id!=id);save();location.hash='#/projects'};
window.editProject=id=>{const p=id?DB.projects.find(x=>x.id==id):{name:'',category:'组织建设',status:1,progress:0,
  startMillis:today(),endMillis:today()+180*864e5,target:'',basis:'',plan:'',outcome:''};
  modal(`<h3>${id?'编辑':'发起'}立项</h3>
  <div class="field"><label>项目名称</label><input id="f-n" value="${esc(p.name)}"></div>
  <div class="grid g2"><div class="field"><label>类别</label><select id="f-c">${['组织建设','理论学习','志愿服务','社会实践','科创竞赛','文体艺术'].map(c=>`<option ${p.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
  <div class="field"><label>状态</label><select id="f-s">${PSTATUS.map((s,i)=>`<option value="${i}" ${p.status===i?'selected':''}>${s}</option>`).join('')}</select></div></div>
  <div class="field"><label>进度 <b id="f-pv">${p.progress}%</b></label><input id="f-p" type="range" min="0" max="100" step="5" value="${p.progress}" oninput="f-pv.textContent=this.value+'%'"></div>
  <div class="grid g2"><div class="field"><label>开始</label><input id="f-sd" type="date" value="${fmt(p.startMillis)}"></div>
  <div class="field"><label>预计结项</label><input id="f-ed" type="date" value="${fmt(p.endMillis)}"></div></div>
  <div class="field"><label>项目目标</label><textarea id="f-t" rows="2">${esc(p.target)}</textarea></div>
  <div class="field"><label>立项依据</label><textarea id="f-b" rows="3">${esc(p.basis)}</textarea></div>
  <div class="field"><label>实施方案</label><textarea id="f-pl" rows="3">${esc(p.plan)}</textarea></div>
  <div class="field"><label>阶段成果</label><textarea id="f-o" rows="2">${esc(p.outcome)}</textarea></div>
  <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveProject(${id||0})">保存</button></div>`)};
window.saveProject=id=>{const n=$('#f-n').value.trim();if(!n){toast('请填写项目名称');return}
  const o={name:n,category:$('#f-c').value,status:+$('#f-s').value,progress:+$('#f-p').value,
    startMillis:new Date($('#f-sd').value+'T00:00:00').getTime(),endMillis:new Date($('#f-ed').value+'T00:00:00').getTime(),
    target:$('#f-t').value.trim(),basis:$('#f-b').value.trim(),plan:$('#f-pl').value.trim(),outcome:$('#f-o').value.trim()};
  if(id)Object.assign(DB.projects.find(p=>p.id==id),o);else DB.projects.push({id:nextId(DB.projects),createdAt:Date.now(),...o});
  save();closeModal();cur==='project'?pgProject(id||DB.projects.at(-1).id):pgProjects();toast('已保存')};

/* ================= 成员 ================= */
let memQ='';
function pgMembers(){const pg=$('#pg');
  pg.innerHTML=`<div class="page-h"><h2>成员管理</h2><span class="hint">团员 ${DB.members.filter(m=>m.political==='共青团员').length} · 青年 ${DB.members.filter(m=>m.political==='群众').length} · 境外线上 0</span>
  ${canEdit()?'<button class="btn sm" style="margin-left:auto" onclick="editMember(0)">＋ 添加成员</button>':''}</div>
  <div class="search"><input placeholder="搜索姓名 / 职务…" oninput="memQ=this.value;listMembers()"></div>
  <div class="grid g3" id="ml"></div>`;listMembers()}
function listMembers(){const q=memQ.toLowerCase();
  const order={'团支部书记':0,'副书记':1,'组织委员':2,'宣传委员':3};
  const list=DB.members.filter(m=>!q||(m.name+(m.role||'')).toLowerCase().includes(q))
    .sort((a,b)=>(order[a.role]??9)-(order[b.role]??9)||a.id-b.id);
  $('#ml').innerHTML=list.map(m=>`<div class="card" style="padding:14px">
    <div style="display:flex;align-items:center;gap:10px">
    <span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:17px;
    background:${m.political==='共青团员'?'#fbeaea':'#f0ece6'}">${m.political==='共青团员'?'🚩':'🌱'}</span>
    <div style="flex:1;min-width:0"><b>${esc(mask(m.name))}</b>
    <div style="font-size:11px;color:var(--mut)">${esc(m.political)}${m.sid?' · 尾号 '+esc(m.sid):''}${m.role?' · '+esc(m.role):''}</div></div>
    ${canEdit()?`<button class="btn ghost sm" onclick="editMember(${m.id})">✎</button>`:''}</div></div>`).join('')
    ||'<div class="empty" style="grid-column:1/-1">未找到成员</div>'}
window.editMember=id=>{const m=id?DB.members.find(x=>x.id==id):{name:'',sid:'',political:'共青团员',role:''};
  modal(`<h3>${id?'编辑':'添加'}成员</h3>
  <div class="grid g2"><div class="field"><label>姓名（可留占位）</label><input id="f-mn" value="${esc(m.name)}" placeholder="团员__ / 青年__"></div>
  <div class="field"><label>学号（可留空）</label><input id="f-ms" value="${esc(m.sid)}" placeholder="________"></div></div>
  <div class="grid g2"><div class="field"><label>政治面貌</label><select id="f-mp">${['共青团员','中共党员','中共预备党员','群众'].map(p=>`<option ${m.political===p?'selected':''}>${p}</option>`).join('')}</select></div>
  <div class="field"><label>支部职务</label><select id="f-mr">${['','团支部书记','副书记','组织委员','宣传委员','权益委员','文体委员'].map(r=>`<option ${m.role===r?'selected':''}>${r||'无'}</option>`).join('')}</select></div></div>
  <div class="mrow">${id?'<button class="btn danger" onclick="delMember('+id+')">删除</button>':''}
  <button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveMember(${id||0})">保存</button></div>`)};
window.saveMember=id=>{const n=$('#f-mn').value.trim();if(!n){toast('请填写姓名或占位名');return}
  const o={name:n,sid:$('#f-ms').value.trim(),political:$('#f-mp').value,role:$('#f-mr').value==='无'?'':$('#f-mr').value};
  if(id)Object.assign(DB.members.find(m=>m.id==id),o);else DB.members.push({id:nextId(DB.members),...o});
  save();closeModal();listMembers();toast('已保存')};
window.delMember=id=>{if(!confirm('删除该成员？相关志愿记录将保留'))return;
  DB.members=DB.members.filter(m=>m.id!=id);save();closeModal();listMembers();toast('已删除')};

/* ================= 体系 ================= */
function pgSystem(){const pg=$('#pg');const s=st();
  pg.innerHTML=`<div class="page-h"><h2>建设体系</h2><span class="hint">制度落实 · 年报 · 数据管理 · 隐私设置</span></div>
  <div class="grid g2">
    <div class="card"><h3><span class="dot"></span>制度落实 ${s.yr}</h3>
      ${specRows().map(r=>`<div class="vrow"><span class="nm" style="width:110px">${r.name}</span>
      <span class="bar"><i style="width:${r.pct}%"></i></span>
      <span class="hv" style="width:64px">${r.n}/${r.quota} ${r.pct>=100?'✓':''}</span></div>`).join('')}
      <div class="rem warn" style="margin-top:8px"><span class="ic">ℹ</span><span class="t" style="font-size:12px">留痕四原则：签到表+会议记录+照片三件套 · 会后3日归档 · 照片规范命名 · 同步智慧团建</span></div></div>
    <div>
      <div class="card"><h3><span class="dot"></span>荣誉台账 ${canEdit()?'<button class="btn ghost sm" style="margin-left:auto" onclick="editHonor()">＋</button>':''}</h3>
        ${DB.honors.map(h=>`<div class="row"><span class="cat" style="background:#faf0da">🏆</span>
        <span class="tt"><b>${esc(h.title)}</b><small>${esc(h.level)} · ${fmtYMD(h.date)}</small></span>
        ${canEdit()?`<button class="btn ghost sm" onclick="delHonor(${h.id})">删</button>`:''}</div>`).join('')
        ||'<div class="empty" style="padding:16px">暂无荣誉记录<br><small>获评后按实登记</small></div>'}</div>
      <div class="card" style="margin-top:14px"><h3><span class="dot"></span>年度建设报告</h3>
        <div style="font-size:12.5px;color:var(--mut);margin-bottom:10px">自动汇总本学年"三会两制一课"落实情况、留痕数据与立项进展，生成可打印/上报的年报。</div>
        <button class="btn" style="width:100%" onclick="genReport()">生成年度报告</button>
        <button class="btn line" style="width:100%;margin-top:8px" onclick="window.print()">打印 / 另存 PDF</button></div>
    </div></div>
  ${canEdit()?`<div class="card" style="margin-top:14px"><h3><span class="dot"></span>官方数据发布 <span style="font-size:11px;color:var(--mut);font-weight:400">隐藏端点 · 发布后全端免更新同步</span></h3>
    <div style="font-size:12.5px;color:var(--mut);margin-bottom:10px">生成 JSON → 粘贴进仓库 data/feed.json 对应数组 → 提交。所有 App 与网页端下次打开即自动拉到。</div>
    <div class="grid g3">
      <button class="btn ghost" onclick="pubForm('record')">🗂 发布官方留痕</button>
      <button class="btn ghost" onclick="pubForm('vol')">♥ 发布志愿公示</button>
      <button class="btn ghost" onclick="pubForm('notice')">📣 发布公告</button>
      <button class="btn ghost" onclick="pubForm('schedule')">📅 发布日程</button>
      <button class="btn line" onclick="openFeedEdit()">✏️ 直接编辑 feed.json</button>
    </div></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>数据管理</h3>
    <div class="grid g3">
      <button class="btn ghost" onclick="exportJSON()">⬇ 导出 JSON 备份</button>
      <button class="btn ghost" onclick="document.getElementById('imp').click()">⬆ 导入 JSON 恢复</button>
      <button class="btn ghost" onclick="exportCSV()">📊 留痕台账 → Excel(CSV)</button>
      <button class="btn ghost" onclick="exportVolCSV()">📊 志愿工时 → Excel(CSV)</button>
      <button class="btn ghost" onclick="copyLedger()">📋 复制台账摘要</button>
      <button class="btn danger" onclick="resetAll()">⟲ 重置为初始示例</button>
    </div><input id="imp" type="file" accept=".json" style="display:none" onchange="importJSON(this)">
    <div style="font-size:11.5px;color:var(--mut);margin-top:10px">数据仅存于本机浏览器（localStorage），不上传服务器；换机请先导出备份。</div></div>
  <div class="card" style="margin-top:14px"><h3><span class="dot"></span>安全与隐私</h3>
    <div class="grid g3">
      <button class="btn ghost" onclick="changeCode()">🔑 修改管理口令</button>
      <button class="btn ghost" onclick="togglePrivacy()">${SET().privacy?'🙈 脱敏模式：开（点击关闭）':'🙉 脱敏模式：关（点击开启）'}</button>
      <button class="btn ghost" onclick="logout()">⇥ 退出当前身份</button>
    </div>
    <div style="font-size:11.5px;color:var(--mut);margin-top:10px">脱敏模式开启后，全站姓名显示为"X**"形式；公开演示前建议开启。</div></div>`:''}
  <div id="report"></div>`}
window.editHonor=()=>{modal(`<h3>登记荣誉</h3>
  <div class="field"><label>荣誉名称</label><input id="f-ht"></div>
  <div class="grid g2"><div class="field"><label>级别</label><select id="f-hl">${['校级','院级','省级','国家级'].map(l=>`<option>${l}</option>`).join('')}</select></div>
  <div class="field"><label>日期</label><input id="f-hd" type="date" value="${fmt(Date.now())}"></div></div>
  <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveHonor()">保存</button></div>`)};
window.saveHonor=()=>{const t=$('#f-ht').value.trim();if(!t)return toast('请填写荣誉名称');
  DB.honors.push({id:nextId(DB.honors),title:t,level:$('#f-hl').value,date:new Date($('#f-hd').value+'T00:00:00').getTime()});save();closeModal();pgSystem()};
window.delHonor=id=>{DB.honors=DB.honors.filter(h=>h.id!=id);save();pgSystem()};
window.exportJSON=()=>{const b=new Blob([JSON.stringify(DB,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cysl-backup-'+fmt(Date.now())+'.json';a.click();toast('已导出备份')};
const _csv=(rows,name)=>{const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;a.click()};
window.exportCSV=()=>{_csv([['日期','类型','标题','地点','人数','签到表','会议记录','照片数','已同步智慧团建','已归档','摘要'],
  ...DB.records.slice().sort((a,b)=>a.date-b.date).map(r=>[fmtYMD(r.date),r.type,r.title,r.location,r.attendees||0,
  r.signin?'✓':'',r.minutes?'✓':'',r.photos||0,r.synced?'✓':'',r.archived?'✓':'',r.summary])],
  'cysl-留痕台账-'+fmt(Date.now())+'.csv');toast('已导出，Excel/WPS 可直接打开')};
window.exportVolCSV=()=>{const byM={},cnt={};DB.volunteers.forEach(v=>{byM[v.memberId]=(byM[v.memberId]||0)+v.hours;cnt[v.memberId]=(cnt[v.memberId]||0)+1});
  _csv([['姓名','政治面貌','累计工时(h)','服务次数'],
  ...DB.members.map(m=>[mask(m.name),m.political,byM[m.id]||0,cnt[m.id]||0])],
  'cysl-志愿工时-'+fmt(Date.now())+'.csv');toast('已导出（脱敏模式生效中则姓名已遮蔽）')};
window.copyLedger=async()=>{const s=st();
  const lines=[`【${BRANCH} · 台账摘要 ${fmt(Date.now())}】`,...specRows().map(r=>`${r.name}：${r.n}/${r.quota}`),
  `留痕 ${s.recCnt} 条 · 志愿工时 ${s.volHours}h · 照片 ${s.photoCnt} 张`,'',
  '日期\t类型\t标题\t地点\t人数\t三件套',
  ...DB.records.slice().sort((a,b)=>b.date-a.date).map(r=>[fmtYMD(r.date),r.type,r.title,r.location,r.attendees||0,
  (r.signin&&r.minutes&&r.photos)?'✓':'缺'].join('\t'))];
  try{await navigator.clipboard.writeText(lines.join('\n'));toast('已复制，直接粘贴进 Excel/微信即可')}catch(e){toast('复制失败：'+e.message)}};
window.importJSON=inp=>{const f=inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.members||!d.records)throw 0;
    if(confirm('导入将覆盖当前全部数据，确定？')){DB=d;save();pgSystem();toast('已恢复 '+d.records.length+' 条留痕')}}catch(e){toast('文件格式不正确')}};r.readAsText(f)};
window.resetAll=()=>{if(confirm('将清空全部数据并恢复初始示例，确定？')){DB=seed();save();pgSystem();toast('已重置')}};
window.changeCode=async()=>{modal(`<h3>修改管理口令</h3>
  <div class="field"><label>新口令</label><input id="f-pw" type="password" maxlength="20"></div>
  <div class="field"><label>确认新口令</label><input id="f-pw2" type="password" maxlength="20"></div>
  <div class="mrow"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="doCode()">保存</button></div>`)};
window.doCode=async()=>{const a=$('#f-pw').value,b=$('#f-pw2').value;
  if(a.length<4)return toast('口令至少4位');if(a!==b)return toast('两次输入不一致');
  setSet('codeHash',await sha(a));closeModal();toast('口令已更新')};
window.togglePrivacy=()=>{setSet('privacy',!SET().privacy);pgSystem();toast(SET().privacy?'已开启脱敏':'已关闭脱敏')};
window.genReport=()=>{const s=st(),y=s.yr,rows=specRows();
  const txt=`${BRANCH}\n${y} 年度团支部建设工作报告\n${'='.repeat(40)}\n生成时间：${fmt(Date.now())}\n\n一、组织概况\n  在册团员 ${s.memberCnt} 人 · 青年群众 ${s.youthCnt} 人 · 境外线上团员 0 人\n\n二、"三会两制一课"制度落实\n${rows.map(r=>`  ${r.name.padEnd(6,'　')} ${r.n}/${r.quota} 次 ${r.pct>=100?'✓ 达标':'○ 进行中'}`).join('\n')}\n\n三、留痕台账\n  累计留痕活动 ${s.recCnt} 场 · 三件套完备 ${s.doneCnt} 场 · 照片留痕 ${s.photoCnt} 张\n\n四、志愿服务\n  累计 ${s.volHours} 小时 · ${s.volCnt} 人次 · 人均 ${s.total?(s.volHours/s.total).toFixed(1):0} 小时\n\n五、立项进展\n${DB.projects.map(p=>`  [${PSTATUS[p.status]}] ${p.name}（进度${p.progress}%）`).join('\n')||'  暂无'}\n\n六、荣誉台账\n${DB.honors.map(h=>`  ${h.level} · ${h.title}`).join('\n')||'  暂无'}\n\n——本报告由 CYSL 支部数字化工作台自动生成`;
  $('#report').innerHTML=`<div class="card" style="margin-top:14px"><h3><span class="dot"></span>${y} 年度报告</h3>
  <div class="paper" style="font-family:ui-monospace,monospace;font-size:12.5px">${esc(txt)}</div>
  <button class="btn" style="margin-top:12px" onclick="window.print()">打印 / 存为 PDF</button></div>`;
  $('#report').scrollIntoView({behavior:'smooth'})};

/* ================= 签到 ================= */
function pgCheckin(q){const pg=$('#pg');const id=+new URLSearchParams(q||'').get('e');
  const r=DB.records.find(x=>x.id==id);
  if(!r){pg.innerHTML='<div class="empty"><span class="big">❓</span>签到链接无效或活动已删除</div>';return}
  const done=(DB.checkins||[]).some(c=>c.rid==id&&c.who===((auth()||{}).who));
  pg.innerHTML=`<div style="max-width:460px;margin:20px auto"><div class="card" style="text-align:center;padding:30px">
  <div style="font-size:44px">${CAT_ICON[r.category]||'📌'}</div>
  <h2 style="margin:12px 0 4px;font-size:18px">${esc(r.title)}</h2>
  <div style="font-size:12.5px;color:var(--mut)">${fmtYMD(r.date)} · ${esc(r.location)}</div>
  <div class="field" style="margin-top:20px;text-align:left"><label>签到人姓名（留空则以"匿名"记录）</label>
  <input id="ci-name" maxlength="12" placeholder="你的姓名 / 占位名"></div>
  <button class="btn" style="width:100%" onclick="doCheckin(${r.id})" ${done?'disabled':''}>${done?'✓ 已签到':'确认签到'}</button>
  <div style="font-size:11px;color:var(--mut);margin-top:12px">当前已签到 ${(DB.checkins||[]).filter(c=>c.rid==id).length+(r.attendees||0)} 人 · 数据存于本机</div>
  </div></div>`}
window.doCheckin=id=>{const name=$('#ci-name').value.trim()||'匿名'+String(Date.now()).slice(-4);
  DB.checkins=DB.checkins||[];const a=auth()||{};a.who=name;sessionStorage.setItem(AUTH_KEY,JSON.stringify(a));
  DB.checkins.push({rid:id,name,ts:Date.now()});save();
  toast('签到成功 ✓');pgCheckin('e='+id)};

/* ================= 出片展示屏 ================= */
let scTimer=null,scIdx=0;
function renderShowcase(){const s=st();document.title='CYSL · 支部名片';
  const slides=[
    {n:'支部名片',h:`<div class="sc-panel"><h4>BRANCH PROFILE · 支部名片</h4>
      <div style="font-size:clamp(18px,2.6vw,30px);font-weight:800;line-height:1.4">${BRANCH}</div>
      <div style="font-size:13px;opacity:.7;margin-top:10px">福建师范大学 · 计算机与网络空间安全学院 · 团支部数字化建设体系</div>
      <div class="sc-kpis">
        <div class="sc-kpi"><b>${s.memberCnt}</b><span>在册团员</span></div>
        <div class="sc-kpi"><b>${s.youthCnt}</b><span>青年群众</span></div>
        <div class="sc-kpi"><b>0</b><span>境外线上团员</span></div>
        <div class="sc-kpi"><b>${s.recCnt}</b><span>留痕活动</span></div></div></div>
      <div class="sc-panel" style="max-width:320px"><h4>NEXT · 下次活动</h4>
      ${s.next?`<div class="sc-big" id="sc-cd">--</div><div class="sc-lb">天后 · ${esc(s.next.title)}</div>
      <div style="margin-top:8px;font-size:12px;opacity:.7">${fmtYMD(s.next.date)} · ${esc(s.next.location)}</div>`
      :'<div class="sc-big">—</div><div class="sc-lb">暂无计划活动</div>'}
      <div style="margin-top:auto" class="sc-qr">${qrImg(SITE+'#/checkin',110)}<span>扫码进入工作台</span></div></div>`},
    {n:'体系看板',h:`<div class="sc-panel"><h4>SYSTEM INDEX · 三会两制一课</h4>
      ${specRows().map(r=>`<div class="vrow" style="padding:7px 0"><span class="nm" style="color:#fff;opacity:.85;width:120px">${r.name}</span>
      <span class="bar" style="background:rgba(255,255,255,.12)"><i style="width:${r.pct}%;background:linear-gradient(90deg,#f6d9a0,#e8b45a)"></i></span>
      <span class="hv" style="color:var(--gold-l)">${r.n}/${r.quota}</span></div>`).join('')}
      <div style="margin-top:auto;font-size:11.5px;opacity:.55">制度落实率实时统计 · 数据即看即新</div></div>
      <div class="sc-panel" style="max-width:340px"><h4>INDEX · 建设指数</h4>
      <div class="sc-big">${index()}</div><div class="sc-lb">支部建设综合指数 / 100</div>
      <div class="sc-kpis" style="grid-template-columns:1fr 1fr;margin-top:20px">
        <div class="sc-kpi"><b>${s.doneCnt}</b><span>三件套完备</span></div>
        <div class="sc-kpi"><b>${s.photoCnt}</b><span>照片留痕</span></div>
        <div class="sc-kpi"><b>${s.volHours}h</b><span>志愿时长</span></div>
        <div class="sc-kpi"><b>${DB.projects.length}</b><span>在研立项</span></div></div></div>`},
    {n:'组织生活',h:`<div class="sc-panel"><h4>ORG-LIFE · 组织生活落实</h4>
      ${(()=>{const g={'三会':0,'两制':0,'一课':0,'拓展':0};
        DB.records.forEach(r=>{const c=r.category||'';g[/大会|委员会|小组/.test(c)?'三会':/评议|注册/.test(c)?'两制':/团课/.test(c)?'一课':'拓展']++});
        const triad=DB.records.filter(r=>r.signIn&&r.minutes&&(r.photos||0)>=3).length;
        return `<div class="sc-kpis" style="grid-template-columns:repeat(2,1fr)">
        <div class="sc-kpi"><b>${g['三会']}</b><span>“三会”召开</span></div>
        <div class="sc-kpi"><b>${g['两制']}</b><span>“两制”落实</span></div>
        <div class="sc-kpi"><b>${g['一课']}</b><span>“一课”开展</span></div>
        <div class="sc-kpi"><b>${triad}</b><span>三件套完备</span></div></div>
        <div class="sc-lb" style="margin-top:14px;text-align:left">签到+纪要+3图 为一条完备留痕，完备率 ${DB.records.length?Math.round(triad/DB.records.length*100):0}%</div>`})()}</div>
      <div class="sc-panel" style="max-width:340px"><h4>STAR · 志愿之星</h4>
      ${(()=>{const agg={};DB.volunteers.forEach(v=>{agg[v.name]=(agg[v.name]||0)+v.hours});
        const top=Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,3);
        return top.length?top.map(([n,h],i)=>`<div class="sc-row" style="font-size:17px">${'🥇🥈🥉'[i]} ${esc(mask(n))} <b style="margin-left:auto;color:var(--gold)">${h}h</b></div>`).join(''):'<div class="sc-lb">暂无志愿记录</div>'})()}
      <div class="sc-lb" style="margin-top:auto">累计服务 ${s.volHours} 小时</div></div>`},
    {n:'风采动态',h:`<div class="sc-panel"><h4>RECENT · 留痕风采</h4><div class="sc-list">
      ${DB.records.slice().sort((a,b)=>b.date-a.date).slice(0,8).map(r=>`<div class="it"><span>${CAT_ICON[r.category]||''} ${esc(r.title)}</span><span style="opacity:.6">${fmtYMD(r.date)}</span></div>`).join('')||'<div style="opacity:.6">暂无记录</div>'}</div></div>
      <div class="sc-panel" style="max-width:340px"><h4>PROJECT · 重点立项</h4>
      ${DB.projects.slice(0,2).map(p=>`<div style="margin-bottom:16px"><div style="font-size:14px;font-weight:700;line-height:1.4">${esc(p.name)}</div>
      <div class="pbar" style="margin-top:8px;background:rgba(255,255,255,.12)"><i style="width:${p.progress}%;background:linear-gradient(90deg,#f6d9a0,#e8b45a)"></i></div>
      <div style="font-size:11px;opacity:.6;margin-top:5px">${PSTATUS[p.status]} · ${p.progress}%</div></div>`).join('')||'<div style="opacity:.6">暂无立项</div>'}</div>`}];
  $('#app').innerHTML=`<div class="showcase">
  <div class="sc-top"><span class="flag">⚑</span><div><h1>${BRANCH} · 支部名片</h1>
  <div class="en">CYSL DIGITAL LEAGUE-BRANCH SYSTEM</div></div>
  <div class="sc-clock"><b id="sc-t">--:--:--</b><span id="sc-d"></span></div></div>
  <div class="sc-stage">${slides.map((sl,i)=>`<div class="sc-slide ${i===0?'on':''}" data-i="${i}">${sl.h}</div>`).join('')}</div>
  <div class="sc-bottom">
    <div class="sc-marquee"><i>　⚑ ${BRANCH} ｜ "三会两制一课"制度数字化落实 ｜ 低负担·全自动·强留痕 ｜ 支部建设指数 ${index()} ｜ 志愿服务 ${s.volHours} 小时 ｜ 数据本地存储·隐私脱敏保护　</i></div>
    <div class="sc-dots">${slides.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>
    <button class="sc-exit" onclick="exitShowcase()">✕ 退出名片</button></div></div>`;
  const tick=()=>{const d=new Date();const e=$('#sc-t');if(!e)return;
    e.textContent=d.toTimeString().slice(0,8);
    $('#sc-d').textContent=`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${'日一二三四五六'[d.getDay()]}`};
  tick();const clock=setInterval(tick,1e3);
  const cdt=()=>{const e=$('#sc-cd');if(e&&s.next)e.textContent=Math.max(0,Math.ceil((day0(s.next.date)-today())/864e5))};
  cdt();
  scIdx=0;scTimer=setInterval(()=>{scIdx=(scIdx+1)%slides.length;
    $$('.sc-slide').forEach((el,i)=>el.classList.toggle('on',i===scIdx));
    $$('.sc-dots i').forEach((el,i)=>el.classList.toggle('on',i===scIdx));},7000);
  document.addEventListener('keydown',scKeys);window.__scClock=clock;
  // 触屏滑动切换 + 点按暂停/继续
  const st=document.querySelector('.sc-stage');let sx=0,sy=0;
  st.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  st.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){const n=$$('.sc-slide').length;
      scIdx=(scIdx+(dx<0?1:-1)+n)%n;
      $$('.sc-slide').forEach((el,i)=>el.classList.toggle('on',i===scIdx));
      $$('.sc-dots i').forEach((el,i)=>el.classList.toggle('on',i===scIdx))}},{passive:true});
  st.addEventListener('click',()=>{if(scTimer){clearInterval(scTimer);scTimer=null}
    else scTimer=setInterval(()=>{scIdx=(scIdx+1)%$$('.sc-slide').length;
      $$('.sc-slide').forEach((el,i)=>el.classList.toggle('on',i===scIdx));
      $$('.sc-dots i').forEach((el,i)=>el.classList.toggle('on',i===scIdx))},7000)})}
function scKeys(e){if(e.key==='Escape')exitShowcase();
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=$$('.sc-slide').length;
    scIdx=(scIdx+(e.key==='ArrowRight'?1:-1)+n)%n;
    $$('.sc-slide').forEach((el,i)=>el.classList.toggle('on',i===scIdx));
    $$('.sc-dots i').forEach((el,i)=>el.classList.toggle('on',i===scIdx))}}
window.exitShowcase=()=>{clearInterval(scTimer);clearInterval(window.__scClock);
  document.removeEventListener('keydown',scKeys);document.title='CYSL · 团支部数字化工作台';
  if(document.fullscreenElement)document.exitFullscreen();nav()};

/* ================= 入党日程 ================= */
const PARTY={
 stats:[['⚡','最快入党时间','2年3个月','从提交申请书到转正式党员的最短路径。以第一批为例：2026.9 提交申请 → 2026.10-11 评积极分子 → 2027.10-11 评发展对象 → 2028.6 预备党员 → 2029.6 转正。'],
  ['🎯','毕业前转预备截止','研二下（2028.3前）','2028年3月前被评为入党积极分子，才有机会在毕业前转为预备党员。'],
  ['🏆','毕业前转正截止','研一下（2027.3前）','2027年3月前被评为入党积极分子，才有机会在毕业前转为正式党员。']],
 flow:[['📝','提交入党申请书','手写约3000字，400字方格纸'],['🗳️','评入党积极分子','团组织推优，约2-3个月'],
  ['🌟','评发展对象','积极分子满一年'],['📚','党课培训考试','24学时党校培训'],['🎉','转预备党员','预备期一年'],['🏆','转正式党员','预备期满转正']],
 batches:[
  {n:'第一批',t:'2026.9–2029.6',st:'当前阶段',cls:'green',target:'毕业前转正式党员',
   ms:[['2026.9','提交入党申请书'],['2026.10-11','团组织推优评积极分子'],['2026.12','党课培训（24学时）'],['2027.1','党章考试及格，成为积极分子'],['2027.10-11','积极分子满一年，评发展对象'],['2027.12','党校培训（24学时）'],['2028.1','校党委组织谈话'],['2028.3','成为发展对象'],['2028.6','成为预备党员'],['2029.6','转为正式党员']]},
  {n:'第二批',t:'2027.3–2029.6',st:'即将开始',cls:'gold',target:'毕业前转正式党员',
   ms:[['2027.3','推优评积极分子'],['2027.4','党课培训'],['2027.6','成为积极分子'],['2028.3','评发展对象'],['2028.4','党校培训'],['2028.5','组织谈话'],['2028.6','成为发展对象'],['2028.9','预备党员'],['2029.9','转为正式党员']]},
  {n:'第三批',t:'2027.10–2030.6',st:'未来批次',cls:'',target:'毕业后转正',
   ms:[['2027.10-11','推优评积极分子'],['2027.12','党课培训'],['2028.1','成为积极分子'],['2028.10-11','评发展对象'],['2028.12','党校培训'],['2029.1','组织谈话'],['2029.3','发展对象'],['2029.6','预备党员'],['2030.6','转为正式党员']]},
  {n:'第四批',t:'2028.3–2030.6',st:'未来批次',cls:'',target:'毕业前转预备党员',
   ms:[['2028.3','推优评积极分子'],['2028.4','党课培训'],['2028.6','积极分子'],['2029.3','评发展对象'],['2029.4','党校培训'],['2029.5','组织谈话'],['2029.6','发展对象'],['2029.9','预备党员'],['2030.9','转为正式党员']]},
  {n:'第五/六批',t:'2028.9/2029.3 起',st:'最晚批次',cls:'',target:'毕业后继续发展',
   ms:[['2028.9 或 2029.3','推优评积极分子'],['+1月','党课培训'],['+3月','成为积极分子'],['+1年','评发展对象'],['此后','党校培训→谈话→发展对象→预备党员'],['毕业后','转正，发展不中断']]}],
 materials:[['入党积极分子阶段','约1年',[['入党申请书','手写约3000字，400字方格纸'],['群团组织推优评测表','推优时填写'],['入党积极分子培养考察登记表','记录培养考察情况'],['积极分子党课结业证书','党课合格后颁发']]],
  ['发展对象阶段','约2-3个月',[['入党自传','个人成长经历、家庭情况'],['政审材料','政治审查材料'],['思想汇报','每季度一篇，约4-10篇'],['党校培训结业证书','确定发展对象后参加'],['成绩单','学习成绩是重要评选条件']]],
  ['预备党员阶段','1年',[['入党志愿书','正式入党材料'],['预备党员考察登记表','预备期一年考察'],['思想汇报','预备期间4篇']]]],
 notes:[['⚠️','入党申请书落款日期','建议最后一行落款日期先空着，确定积极分子时再填——日期需与《入党积极分子培养考察登记表》一致，提前写错要整页重抄。'],
  ['🔴','指导思想一字不差','写"党的指导思想/行动指南"必须完整准确：马克思列宁主义、毛泽东思想、邓小平理论、"三个代表"重要思想、科学发展观、习近平新时代中国特色社会主义思想。错漏任何一处都可能被要求重写。'],
  ['🔴','两个先锋队完整表述','必须写全："中国共产党是中国工人阶级的先锋队，同时是中国人民和中华民族的先锋队"，不能省"同时是"、不能颠倒顺序。建议连同"一个领导核心""三个代表"整套写。'],
  ['🔄','组织关系转接','积极分子/发展对象转往他校他单位不一定被认可，可能要重新发展；毕业前已转预备党员则不受影响，转正当继承。注意留档电子证明材料。'],
  ['📚','成绩与任职','成绩好是首要条件但非充分条件；建议有干部任职经历并积累志愿时长，具体以导员、院团委书记意见为准。'],
  ['⏱️','发展时长','全流程最快2年3个月；积极分子到发展对象可能延长，最长案例约3年9个月。']]};
let partyTab='overview',partyBatch=0;
function pgParty(){const pg=$('#pg');
  const tabs=[['overview','📊 总览'],['timeline','📅 时间线'],['materials','📋 材料清单'],['notes','⚠️ 注意事项']];
  pg.innerHTML=`<div class="page-h"><h2>入党日程表</h2><span class="hint">流程指南 · 批次安排 · 材料清单 · 避坑须知</span></div>
  <div class="grid g3">${PARTY.stats.map(s=>`<div class="card stat"><span class="ico">${s[0]}</span>
    <span class="v" style="font-size:17px">${s[2]}</span><span class="l">${s[1]}</span>
    <div style="font-size:11px;color:var(--mut);margin-top:6px;line-height:1.5">${s[3]}</div></div>`).join('')}</div>
  <div class="chips" style="margin-top:14px">${tabs.map(t=>`<button class="fchip ${partyTab===t[0]?'on':''}" onclick="partyTab='${t[0]}';pgParty()">${t[1]}</button>`).join('')}</div>
  <div id="pt"></div>`;
  const el=$('#pt');
  if(partyTab==='overview')el.innerHTML=`<div class="card"><h3><span class="dot"></span>入党整体流程</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${PARTY.flow.map((f,i)=>`${i?'<span style="color:var(--mut)">→</span>':''}<span class="chip red" style="font-size:12px;padding:7px 12px">${f[0]} ${f[1]}</span>`).join('')}</div>
    <div class="grid g3" style="margin-top:14px">${PARTY.flow.map(f=>`<div style="font-size:12px;color:var(--mut);line-height:1.5"><b style="color:var(--ink)">${f[1]}</b><br>${f[2]}</div>`).join('')}</div></div>
    <div class="grid g2" style="margin-top:14px">${PARTY.batches.map((b,i)=>`<a class="card" onclick="partyBatch=${i};partyTab='timeline';pgParty()"><div style="display:flex;gap:8px;align-items:center"><b>${b.n}</b><span class="chip ${b.cls||'gray'}">${b.st}</span></div>
    <div style="font-size:12px;color:var(--mut);margin:6px 0">${b.t}</div><div style="font-size:12.5px">🎯 ${b.target}</div></a>`).join('')}</div>`;
  if(partyTab==='timeline'){const b=PARTY.batches[partyBatch];
    el.innerHTML=`<div class="chips">${PARTY.batches.map((x,i)=>`<button class="fchip ${partyBatch===i?'on':''}" onclick="partyBatch=${i};pgParty()">${x.n}</button>`).join('')}</div>
    <div class="card"><h3><span class="dot"></span>${b.n} · ${b.t} <span class="chip ${b.cls||'gray'}" style="margin-left:6px">${b.st}</span></h3>
    ${b.ms.map((m,i)=>`<div class="vrow"><span class="nm" style="width:96px;font-weight:600;color:var(--red-d)">${m[0]}</span>
    <span style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--red)':'var(--gold)'};flex-shrink:0"></span>
    <span style="flex:1;font-size:13.5px">${m[1]}</span></div>`).join('')}
    <div class="rem warn" style="margin-top:10px"><span class="ic">🎯</span><span class="t">目标：${b.target}</span></div></div>`}
  if(partyTab==='materials'){const key='cysl_mat';let ck={};try{ck=JSON.parse(localStorage.getItem(key))||{}}catch(e){}
    const tot=PARTY.materials.reduce((s,m)=>s+m[2].length,0),done=Object.values(ck).filter(Boolean).length;
    el.innerHTML=`<div class="card"><h3><span class="dot"></span>材料准备进度 ${done}/${tot}</h3><div class="pbar"><i style="width:${tot?done/tot*100:0}%"></i></div></div>
    ${PARTY.materials.map((m,mi)=>`<div class="card" style="margin-top:14px"><h3><span class="dot"></span>${m[0]} <span class="chip" style="margin-left:4px">${m[1]}</span></h3>
    ${m[2].map((it,ii)=>`<div class="vrow" onclick="(function(){let c=JSON.parse(localStorage.getItem('${key}')||'{}');c['${mi}-${ii}']=!c['${mi}-${ii}'];localStorage.setItem('${key}',JSON.stringify(c));pgParty()})()" style="cursor:pointer">
    <span style="font-size:17px">${ck[mi+'-'+ii]?'✅':'⬜'}</span><span style="flex:1"><b style="font-size:13.5px">${it[0]}</b><br><small style="color:var(--mut)">${it[1]}</small></span></div>`).join('')}</div>`).join('')}`}
  if(partyTab==='notes')el.innerHTML=PARTY.notes.map(n=>`<div class="card" style="margin-bottom:12px"><h3>${n[0]} ${n[1]}</h3><div style="font-size:13.5px;line-height:1.7;color:#4a3d38">${n[2]}</div></div>`).join('')
}

/* ================= 团务知识库 ================= */
const KNOW=[
 {t:'"三会两制一课" 制度',icon:'🏛️',body:`团内组织生活的基本制度，出自《中国共产主义青年团支部工作条例（试行）》：
【三会】
· 支部团员大会：支部最高议事机构，每季度至少1次。议题含学习上级精神、选举、评议、推优等，决议须半数以上有表决权团员通过。
· 支部委员会：大会闭会期间的领导机构，每月至少1次。研究支部日常事务、工作计划与分工落实。
· 团小组会：按团小组开展，组织学习、交流思想、落实支部分工，按需开展。

【两制】
· 团员教育评议制度：年度开展，围绕思想、学习、工作、纪律开展自评互评，评出优秀/合格/基本合格/不合格等次。
· 团员年度团籍注册制度：每年1次，结合教育评议进行，是团员团籍连续有效的必要程序，一般结合"智慧团建"系统线上完成。

【一课】
· 团课：团员教育的主要形式，每季度至少1次。围绕党的理论、团章团史、形势政策开展，可邀请老师/支委/优秀团员讲授。`},
 {t:'《团章》核心要点',icon:'📖',body:`· 性质：中国共产主义青年团是中国共产党领导的先进青年的群团组织，是党的助手和后备军。
· 团员年龄：14周岁以上、28周岁以下的中国青年可申请入团；年满28岁未任团内职务应办理离团。
· 团员义务：学习理论、执行决议、按时缴纳团费、参加组织生活、发挥模范作用。
· 团员权利：选举权/被选举权/表决权、参加团的活动、对团的工作提出建议、申辩与申诉。
· 组织原则：民主集中制。团的全国代表大会每5年一次；基层组织包括团的基层委员会、总支部委员会、支部委员会。
· 纪律处分：警告、严重警告、撤销团内职务、留团察看、开除团籍。`},
 {t:'发展团员流程',icon:'🌱',body:`1. 提交入团申请书 → 2. 确定为入团积极分子（培养考察不少于3个月）→ 3. 确定为发展对象 → 4. 填写《入团志愿书》→ 5. 支部大会讨论表决 → 6. 上级团委审批 → 7. 入团宣誓、颁发团徽团员证。
要点：两名团员作介绍人；表决须半数以上通过；宣誓为必备程序。`},
 {t:'"推优入党"流程',icon:'🌟',body:`推优 = 团组织推荐优秀团员作党的发展对象，是团员入党的主渠道。
1. 支部委员会酝酿提名 → 2. 支部团员大会民主评议/表决 → 3. 团支部填写《推优表》报上级团委 → 4. 上级团委审核后向党支部推荐 → 5. 党支部确定入党积极分子。
要点：团员入党一般应经团组织推优；推优有效期按上级党组织规定（通常一年）。`},
 {t:'"智慧团建"系统操作',icon:'💻',body:`· 团员电子档案：组织关系转接、团籍注册均在线办理；转接需原支部与新支部双端确认。
· 留痕同步：每次"三会两制一课"活动后3日内，在系统录入活动信息（时间/主题/人数/摘要/照片），即"网上团支部"动态更新。
· 教育评议：评议结果在系统内确认；团籍注册以年度评议结果为依据在线完成。
· 管理员：支部书记/组织委员持管理员账号维护成员与活动数据。`},
 {t:'主题团日怎么开',icon:'🚩',body:`一月一主题，支部全员参加，建议流程：
确定主题（结合重要纪念日/上级部署/专业特色）→ 方案策划 → 活动实施（学习+实践+交流）→ 三件套留痕（签到表+记录+照片）→ 3日内归档+智慧团建同步 → 总结复盘。
常见主题：理论学习、红色寻访、志愿服务、专业实践（如网络安全宣传）、文体共建。`}];

const STUDY=[
 {c:'讲话',t:'在庆祝中国共产主义青年团成立100周年大会上的讲话',s:'2022.5.10',u:'https://www.gqt.org.cn',b:'提出“四个塑造”，勉励共青团“坚持为党育人、自觉担当尽责、心系广大青年、勇于自我革命”。'},
 {c:'讲话',t:'纪念五四运动100周年大会上的讲话',s:'2019.4.30',u:'https://www.gqt.org.cn',b:'提出新时代中国青年“树立远大理想、热爱伟大祖国、担当时代责任、勇于砥砺奋斗、练就过硬本领、锤炼品德修为”六点要求。'},
 {c:'讲话',t:'同团中央新一届领导班子成员集体谈话',s:'2023.6.26',u:'https://www.gqt.org.cn',b:'强调团的工作要把牢新时代青年工作主题，着力加强对青年的政治引领。'},
 {c:'讲话',t:'同团中央新一届领导班子成员集体谈话',s:'2018.7.2',u:'https://www.gqt.org.cn',b:'要求共青团“树立大抓基层的鲜明导向，推动改革举措落到基层”。'},
 {c:'讲话',t:'同团中央新一届领导班子成员集体谈话',s:'2013.6.20',u:'https://www.gqt.org.cn',b:'指出共青团工作根本任务：培养中国特色社会主义事业建设者和接班人。'},
 {c:'讲话',t:'在庆祝中国共产党成立100周年大会上的讲话',s:'2021.7.1',u:'https://www.gqt.org.cn',b:'“未来属于青年，希望寄予青年”，新时代青年要以实现中华民族伟大复兴为己任。'},
 {c:'讲话',t:'在北京大学师生座谈会上的讲话',s:'2018.5.2',u:'https://www.gqt.org.cn',b:'提出“爱国、励志、求真、力行”八字要求勉励青年学子。'},
 {c:'讲话',t:'在北京大学师生座谈会上的讲话',s:'2014.5.4',u:'https://www.gqt.org.cn',b:'首次系统阐述青年要扣好人生第一粒扣子，培育和践行社会主义核心价值观。'},
 {c:'讲话',t:'在中国政法大学考察时的讲话',s:'2017.5.3',u:'https://www.gqt.org.cn',b:'勉励青年“立志是一切开始的前提”，正确处理顺境逆境。'},
 {c:'讲话',t:'在中国人民大学考察时的讲话',s:'2022.4.25',u:'https://www.gqt.org.cn',b:'勉励青年“在青春的赛道上奋力奔跑，争取跑出当代青年的最好成绩”。'},
 {c:'讲话',t:'在清华大学考察时的讲话',s:'2021.4.19',u:'https://www.gqt.org.cn',b:'寄语青年“立大志、明大德、成大才、担大任”。'},
 {c:'讲话',t:'在同各界优秀青年代表座谈时的讲话',s:'2013.5.4',u:'https://www.gqt.org.cn',b:'提出青年要“坚定理想信念、练就过硬本领、勇于创新创造、矢志艰苦奋斗、锤炼高尚品格”。'},
 {c:'讲话',t:'知识分子、劳动模范、青年代表座谈会上的讲话',s:'2016.4.26',u:'https://www.gqt.org.cn',b:'勉励青年“勇做走在时代前列的奋进者、开拓者、奉献者”。'},
 {c:'讲话',t:'在学校思想政治理论课教师座谈会上的讲话',s:'2019.3.18',u:'https://www.gqt.org.cn',b:'强调思政课是落实立德树人根本任务的关键课程。'},
 {c:'讲话',t:'在全国教育大会上的讲话',s:'2018.9.10',u:'https://www.gqt.org.cn',b:'提出培养德智体美劳全面发展的社会主义建设者和接班人。'},
 {c:'讲话',t:'在全国教育大会上的讲话',s:'2024.9.9',u:'https://www.gqt.org.cn',b:'强调建成教育强国的战略目标，实施新时代立德树人工程。'},
 {c:'讲话',t:'中央人才工作会议上的讲话',s:'2021.9.27',u:'https://www.gqt.org.cn',b:'强调造就规模宏大的青年科技人才队伍。'},
 {c:'讲话',t:'科学家座谈会上的讲话',s:'2020.9.11',u:'https://www.gqt.org.cn',b:'勉励青年科技人才肩负起历史赋予的科技创新重任。'},
 {c:'讲话',t:'党史学习教育动员大会上的讲话',s:'2021.2.20',u:'https://www.gqt.org.cn',b:'要求全党“学党史、悟思想、办实事、开新局”，青年要知史爱党、知史爱国。'},
 {c:'讲话',t:'纪念辛亥革命110周年大会上的讲话',s:'2021.10.9',u:'https://www.gqt.org.cn',b:'勉励海内外中华儿女为实现中华民族伟大复兴共同奋斗。'},
 {c:'讲话',t:'纪念中国人民抗日战争暨世界反法西斯战争胜利80周年大会上的讲话',s:'2025.9.3',u:'https://www.gqt.org.cn',b:'铭记历史、缅怀先烈、珍爱和平、开创未来，宣示走和平发展道路。'},
 {c:'讲话',t:'纪念中国人民志愿军抗美援朝出国作战70周年大会上的讲话',s:'2020.10.23',u:'https://www.gqt.org.cn',b:'弘扬伟大抗美援朝精神，雄赳赳气昂昂向着全面建设社会主义现代化国家新征程进军。'},
 {c:'讲话',t:'党的二十大报告（青年部分）',s:'2022.10.16',u:'https://www.gqt.org.cn',b:'“青年强，则国家强”，全党要把青年工作作为战略性工作来抓。'},
 {c:'讲话',t:'党的十九大报告（青年部分）',s:'2017.10.18',u:'https://www.gqt.org.cn',b:'“青年兴则国家兴，青年强则国家强”，青年一代有理想、有本领、有担当。'},
 {c:'回信',t:'给中国农业大学科技小院的学生回信',s:'2023.5.1',u:'https://www.gqt.org.cn',b:'肯定同学们“自找苦吃”的精气神，鼓励走进乡土中国深处解民生、治学问。'},
 {c:'回信',t:'给新疆克孜勒苏柯尔克孜自治州阿图什市谢依特小学戍边支教西部计划志愿者服务队回信',s:'2025.5.2',u:'https://www.gqt.org.cn',b:'勉励志愿者到祖国和人民最需要的地方发光发热，为中国式现代化建设贡献青春力量。'},
 {c:'回信',t:'给南京大学留学归国青年学者回信',s:'2022.5.18',u:'https://www.gqt.org.cn',b:'勉励归国学者心系“国家事”、肩扛“国家责”，在坚持立德树人、推动科技自立自强上再创佳绩。'},
 {c:'回信',t:'给北京师范大学“优师计划”师范生回信',s:'2022.9.7',u:'https://www.gqt.org.cn',b:'勉励师范生到祖国和人民最需要的地方去，努力成为党和人民满意的“四有”好老师。'},
 {c:'回信',t:'给东北大学全体师生回信',s:'2023.9.15',u:'https://www.gqt.org.cn',b:'勉励师生培养更多高素质人才，为推动东北全面振兴、推进中国式现代化作出新贡献。'},
 {c:'回信',t:'给武汉大学参加中国南北极科学考察队师生代表回信',s:'2023.12.1',u:'https://www.gqt.org.cn',b:'勉励师生用大事业磨砺真本领，为高水平科技自立自强贡献力量。'},
 {c:'回信',t:'给中国国际大学生创新大赛参赛学生代表回信',s:'2024.10',u:'https://www.gqt.org.cn',b:'勉励青年学生弘扬科学精神，积极投身科技创新，在中国式现代化中挺膺担当。'},
 {c:'回信',t:'给中国传媒大学全体师生回信',s:'2024.9',u:'https://www.gqt.org.cn',b:'勉励师生培养更多高素质新闻传播人才，讲好中国故事。'},
 {c:'回信',t:'给四川省南充市嘉陵区之江小学学生回信',s:'2024.5.30',u:'https://www.gqt.org.cn',b:'勉励少年儿童争做爱党爱国、自立自强、奋发向上的新时代好少年。'},
 {c:'回信',t:'给“银龄行动”老年志愿者代表回信',s:'2024.10',u:'https://www.gqt.org.cn',b:'肯定老年人志愿服务，勉励为推进中国式现代化贡献“银发力量”。'},
 {c:'回信',t:'给普洱民族团结誓词碑盟誓代表后代回信',s:'2024.9',u:'https://www.gqt.org.cn',b:'勉励各族群众铸牢中华民族共同体意识，共守祖国疆土、共建美好家园。'},
 {c:'回信',t:'给西藏林芝市巴宜区林芝镇嘎拉村全体村民回信',s:'2025.6',u:'https://www.gqt.org.cn',b:'勉励村民把日子过得更红火，建设美丽幸福西藏。'},
 {c:'回信',t:'给全国特岗教师代表回信',s:'2025.9.9',u:'https://www.gqt.org.cn',b:'教师节前夕勉励特岗教师坚守教育初心，为乡村振兴贡献教育力量。'},
 {c:'回信',t:'给“中国好人”李培生胡晓春回信',s:'2022.8.13',u:'https://www.gqt.org.cn',b:'勉励继续发挥榜样作用，带动更多身边人向上向善。'},
 {c:'回信',t:'给河北省保定学院西部支教毕业生群体代表回信',s:'2014.5.3',u:'https://www.gqt.org.cn',b:'勉励青年到基层和人民中去建功立业，让青春之花绽放在祖国最需要的地方。'},
 {c:'回信',t:'给华中农业大学“本禹志愿服务队”回信',s:'2013.12.5',u:'https://www.gqt.org.cn',b:'勉励青年志愿者坚持与祖国同行、为人民奉献，以青春梦想用实际行动为实现中国梦作贡献。'},
 {c:'回信',t:'给莫斯科大学中国留学生回信',s:'2017.12.30',u:'https://www.gqt.org.cn',b:'勉励留学生弘扬留学报国光荣传统，让青春之光闪耀在为梦想奋斗的道路上。'},
 {c:'回信',t:'给南开大学8名新入伍大学生回信',s:'2017.9.23',u:'https://www.gqt.org.cn',b:'勉励携笔从戎的大学生把热血挥洒在实现强军梦的伟大实践之中。'},
 {c:'回信',t:'给西藏隆子县玉麦乡牧民卓嘎、央宗姐妹回信',s:'2017.10.28',u:'https://www.gqt.org.cn',b:'勉励传承爱国守边精神，做神圣国土守护者、幸福家园建设者。'},
 {c:'回信',t:'给第三届中国“互联网+”大学生创新创业大赛“青年红色筑梦之旅”大学生回信',s:'2017.8.15',u:'https://www.gqt.org.cn',b:'勉励青年学子扎根中国大地了解国情民情，在创新创业中增长智慧才干。'},
 {c:'回信',t:'给国家测绘地理信息局第一大地测量队老党员回信',s:'2015.7.1',u:'https://www.gqt.org.cn',b:'肯定国测一大队艰苦奋斗、无私奉献精神，勉励全体党员不忘初心。'},
 {c:'回信',t:'给南京青奥会志愿者回信',s:'2014.7',u:'https://www.gqt.org.cn',b:'勉励志愿者弘扬奥林匹克精神和志愿服务精神，展现中国青年风采。'},
 {c:'回信',t:'给大陈岛老垦荒队员后代、浙江省台州市小学生回信',s:'2016.6.1',u:'https://www.gqt.org.cn',b:'勉励孩子们传承大陈岛垦荒精神，做祖国和人民事业发展的接班人。'},
 {c:'回信',t:'给陕西照金北梁红军小学学生回信',s:'2018.5.30',u:'https://www.gqt.org.cn',b:'勉励孩子们热爱党、热爱祖国、热爱人民，做对国家、对人民、对社会有用的人。'},
 {c:'回信',t:'给北京体育大学2016级研究生冠军班学生回信',s:'2019.6.18',u:'https://www.gqt.org.cn',b:'勉励运动员为建设体育强国多作贡献，为社会传递更多正能量。'},
 {c:'回信',t:'给复旦大学青年师生党员回信',s:'2020.6.27',u:'https://www.gqt.org.cn',b:'勉励党员在学思践悟中坚定理想信念，在奋发有为中践行初心使命。'},
 {c:'回信',t:'给中国石油大学（北京）克拉玛依校区毕业生回信',s:'2020.7.7',u:'https://www.gqt.org.cn',b:'肯定毕业生奔赴新疆基层工作的选择，勉励为党为祖国为人民多作贡献。'},
 {c:'回信',t:'给中国戏曲学院师生回信',s:'2020.10.23',u:'https://www.gqt.org.cn',b:'勉励师生坚定文化自信，传承弘扬中华优秀传统文化。'},
 {c:'回信',t:'给河北省平山县西柏坡镇北庄村全体党员回信',s:'2021.2.7',u:'https://www.gqt.org.cn',b:'勉励党员群众团结一心，在全面建设社会主义现代化国家新征程上奋勇争先。'},
 {c:'回信',t:'给上海外国语大学师生回信',s:'2019.6',u:'https://www.gqt.org.cn',b:'勉励师生提高人才培养质量，为中外人文交流作出更大贡献。'},
 {c:'文件',t:'《中国共产主义青年团章程》（团的十九大修订）',s:'2023.6',u:'https://www.gqt.org.cn',b:'团的根本大法，明确团的性质、任务、组织制度和团员义务权利。'},
 {c:'文件',t:'《中国共产主义青年团支部工作条例》',s:'2019.6',u:'https://www.gqt.org.cn',b:'支部工作基本遵循：“三会两制一课”制度的具体规范。'},
 {c:'文件',t:'《中国共产主义青年团团员教育管理工作条例（试行）》',s:'2020.12',u:'https://www.gqt.org.cn',b:'团员教育管理的基本制度，规范团籍、组织关系、日常教育。'},
 {c:'文件',t:'《中国共产主义青年团纪律处分条例（试行）》',s:'2022.1',u:'https://www.gqt.org.cn',b:'明确团员违纪行为与处分种类，全面从严治团制度支撑。'},
 {c:'文件',t:'《中国共产主义青年团发展团员工作细则》',s:'2016',u:'https://www.gqt.org.cn',b:'规范入团条件、程序与仪式，控制总量、提高质量。'},
 {c:'文件',t:'《关于保持和增强团员先进性的意见》',s:'2017',u:'https://www.gqt.org.cn',b:'提出团员先进性标准与“一学一做”教育实践路径。'},
 {c:'文件',t:'《关于新形势下推进从严治团的规定》',s:'2017.1',u:'https://www.gqt.org.cn',b:'全面从严治团的纲领性文件，明确“六严”要求。'},
 {c:'文件',t:'《关于加强新时代团的基层建设着力提升团的组织力的意见》',s:'2019',u:'https://www.gqt.org.cn',b:'树立大抓基层导向，健全基层组织体系。'},
 {c:'文件',t:'《关于加强党建带团建工作的意见》',s:'2026.3',u:'https://www.gqt.org.cn',b:'健全党建带团建制度机制，贯通党团队一体化育人链条。'},
 {c:'文件',t:'《关于推进中国青年志愿者行动高质量发展的指导意见》',s:'2026.4（中青发〔2026〕4号）',u:'https://www.gqt.org.cn',b:'健全志愿服务体系，深化青年志愿者行动。'},
 {c:'文件',t:'《志愿服务条例》',s:'2017.12（国务院令）',u:'https://www.gqt.org.cn',b:'我国志愿服务领域第一部行政法规，规范志愿者权益保障。'},
 {c:'文件',t:'《关于推进志愿服务制度化的意见》',s:'2014.2',u:'https://www.gqt.org.cn',b:'推动志愿服务制度化常态化的指导性文件。'},
 {c:'文件',t:'《新时代的中国青年》白皮书',s:'2022.4（国务院新闻办）',u:'https://www.gqt.org.cn',b:'首部专门关于青年的白皮书，全景展现新时代青年风貌。'},
 {c:'文件',t:'《中长期青年发展规划（2016—2025年）》',s:'2017.4',u:'https://www.gqt.org.cn',b:'新中国历史上第一个青年发展规划，提出“党和国家事业要发展，青年首先要发展”。'},
 {c:'文件',t:'《关于开展青年发展型城市建设试点的意见》',s:'2022.4',u:'https://www.gqt.org.cn',b:'部署青年发展型城市建设，让城市对青年更友好、青年在城市更有为。'},
 {c:'文件',t:'《深化学校共青团改革的若干措施》',s:'2019',u:'https://www.gqt.org.cn',b:'聚焦高校共青团主责主业，深化“第二课堂成绩单”制度。'},
 {c:'文件',t:'《关于学联学生会工作人员改进作风服务同学的若干规定》',s:'2019',u:'https://www.gqt.org.cn',b:'学联学生会改革文件，明确工作人员作风要求。'},
 {c:'文件',t:'《深化青年马克思主义者培养工程的实施意见》',s:'2020',u:'https://www.gqt.org.cn',b:'规范“青马工程”培养体系，为党培养青年政治骨干。'},
 {c:'文件',t:'《关于在广大团员青年中开展党史学习教育的通知》',s:'2021.3',u:'https://www.gqt.org.cn',b:'部署团员青年党史学习教育，“学党史、强信念、跟党走”。'},
 {c:'文件',t:'《中华人民共和国爱国主义教育法》',s:'2024.1施行',u:'https://www.gqt.org.cn',b:'爱国主义教育专门立法，青少年为重点对象。'},
 {c:'文件',t:'《中华人民共和国未成年人保护法》（修订）',s:'2021.6施行',u:'https://www.gqt.org.cn',b:'强化对未成年人的六大保护体系。'},
 {c:'文件',t:'《中国共产党普通高等学校基层组织工作条例》',s:'2021.4',u:'https://www.gqt.org.cn',b:'高校党团一体化建设的制度依据。'},
 {c:'报告',t:'党的二十大报告《高举中国特色社会主义伟大旗帜 为全面建设社会主义现代化国家而团结奋斗》',s:'2022.10',u:'https://www.gqt.org.cn',b:'中国式现代化宏伟蓝图，“三个务必”与“五个重大原则”。'},
 {c:'报告',t:'党的二十届三中全会《中共中央关于进一步全面深化改革、推进中国式现代化的决定》',s:'2024.7',u:'https://www.gqt.org.cn',b:'部署全面深化改革，健全青年人才发现选拔培养机制。'},
 {c:'报告',t:'党的二十届四中全会《中共中央关于制定国民经济和社会发展第十五个五年规划的建议》',s:'2025.10',u:'https://www.gqt.org.cn',b:'“十五五”时期经济社会发展顶层设计。'},
 {c:'报告',t:'团的十九大报告',s:'2023.6',u:'https://www.gqt.org.cn',b:'“在强国建设民族复兴新征程上书写壮丽青春篇章”。'},
 {c:'报告',t:'团的十八大报告',s:'2018.6',u:'https://www.gqt.org.cn',b:'“高举习近平新时代中国特色社会主义思想伟大旗帜，奋力谱写决胜全面建成小康社会全面建设社会主义现代化国家的壮丽青春篇章”。'},
 {c:'报告',t:'团十九届四中全会精神',s:'2024',u:'https://www.gqt.org.cn',b:'部署动员团员青年为中国式现代化挺膺担当。'},
 {c:'报告',t:'《中共中央关于党的百年奋斗重大成就和历史经验的决议》',s:'2021.11',u:'https://www.gqt.org.cn',b:'党的第三个历史决议，“十个坚持”历史经验。'},
 {c:'报告',t:'中央经济工作会议精神',s:'历年12月',u:'https://www.gqt.org.cn',b:'研判经济形势部署来年工作，青年就业是重点关切。'},
 {c:'报告',t:'《政府工作报告》（青年与教育相关部署）',s:'历年3月',u:'https://www.gqt.org.cn',b:'高校毕业生就业、教育科技人才一体推进等部署。'},
 {c:'寄语',t:'2025年五四青年节寄语',s:'2025.5.4',u:'https://www.gqt.org.cn',b:'勉励青年坚定理想信念，厚植家国情怀，练就过硬本领，发扬奋斗精神，到祖国和人民最需要的地方发光发热。'},
 {c:'寄语',t:'2024年五四青年节寄语',s:'2024.5.4',u:'https://www.gqt.org.cn',b:'勉励青年争做有理想、敢担当、能吃苦、肯奋斗的新时代好青年。'},
 {c:'寄语',t:'2023年五四青年节寄语',s:'2023.5.4',u:'https://www.gqt.org.cn',b:'勉励青年厚植爱农情怀、练就兴农本领，在乡村振兴大舞台建功立业。'},
 {c:'寄语',t:'2022年五四青年节之际考察中国人民大学',s:'2022.4.25',u:'https://www.gqt.org.cn',b:'“立志民族复兴，不负韶华、不负时代、不负人民”。'},
 {c:'寄语',t:'2021年五四前夕考察清华大学',s:'2021.4',u:'https://www.gqt.org.cn',b:'“让青春在为祖国、为民族、为人民、为人类的不懈奋斗中绽放绚丽之花”。'},
 {c:'寄语',t:'2020年五四青年节寄语',s:'2020.5.3',u:'https://www.gqt.org.cn',b:'“青春由磨砺而出彩，人生因奋斗而升华”，各族青年在战疫中展现担当。'},
 {c:'寄语',t:'致中国少年先锋队第八次全国代表大会贺信',s:'2020.7.23',u:'https://www.gqt.org.cn',b:'勉励少先队员从小立志向、修品行、练本领。'},
 {c:'寄语',t:'致首届全国职业技能大赛贺信',s:'2020.12.10',u:'https://www.gqt.org.cn',b:'勉励青年技能人才走技能成才、技能报国之路。'},
 {c:'寄语',t:'致全国青联十三届全委会和全国学联二十七大贺信',s:'2020.8.17',u:'https://www.gqt.org.cn',b:'勉励青联学联组织团结带领青年为党和国家事业发展作贡献。'},
 {c:'寄语',t:'致中国志愿服务联合会第二届会员代表大会贺信',s:'2019.7.23',u:'https://www.gqt.org.cn',b:'勉励志愿者弘扬奉献友爱互助进步精神，书写新时代雷锋故事。'},
 {c:'寄语',t:'致全国青联十三届全委会贺信精神（青年工作）',s:'2020.8',u:'https://www.gqt.org.cn',b:'青联工作是党的青年工作重要组成部分。'},
 {c:'寄语',t:'致中华全国青年联合会世界青年发展论坛贺信',s:'2022.7.21',u:'https://www.gqt.org.cn',b:'勉励各国青年以实际行动推进全球发展倡议，共创人类美好未来。'},
 {c:'寄语',t:'致世界青年发展论坛贺信（青年参与全球治理）',s:'2022.7',u:'https://www.gqt.org.cn',b:'青年代表希望，青年创造明天。'},
 {c:'寄语',t:'致全国青联学联换届及青年统战工作指示',s:'2020',u:'https://www.gqt.org.cn',b:'巩固和扩大党执政的青年群众基础。'},
 {c:'实务',t:'“三会两制一课”制度实务指引',s:'团中央基层建设部',u:'https://www.gqt.org.cn',b:'支部团员大会每季度至少1次、支委会每月至少1次、团小组会按月召开、团课每季度至少1次；团员教育评议制度、年度团籍注册制度。'},
 {c:'实务',t:'“青年大学习”网上主题团课学习指引',s:'团中央宣传部',u:'https://www.gqt.org.cn',b:'每周一期的网上主题团课，团员全员参与、计入学习记录。'},
 {c:'实务',t:'入团仪式、重温入团誓词规范',s:'团中央',u:'https://www.gqt.org.cn',b:'规范誓词内容与仪式流程，增强团员身份意识。'},
 {c:'实务',t:'推优入党工作规范',s:'团中央＋中组部',u:'https://www.gqt.org.cn',b:'“推优”是党赋予团组织的光荣任务，28周岁以下青年入党一般应从团员中发展。'},
 {c:'实务',t:'团员教育评议与年度团籍注册流程',s:'团中央',u:'https://www.gqt.org.cn',b:'民主评议团员（优秀/合格/基本合格/不合格），评议合格方可注册。'},
 {c:'实务',t:'团旗、团徽、团歌使用规范',s:'团中央办公厅',u:'https://www.gqt.org.cn',b:'规范团旗团徽制作使用场合，奏唱团歌场合要求。'},
 {c:'实务',t:'“智慧团建”系统操作要点',s:'团中央',u:'https://www.gqt.org.cn',b:'团员电子档案、组织关系转接、活动记录线上管理。'},
];
const STUDY_CATS={讲话:'📣 重要讲话',回信:'✉️ 重要回信贺信',文件:'📜 法规条例与政策文件',报告:'🏛 大会报告与全会精神',寄语:'🌱 五四寄语与节日指示',实务:'🛠 团务实务指引'};
window._st={q:'',cat:'',pg:0};
window.stGo=p=>{window._st.pg=p;pgKnowledge();const el=document.querySelector('.sect');el&&el.scrollIntoView()};
window.stCat=c=>{window._st.cat=c;window._st.pg=0;pgKnowledge()};
window.stSearch=v=>{window._st.q=v;window._st.pg=0;
  const box=$('#st-list');if(box)box.innerHTML=stListHtml()};
function stListHtml(){const P=12;const q=window._st.q.trim().toLowerCase();
  let arr=STUDY.filter(k=>(!window._st.cat||k.c===window._st.cat)
    &&(!q||(k.t+k.s+k.b).toLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(arr.length/P));
  const pg=Math.min(window._st.pg,pages-1);window._st.pg=pg;
  const part=arr.slice(pg*P,pg*P+P);
  return `${part.map(k=>`<div class="card" style="margin-bottom:10px;cursor:pointer" onclick="const b=this.querySelector('.st-body');b.style.display=b.style.display==='none'?'block':'none'">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><span class="chip">${STUDY_CATS[k.c]?STUDY_CATS[k.c].slice(3):k.c}</span><b style="font-size:14.5px;flex:1;min-width:60%">${esc(k.t)}</b>
    <span style="margin-left:auto;font-size:11px;color:var(--mut);white-space:nowrap">${esc(k.s)}</span></div>
    <div class="st-body" style="display:none;margin-top:8px"><div class="paper" style="border:none;padding:4px 0">${esc(k.b)}</div>
    <a href="${k.u}" target="_blank" rel="noopener" style="font-size:12px">前往官方来源 ↗</a></div></div>`).join('')}
  ${!part.length?'<div class="empty" style="padding:24px">无匹配资料</div>':''}
  ${pages>1?`<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin:14px 0;flex-wrap:wrap">
    <button class="btn ghost sm" ${pg===0?'disabled style="opacity:.4"':''} onclick="stGo(${pg-1})">‹ 上页</button>
    ${Array.from({length:pages},(_,i)=>i).filter(i=>i===0||i===pages-1||Math.abs(i-pg)<=2).map(i=>
      `<button class="btn ${i===pg?'':'ghost'} sm" onclick="stGo(${i})">${i+1}</button>`).join('')}
    <button class="btn ghost sm" ${pg>=pages-1?'disabled style="opacity:.4"':''} onclick="stGo(${pg+1})">下页 ›</button>
    <span style="font-size:11.5px;color:var(--mut);width:100%;text-align:center">共 ${arr.length} 条 · 第 ${pg+1}/${pages} 页</span></div>`:''}`}
function pgKnowledge(){$('#pg').innerHTML=`<div class="page-h"><h2>学习</h2><span class="hint">${STUDY.length} 条官方学习资料 · 指示精神 · 制度原文</span></div>
  <input class="st-q" placeholder="搜索标题 / 内容 / 来源…" value="${esc(window._st.q)}"
    oninput="stSearch(this.value)" style="width:100%;padding:11px 14px;border:1.5px solid var(--line);border-radius:12px;margin-bottom:10px;font-size:14px;box-sizing:border-box">
  <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none">
    ${[''].concat(Object.keys(STUDY_CATS)).map(c=>`<button class="btn ${window._st.cat===c?'':'ghost'} sm" style="flex-shrink:0" onclick="stCat('${c}')">${c?STUDY_CATS[c]:'全部'}</button>`).join('')}</div>
  <div id="st-list">${stListHtml()}</div>
  <div class="sect" style="margin-top:20px">📚 团务知识库 · 制度要点</div>
  ${KNOW.map(k=>`<div class="card" style="margin-bottom:12px"><h3>${k.icon} ${k.t}</h3>
  <div class="paper" style="border:none;padding:4px 0 0">${esc(k.body)}</div></div>`).join('')}
  <div style="font-size:11px;color:var(--mut);margin-top:8px">资料来源：共青团中央官网 gqt.org.cn · 新华社 · 中国政府网</div>`}

/* ================= 官方公告（feed.json 数据源） ================= */
let FEED=null;
async function fetchFeed(){try{const r=await fetch('data/feed.json?t='+Date.now());if(r.ok)FEED=await r.json()}catch(e){}
  if(!FEED)try{FEED=JSON.parse(localStorage.getItem('cysl_feed_cache'))}catch(e){}
  if(FEED)localStorage.setItem('cysl_feed_cache',JSON.stringify(FEED));
  const h=$('#official-hint');if(h&&FEED)h.textContent=FEED.notices&&FEED.notices.length?FEED.notices[0].title:'已同步官方内容'}
function pgOfficial(){const pg=$('#pg');
  pg.innerHTML=`<div class="page-h"><h2>官方公告</h2><span class="hint">由支委通过网站数据统一发布 · App 自动/手动同步 · 版本 v${FEED?FEED.version:'—'}</span>
  <button class="btn ghost sm" style="margin-left:auto" onclick="fetchFeed().then(()=>pgOfficial())">↻ 检查更新</button></div>
  ${FEED?`
  ${(FEED.notices||[]).map(n=>`<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center">
    <span class="chip ${n.pin?'red':''}">${n.pin?'📌 置顶':'📣'}</span><b>${esc(n.title)}</b>
    <span style="margin-left:auto;font-size:11.5px;color:var(--mut)">${esc(n.date||'')}</span></div>
    <div style="font-size:13.5px;line-height:1.7;margin-top:8px;white-space:pre-wrap">${esc(n.body)}</div></div>`).join('')}
  ${(FEED.records||[]).length?`<div class="card" style="margin-bottom:12px"><h3><span class="dot"></span>官方留痕台账（只读）</h3>
    ${FEED.records.map(r=>`<div class="vrow"><span class="nm" style="width:96px;font-weight:600;color:var(--red-d)">${esc(r.date||'')}</span>
    <span style="flex:1;font-size:13.5px"><b>${esc(r.title||'')}</b>${(r.type||r.category)?' · '+esc(r.type||r.category):''}${r.attendees?' · '+r.attendees+'人':''}${r.summary?'<div style="font-size:12px;color:var(--mut);margin-top:2px">'+esc(r.summary)+'</div>':''}</span></div>`).join('')}
    <div style="font-size:11px;color:var(--mut);margin-top:8px">以上为支委统一发布的官方留痕，与个人登记记录区分展示</div></div>`:''}
  ${(FEED.volunteerPushes||[]).length?`<div class="card" style="margin-bottom:12px"><h3><span class="dot"></span>志愿工时公示（只读）</h3>
    ${FEED.volunteerPushes.map(v=>`<div class="vrow"><span class="nm" style="width:96px;font-weight:600;color:var(--red-d)">${esc(v.date||'')}</span>
    <span style="flex:1;font-size:13.5px"><b>${esc(v.member||'')}</b> · ${esc(v.activity||'')}<b style="color:var(--red-d)"> ${v.hours||0}h</b></span></div>`).join('')}
    <div style="font-size:11px;color:var(--mut);margin-top:8px">支委统一公示的工时认定，与个人申报区分</div></div>`:''}
  ${(FEED.schedule||[]).length?`<div class="card"><h3><span class="dot"></span>官方日程</h3>
    ${FEED.schedule.map(s=>`<div class="vrow"><span class="nm" style="width:96px;font-weight:600;color:var(--red-d)">${esc(s.date)}</span>
    <span style="flex:1;font-size:13.5px">${esc(s.title)}${s.loc?' · '+esc(s.loc):''}</span></div>`).join('')}</div>`:''}`
  :'<div class="empty"><span class="big">📡</span>暂未获取到官方数据<br><small>检查网络后点击"检查更新"</small></div>'}
  <div style="font-size:11px;color:var(--mut);margin-top:14px">数据源：站点 <code>data/feed.json</code>（隐藏端点，不在导航展示）。支委更新仓库中的该文件即可向所有 App/网页端推送新团课日程、志愿工时信息等。</div>`}
fetchFeed();

const FEED_EDIT='https://github.com/icyteacn/CYSL-26CS/edit/main/data/feed.json';
window.openFeedEdit=()=>window.open(FEED_EDIT,'_blank');
const PUB_SPEC={record:{arr:'records',fields:[['type','类型',1,'支部团员大会|支部委员会|团小组会|团课|主题团日|志愿活动|谈心谈话|立项活动|其他'],['title','标题',1,''],['date','日期(YYYY-MM-DD)',1,''],['location','地点',0,''],['attendees','人数(数字)',0,''],['summary','纪要(可多行)',2,'']]},
 vol:{arr:'volunteerPushes',fields:[['member','成员(如 团员77)',1,''],['activity','活动',1,''],['hours','工时(数字)',1,''],['date','日期(YYYY-MM-DD)',0,'']]},
 notice:{arr:'notices',fields:[['title','标题',1,''],['date','日期(YYYY-MM-DD)',1,''],['body','正文(可多行)',2,''],['pin','置顶(填1)',0,'']]},
 schedule:{arr:'schedule',fields:[['title','日程',1,''],['date','日期(YYYY-MM-DD)',1,''],['loc','地点',0,'']]}};
window.pubForm=t=>{const sp=PUB_SPEC[t];
  modal(`<h3>发布 → feed.json 的 <code>${sp.arr}[]</code></h3>
  ${sp.fields.map(f=>f[2]===2?`<textarea id="pf-${f[0]}" rows="4" placeholder="${f[3]||f[1]}" style="width:100%;margin-top:10px;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit"></textarea>`
    :`<input id="pf-${f[0]}" placeholder="${f[1]}${f[3]?'（'+f[3]+'）':''}" style="width:100%;margin-top:10px;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit">`).join('')}
  <div class="mrow"><button class="btn" onclick="pubGen('${t}')">生成 JSON</button></div>`)};
window.pubGen=t=>{const sp=PUB_SPEC[t];const o={};let ok=true;
  sp.fields.forEach(f=>{const v=($('#pf-'+f[0]).value||'').trim();
    if(!v&&f[2]===1){ok=false;$('#pf-'+f[0]).style.borderColor='var(--bad)'}
    if(v){o[f[0]]=f[0]==='attendees'||f[0]==='hours'?(isNaN(+v)?v:+v):f[0]==='pin'?!!+v:v}});
  if(!ok){toast('请填必填项');return}
  const js=JSON.stringify(o,null,2);window.__pubJs=js;
  modal(`<h3>已生成 → <code>${sp.arr}[]</code></h3>
  <div style="font-size:12px;color:var(--mut);margin-bottom:8px">打开 feed.json 编辑页 → 在 <code>"${sp.arr}": [</code> 内粘贴这段（注意结尾逗号）→ Commit。</div>
  <textarea readonly style="width:100%;height:160px;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-family:monospace;font-size:12px">${js.replace(/</g,'&lt;')}</textarea>
  <div class="mrow"><button class="btn ghost" onclick="navigator.clipboard.writeText(window.__pubJs).then(()=>toast('已复制'))">📋 复制</button>
  <button class="btn" onclick="navigator.clipboard.writeText(window.__pubJs);openFeedEdit()">📋 复制并打开编辑页</button></div>`)};

function modal(html){const r=$('#modal-root');r.className='on';
  r.innerHTML=`<div class="mback" onclick="closeModal()"></div><div class="mbox">${html}</div>`}
window.closeModal=()=>{$('#modal-root').className='';$('#modal-root').innerHTML=''};

/* ================= boot ================= */
load();window.addEventListener('hashchange',nav);
setTimeout(()=>{$('#boot').classList.add('hide');nav()},700);
