/* ══════════ 상태 & 네비게이션 ══════════ */
let currentPage = null;
let chartInited = false;

function enterApp(){
  const lp = document.getElementById('loginPage');
  lp.classList.add('leaving');
  setTimeout(()=>{
    lp.style.display='none';
    document.getElementById('appShell').classList.add('on');
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('chatPanel').classList.remove('hidden');
    nav('dashboard');
    toast('ok','로그인되었습니다 — 김농가님, 환영합니다');
  }, 330);
}

function nav(id){
  if(currentPage === id) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+id);
  // reflow로 애니메이션 재시작
  void pg.offsetWidth;
  pg.classList.add('active');
  document.querySelectorAll('.gnb-item').forEach(b=>b.classList.toggle('active', b.dataset.nav===id));
  currentPage = id;
  // 챗봇 페이지에서는 플로팅 숨김
  document.getElementById('fab').style.display = (id==='chatbot') ? 'none' : '';
  if(id==='chatbot'){ closeChatPanel(); setTimeout(initChatWidget, 120); }
  if(id==='dashboard') setTimeout(initChart, 150);
  if(id==='docs' && !document.querySelector('.doc-view.on')) goDocView('home');
  if(id==='map') setTimeout(function(){
    if(typeof initPanMap === 'function') initPanMap();
    if(panMap && panMap.invalidateSize) panMap.invalidateSize();
  }, 180);
  if(typeof closeNotif === 'function') closeNotif();
  if(id !== 'map' && $mapTip) $mapTip.classList.remove('show');
  window.scrollTo({top:0});
}

/* ══════════ amCharts 시세 차트 ══════════ */
function initChart(){
  if(chartInited || !document.getElementById('priceChart')) return;
  if(!window.am5 || !window.am5xy){ setTimeout(initChart, 300); return; }
  chartInited = true;
  const root = am5.Root.new("priceChart");
  root.setThemes([am5themes_Animated.new(root)]);
  const chart = root.container.children.push(am5xy.XYChart.new(root, {panX:false, panY:false, layout:root.verticalLayout, paddingLeft:0}));

  const data = [
    {d:"7/20", a:1128},{d:"7/23", a:1135},{d:"7/26", a:1120},{d:"7/29", a:1148},
    {d:"8/1", a:1160},{d:"8/4", a:1152},{d:"8/7", a:1171},{d:"8/10", a:1185},
    {d:"8/13", a:1198},{d:"8/16", a:1224},
    {d:"8/19", a:1240, f:1240, lo:1240, hi:1240},
    {d:"8/21", f:1258, lo:1240, hi:1278},
    {d:"8/23", f:1272, lo:1246, hi:1300},
    {d:"8/25", f:1290, lo:1254, hi:1324},
    {d:"8/26", f:1305, lo:1258, hi:1342}
  ];

  const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
    categoryField:"d",
    renderer: am5xy.AxisRendererX.new(root, {minGridDistance:36, stroke:am5.color(0xE4E8E6)})
  }));
  xAxis.data.setAll(data);
  xAxis.get("renderer").labels.template.setAll({fontSize:11, fill:am5.color(0x6E7681)});
  xAxis.get("renderer").grid.template.setAll({stroke:am5.color(0xEEF1EF)});

  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    min:1080, max:1380,
    renderer: am5xy.AxisRendererY.new(root, {stroke:am5.color(0xE4E8E6)})
  }));
  yAxis.get("renderer").labels.template.setAll({fontSize:11, fill:am5.color(0x6E7681)});
  yAxis.get("renderer").grid.template.setAll({stroke:am5.color(0xEEF1EF)});

  // 예측 범위 밴드
  const band = chart.series.push(am5xy.LineSeries.new(root, {
    xAxis, yAxis, categoryXField:"d", valueYField:"hi", openValueYField:"lo",
    fill:am5.color(0xE17A17), stroke:am5.color(0x000000)
  }));
  band.fills.template.setAll({fillOpacity:0.12, visible:true});
  band.strokes.template.setAll({strokeOpacity:0});
  band.data.setAll(data);

  // 실측
  const s1 = chart.series.push(am5xy.LineSeries.new(root, {
    name:"실측", xAxis, yAxis, categoryXField:"d", valueYField:"a",
    stroke:am5.color(0x0E7A46),
    tooltip: am5.Tooltip.new(root, {labelText:"{categoryX} · {valueY}원/kg"})
  }));
  s1.strokes.template.setAll({strokeWidth:3});
  s1.data.setAll(data);

  // 예측 (점선)
  const s2 = chart.series.push(am5xy.LineSeries.new(root, {
    name:"예측", xAxis, yAxis, categoryXField:"d", valueYField:"f",
    stroke:am5.color(0xE17A17),
    tooltip: am5.Tooltip.new(root, {labelText:"{categoryX} 예측 · {valueY}원/kg"})
  }));
  s2.strokes.template.setAll({strokeWidth:3, strokeDasharray:[7,5]});
  s2.data.setAll(data);

  // 오늘 지점 불릿
  s1.bullets.push((root, series, di)=>{
    if(di.dataContext.d === "8/19"){
      return am5.Bullet.new(root, {sprite: am5.Circle.new(root, {radius:5, fill:am5.color(0x0E7A46), stroke:am5.color(0xFFFFFF), strokeWidth:2})});
    }
    return null;
  });
  s2.bullets.push((root, series, di)=>{
    if(di.dataContext.d === "8/26"){
      return am5.Bullet.new(root, {sprite: am5.Circle.new(root, {radius:5, fill:am5.color(0xE17A17), stroke:am5.color(0xFFFFFF), strokeWidth:2})});
    }
    return null;
  });

  chart.set("cursor", am5xy.XYCursor.new(root, {behavior:"none"}));
  chart.get("cursor").lineY.set("visible", false);
  s1.appear(600); s2.appear(600); band.appear(600);
}

/* ══════════ 커스텀 셀렉트 ══════════ */
function tglSelect(btn){
  const sel = btn.closest('.select');
  document.querySelectorAll('.select.open').forEach(s=>{ if(s!==sel) s.classList.remove('open'); });
  sel.classList.toggle('open');
  event.stopPropagation();
}
function pickOpt(opt){
  const sel = opt.closest('.select');
  sel.querySelectorAll('.select-opt').forEach(o=>o.classList.remove('sel'));
  opt.classList.add('sel');
  const btn = sel.querySelector('.select-btn');
  btn.childNodes[0].textContent = opt.textContent + ' ';
  sel.classList.remove('open');
  toast('info', '"' + opt.textContent + '" 선택됨');
  event.stopPropagation();
}
document.addEventListener('click', ()=>document.querySelectorAll('.select.open').forEach(s=>s.classList.remove('open')));

/* ══════════ 토스트 ══════════ */
const T_ICONS = {
  info:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#2E6BD6" stroke-width="1.4"/><path d="M8 7.5V11" stroke="#2E6BD6" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".9" fill="#2E6BD6"/></svg>',
  warn:'<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2L16.5 15.5H1.5L9 2Z" stroke="#E17A17" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 7V10.5" stroke="#E17A17" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="13" r=".9" fill="#E17A17"/></svg>',
  ok:'<svg width="16" height="16" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.2" stroke="#0E7A46" stroke-width="1.2"/><path d="M3.5 6.2L5.3 8L8.5 4.5" stroke="#0E7A46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  err:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#D93025" stroke-width="1.4"/><path d="M5.8 5.8L10.2 10.2M10.2 5.8L5.8 10.2" stroke="#D93025" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
const T_CLASS = {info:'t-info', warn:'t-warn', ok:'t-ok', err:'t-err'};
function toast(type, msg){
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (T_CLASS[type]||'t-info');
  el.innerHTML = T_ICONS[type] + '<span>' + msg + '</span>';
  box.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 320); }, 3000);
}

/* ══════════ 모달 ══════════ */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.remove('open'); });
});

/* ══════════ 마이페이지 — 데이터 연동 ══════════ */
const CONNS = [
  {id:'epis', name:'농정원 (EPIS)', items:'경영체 등록정보 · 교육 이수 이력 · 경락 시세', icon:'g', on:true, date:'2026-05-10'},
  {id:'nts', name:'공공마이데이터 — 국세청', items:'사업자등록증명 · 소득금액증명 · 납세증명', icon:'b', on:true, date:'2026-06-02'},
  {id:'mois', name:'공공마이데이터 — 행정안전부', items:'주민등록표 등·초본 · 지방세 납세증명', icon:'b', on:false, date:null},
  {id:'kplus', name:'케이플러스 (금융·소비)', items:'법인 신용정보 · 카드 소비 패턴', icon:'o', on:true, date:'2026-06-20'}
];
let pendingConn = null;

function renderConns(){
  const box = document.getElementById('connList');
  const ICON_BG = {g:'var(--g100)', b:'var(--blue-bg)', o:'var(--orange-bg)'};
  const ICON_SVG = {
    g:'<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M10 17V9" stroke="#0E7A46" stroke-width="1.7" stroke-linecap="round"/><path d="M10 9C10 5.5 12.5 3 16 3C16 6.5 13.5 9 10 9Z" stroke="#0E7A46" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 12C10 9.5 8 7.5 5 7.5C5 10 7 12 10 12Z" stroke="#0E7A46" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    b:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="7" width="13" height="8.5" rx="1.5" stroke="#2E6BD6" stroke-width="1.5"/><path d="M9 2L15.5 7H2.5L9 2Z" stroke="#2E6BD6" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    o:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="4" width="13" height="10" rx="1.5" stroke="#E17A17" stroke-width="1.5"/><path d="M2.5 7.5H15.5" stroke="#E17A17" stroke-width="1.5"/></svg>'
  };
  box.innerHTML = CONNS.map(c=>`
    <div class="conn">
      <div class="conn-ic" style="background:${ICON_BG[c.icon]}">${ICON_SVG[c.icon]}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px">${c.name}</b>
          ${c.on ? '<span class="badge bg-ok">연동중</span>' : '<span class="badge bg-mut">미연동</span>'}</div>
        <div style="font-size:12px;color:var(--sub);margin-top:3px">${c.items}${c.on&&c.date ? ' · 동의일 '+c.date : ''}</div>
      </div>
      ${c.on
        ? `<button class="btn btn-dan-out btn-sm" onclick="askRevoke('${c.id}')">철회</button>`
        : `<button class="btn btn-pri btn-sm" onclick="askConsent('${c.id}')">연동하기</button>`}
    </div>`).join('');
  const n = CONNS.filter(c=>c.on).length;
  document.getElementById('connSummary').textContent = `${n} / ${CONNS.length} 기관 연동중`;
}

function askRevoke(id){
  pendingConn = CONNS.find(c=>c.id===id);
  document.getElementById('revokeName').textContent = pendingConn.name;
  openModal('revokeModal');
}
function confirmRevoke(){
  pendingConn.on = false; pendingConn.date = null;
  closeModal('revokeModal'); renderConns();
  toast('warn', pendingConn.name + ' 연동이 철회되었습니다 — 철회 기록이 영수증에 남습니다');
}
function askConsent(id){
  pendingConn = CONNS.find(c=>c.id===id);
  document.getElementById('consentTitle').textContent = pendingConn.name + ' 연동 동의';
  document.getElementById('consentDesc').innerHTML = `<b style="color:var(--txt)">${pendingConn.items}</b> 데이터를 본인 동의로 불러옵니다. 아래 항목에 동의해주세요.`;
  document.querySelectorAll('.consent-chk').forEach(c=>c.checked=false);
  document.getElementById('consentOk').disabled = true;
  openModal('consentModal');
}
function chkConsent(){
  const all = [...document.querySelectorAll('.consent-chk')].every(c=>c.checked);
  document.getElementById('consentOk').disabled = !all;
}
function confirmConsent(){
  pendingConn.on = true; pendingConn.date = '2026-08-19';
  closeModal('consentModal'); renderConns();
  toast('ok', pendingConn.name + ' 연동이 완료되었습니다 — 데이터 수신을 시작합니다');
}
renderConns();

/* ══════════ 행정서류 — 내 서류함 + 4단계 위저드 ══════════ */
const DOCS_KEY = 'agri_docs_v1';
const TPLS_KEY = 'agri_tpls_v1';
const CHECK_W = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.8 9L10 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_G = '<svg width="14" height="14" viewBox="0 0 12 12" fill="none" style="flex-shrink:0"><circle cx="6" cy="6" r="5.2" stroke="#0E7A46" stroke-width="1.2"/><path d="M3.5 6.2L5.3 8L8.5 4.5" stroke="#0E7A46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let docs = null;
let tpls = null;
let curDoc = {name:'농업경영회생자금(정책자금) 신청서', org:'농림축산식품부 표준서식'};
let convName = '';

function loadStore(key, seed){
  try{ const v = JSON.parse(localStorage.getItem(key)); if(Array.isArray(v)) return v; }catch(e){}
  return seed;
}
function loadDocs(){
  if(!docs) docs = loadStore(DOCS_KEY, [
    {name:'농업경영회생자금(정책자금) 신청서', org:'농림축산식품부', date:'2026-08-17', status:'draft', prog:60},
    {name:'면세유 배정 신청서', org:'지역 농협', date:'2026-07-02', status:'done'},
    {name:'농업경영체 변경 신고서', org:'국립농산물품질관리원', date:'2026-05-28', status:'done'}
  ]);
  return docs;
}
function loadTpls(){ if(!tpls) tpls = loadStore(TPLS_KEY, []); return tpls; }
function persist(){ try{ localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); localStorage.setItem(TPLS_KEY, JSON.stringify(tpls)); }catch(e){} }

const DOC_SUBTITLES = {
  home:'완성된 서류는 이 기기에만 저장되고, 내 데이터는 작성 시점마다 실시간으로 조회합니다.',
  s1:'표준 서식을 고르거나, 갖고 있는 서식 파일을 올려 웹 양식으로 변환하세요.',
  s2:'마이데이터로 자동입력된 값을 확인하고, 비어 있는 항목만 채워주세요.',
  s3:'실제 서식 그대로 미리 확인합니다. 초록 배경이 자동입력된 항목입니다.',
  s4:'생성된 서류는 내 서류함(이 기기)에 보관됩니다.'
};

function goDocView(v){
  document.querySelectorAll('.doc-view').forEach(el=>el.classList.remove('on'));
  const el = document.getElementById('dv-'+v);
  if(!el) return;
  void el.offsetWidth;
  el.classList.add('on');
  const step = {home:0, s1:1, s2:2, s3:3, s4:4}[v] || 0;
  document.getElementById('docStepper').style.display = step ? 'flex' : 'none';
  if(step) updStepper(step);
  document.getElementById('docSubtitle').textContent = DOC_SUBTITLES[v] || '';
  if(v==='home') renderDocList();
  if(v==='s1') renderTpls();
  if(v==='s3') buildPreview();
  window.scrollTo({top:0});
}
function openDocs(v){ nav('docs'); goDocView(v); }

function updStepper(n){
  for(let i=1;i<=4;i++){
    const s = document.getElementById('stp'+i);
    s.className = 'stp ' + (i<n ? 'done' : i===n ? 'now' : 'todo');
    s.querySelector('.stp-n').innerHTML = i<n ? CHECK_W : i;
  }
  for(let i=1;i<=3;i++) document.getElementById('ln'+i).className = 'stp-line' + (i<n ? ' fill' : '');
}

/* ── 내 서류함 ── */
const DOC_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="flex-shrink:0"><path d="M4 2.5H11L14.5 6V15.5H4V2.5Z" stroke="#0E7A46" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 9H11.5M6.5 12H11.5" stroke="#0E7A46" stroke-width="1.5" stroke-linecap="round"/></svg>';
function renderDocList(){
  loadDocs();
  const box = document.getElementById('docList');
  if(!docs.length){
    box.innerHTML = '<div style="padding:36px;text-align:center;font-size:13px;color:var(--sub)">아직 작성한 서류가 없습니다. <b>새 서류 작성</b>으로 시작해보세요.</div>';
    return;
  }
  box.innerHTML = docs.map((d,i)=>`
    <div class="doc-row2">
      <div style="width:38px;height:38px;border-radius:9px;background:${d.status==='draft'?'var(--blue-bg)':'var(--g100)'};display:flex;align-items:center;justify-content:center">${DOC_ICON}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px">${d.name}</b>
          ${d.status==='draft'
            ? '<span class="badge bg-info">작성 중</span>'
            : '<span class="badge bg-ok">완료 · TSA ✓</span>'}</div>
        <div style="font-size:12px;color:var(--sub);margin-top:3px">${d.org} · ${d.status==='draft'?'임시저장':'생성'} ${d.date}</div>
      </div>
      ${d.status==='draft' ? `
        <div style="display:flex;align-items:center;gap:8px">
          <div class="mini-prog"><i style="width:${d.prog||60}%"></i></div>
          <span style="font-size:12px;font-weight:700;color:var(--blue)">${d.prog||60}%</span>
        </div>
        <button class="btn btn-pri btn-sm" onclick="resumeDoc(${i})">이어쓰기</button>`
      : `<button class="btn btn-neu btn-sm" onclick="toast('info','PDF 열기 — 시안에서는 생략됩니다')">PDF 보기</button>`}
      <button class="btn btn-neu btn-sm" onclick="delDoc(${i})" title="이 기기에서 삭제">삭제</button>
    </div>`).join('');
}
function resumeDoc(i){
  curDoc = {name:docs[i].name, org:docs[i].org};
  setFormBar();
  goDocView('s2');
  toast('info','임시저장 상태를 불러왔습니다 — 마이데이터는 최신 값으로 다시 조회했습니다');
}
function delDoc(i){
  const nm = docs[i].name;
  docs.splice(i,1); persist(); renderDocList();
  toast('warn', '"'+nm+'" 서류를 이 기기에서 삭제했습니다');
}
function saveDraft(){
  loadDocs();
  const today = fmtDate(new Date()).slice(0,10);
  const ex = docs.find(d=>d.name===curDoc.name && d.status==='draft');
  if(ex){ ex.date = today; }
  else docs.unshift({name:curDoc.name, org:curDoc.org, date:today, status:'draft', prog:60});
  persist();
  toast('ok','임시저장 완료 — 내 서류함(이 기기)에 보관되었습니다');
}

/* ── 1단계: 서식 선택 / 업로드 변환 ── */
function setFormBar(){
  document.getElementById('curFormName').textContent = curDoc.name;
  document.getElementById('curFormSub').innerHTML = curDoc.org + ' · 필수 항목 8개 중 <b style="color:var(--g700)">7개 자동입력</b>';
  document.getElementById('pv-title').textContent = curDoc.name;
  document.getElementById('pv-org').textContent = curDoc.org + ' · 접수기관: 지역 농협';
  document.getElementById('dcName').textContent = curDoc.name;
  touchMdTime();
}
function pickTemplate(name, org){
  curDoc = {name, org};
  setFormBar();
  goDocView('s2');
  toast('ok','서식을 불러와 마이데이터로 자동입력했습니다');
}
function handleUpload(file){
  if(!file) return;
  convName = file.name.replace(/\.[^.]+$/,'');
  document.getElementById('convFile').textContent = file.name;
  const panel = document.getElementById('convPanel');
  panel.style.display = 'flex';
  document.getElementById('convResult').style.display = 'none';
  const steps = ['cv1','cv2','cv3','cv4'].map(id=>document.getElementById(id));
  steps.forEach(s=>{ s.className='conv-step'; s.firstElementChild.outerHTML='<span class="dot-idle"></span>'; });
  let i = 0;
  (function next(){
    if(i > 0){ const p = steps[i-1]; p.className='conv-step done'; p.firstElementChild.outerHTML=CHECK_G; }
    if(i >= steps.length){ document.getElementById('convResult').style.display='flex'; return; }
    const s = steps[i];
    s.className = 'conv-step doing';
    s.firstElementChild.outerHTML = '<span class="spin"></span>';
    i++;
    setTimeout(next, 750);
  })();
}
function useConverted(){
  loadTpls();
  if(!tpls.find(t=>t.name===convName)){
    tpls.unshift({name:convName, fields:12, auto:7});
    persist();
  }
  curDoc = {name:convName, org:'내 변환 서식 (업로드)'};
  setFormBar();
  goDocView('s2');
  toast('ok','변환된 서식에 자동입력을 적용했습니다 — 값을 꼭 확인해주세요');
}
function renderTpls(){
  loadTpls();
  const box = document.getElementById('tplBox');
  if(!tpls.length){ box.style.display='none'; return; }
  box.style.display = 'flex';
  document.getElementById('tplList').innerHTML = tpls.map((t,i)=>`
    <div style="display:flex;align-items:center;gap:10px;border:1px solid var(--bd);border-radius:10px;padding:10px 14px">
      ${DOC_ICON}
      <div style="flex:1;min-width:0"><b style="font-size:13px">${t.name}</b>
        <div style="font-size:11px;color:var(--sub)">인식 필드 ${t.fields}개 · 자동입력 ${t.auto}개</div></div>
      <button class="btn btn-pri btn-sm" onclick="useTpl(${i})">사용</button>
      <button class="btn btn-neu btn-sm" onclick="delTpl(${i})">삭제</button>
    </div>`).join('');
}
function useTpl(i){
  curDoc = {name:tpls[i].name, org:'내 변환 서식 (업로드)'};
  setFormBar();
  goDocView('s2');
  toast('ok','저장된 변환 서식을 불러왔습니다 — 마이데이터 최신 값으로 자동입력');
}
function delTpl(i){
  const nm = tpls[i].name;
  tpls.splice(i,1); persist(); renderTpls();
  toast('warn','"'+nm+'" 변환 서식을 삭제했습니다');
}

/* ── 2단계: 정보 확인 ── */
function fmtDate(d){
  const p = n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function touchMdTime(){
  document.getElementById('mdTime').textContent = '마이데이터 실시간 조회 · ' + fmtDate(new Date()).slice(11);
}
function refreshMyData(){
  touchMdTime();
  toast('info','마이데이터를 다시 조회했습니다 — 저장본이 아닌 실시간 연계 값입니다');
}
function phoneFilled(inp){
  const has = inp.value.trim().length > 0;
  inp.style.border = has ? '1px solid var(--bd2)' : '1.5px solid var(--orange)';
  document.getElementById('phoneBadge').className = 'badge ' + (has?'bg-ok':'bg-warn');
  document.getElementById('phoneBadge').textContent = has ? '입력 완료' : '직접 입력 필요';
  document.getElementById('missingNote').style.display = has ? 'none' : '';
}
function genPreview(){
  const phone = document.getElementById('phoneInput').value.trim();
  if(!phone){ toast('err','연락처를 입력해주세요 — 필수 항목입니다'); document.getElementById('phoneInput').focus(); return; }
  goDocView('s3');
}

/* ── 3단계: 미리보기 ── */
function buildPreview(){
  document.getElementById('pv-phone').textContent = document.getElementById('phoneInput').value.trim() || '(미입력)';
}

/* ── 4단계: 확정·보관 ── */
function confirmDoc(){
  const now = new Date();
  const dt = fmtDate(now);
  const no = 'DOC-' + dt.slice(0,10).replace(/-/g,'') + '-' + String(now.getTime()).slice(-4);
  document.getElementById('dcNo').textContent = no;
  document.getElementById('dcTime').textContent = dt;
  document.getElementById('dcTsa').textContent = 'TSA ' + dt + ' KST · 검증 가능';
  loadDocs();
  docs = docs.filter(d=>!(d.name===curDoc.name && d.status==='draft'));
  docs.unshift({name:curDoc.name, org:curDoc.org, date:dt.slice(0,10), status:'done'});
  persist();
  goDocView('s4');
  toast('ok','서류가 생성되었습니다 — TSA 타임스탬프 적용');
}

/* ══════════ AI 챗봇 — rag-orchestrator 위젯 연동 ══════════ */
/* 백엔드팀 PoC(services/ai/rag-orchestrator)의 임베더블 위젯을 그대로 마운트한다.
   답변·카드·출처는 전부 백엔드가 만들고, 이 파일은 마운트와 연결 상태만 책임진다. */
const API_KEY_LS = 'agri.apiBase';
let chatWidget = null, panelWidget = null, chatMounting = false;

function apiBase(){
  const p = new URLSearchParams(location.search).get('api');
  if(p !== null) return p;
  const saved = localStorage.getItem(API_KEY_LS);
  if(saved !== null) return saved;
  /* 로컬 시연 기본값: 같은 머신에서 띄운 rag-orchestrator */
  return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8080' : '';
}
function apiLabel(){ return apiBase() || location.origin + ' (동일 출처)'; }

function widgetOptions(extra){
  return Object.assign({
    apiBase: apiBase(),
    tenantId: 'demo-tenant',
    userName: '김농가',
    assetsBase: 'vendor/agri-chat/assets/',
    theme: {accent:'#0E7A46', 'accent-ink':'#ffffff'},
    colorScheme: 'light',
    fonts: false,                      /* 호스트(Noto Sans KR) 폰트 사용 */
    storageKey: 'agri-chat.sessions.agriG',
    onAction: hostAction
  }, extra || {});
}

/* 카드 버튼을 우리 화면으로 연결 */
function hostAction(e){
  const kind = e && e.kind, label = (e && e.label) || '';
  if(kind === 'document-vault'){ openDocs('home'); return; }
  if(kind === 'channel-cta'){ nav('map'); toast('info', label + ' — 판로 지도에서 확인하세요'); return; }
  if(kind === 'contact'){ toast('info', label + ' — 전화 연결은 시안 범위 외입니다'); return; }
  toast('info', label + ' — 시안 범위 외 동작입니다');
}

function setConn(state, text){
  const chip = document.getElementById('connChip');
  if(!chip) return;
  chip.className = 'conn ' + state;
  document.getElementById('connText').textContent = text;
  const off = document.getElementById('chatOffline'), host = document.getElementById('chatHost');
  off.classList.toggle('on', state === 'err');
  host.classList.toggle('hide', state === 'err');
  document.getElementById('apiLabel').textContent = apiLabel();
  document.getElementById('offlineApi').textContent = apiLabel();
}

/* 연결 확인: actuator 헬스가 CORS로 막혀도 chat API 가 열려 있으면 사용 가능하다 */
async function probeApi(){
  const base = apiBase();
  const tryFetch = async function(path, opt){
    try{
      const c = new AbortController(); const t = setTimeout(function(){ c.abort(); }, 4000);
      const r = await fetch(base + path, Object.assign({signal:c.signal}, opt));
      clearTimeout(t);
      return r.ok || r.status === 405 || r.status === 400;
    }catch(e){ return false; }
  };
  if(await tryFetch('/health/readiness')) return true;
  return await tryFetch('/api/v1/chat', {method:'OPTIONS'});
}

async function initChatWidget(){
  if(chatMounting) return;
  const host = document.getElementById('chatHost');
  if(!host || !window.AgriChat) return;
  chatMounting = true;
  setConn('wait', '연결 확인 중…');
  try{
    if(chatWidget){ chatWidget.destroy(); chatWidget = null; }
    host.innerHTML = '';
    chatWidget = AgriChat.mount(host, widgetOptions({header:false}));
    await chatWidget.ready;
    const ok = await probeApi();
    setConn(ok ? 'ok' : 'err', ok ? '백엔드 연결됨' : '연결 실패');
    chatWidget.on('error', function(){ setConn('err', '연결 실패'); });
    chatWidget.on('auth-error', function(){ setConn('err', '인증 필요'); });
  }catch(err){
    setConn('err', '연결 실패');
  }
  chatMounting = false;
}
function retryChatConnect(){ initChatWidget(); }
function newChatSession(){
  if(chatWidget){ chatWidget.newSession(); toast('ok','새 상담을 시작했습니다'); }
  else initChatWidget();
}
function openApiModal(){
  document.getElementById('apiInput').value = apiBase();
  openModal('apiModal');
}
function saveApiBase(){
  localStorage.setItem(API_KEY_LS, document.getElementById('apiInput').value.trim());
  closeModal('apiModal');
  if(panelWidget){ panelWidget.destroy(); panelWidget = null; document.getElementById('cpBody').innerHTML = ''; }
  initChatWidget();
  toast('ok','API 주소를 저장했습니다 — 다시 연결합니다');
}
/* 외부(대시보드 칩 등)에서 질문을 보내면 챗봇 페이지로 이동해 실제 질의 */
function askFromOutside(q){
  nav('chatbot');
  const send = function(){ if(chatWidget) chatWidget.send(q); else setTimeout(send, 400); };
  setTimeout(send, 700);
}

/* ── 플로팅 챗봇 패널 (같은 위젯을 contained 모드로) ── */
function mountPanelWidget(){
  const body = document.getElementById('cpBody');
  if(!body || panelWidget || !window.AgriChat) return;
  body.innerHTML = '';
  panelWidget = AgriChat.mount(body, widgetOptions({header:false, contained:true}));
}
function toggleChatPanel(){
  const p = document.getElementById('chatPanel');
  p.classList.toggle('open');
  if(p.classList.contains('open')) mountPanelWidget();
}
function openChatPanel(){ document.getElementById('chatPanel').classList.add('open'); mountPanelWidget(); }
function closeChatPanel(){ document.getElementById('chatPanel').classList.remove('open'); }
function expandChat(){ closeChatPanel(); nav('chatbot'); }
function cpSend(preset){ if(panelWidget && preset) panelWidget.send(preset); }

function escapeH(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ══════════ 판로 지도 (Leaflet · 시도→시군구→읍면동 드릴다운) ══════════ */
const SIDO_DATA = {
  '11':{n:'서울', full:'서울특별시', price:1290, net:8.2, vol:412, fee:84,  ch:'가락시장 경매'},
  '26':{n:'부산', full:'부산광역시', price:1245, net:5.9, vol:128, fee:96,  ch:'엄궁동 도매시장'},
  '27':{n:'대구', full:'대구광역시', price:1238, net:6.8, vol:145, fee:41,  ch:'북부 도매시장'},
  '28':{n:'인천', full:'인천광역시', price:1252, net:5.4, vol:98,  fee:88,  ch:'삼산 도매시장'},
  '29':{n:'광주', full:'광주광역시', price:1215, net:4.1, vol:87,  fee:102, ch:'각화동 도매시장'},
  '30':{n:'대전', full:'대전광역시', price:1230, net:5.8, vol:76,  fee:62,  ch:'오정동 도매시장'},
  '31':{n:'울산', full:'울산광역시', price:1228, net:5.2, vol:54,  fee:58,  ch:'울산 도매시장'},
  '36':{n:'세종', full:'세종특별자치시', price:1210, net:4.6, vol:22,  fee:66,  ch:'로컬푸드 직매장'},
  '41':{n:'경기', full:'경기도', price:1258, net:6.1, vol:214, fee:79,  ch:'구리·안양 도매시장'},
  '51':{n:'강원', full:'강원특별자치도', price:1195, net:3.2, vol:41,  fee:118, ch:'춘천 도매시장'},
  '43':{n:'충북', full:'충청북도', price:1222, net:5.1, vol:63,  fee:72,  ch:'청주 도매시장'},
  '44':{n:'충남', full:'충청남도', price:1234, net:5.5, vol:92,  fee:85,  ch:'천안 도매시장'},
  '52':{n:'전북', full:'전북특별자치도', price:1205, net:3.9, vol:71,  fee:108, ch:'전주 도매시장'},
  '46':{n:'전남', full:'전라남도', price:1198, net:3.5, vol:118, fee:124, ch:'무안 산지 APC'},
  '47':{n:'경북', full:'경상북도', price:1226, net:7.4, vol:156, fee:12,  ch:'청송 지역 APC (계약)'},
  '48':{n:'경남', full:'경상남도', price:1240, net:6.3, vol:134, fee:74,  ch:'창원 팔용 도매시장'},
  '50':{n:'제주', full:'제주특별자치도', price:1180, net:1.8, vol:36,  fee:168, ch:'제주 도매시장 (해상운송)'}
};
const HEAT = ['#D3E9DC','#AEDBC4','#7FC9A2','#35A46C','#0E7A46'];
const DIM_FILL = '#DCDFDC';
const ITEM_BASE = {'양파':1240,'배추':3150,'무':1420,'마늘':6800,'고추':11200};
const DATE_FACTOR = {'2026-08-19':1.0,'2026-08-18':0.982,'2026-08-17':0.969,'2026-08-14':0.945,'2026-08-12':0.928};
const METRIC_META = {
  price:{title:'평균 경락가', unit:'원/kg', fmt:v=>Math.round(v).toLocaleString()},
  net:{title:'내 예상 순수익', unit:'%', fmt:v=>(v>=0?'+':'')+v.toFixed(1)}
};

let panMap = null, mapMetric = 'price', curItem = '양파', curDate = '2026-08-19';
let labelsOn = true;
// 드릴다운 상태
let VIEW = {level:'nation', sido:null, sig:null};   // 지도 렌더 레벨
let suppressUntil = 0, userMoved = false;            // 줌 기반 레벨 전환 가드
const SIGUNGU_ZOOM = 8.5;                            // 이 줌 이상이면 시군구 레벨
let PANEL = {level:'sido', code:'11'};              // 우측 패널 대상
// geo·레이어 캐시
let GEO = {sido:null, sig:null, emd:null};
let sigBySido = {}, emdBySig = {};
let groups = {sido:null, sig:{}, emd:{}};           // L.layerGroup
let lyrs = {sido:{}, sig:{}, emd:{}};               // code → polygon layer
let lbls = {sido:{}, sig:{}, emd:{}};               // code → label marker
let bnds = {sido:{}, sig:{}, emd:{}};

/* ── 값 생성 (품목·날짜·지역 결정적 시뮬레이션) ── */
function h32(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function dateF(){ return DATE_FACTOR[curDate] || 1; }
function sidoPrice(cd){ return SIDO_DATA[cd].price * ITEM_BASE[curItem]/1240 * dateF(); }
function valOf(level, code){
  if(mapMetric === 'price'){
    if(level==='sido') return sidoPrice(code);
    if(level==='sig') return sidoPrice(code.slice(0,2)) * (0.86 + (h32(code+curItem)%281)/1000);
    return sidoPrice(code.slice(0,2)) * (0.86 + (h32(code.slice(0,5)+curItem)%281)/1000) * (0.93 + (h32(code)%141)/1000);
  }
  if(level==='sido') return SIDO_DATA[code].net;
  if(level==='sig'){ const b=SIDO_DATA[code.slice(0,2)].net; return Math.max(-2.5, b + ((h32(code+'n')%60)-30)/10); }
  const b=SIDO_DATA[code.slice(0,2)].net + ((h32(code.slice(0,5)+'n')%60)-30)/10;
  return Math.max(-3, b + ((h32(code+'n')%40)-20)/10);
}
function nameOf(level, code){
  if(level==='sido') return SIDO_DATA[code] ? SIDO_DATA[code].full : code;
  const feats = level==='sig' ? (sigBySido[code.slice(0,2)]||[]) : (emdBySig[code.slice(0,5)]||[]);
  const f = feats.find(x=>(x.properties.SIG_CD||x.properties.EMD_CD)===code);
  return f ? (f.properties.SIG_KOR_NM||f.properties.EMD_KOR_NM) : code;
}
function visibleCodes(){
  if(VIEW.level==='nation') return Object.keys(SIDO_DATA).map(c=>['sido',c]);
  if(VIEW.level==='sido') return (sigBySido[VIEW.sido]||[]).map(f=>['sig',f.properties.SIG_CD]);
  return (emdBySig[VIEW.sig]||[]).map(f=>['emd',f.properties.EMD_CD]);
}
function levelRange(){
  const vs = visibleCodes().map(([lv,c])=>valOf(lv,c));
  return [Math.min.apply(null,vs), Math.max.apply(null,vs)];
}
function heatColor(v, mn, mx){ const t=(v-mn)/((mx-mn)||1); return HEAT[Math.max(0,Math.min(4,Math.floor(t*5)))]; }

/* ── 툴팁 ── */
let $mapTip = null, tipHover = false;
function ensureTip(){
  if(!$mapTip){ $mapTip=document.createElement('div'); $mapTip.id='map-tooltip'; document.body.appendChild($mapTip); }
  return $mapTip;
}
function tipHtml(level, code){
  const m = METRIC_META[mapMetric];
  return '<div class="tip-name">'+ (level==='sido' ? SIDO_DATA[code].full : nameOf(level, code)) +
         '</div><div class="tip-val">'+m.title+' <b>'+m.fmt(valOf(level,code))+m.unit+'</b></div>';
}
function showMapTip(html, e){
  const t = ensureTip();
  tipHover = true;
  t.classList.remove('ch');
  t.innerHTML = html; t.classList.add('show'); moveMapTip(e);
}
function moveMapTip(e){ if($mapTip && e && e.originalEvent){ $mapTip.style.left=(e.originalEvent.clientX+14)+'px'; $mapTip.style.top=(e.originalEvent.clientY-$mapTip.offsetHeight-12)+'px'; } }
function hideMapTip(){
  tipHover = false;
  if($mapTip) $mapTip.classList.remove('show');
  updateCrosshairTip();          /* hover 해제 시 조준점 툴팁 복귀 */
}
/* 조준점이 가리키는 타일에 hover 와 동일한 툴팁 표시 */
function updateCrosshairTip(){
  const t = ensureTip();
  const ch = document.getElementById('crosshair');
  if(tipHover || !ch || !ch.classList.contains('has') || currentPage !== 'map'){
    if(!tipHover) t.classList.remove('show');
    return;
  }
  const box = panMap.getContainer().getBoundingClientRect();
  t.classList.add('ch');
  t.innerHTML = tipHtml(PANEL.level, PANEL.code);
  /* transform 대신 실좌표로 배치 — 조준점 중앙 상단 */
  const cx = box.left + box.width/2, cy = box.top + box.height/2;
  t.style.left = Math.round(cx - t.offsetWidth/2) + 'px';
  t.style.top  = Math.round(cy - 22 - t.offsetHeight) + 'px';
  t.classList.add('show');
}

/* ── 레이어 빌드 (참조: web_bi dashboard.js fn_BuildLevelGroup) ── */
function buildGroup(features, level){
  const group = L.layerGroup();
  const geoLayer = L.geoJSON({type:'FeatureCollection', features}, {
    pane: level==='sido' ? 'overlayPane' : 'drill',
    style: function(){ return {fillColor:HEAT[0], fillOpacity:.92, color:'#fff', weight:1.1, opacity:.85}; },
    onEachFeature: function(feature, lyr){
      const p = feature.properties;
      const code = p.CTPRVN_CD || p.SIG_CD || p.EMD_CD;
      const name = level==='sido' ? SIDO_DATA[code].full : (p.SIG_KOR_NM || p.EMD_KOR_NM);
      lyrs[level][code] = lyr; bnds[level][code] = lyr.getBounds();
      const lm = L.marker(lyr.getBounds().getCenter(), {icon:L.divIcon({className:'custom-label', html:'<span class="label-text">'+name+'</span>'}), interactive:false, pane: level==='sido' ? 'markerPane' : 'drill'});
      group.addLayer(lm); lbls[level][code] = lm;
      lyr.on('mouseover', function(e){
        if(lyr.options.ghost) return;
        lyr.setStyle(lyr.options.dimmed ? {fillOpacity:.95, weight:1.6, color:'#9a9d9a'} : {weight:2.2, color:'#1A1E24', opacity:.55, fillOpacity:1});
        showMapTip(tipHtml(level, code), e);
      });
      lyr.on('mousemove', moveMapTip);
      lyr.on('mouseout', function(){ if(!lyr.options.ghost) restyle(level, code); hideMapTip(); });
      lyr.on('click', function(){
        if(lyr.options.ghost) return;
        hideMapTip();
        if(level==='sido') focusSidoView(code);
        else if(level==='sig') enterEmdView(code);
        /* emd 클릭: 지도 전환 없음(참조 규칙) — 패널만 갱신 */
        else { PANEL={level:'emd', code}; renderSel(); markRank(); }
      });
    }
  });
  group.addLayer(geoLayer);
  return group;
}
function restyle(level, code){
  const lyr = lyrs[level][code]; if(!lyr) return;
  const lm = lbls[level][code];
  if(lyr.options.ghost){ lyr.setStyle({fillOpacity:0, opacity:0}); if(lm&&lm._icon) lm._icon.classList.add('label-hide'); return; }
  if(lm&&lm._icon) lm._icon.classList.remove('label-hide');
  if(lyr.options.dimmed){
    lyr.setStyle({fillColor:DIM_FILL, fillOpacity:.8, color:'#fff', weight:1, opacity:.9});
    if(lm&&lm._icon) lm._icon.classList.add('label-dim');
    return;
  }
  if(lm&&lm._icon) lm._icon.classList.remove('label-dim');
  const [mn,mx] = levelRange();
  const selected = (PANEL.level===level && PANEL.code===code);
  lyr.setStyle({fillColor:heatColor(valOf(level,code),mn,mx), fillOpacity:.92, weight:selected?2.4:1.1, color:selected?'#1A1E24':'#fff', opacity:selected?.55:.85});
  if(selected) lyr.bringToFront();
}

/* ── 시군구/읍면동 그룹 lazy 확보 ── */
function ensureSigGroup(sidoCd){
  if(!groups.sig[sidoCd]) groups.sig[sidoCd] = buildGroup(sigBySido[sidoCd]||[], 'sig');
  return groups.sig[sidoCd];
}
function ensureEmdIndex(cb){
  if(GEO.emd){ cb(); return; }
  toast('info','읍면동 경계를 불러오는 중입니다…');
  fetch('data/emd_wgs84.json').then(r=>r.json()).then(g=>{
    GEO.emd = g;
    g.features.forEach(f=>{ const sig=f.properties.EMD_CD.slice(0,5); (emdBySig[sig]=emdBySig[sig]||[]).push(f); });
    cb();
  }).catch(()=>toast('err','읍면동 데이터를 불러오지 못했습니다'));
}
function ensureEmdGroup(sigCd){
  if(!groups.emd[sigCd]) groups.emd[sigCd] = buildGroup(emdBySig[sigCd]||[], 'emd');
  return groups.emd[sigCd];
}

/* ── 뷰 전환 (전국 / 시도 포커스 / 읍면동 단독) ── */
/* 좌측 필터·우측 통계 패널에 지도가 가리지 않도록 여백 확보 */
function fitPad(){
  const w = document.getElementById('panMap').clientWidth;
  const right = w > 1200 ? 400 : w > 900 ? 300 : 40;
  return {paddingTopLeft:[48,132], paddingBottomRight:[right,88]};
}
function flyPad(b, dur, minZ){
  const d = dur || .5;
  const o = fitPad(); o.duration = d;
  /* moveend 가 유실돼도 고착되지 않도록 시간 기반 억제 */
  suppressUntil = Date.now() + d * 1000 + 350;
  if(minZ){
    /* 드릴다운 레벨이 유지되도록 최소 줌 보장 (참조: web_bi fn_PinFocus) */
    const z = Math.max(panMap.getBoundsZoom(b, false, L.point(o.paddingTopLeft[0]+o.paddingBottomRight[0], o.paddingTopLeft[1]+o.paddingBottomRight[1])), minZ);
    const c = panMap._getBoundsCenterZoom(b, o).center;
    panMap.flyTo(c, z, {duration:d});
  } else {
    panMap.flyToBounds(b, o);
  }
}
/* 드릴다운 타일 떠 보이게 (그림자 + 살짝 오프셋) */
function setFloat(on){
  const p = panMap.getPane('drill');
  if(p) p.classList.toggle('float-pane', !!on);
}
/* 지도 중심에 있는 시도 코드 (bounds 근사) */
function sidoAtCenter(){
  const c = panMap.getCenter();
  let hit = null, area = Infinity;
  Object.keys(bnds.sido).forEach(function(cd){
    const b = bnds.sido[cd];
    if(!b.contains(c)) return;
    const a = (b.getNorth()-b.getSouth()) * (b.getEast()-b.getWest());
    if(a < area){ area = a; hit = cd; }
  });
  return hit;
}
/* 스크롤 줌에 따른 레벨 자동 전환 — 읍면동은 클릭으로만 진입 */
function onZoomEnd(){
  if(!panMap || panMap === 'loading' || Date.now() < suppressUntil) return;
  const z = panMap.getZoom();
  if(VIEW.level === 'emd'){
    /* 읍면동에서 충분히 축소하면 부모 시도(시군구 레벨)로 복귀 */
    if(z < SIGUNGU_ZOOM + 0.6) focusSidoView(VIEW.sig.slice(0,2), true);
    return;
  }
  if(z >= SIGUNGU_ZOOM){
    const target = (userMoved || !VIEW.sido) ? (sidoAtCenter() || VIEW.sido) : VIEW.sido;
    if(target && target !== VIEW.sido) focusSidoView(target, true);
    else if(target && VIEW.level !== 'sido') focusSidoView(target, true);
  } else if(VIEW.level !== 'nation'){
    showNationView(true);
  }
}
function clearOverlays(){
  Object.values(groups.sig).forEach(g=>{ if(panMap.hasLayer(g)) panMap.removeLayer(g); });
  Object.values(groups.emd).forEach(g=>{ if(panMap.hasLayer(g)) panMap.removeLayer(g); });
}
function showNationView(keepZoom){
  VIEW = {level:'nation', sido:null, sig:null};
  clearOverlays();
  setFloat(false);
  if(!panMap.hasLayer(groups.sido)) panMap.addLayer(groups.sido);
  Object.keys(lyrs.sido).forEach(cd=>{ lyrs.sido[cd].options.dimmed=false; lyrs.sido[cd].options.ghost=false; });
  PANEL = {level:'sido', code:PANEL.code.slice(0,2) ? PANEL.code.slice(0,2) : '11'};
  if(!SIDO_DATA[PANEL.code]) PANEL = {level:'sido', code:'11'};
  if(!keepZoom) flyPad(L.geoJSON(GEO.sido).getBounds());
  userMoved = false;
  refreshAll();
  updateCrosshair();
}
function focusSidoView(cd, keepZoom){
  VIEW = {level:'sido', sido:cd, sig:null};
  clearOverlays();
  if(!panMap.hasLayer(groups.sido)) panMap.addLayer(groups.sido);
  Object.keys(lyrs.sido).forEach(k=>{
    lyrs.sido[k].options.ghost = (k===cd);
    lyrs.sido[k].options.dimmed = (k!==cd);
  });
  panMap.addLayer(ensureSigGroup(cd));
  setFloat(true);
  PANEL = {level:'sido', code:cd};
  if(!keepZoom){ flyPad(bnds.sido[cd], .5, SIGUNGU_ZOOM + 0.25); userMoved = false; }
  refreshAll();
  updateCrosshair();
}
function enterEmdView(sigCd){
  ensureEmdIndex(function(){
    VIEW = {level:'emd', sido:sigCd.slice(0,2), sig:sigCd};
    clearOverlays();
    /* 참조 규칙: 읍면동 모드는 해당 시군구 조각만 단독 렌더 */
    if(panMap.hasLayer(groups.sido)) panMap.removeLayer(groups.sido);
    panMap.addLayer(ensureEmdGroup(sigCd));
    setFloat(true);
    PANEL = {level:'sig', code:sigCd};
    flyPad(bnds.sig[sigCd], .55, SIGUNGU_ZOOM + 1.5);
    userMoved = false;
    refreshAll();
    updateCrosshair();
  });
}

/* ── 중앙 조준점: 시군구 레벨에서 지도 중심의 지역을 활성화 ── */
function ptInRing(lat, lng, ring){
  let inside = false;
  for(let i=0, j=ring.length-1; i<ring.length; j=i++){
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if(((yi > lat) !== (yj > lat)) && (lng < (xj-xi) * (lat-yi) / ((yj-yi)||1e-12) + xi)) inside = !inside;
  }
  return inside;
}
function ptInFeature(lat, lng, feature){
  const g = feature.geometry;
  if(!g) return false;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for(const poly of polys){
    if(!poly.length || !ptInRing(lat, lng, poly[0])) continue;
    let hole = false;
    for(let h=1; h<poly.length; h++){ if(ptInRing(lat, lng, poly[h])){ hole = true; break; } }
    if(!hole) return true;
  }
  return false;
}
let chRaf = 0, chSwitching = false;
function updateCrosshair(){
  const el = document.getElementById('crosshair');
  if(!el || !panMap || panMap === 'loading') return;
  el.classList.add('on');                      /* 모든 레벨에서 상시 표시 */
  const c = panMap.getCenter();

  /* 시군구 레벨: 조준점이 다른 시도로 넘어가면 그 시도 데이터로 전환 */
  if(VIEW.level === 'sido' && !chSwitching){
    const cur = (sigBySido[VIEW.sido] || []).some(function(f){
      const b = bnds.sig[f.properties.SIG_CD];
      return (!b || b.contains(c)) && ptInFeature(c.lat, c.lng, f);
    });
    if(!cur){
      const other = GEO.sido.features.find(function(f){
        const cd = f.properties.CTPRVN_CD;
        if(cd === VIEW.sido || !SIDO_DATA[cd]) return false;
        const b = bnds.sido[cd];
        return (!b || b.contains(c)) && ptInFeature(c.lat, c.lng, f);
      });
      if(other){
        chSwitching = true;
        focusSidoView(other.properties.CTPRVN_CD, true);   /* 줌 유지한 채 전환 */
        chSwitching = false;
        return;                                           /* focusSidoView 가 재호출 */
      }
    }
  }

  /* 현재 레벨에서 조준점 아래 지역 판정 */
  let feats, lv;
  if(VIEW.level === 'nation'){ feats = GEO.sido.features; lv = 'sido'; }
  else if(VIEW.level === 'sido'){ feats = sigBySido[VIEW.sido] || []; lv = 'sig'; }
  else { feats = emdBySig[VIEW.sig] || []; lv = 'emd'; }

  let hit = null;
  for(const f of feats){
    const cd = f.properties.CTPRVN_CD || f.properties.SIG_CD || f.properties.EMD_CD;
    if(lv === 'sido' && !SIDO_DATA[cd]) continue;
    const b = bnds[lv][cd];
    if(b && !b.contains(c)) continue;
    if(ptInFeature(c.lat, c.lng, f)){ hit = cd; break; }
  }
  if(hit){
    el.classList.add('has');
    if(!(PANEL.level === lv && PANEL.code === hit)){
      PANEL = {level:lv, code:hit};
      renderSel(); markRank();
      const row = document.querySelector('#rankList .rank-row.sel');
      if(row && row.scrollIntoView) row.scrollIntoView({block:'nearest'});
    }
  } else {
    el.classList.remove('has');
  }
  updateCrosshairTip();
}
function queueCrosshair(){
  if(chRaf) return;
  chRaf = setTimeout(function(){ chRaf = 0; updateCrosshair(); }, 40);
}

/* ── 초기화 ── */
function initPanMap(){
  if(panMap || !window.L || !document.getElementById('panMap')) return;
  panMap = 'loading';
  Promise.all([fetch('data/sido_wgs84.json').then(r=>r.json()), fetch('data/sigungu_wgs84.json').then(r=>r.json())])
  .then(function(res){
    GEO.sido = res[0]; GEO.sig = res[1];
    GEO.sig.features.forEach(f=>{ const sd=f.properties.SIG_CD.slice(0,2); (sigBySido[sd]=sigBySido[sd]||[]).push(f); });
    panMap = L.map('panMap', {zoomControl:true, attributionControl:false, scrollWheelZoom:true, doubleClickZoom:false, zoomSnap:.25, zoomDelta:.5, minZoom:5.5, maxZoom:12, wheelPxPerZoomLevel:90});
    /* 드릴다운 타일 전용 pane — 포커스 시 그림자+오프셋으로 떠 보이게 (참조: web_bi sigfocus) */
    panMap.createPane('drill');
    panMap.getPane('drill').style.zIndex = 450;
    panMap.on('zoomend', onZoomEnd);
    panMap.on('move zoom', queueCrosshair);
    panMap.on('movestart', function(){ if(Date.now() >= suppressUntil) userMoved = true; });
    groups.sido = buildGroup(GEO.sido.features, 'sido');
    panMap.addLayer(groups.sido);
    panMap.fitBounds(L.geoJSON(GEO.sido).getBounds(), fitPad());
    buildMarkets();
    refreshAll();
  })
  .catch(function(){ panMap=null; toast('err','지도 데이터를 불러오지 못했습니다'); });
}

/* ── 렌더 일괄 ── */
function refreshAll(){
  paintVisible(); renderCrumb(); renderSel(); renderRank(); renderLegend(); renderStats();
  if(!chSwitching) queueCrosshair();
}
function paintVisible(){
  if(!panMap || panMap==='loading') return;
  if(VIEW.level!=='emd') Object.keys(lyrs.sido).forEach(cd=>restyle('sido',cd));
  if(VIEW.level==='sido') (sigBySido[VIEW.sido]||[]).forEach(f=>restyle('sig', f.properties.SIG_CD));
  if(VIEW.level==='emd') (emdBySig[VIEW.sig]||[]).forEach(f=>restyle('emd', f.properties.EMD_CD));
}
function renderCrumb(){
  const el = document.getElementById('mapCrumb');
  let html = '<span class="seg'+(VIEW.level==='nation'?' cur':'')+'" onclick="showNationView()">전국</span>';
  if(VIEW.level!=='nation'){
    const sd = VIEW.level==='emd' ? VIEW.sig.slice(0,2) : VIEW.sido;
    html += '<span class="sep2">›</span><span class="seg'+(VIEW.level==='sido'?' cur':'')+'" onclick="focusSidoView(\''+sd+'\')">'+SIDO_DATA[sd].full+'</span>';
  }
  if(VIEW.level==='emd'){
    html += '<span class="sep2">›</span><span class="seg cur">'+nameOf('sig', VIEW.sig)+'</span>';
  }
  el.innerHTML = html;
}
function panelSido(){ return SIDO_DATA[PANEL.code.slice(0,2)] || SIDO_DATA['11']; }
function renderSel(){
  const sd = panelSido();
  const price = mapMetricSafe('price');
  const net = mapMetricSafe('net');
  document.getElementById('sr-name').textContent = nameOf(PANEL.level, PANEL.code);
  document.getElementById('sr-price').innerHTML = Math.round(price).toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">원/kg</span>';
  document.getElementById('sr-net').innerHTML = (net>=0?'+':'')+net.toFixed(1)+'<span style="font-size:11px;font-weight:500;color:var(--sub)">%</span>';
  const volJit = PANEL.level==='sido' ? sd.vol : Math.max(3, Math.round(sd.vol*(0.05+(h32(PANEL.code+'v')%200)/1000)));
  const feeJit = PANEL.level==='sido' ? sd.fee : Math.max(8, sd.fee + (h32(PANEL.code+'f')%30)-15);
  document.getElementById('sr-vol').innerHTML = volJit.toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">톤</span>';
  document.getElementById('sr-fee').innerHTML = feeJit.toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">원/kg</span>';
  document.getElementById('sr-ch').textContent = sd.ch;
  const nets = Object.values(SIDO_DATA).map(x=>x.net).sort((a,b)=>b-a);
  const rank = nets.indexOf(sd.net)+1;
  document.getElementById('sr-badge').textContent = '순수익 '+rank+'위';
  document.getElementById('sr-badge').className = 'badge '+(rank<=3?'bg-ok':'bg-mut');
}
function mapMetricSafe(metric){
  const keep = mapMetric; mapMetric = metric;
  const v = valOf(PANEL.level, PANEL.code);
  mapMetric = keep; return v;
}
function renderRank(){
  const m = METRIC_META[mapMetric];
  const lvName = VIEW.level==='nation' ? '시도별' : VIEW.level==='sido' ? SIDO_DATA[VIEW.sido].n+' 시군구' : nameOf('sig',VIEW.sig)+' 읍면동';
  document.getElementById('rankTitle').textContent = lvName+' 순위 · '+m.title;
  const rows = visibleCodes().map(([lv,c])=>({lv, c, v:valOf(lv,c), n: lv==='sido'?SIDO_DATA[c].n:nameOf(lv,c)})).sort((a,b)=>b.v-a.v);
  const max = rows.length ? rows[0].v : 1;
  document.getElementById('rankList').innerHTML = rows.map((r,i)=>`
    <div class="rank-row${(PANEL.level===r.lv&&PANEL.code===r.c)?' sel':''}" data-code="${r.c}" onclick="rankClick('${r.lv}','${r.c}')">
      <span class="rk">${i+1}</span>
      <span style="width:64px;font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.n}</span>
      <div class="rank-bar"><i style="width:${Math.max(4,Math.round(r.v/max*100))}%"></i></div>
      <span style="width:70px;text-align:right;font-size:12px;font-weight:700">${m.fmt(r.v)}<span style="font-weight:400;color:var(--mut);font-size:10.5px">${m.unit}</span></span>
    </div>`).join('');
}
function markRank(){
  document.querySelectorAll('#rankList .rank-row').forEach(el=>el.classList.toggle('sel', el.dataset.code===PANEL.code));
  paintVisible();
}
function rankClick(lv, c){
  if(lv==='sido' && VIEW.level==='nation'){ focusSidoView(c); return; }
  if(lv==='sig' && VIEW.level==='sido'){ enterEmdView(c); return; }
  PANEL = {level:lv, code:c}; renderSel(); markRank();
}
function renderLegend(){
  const [mn,mx] = levelRange();
  const m = METRIC_META[mapMetric];
  let rows='';
  for(let i=0;i<5;i++){
    const a = mn + (mx-mn)*i/5, b = mn + (mx-mn)*(i+1)/5;
    rows += '<div class="lg-row"><span class="lg-sw" style="background:'+HEAT[i]+'"></span>'+m.fmt(a)+' ~ '+m.fmt(b)+'</div>';
  }
  let mkRows = '<div style="font-size:11px;font-weight:700;color:#4B5563;margin:8px 0 2px;padding-top:8px;border-top:1px solid #EEF1EF">판로 유형</div>';
  Object.keys(MK_TYPE).forEach(function(k){
    mkRows += '<div class="lg-row"><span class="lg-sw" style="background:'+MK_TYPE[k].color+';border-radius:50%;width:11px;height:11px"></span>'+MK_TYPE[k].label+'</div>';
  });
  document.getElementById('mapLegend').innerHTML = '<div style="font-size:11px;font-weight:700;color:#4B5563;margin-bottom:2px">'+m.title+' ('+m.unit+')</div>'+rows+mkRows;
}
function renderStats(){
  const prices = Object.keys(SIDO_DATA).map(cd=>sidoPrice(cd));
  const avg = prices.reduce((a,b)=>a+b,0)/prices.length;
  document.getElementById('mf-avg').innerHTML = Math.round(avg).toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">원/kg</span>';
  const top = Object.keys(SIDO_DATA).sort((a,b)=>sidoPrice(b)-sidoPrice(a))[0];
  document.getElementById('mf-top').textContent = SIDO_DATA[top].n+' '+Math.round(sidoPrice(top)).toLocaleString();
  const dates = Object.keys(DATE_FACTOR);
  const idx = dates.indexOf(curDate);
  const prev = idx>=0 && idx<dates.length-1 ? DATE_FACTOR[dates[idx+1]] : null;
  const el = document.getElementById('mf-diff');
  if(prev){
    const d = (dateF()-prev)/prev*100;
    el.textContent = (d>=0?'▲ ':'▼ ')+Math.abs(d).toFixed(1)+'%';
    el.className = 'v '+(d>=0?'up':'down');
  } else { el.textContent='— 기준'; el.className='v'; }
}

/* ── 컨트롤 ── */
function setMetric(m, btn){
  mapMetric = m;
  document.querySelectorAll('#metricSeg button').forEach(b=>b.classList.toggle('on', b===btn));
  paintVisible(); renderRank(); renderLegend();
}
function applySelPick(opt){
  const sel = opt.closest('.select');
  sel.querySelectorAll('.select-opt').forEach(o=>o.classList.remove('sel'));
  opt.classList.add('sel');
  sel.querySelector('.select-btn').childNodes[0].textContent = opt.textContent+' ';
  sel.classList.remove('open');
  event.stopPropagation();
}
function pickItem(opt){ applySelPick(opt); curItem = opt.textContent.trim(); refreshAll(); toast('info', '"'+curItem+'" 기준으로 갱신했습니다'); }
function pickDate(opt){ applySelPick(opt); curDate = opt.textContent.trim(); refreshAll(); toast('info', curDate+' 기준 시세로 갱신했습니다'); }
function toggleLabels(){
  labelsOn = !labelsOn;
  document.getElementById('panMap').classList.toggle('labels-off', !labelsOn);
  document.getElementById('lblToggle').textContent = '지역명 '+(labelsOn?'ON':'OFF');
}
function askRegion(){
  const nm = nameOf(PANEL.level, PANEL.code);
  askFromOutside(nm+'('+panelSido().ch+')로 출하하면 순수익이 얼마나 될까?');
}


/* ══════════ 판로(시장) 마커 ══════════ */
/* 유형: auction 공영도매시장 · apc 산지유통센터 · retail 대형유통/마트 · online 온라인/B2B */
const MK_TYPE = {
  auction:{label:'공영도매시장', color:'#0E7A46', ic:'<path d="M5 9.5h10M6.5 9.5v4.5M13.5 9.5v4.5M4.5 15.5h11M10 4l5.5 3.2H4.5L10 4Z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'},
  apc:{label:'산지유통센터(APC)', color:'#2E6BD6', ic:'<path d="M4.5 9.2 10 5l5.5 4.2v6.3h-11V9.2Z" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.2 15.5v-3.6h3.6v3.6" stroke="#fff" stroke-width="1.4"/>'},
  retail:{label:'대형유통·마트', color:'#E17A17', ic:'<path d="M4.5 7.5h11l-1 8h-9l-1-8Z" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.6 7.5V6a2.4 2.4 0 0 1 4.8 0v1.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>'},
  online:{label:'온라인·B2B 직거래', color:'#7A3FCB', ic:'<path d="M10 4.5v11M5.5 8.5 10 4.5l4.5 4M6 15.5h8" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'}
};
/* 샘플 데이터 — 실서비스에서는 도매시장 반입/경락 API + 자사 유통 DB로 대체 */
const MARKETS = [
  {id:'m01', t:'auction', n:'서울 가락동 농수산물도매시장', lat:37.4970, lng:127.1190, price:1290, vol:412, fee:7.0, dist:298, settle:'D+3', hours:'경매 20:00~04:00', best:true, tags:['최고 단가','대량 출하'], note:'전국 최대 규모. 상품 등급이 좋을수록 낙찰가 편차가 큽니다.'},
  {id:'m02', t:'auction', n:'서울 강서 농수산물도매시장', lat:37.5510, lng:126.8490, price:1268, vol:186, fee:7.0, dist:312, settle:'D+3', hours:'경매 21:00~03:00', tags:['수도권 서부'], note:'가락시장 대비 반입량이 적어 물량 소진이 빠른 편.'},
  {id:'m03', t:'auction', n:'구리 농수산물도매시장', lat:37.5940, lng:127.1420, price:1258, vol:143, fee:6.5, dist:305, settle:'D+3', hours:'경매 20:30~03:30', tags:['수수료 낮음'], note:'수도권 동북부 소비지 접근성이 좋습니다.'},
  {id:'m04', t:'auction', n:'부산 엄궁동 농산물도매시장', lat:35.1420, lng:128.9760, price:1245, vol:128, fee:7.0, dist:186, settle:'D+3', hours:'경매 20:00~02:00', tags:['영남권'], note:'영남권 소비지 물량 집중.'},
  {id:'m05', t:'auction', n:'대구 북부 농수산물도매시장', lat:35.8950, lng:128.5570, price:1238, vol:145, fee:6.5, dist:98, settle:'D+3', hours:'경매 20:00~02:30', tags:['근거리','운송비 절감'], note:'청송에서 가까워 운송비 부담이 가장 적은 도매시장.'},
  {id:'m06', t:'auction', n:'대전 오정 농수산물도매시장', lat:36.3620, lng:127.4090, price:1230, vol:76, fee:6.5, dist:214, settle:'D+3', hours:'경매 20:00~02:00', tags:['중부권'], note:'중부권 분산 출하 시 활용.'},
  {id:'m07', t:'auction', n:'광주 각화동 농산물도매시장', lat:35.1720, lng:126.9330, price:1215, vol:87, fee:7.0, dist:306, settle:'D+3', hours:'경매 20:00~02:00', tags:['호남권'], note:'호남권 물량이 많아 단가 경쟁이 있는 편.'},
  {id:'m08', t:'apc', n:'청송 농협 산지유통센터(APC)', lat:36.4360, lng:129.0570, price:1180, vol:42, fee:3.0, dist:12, settle:'D+7', hours:'접수 08:00~17:00', best:true, tags:['계약 출하','물류 부담 없음'], note:'계약 물량은 고정가 정산. 시세 변동 위험을 줄이고 싶을 때 유리.'},
  {id:'m09', t:'apc', n:'안동 농협 통합 APC', lat:36.5680, lng:128.7290, price:1195, vol:58, fee:3.5, dist:48, settle:'D+7', hours:'접수 08:00~17:00', tags:['선별·저장 지원'], note:'저온저장 연계로 출하 시점 조절 가능.'},
  {id:'m10', t:'apc', n:'무안 양파 전문 APC', lat:34.9900, lng:126.4820, price:1210, vol:96, fee:3.0, dist:392, settle:'D+7', hours:'접수 08:00~18:00', tags:['양파 특화'], note:'양파 주산지 전문 선별 라인 보유.'},
  {id:'m11', t:'retail', n:'롯데마트 중부 물류센터', lat:36.8060, lng:127.1140, price:1340, vol:64, fee:9.0, dist:246, settle:'D+30', hours:'입고 06:00~15:00', tags:['고단가','정산 김'], note:'규격·선별 기준이 엄격하지만 단가가 높습니다. 정산 주기 확인 필요.'},
  {id:'m12', t:'retail', n:'이마트 후레쉬센터', lat:37.2410, lng:127.1780, price:1352, vol:78, fee:9.5, dist:288, settle:'D+30', hours:'입고 05:00~14:00', tags:['고단가','대량 계약'], note:'연간 계약 물량 위주. 소량 출하는 어려울 수 있습니다.'},
  {id:'m13', t:'retail', n:'하나로마트 대구 유통센터', lat:35.8420, lng:128.6320, price:1285, vol:52, fee:7.5, dist:104, settle:'D+15', hours:'입고 06:00~16:00', tags:['근거리','농협 계열'], note:'농협 계열로 경영체 실적 연계가 수월합니다.'},
  {id:'m14', t:'online', n:'온라인 B2B 직거래 (식자재 유통)', lat:37.3980, lng:127.1080, price:1350, vol:36, fee:5.0, dist:290, settle:'D+7', hours:'상시 접수', best:true, tags:['최소 5톤','순수익 우수'], note:'중간 유통 단계가 짧아 순수익이 높지만 최소 물량 조건이 있습니다.'},
  {id:'m15', t:'online', n:'로컬푸드 직매장 (경북권)', lat:36.0190, lng:129.3430, price:1420, vol:8, fee:12.0, dist:86, settle:'D+1', hours:'상시 접수', tags:['소량 가능','즉시 정산'], note:'단가는 높으나 물량이 적어 보조 판로로 적합.'}
];
let mkGroup = null, mkOn = true, selMk = null;

function mkNet(m){
  /* 내 예상 순수익률(%) = (수취가 - 운송비 - 수수료) / 시장평균가 기준 근사 */
  const ship = m.dist * 0.28;               // 원/kg (거리 기반 근사)
  const net = m.price - ship - m.price * m.fee / 100;
  return {ship: Math.round(ship), net: Math.round(net), rate: (net / 1240 - 1) * 100};
}
function mkIcon(m, selected){
  const ty = MK_TYPE[m.t];
  const badge = m.best ? '<span class="mk-badge">추천</span>' : '';
  return L.divIcon({className:'mk', iconSize:[34,42], iconAnchor:[17,42], popupAnchor:[0,-44], tooltipAnchor:[0,-42], html:
    '<div class="mk-pin'+(selected?' sel':'')+'" data-id="'+m.id+'">'+
      '<svg width="34" height="42" viewBox="0 0 34 42" fill="none">'+
        '<path d="M17 41C17 41 31 25.6 31 16.2 31 8.4 24.7 2 17 2S3 8.4 3 16.2C3 25.6 17 41 17 41Z" fill="'+ty.color+'" stroke="#fff" stroke-width="2.2"/>'+
        '<g transform="translate(7,6)">'+ty.ic+'</g>'+
      '</svg>'+badge+
    '</div>'});
}
function mkPopup(m){
  const ty = MK_TYPE[m.t], c = mkNet(m);
  const rows = [
    ['수취 단가', m.price.toLocaleString()+'원/kg'],
    ['운송비 (청송→)', c.ship.toLocaleString()+'원/kg · '+m.dist+'km'],
    ['수수료', m.fee.toFixed(1)+'%'],
    ['예상 실수취', '<span style="color:var(--g700)">'+c.net.toLocaleString()+'원/kg</span>'],
    ['정산', m.settle],
    ['일평균 반입', m.vol.toLocaleString()+'톤'],
    ['운영', m.hours]
  ];
  return '<div class="mkp-head"><div class="t">'+m.n+'</div><div class="s">'+ty.label+'</div></div>'+
    '<div class="mkp-body">'+rows.map(r=>'<div class="mkp-row"><span class="k">'+r[0]+'</span><span class="v">'+r[1]+'</span></div>').join('')+
    '<div style="font-size:11.5px;color:var(--sub);line-height:1.55;border-top:1px solid #EEF1EF;padding-top:8px">'+m.note+'</div></div>'+
    (m.tags && m.tags.length ? '<div class="mkp-tags">'+m.tags.map(t=>'<span class="badge bg-ok">'+t+'</span>').join('')+'</div>' : '')+
    '<div class="mkp-foot"><button class="btn btn-pri btn-sm" style="flex:1" onclick="askMarket(\''+m.id+'\')">챗봇에게 질문</button>'+
    '<button class="btn btn-neu btn-sm" style="flex:1" onclick="toast(\'info\',\'출하 등록 — 시안 범위 외\')">출하 등록</button></div>';
}
function buildMarkets(){
  mkGroup = L.layerGroup();
  MARKETS.forEach(function(m){
    const c = mkNet(m);
    const mk = L.marker([m.lat, m.lng], {icon:mkIcon(m,false), riseOnHover:true, zIndexOffset:m.best?300:100});
    mk.bindTooltip('<span class="tipwrap"><span class="n">'+m.n+'</span><span class="v">'+MK_TYPE[m.t].label+' · <b>'+m.price.toLocaleString()+'원/kg</b></span></span>',
      {direction:'top', offset:[0,0], className:'mk-tip', opacity:1});
    mk.bindPopup(mkPopup(m), {offset:[0,0], closeButton:true, autoPan:false});
    mk.on('popupopen', function(){
      selMk = m.id;
      const el=mk.getElement(); if(el) el.querySelector('.mk-pin').classList.add('sel');
    });
    mk.on('popupclose', function(){ if(selMk===m.id) selMk = null; const el=mk.getElement(); if(el) el.querySelector('.mk-pin').classList.remove('sel'); });
    mkGroup.addLayer(mk);
  });
  if(mkOn) mkGroup.addTo(panMap);
}
function toggleMarkets(){
  mkOn = !mkOn;
  const el = document.getElementById('mktToggle');
  el.classList.toggle('off', !mkOn);
  el.querySelector('span').textContent = '판로 '+(mkOn?'ON':'OFF');
  if(!mkGroup) return;
  if(mkOn){ mkGroup.addTo(panMap); } else { panMap.removeLayer(mkGroup); }
}
function askMarket(id){
  const m = MARKETS.find(x=>x.id===id);
  askFromOutside(m.n+'에 출하하면 순수익이 얼마나 될까?');
}

/* ══════════ 알림 ══════════ */
const NOTIFS = [
  {type:'warn', tt:'원가 급증 감지 · 비료비', desc:'최근 30일 지출이 평년 대비 +18% 상승했습니다. 상세 내역을 확인해보세요.', time:'오늘 09:12', unread:true, go:'dashboard'},
  {type:'ok', tt:'교육 이수증 수신 완료', desc:'농정원에서 수신되어 작성 중인 서류에 자동 첨부되었어요.', time:'2시간 전', unread:true, go:'docs'},
  {type:'info', tt:'분산 출하 시작일 안내', desc:'AI 추천 출하 기간(8/22~8/29)이 3일 후 시작됩니다.', time:'어제', unread:false, go:'dashboard'},
  {type:'ok', tt:'데이터 영수증 신규 기록 2건', desc:'정책자금 신청서 자동 첨부에 마이데이터가 활용되었습니다.', time:'어제', unread:false, go:'mypage'}
];
const N_STYLE = {
  warn:{bg:'var(--orange-bg)', svg:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M9 2L16.5 15.5H1.5L9 2Z" stroke="#E17A17" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7V10.5" stroke="#E17A17" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="13" r=".9" fill="#E17A17"/></svg>'},
  ok:{bg:'var(--g100)', svg:'<svg width="17" height="17" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.2" stroke="#0E7A46" stroke-width="1.2"/><path d="M3.5 6.2L5.3 8L8.5 4.5" stroke="#0E7A46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
  info:{bg:'var(--blue-bg)', svg:'<svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#2E6BD6" stroke-width="1.4"/><path d="M8 7.5V11" stroke="#2E6BD6" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".9" fill="#2E6BD6"/></svg>'}
};
function renderNotifs(){
  document.getElementById('notifList').innerHTML = NOTIFS.map((n,i)=>`
    <div class="notif-item${n.unread?' unread':''}" onclick="openNotif(${i})">
      <span class="dot"></span>
      <div class="notif-ic" style="background:${N_STYLE[n.type].bg}">${N_STYLE[n.type].svg}</div>
      <div style="flex:1;min-width:0">
        <div class="notif-tt">${n.tt}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('');
  const unread = NOTIFS.filter(n=>n.unread).length;
  const badge = document.getElementById('bellBadge');
  badge.textContent = unread;
  badge.style.display = unread ? 'flex' : 'none';
}
function toggleNotif(e){
  e.stopPropagation();
  document.getElementById('notifPanel').classList.toggle('open');
}
function closeNotif(){ document.getElementById('notifPanel').classList.remove('open'); }
function openNotif(i){
  const n = NOTIFS[i];
  n.unread = false;
  renderNotifs();
  closeNotif();
  if(n.go === 'docs') openDocs('s2');
  else nav(n.go);
}
function readAllNotifs(){
  NOTIFS.forEach(n=>n.unread=false);
  renderNotifs();
  toast('ok','모든 알림을 읽음으로 표시했습니다');
}
document.addEventListener('click', closeNotif);
renderNotifs();

/* ══════════ 디자인시스템 — 세그먼트 탭 데모 ══════════ */
function dsSeg(btn){
  btn.parentElement.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b === btn); });
  toast('info', '"' + btn.textContent.trim() + '" 선택됨');
}
