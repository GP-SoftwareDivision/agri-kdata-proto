/* ══════════ 상태 & 네비게이션 ══════════ */
let currentPage = null;
let chartInited = false;

/* ── PC/모바일 미리보기 전환 ── */
function setDeviceView(mode){
  const pcBtn = document.getElementById('vtPc');
  const moBtn = document.getElementById('vtMobile');
  const ov = document.getElementById('phoneFrameOverlay');
  if(mode==='mobile'){
    pcBtn.classList.remove('active'); moBtn.classList.add('active');
    const ifr = document.getElementById('phoneFrameIframe');
    if(!ifr.getAttribute('src')) ifr.src = 'index.html?m=1';
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }else{
    moBtn.classList.remove('active'); pcBtn.classList.add('active');
    ov.classList.remove('open');
    document.body.style.overflow = '';
  }
}
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && document.getElementById('phoneFrameOverlay').classList.contains('open')) setDeviceView('pc');
});

/* ── 모바일 사이드 메뉴 ── */
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarScrim').classList.add('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarScrim').classList.remove('open');
}

/* ── 챗봇 대화 목록 (7일 보관 · 시안) ── */
var CHAT_THREADS = [
  {t:'양파 출하 시기, 지금이 좋을까?', d:'오늘', left:7},
  {t:'청송 사과 판로 추천 결과', d:'어제', left:6},
  {t:'농약 안전사용 기준 문의', d:'8/22', left:3},
  {t:'정책자금 신청 서류 준비', d:'8/20', left:1}
];
var activeThread = 0;
function renderThreads(){
  const box = document.getElementById('ctList'); if(!box) return;
  box.innerHTML = CHAT_THREADS.map((th,i)=>`
    <button class="ct-row ${i===activeThread?'active':''}" onclick="pickThread(${i})">
      <div class="t">${th.t}</div>
      <div class="m">${th.d} · ${th.left<=1?'<span class="warn">'+th.left+'일 남음</span>':'<b>'+th.left+'일</b> 남음'}</div>
      <span class="ct-del" onclick="event.stopPropagation();delThread(${i})" role="button" aria-label="삭제">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 3.5H9.5M4.8 3.2V2.2H7.2V3.2M3.4 3.7L3.9 9.8H8.1L8.6 3.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </button>`).join('');
}
function pickThread(i){
  activeThread = i; renderThreads(); toggleThreads(false);
  toast('info','「'+CHAT_THREADS[i].t+'」 대화를 불러왔어요 — 시안');
}
function delThread(i){
  const th = CHAT_THREADS.splice(i,1)[0];
  if(activeThread>=CHAT_THREADS.length) activeThread = Math.max(0, CHAT_THREADS.length-1);
  renderThreads();
  toast('ok','「'+th.t+'」 대화를 삭제했어요');
}
function newThread(){
  CHAT_THREADS.unshift({t:'새 대화', d:'오늘', left:7});
  activeThread = 0; renderThreads(); toggleThreads(false);
  if(typeof newChatSession === 'function') newChatSession();
}
function toggleThreads(force){
  const p = document.getElementById('chatThreads');
  const s = document.getElementById('ctScrim');
  if(!p) return;
  const open = (force === undefined) ? !p.classList.contains('open') : !!force;
  p.classList.toggle('open', open);
  if(s) s.classList.toggle('open', open);
}

function enterApp(){
  const lp = document.getElementById('loginPage');
  lp.classList.add('leaving');
  setTimeout(()=>{
    lp.style.display='none';
    document.getElementById('appShell').classList.add('on');
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('chatPanel').classList.remove('hidden');
    nav('dashboard');
    toast('ok','로그인되었어요 — 김농가님, 환영해요');
  }, 330);
}

function logoutApp(){
  closeSidebar();
  if(typeof segSyncSoon === 'function') segSyncSoon();
  if(typeof closeNotif === 'function') closeNotif();
  if(typeof closeChatPanel === 'function') closeChatPanel();
  document.getElementById('appShell').classList.remove('on');
  document.getElementById('fab').classList.add('hidden');
  document.getElementById('chatPanel').classList.add('hidden');
  const lp = document.getElementById('loginPage');
  lp.style.display = '';
  lp.classList.remove('leaving');
  toast('info','로그아웃되었어요');
}

function nav(id){
  if(currentPage === id) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+id);
  // reflow로 애니메이션 재시작
  void pg.offsetWidth;
  pg.classList.add('active');
  document.querySelectorAll('.gnb-item,.tb-item,.sb-item').forEach(b=>b.classList.toggle('active', b.dataset.nav===id));
  currentPage = id;
  // 챗봇 페이지에서는 플로팅 숨김
  document.getElementById('fab').style.display = (id==='chatbot') ? 'none' : '';
  if(id==='chatbot'){ closeChatPanel(); setTimeout(initChatWidget, 120); }
  if(id==='dashboard') setTimeout(initChart, 150);
  if(id==='docs' && !document.querySelector('.doc-view.on')) goDocView('home');
  if(id==='map') setTimeout(function(){
    if(typeof initPanMap === 'function') initPanMap();
    if(panMap && panMap.invalidateSize) panMap.invalidateSize();
    if(typeof lockNationZoom === 'function') lockNationZoom();
    if(typeof syncTableTop === 'function') syncTableTop();
    if(typeof initMapChart === 'function') initMapChart();   /* 모바일은 차트 탭에서 다시 시도 */
  }, 180);
  if(typeof segSyncSoon === 'function') segSyncSoon();
  if(typeof closeNotif === 'function') closeNotif();
  /* 숨어 있던 동안은 높이가 0이라 페이드 계산이 틀어진다 — 보인 뒤 다시 계산 */
  if(typeof osUpdateFades === 'function') setTimeout(osUpdateFades, 80);
  if(id !== 'map' && $mapTip) $mapTip.classList.remove('show');
  if(typeof osScrollTop === 'function') osScrollTop(pg, 0);
}

/* ══════════ amCharts 시세 차트 ══════════ */
/* 대시보드와 판로 지도가 같은 차트를 쓴다 — 엘리먼트 id 만 다르다 */
function initChart(){
  if(chartInited || !document.getElementById('priceChart')) return;
  if(!window.am5 || !window.am5xy){ setTimeout(initChart, 300); return; }
  chartInited = true;
  buildPriceChart('priceChart');
}
let mapChartInited = false;
function initMapChart(){
  if(mapChartInited) return;
  const el = document.getElementById('mapPriceChart');
  if(!el || !el.clientHeight) return;              /* 숨겨진 탭에서는 크기가 0이라 나중에 */
  if(!window.am5 || !window.am5xy){ setTimeout(initMapChart, 300); return; }
  mapChartInited = true;
  buildPriceChart('mapPriceChart');
}
function buildPriceChart(elId){
  const root = am5.Root.new(elId);
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
function openModal(id){
  document.getElementById(id).classList.add('open');
  /* 지도 툴팁이 모달 위에 남지 않도록 (z 900 > overlay 110) */
  if($mapTip){ tipHover = false; $mapTip.classList.remove('show'); }
  /* 숨겨진 동안 바뀐 콘텐츠 높이를 반영 */
  if(typeof osUpdateFades === 'function') setTimeout(osUpdateFades, 30);
}
function closeModal(id){
  document.getElementById(id).classList.remove('open');
  if(typeof updateCrosshairTip === 'function') setTimeout(updateCrosshairTip, 0);   /* 닫히면 조준점 툴팁 복귀 */
}
document.querySelectorAll('.overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target===ov){ ov.classList.remove('open'); setTimeout(updateCrosshairTip, 0); } });
});

/* ══════════ 마이페이지 — 마이데이터 공통기능 (규약 준수) ══════════ */
/* ── 데이터 모델: 기관별 동의 = 필수/선택 항목으로 구성 (목적·항목·보유기간 명시) ── */
const CONNS = [
  {id:'epis', name:'농정원 (EPIS)', icon:'g', on:true, date:'2026-05-10',
   easy:'경영체 정보와 교육 이력으로 서류를 자동으로 채우고, 내 품목 시세를 추천해요.',
   items:[
     {k:'농업경영체 등록정보', req:true, on:true, purpose:'행정서류 자동 입력, 본인 농가 확인', fields:'경영체등록번호, 재배 품목·면적, 농지 소재지', period:'동의 철회 또는 회원 탈퇴 시까지'},
     {k:'교육 이수 이력', req:true, on:true, purpose:'서류 첨부용 이수 확인, 의무교육 안내', fields:'교육 과정명, 이수일, 이수 여부', period:'동의 철회 또는 회원 탈퇴 시까지'},
     {k:'경락 시세 이력', req:false, tag:'맞춤 추천', on:true, purpose:'내 품목 기준 시세·출하시점 맞춤 추천', fields:'출하 품목별 경락 가격·물량', period:'수집일로부터 1년'},
   ]},
  {id:'nts', name:'공공마이데이터 — 국세청', icon:'b', on:true, date:'2026-06-02',
   easy:'사업자등록증명 등 국세청 증명서를 정책자금 신청서에 자동으로 첨부해요.',
   items:[
     {k:'사업자등록증명', req:true, on:true, purpose:'행정서류 증빙 자동 첨부', fields:'사업자등록번호, 상호, 개업일', period:'서류 생성 시 1회 수신 후 즉시 파기'},
     {k:'소득금액증명 · 납세증명', req:true, on:true, purpose:'정책자금 심사용 증빙 자동 첨부', fields:'연도별 소득금액, 납세 사실', period:'서류 생성 시 1회 수신 후 즉시 파기'},
   ]},
  {id:'mois', name:'공공마이데이터 — 행정안전부', icon:'b', on:false, date:null,
   easy:'주민등록등본 등 행정 증명서를 서류에 자동으로 첨부해요.',
   items:[
     {k:'주민등록표 등·초본', req:true, on:false, purpose:'행정서류 증빙 자동 첨부', fields:'성명, 주소, 세대 구성', period:'서류 생성 시 1회 수신 후 즉시 파기'},
     {k:'지방세 납세증명', req:false, tag:'서류 첨부', on:false, purpose:'일부 서식의 선택 증빙 첨부', fields:'지방세 납부 사실', period:'서류 생성 시 1회 수신 후 즉시 파기'},
   ]},
  {id:'kplus', name:'케이플러스 (금융·소비)', icon:'o', on:true, date:'2026-06-20',
   easy:'신용정보와 소비 패턴을 분석해 경영 위험을 미리 알려드려요.',
   items:[
     {k:'법인 신용정보', req:true, on:true, purpose:'경영 리스크 이상탐지 알림', fields:'신용등급, 연체 여부', period:'동의 철회 시까지 (분기별 갱신)'},
     {k:'카드 소비 패턴', req:false, tag:'경영 분석', on:true, purpose:'원가 급증 감지 등 경영 분석 고도화', fields:'업종별 카드 지출 요약(개별 결제내역 제외)', period:'수집일로부터 6개월'},
     {k:'분석 결과 통계 활용', req:false, tag:'통계·연구', on:false, purpose:'비식별 통계 작성, 서비스 개선 연구', fields:'비식별 처리된 경영 지표', period:'비식별 처리 후 3년'},
   ]},
];

/* ── 영수증: 동의/수집이용/공유/내려받기 4유형 ── */
const R_TYPE = {
  consent:{n:'동의',   cls:'rt-consent'},
  use:{n:'수집·이용', cls:'rt-use'},
  share:{n:'공유',    cls:'rt-share'},
  download:{n:'내려받기', cls:'rt-download'},
};
let rcptSeq = 20;
let rcptFilter = 'all';
const RECEIPTS = [
  {id:'RCPT-U-260819-014', type:'use', date:'2026-08-19 14:02', title:'정책자금 신청서 증빙 자동 첨부',
   rows:{'시작일':'2026-08-19','목적':'농업경영회생자금 신청서 자동 작성·첨부','개인데이터 항목':'농업경영체 등록확인서, 사업자등록증명, 소득금액증명','이용 기간':'서류 생성 시 1회 이용 후 파기','제공자':'공공마이데이터 (농식품부·국세청)','수신자':'agriG 행정서류 서비스'}, base:'RCPT-C-260602-002'},
  {id:'RCPT-U-260819-013', type:'use', date:'2026-08-19 09:11', title:'AI 시세 예측 · 출하 추천',
   rows:{'시작일':'2026-08-19','목적':'내 품목 기준 시세 예측·출하 시점 추천','개인데이터 항목':'경락 시세 이력, 재배 품목·면적','이용 기간':'추천 산출 시 이용','제공자':'농정원 (EPIS)','수신자':'agriG AI 추천 엔진'}, base:'RCPT-C-260510-001'},
  {id:'RCPT-U-260818-012', type:'use', date:'2026-08-18 16:40', title:'AI 챗봇 답변 개인화',
   rows:{'시작일':'2026-08-18','목적':'챗봇 답변에 내 교육 이수·품목 반영','개인데이터 항목':'교육 이수 이력, 재배 품목','이용 기간':'답변 생성 시 이용','제공자':'농정원 (농업교육포털)','수신자':'agriG AI 챗봇'}, base:'RCPT-C-260510-001'},
  {id:'RCPT-C-260620-003', type:'consent', date:'2026-06-20 10:22', title:'케이플러스 데이터 연동 동의',
   rows:{'동의 일시':'2026-06-20 10:22','동의 유형':'신규 동의','동의 항목':'법인 신용정보(필수), 카드 소비 패턴(선택)','수집·이용 목적':'경영 리스크 이상탐지, 경영 분석','보유·이용 기간':'동의 철회 시까지 / 수집일로부터 6개월','동의 방법':'본인 인증 후 화면 내 개별 동의'}, base:null},
  {id:'RCPT-C-260602-002', type:'consent', date:'2026-06-02 14:05', title:'공공마이데이터(국세청) 연동 동의',
   rows:{'동의 일시':'2026-06-02 14:05','동의 유형':'신규 동의','동의 항목':'사업자등록증명(필수), 소득금액증명·납세증명(필수)','수집·이용 목적':'행정서류 증빙 자동 첨부','보유·이용 기간':'서류 생성 시 1회 수신 후 즉시 파기','동의 방법':'본인 인증 후 화면 내 개별 동의'}, base:null},
  {id:'RCPT-C-260510-001', type:'consent', date:'2026-05-10 09:30', title:'농정원(EPIS) 데이터 연동 동의',
   rows:{'동의 일시':'2026-05-10 09:30','동의 유형':'신규 동의','동의 항목':'농업경영체 등록정보(필수), 교육 이수 이력(필수), 경락 시세 이력(선택)','수집·이용 목적':'행정서류 자동 입력, 맞춤 추천','보유·이용 기간':'동의 철회 시까지 / 시세 이력 1년','동의 방법':'본인 인증 후 화면 내 개별 동의'}, base:null},
];
function nowStamp(){ const d=new Date(),p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function issueReceipt(type, title, rows, base){
  const d=new Date(),p=n=>String(n).padStart(2,'0');
  const id = 'RCPT-'+{consent:'C',use:'U',share:'S',download:'D'}[type]+'-'+String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+'-'+String(++rcptSeq).padStart(3,'0');
  RECEIPTS.unshift({id, type, date:nowStamp(), title, rows, base});
  renderReceipts();
  return id;
}

/* ── 이용내역: 요약 칩 + 필터 + 목록 + 상세 ── */
function renderReceipts(){
  const chips = document.getElementById('rcptChips');
  if(!chips) return;
  const cnt = t => RECEIPTS.filter(r=>r.type===t).length;
  chips.innerHTML = [
    ['all','전체', RECEIPTS.length], ['consent','동의', cnt('consent')], ['use','수집·이용', cnt('use')],
    ['share','공유', cnt('share')], ['download','내려받기', cnt('download')]
  ].map(([k,n,c])=>`<div class="rcpt-chip${rcptFilter===k?' sel':''}" onclick="rcptFilter='${k}';renderReceipts()"><b>${c}</b><span>${n}</span></div>`).join('');
  const list = RECEIPTS.filter(r=>rcptFilter==='all'||r.type===rcptFilter);
  document.getElementById('rcptList').innerHTML = list.length ? list.map(r=>`
    <div class="rcpt-row" onclick="openReceipt('${r.id}')">
      <span class="rt ${R_TYPE[r.type].cls}">${R_TYPE[r.type].n}</span>
      <div style="flex:1;min-width:0">
        <div class="rrt" style="font-size:13.5px;font-weight:700">${r.title}</div>
        <div class="rcpt-id">${r.id}</div>
      </div>
      <span style="font-size:12px;color:var(--sub);white-space:nowrap">${r.date}</span>
      <svg width="7" height="12" viewBox="0 0 8 12" fill="none"><path d="M1.5 1.5L6 6L1.5 10.5" stroke="#9AA3A0" stroke-width="1.5" stroke-linecap="round"/></svg>
    </div>`).join('')
    : '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;color:var(--sub)">해당 유형의 영수증이 아직 없어요.</div>';
  if(typeof osUpdateFades === 'function') osUpdateFades();
}
function openReceipt(id){
  const r = RECEIPTS.find(x=>x.id===id); if(!r) return;
  const badge = document.getElementById('rcptBadge');
  badge.className = 'rt ' + R_TYPE[r.type].cls;
  badge.textContent = R_TYPE[r.type].n + ' 영수증';
  document.getElementById('rcptId').textContent = r.id;
  document.getElementById('rcptTitle').textContent = r.title;
  const rows = Object.assign({'발행 일시': r.date}, r.rows);
  let html = '<table class="rcpt-tbl"><tbody>' +
    Object.entries(rows).map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('') + '</tbody></table>';
  if(r.base){
    html += `<div style="margin-top:12px;font-size:12.5px;background:var(--g50);border:1px solid #DCEBE2;border-radius:10px;padding:10px 14px">이 이용의 근거가 된 동의: <a href="#" style="font-weight:700;font-family:Menlo,monospace;font-size:11.5px" onclick="openReceipt('${r.base}');return false">${r.base}</a></div>`;
  }
  document.getElementById('rcptBody').innerHTML = html;
  openModal('rcptModal');
}
function dlReceipts(){
  const blob = new Blob([JSON.stringify(RECEIPTS, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'agriG_이용내역_영수증.json'; a.click();
  toast('ok','이용내역 전체를 JSON(기계가독형)으로 내려받았어요');
}

/* ── 동의 관리: 기관 카드 + 항목별 상태·토글 ── */
const ICON_BG = {g:'var(--g100)', b:'var(--blue-bg)', o:'var(--orange-bg)'};
const ICON_SVG = {
  g:'<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M10 17V9" stroke="#0E7A46" stroke-width="1.7" stroke-linecap="round"/><path d="M10 9C10 5.5 12.5 3 16 3C16 6.5 13.5 9 10 9Z" stroke="#0E7A46" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 12C10 9.5 8 7.5 5 7.5C5 10 7 12 10 12Z" stroke="#0E7A46" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  b:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="7" width="13" height="8.5" rx="1.5" stroke="#2E6BD6" stroke-width="1.5"/><path d="M9 2L15.5 7H2.5L9 2Z" stroke="#2E6BD6" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  o:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="4" width="13" height="10" rx="1.5" stroke="#E17A17" stroke-width="1.5"/><path d="M2.5 7.5H15.5" stroke="#E17A17" stroke-width="1.5"/></svg>'
};
let pendingConn = null;
const connOpen = {};
function connMetaText(c){
  const onCnt = c.items.filter(i=>i.on).length;
  return `${c.on&&c.date ? '동의일 '+c.date+' · ' : ''}동의 ${onCnt}/${c.items.length}개 항목`;
}
function renderConns(){
  const box = document.getElementById('connList'); if(!box) return;
  box.innerHTML = CONNS.map(c=>{
    const itemsHtml = c.items.map((it,ii)=>`
      <div class="ci-row">
        <span class="${it.req?'tag-req':'tag-opt'}" style="font-size:10px">${it.req?'필수':'선택'}</span>
        <span class="nm">${it.k}${it.tag?` <span style="font-size:11px;color:var(--mut)">· ${it.tag}</span>`:''}</span>
        <span class="${it.on?'st-on':'st-off'}" id="st-${c.id}-${ii}">${it.on?'동의함':'철회됨'}</span>
        <span class="toggle ${it.on?'on':''}" id="tg-${c.id}-${ii}" onclick="toggleItem('${c.id}',${ii})"></span>
      </div>`).join('');
    return `
    <div class="dconn" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="conn-ic" style="background:${ICON_BG[c.icon]}">${ICON_SVG[c.icon]}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px"><b style="font-size:14.5px">${c.name}</b>
            ${c.on ? '<span class="badge bg-ok" style="font-size:11.5px">연동중</span>' : '<span class="badge bg-mut">미연동</span>'}</div>
          <div style="font-size:12px;color:var(--sub);margin-top:3px" id="meta-${c.id}">${connMetaText(c)}</div>
        </div>
        <div class="dconn-acts">${c.on
          ? `<button class="btn btn-neu btn-sm" id="cbtn-${c.id}" onclick="toggleConnItems('${c.id}')">${connOpen[c.id]?'접기':'항목 관리'}</button>
             <button class="btn btn-dan-out btn-sm" onclick="askRevoke('${c.id}')">전체 철회</button>`
          : `<button class="btn btn-pri btn-sm" onclick="askConsent('${c.id}')">연동 동의</button>`}</div>
      </div>
      ${c.on ? `<div class="conn-items" id="ci-${c.id}"><div class="ci-inner">${itemsHtml}</div></div>` : ''}
    </div>`;
  }).join('');
  const n = CONNS.filter(c=>c.on).length;
  document.getElementById('connSummary').textContent = `${n} / ${CONNS.length} 기관 연동중`;
  /* 이전에 열려 있던 항목 패널은 트랜지션 없이 즉시 해당 높이로 복원 */
  CONNS.forEach(c=>{
    if(c.on && connOpen[c.id]){
      const el = document.getElementById('ci-'+c.id);
      if(el) el.style.maxHeight = el.scrollHeight + 'px';
    }
  });
}
/* 항목 관리 아코디언: 부드러운 펼침·접힘 (전체 재렌더 없이 해당 패널만 애니메이션) */
function toggleConnItems(id){
  connOpen[id] = !connOpen[id];
  const box = document.getElementById('ci-'+id);
  const btn = document.getElementById('cbtn-'+id);
  if(btn) btn.textContent = connOpen[id] ? '접기' : '항목 관리';
  if(!box) return;
  if(connOpen[id]){
    box.style.maxHeight = box.scrollHeight + 'px';
  } else {
    box.style.maxHeight = box.scrollHeight + 'px';
    void box.offsetHeight;              /* 강제 리플로우로 시작값 확정 후 닫기 */
    box.style.maxHeight = '0px';
  }
}
/* 항목별 즉시 변경: 선택=바로 토글+영수증, 필수 철회=기관 해지 확인으로 연결
   전체 재렌더 대신 해당 토글·상태 텍스트만 갱신해 토글 애니메이션과 아코디언 상태를 그대로 유지 */
function toggleItem(cid, ii){
  const c = CONNS.find(x=>x.id===cid); const it = c.items[ii];
  if(it.req && it.on){ askRevoke(cid, it.k); return; }
  it.on = !it.on;
  issueReceipt('consent', c.name+' — '+it.k+' '+(it.on?'재동의':'선택 동의 철회'), {
    '동의 일시': nowStamp(), '동의 유형': it.on?'재동의':'동의 철회', '대상 항목': it.k+' ('+(it.req?'필수':'선택')+')',
    '수집·이용 목적': it.purpose, '보유·이용 기간': it.period, '처리 결과': it.on?'수집·이용 재개':'수집 중단 및 기존 데이터 파기'
  });
  const tgEl = document.getElementById('tg-'+cid+'-'+ii);
  const stEl = document.getElementById('st-'+cid+'-'+ii);
  if(tgEl) tgEl.classList.toggle('on', it.on);
  if(stEl){ stEl.textContent = it.on?'동의함':'철회됨'; stEl.className = it.on?'st-on':'st-off'; }
  const metaEl = document.getElementById('meta-'+cid);
  if(metaEl) metaEl.textContent = connMetaText(c);
  toast(it.on?'ok':'warn', '"'+it.k+'" 항목을 '+(it.on?'재동의했어요':'철회했어요 — 동의 영수증에 기록돼요'));
}
function askRevoke(id, itemName){
  pendingConn = CONNS.find(c=>c.id===id);
  document.getElementById('revokeName').textContent = pendingConn.name;
  document.getElementById('revokeDesc').textContent = (itemName ? ' — "'+itemName+'"은(는) 필수 항목이라 기관 연동 해지로 처리돼요. ' : ' ') +
    '연동을 해지하면 모든 동의가 철회되고 자동입력·추천 기능이 중단돼요. 이미 생성된 서류에는 영향이 없어요.';
  openModal('revokeModal');
}
function confirmRevoke(){
  pendingConn.on = false; pendingConn.date = null;
  pendingConn.items.forEach(i=>i.on=false);
  issueReceipt('consent', pendingConn.name+' 연동 해지 (전체 동의 철회)', {
    '철회 일시': nowStamp(), '동의 유형': '전체 동의 철회', '대상 항목': pendingConn.items.map(i=>i.k).join(', '),
    '처리 결과': '데이터 수집 즉시 중단, 보유 데이터 파기(법정 보존 제외)'
  });
  closeModal('revokeModal'); renderConns();
  toast('warn', pendingConn.name+' 연동이 해지되었어요 — 동의 영수증에 기록돼요');
}

/* ── 알기 쉬운 동의 화면 ── */
function askConsent(id){
  pendingConn = CONNS.find(c=>c.id===id);
  document.getElementById('consentTitle').textContent = pendingConn.name + ' 연동 동의';
  document.getElementById('consentDesc').textContent = pendingConn.easy;
  const mk = (it, ii) => `
    <div class="md-item ${it.req?'req':'opt'}" id="mdi-${ii}">
      <div class="md-item-head" onclick="mdItemCheck(${ii})">
        <input type="checkbox" class="md-chk" data-req="${it.req?1:0}" onclick="event.stopPropagation();mdCheckState()">
        <div class="t">${it.k}${it.tag?` <span class="tag-opt" style="margin-left:4px">${it.tag}</span>`:''}
          <small>${it.purpose}</small></div>
        <span class="md-terms" onclick="event.stopPropagation();mdToggleDetail(${ii})">펼치기</span>
        <svg class="md-arrow" width="11" height="7" viewBox="0 0 10 6" fill="none" style="cursor:pointer;flex-shrink:0" onclick="event.stopPropagation();mdToggleDetail(${ii})"><path d="M1 1L5 5L9 1" stroke="#6E7681" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <div class="md-detail" id="mdd-${ii}">
        <div class="md-detail-in">
          <span class="md-terms-link" onclick="event.stopPropagation();showTerms('${pendingConn.id}',${ii})">약관 상세보기 ›</span>
          <table>
            <tr><th>수집·이용 목적</th><td><u>${it.purpose}</u></td></tr>
            <tr><th>수집 항목</th><td>${it.fields}</td></tr>
            <tr><th>보유·이용 기간</th><td><u>${it.period}</u></td></tr>
          </table>
        </div>
      </div>
    </div>`;
  document.getElementById('reqItems').innerHTML = pendingConn.items.map((it,ii)=>it.req?mk(it,ii):'').join('');
  document.getElementById('optItems').innerHTML = pendingConn.items.map((it,ii)=>!it.req?mk(it,ii):'').join('') ||
    '<div style="font-size:12.5px;color:var(--mut);padding:4px 2px">이 기관에는 선택 동의 항목이 없어요.</div>';
  document.getElementById('allChk').checked = false;
  mdCheckState();
  openModal('consentModal');
}
/* 동의 항목 상세 아코디언: 부드러운 펼침·접힘 */
function mdToggleDetail(ii){
  const item = document.getElementById('mdi-'+ii);
  const box = document.getElementById('mdd-'+ii);
  if(!item || !box) return;
  const willOpen = !item.classList.contains('open');
  item.classList.toggle('open', willOpen);
  const label = item.querySelector('.md-terms');
  if(label) label.textContent = willOpen ? '접기' : '펼치기';
  if(willOpen){
    box.style.maxHeight = box.scrollHeight + 'px';
  } else {
    box.style.maxHeight = box.scrollHeight + 'px';
    void box.offsetHeight;              /* 강제 리플로우로 시작값 확정 후 닫기 */
    box.style.maxHeight = '0px';
  }
}
function mdItemCheck(ii){
  const el = document.querySelector('#mdi-'+ii+' .md-chk');
  el.checked = !el.checked; mdCheckState();
}
function mdAllToggle(v){
  document.querySelectorAll('#consentModal .md-chk').forEach(c=>c.checked=v);
  mdCheckState();
}
function mdCheckState(){
  const chks = [...document.querySelectorAll('#consentModal .md-chk')];
  chks.forEach(c=>c.closest('.md-item').classList.toggle('checked', c.checked));
  const reqOk = chks.filter(c=>c.dataset.req==='1').every(c=>c.checked);
  document.getElementById('consentOk').disabled = !reqOk;
  document.getElementById('allChk').checked = chks.every(c=>c.checked);
}
function mdDecline(){
  closeModal('consentModal');
  toast('info','동의하지 않았어요 — 서비스 이용에 불이익은 없으며, 언제든 다시 연동할 수 있어요');
}
function confirmConsent(){
  const chks = [...document.querySelectorAll('#consentModal .md-chk')];
  pendingConn.items.forEach((it,ii)=>{ it.on = chks[ii] ? chks[ii].checked : false; });
  pendingConn.on = true;
  pendingConn.date = nowStamp().slice(0,10);
  const agreed = pendingConn.items.filter(i=>i.on);
  issueReceipt('consent', pendingConn.name+' 데이터 연동 동의', {
    '동의 일시': nowStamp(), '동의 유형': '신규 동의',
    '동의 항목': agreed.map(i=>i.k+'('+(i.req?'필수':'선택')+')').join(', '),
    '수집·이용 목적': [...new Set(agreed.map(i=>i.purpose))].join(' / '),
    '보유·이용 기간': [...new Set(agreed.map(i=>i.period))].join(' / '),
    '동의 방법': '본인 인증 후 화면 내 개별 동의'
  });
  closeModal('consentModal'); renderConns();
  toast('ok', pendingConn.name+' 연동이 완료되었어요 — 동의 영수증이 발행되었어요');
}
function showTerms(cid, ii){
  const c = CONNS.find(x=>x.id===cid); const it = c.items[ii];
  document.getElementById('termsTitle').textContent = '['+(it.req?'필수':'선택')+'] '+it.k+' 수집·이용 동의 약관';
  document.getElementById('termsBody').innerHTML = `
    <div style="font-size:13.5px;line-height:1.8;color:#374151">
      ㈜골든플래닛(agriG)은 「개인정보 보호법」 제15조·제22조에 따라 아래와 같이 개인데이터를 수집·이용하고자 해요.<br><br>
      <b style="font-size:15px">1. 수집·이용 목적</b><br>${it.purpose}<br><br>
      <b style="font-size:15px">2. 수집 항목</b><br>${it.fields}<br><br>
      <b style="font-size:15px">3. 보유 및 이용 기간</b><br><u style="text-decoration-color:var(--g400);text-underline-offset:3px">${it.period}</u><br><br>
      <b style="font-size:15px">4. 동의를 거부할 권리 및 불이익</b><br>
      귀하는 위 동의를 거부할 권리가 있어요. ${it.req
        ? '다만 이 항목은 서비스 제공에 꼭 필요해서, 동의하지 않으면 <b>'+c.name+' 데이터 연동 서비스</b>를 이용할 수 없어요. agriG의 다른 기능 이용에는 제한이 없어요.'
        : '<b>이 항목은 선택 사항으로, 동의하지 않아도 어떤 불이익도 없어요.</b>'}<br><br>
      <span style="font-size:12px;color:var(--sub)">시행일 2026-05-01 · 문의 privacy@agrig.kr</span>
    </div>`;
  openModal('termsModal');
}

/* ── 공통: 세그/멀티 선택 ── */
function segPick(btn){ btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===btn)); }
function segVal(id){ const b=document.querySelector('#'+id+' button.on'); return b?b.textContent.trim():''; }
function togglePick(el){ el.classList.toggle('sel'); }
function pickVals(id){ return [...document.querySelectorAll('#'+id+' .pick.sel')].map(e=>e.dataset.k); }

/* ── 개인데이터 내려받기 ── */
const DL_ITEMS = [
  {k:'농업경영체 정보', d:'경영체번호 · 품목 · 면적'},
  {k:'시세 · 출하 이력', d:'경락가, AI 추천 기록'},
  {k:'작성한 행정서류', d:'서류 메타데이터 · PDF 목록'},
  {k:'데이터 이용내역(영수증)', d:'동의·수집·공유 전체 기록'},
];
function openDownload(){
  document.getElementById('dlItems').innerHTML = DL_ITEMS.map((it,i)=>`
    <div class="pick${i<2?' sel':''}" data-k="${it.k}" onclick="togglePick(this)">
      <input type="checkbox" style="pointer-events:none" ${i<2?'checked':''} onclick="return false">
      <div><div>${it.k}</div><div style="font-size:11px;color:var(--mut);font-weight:400">${it.d}</div></div>
    </div>`).join('');
  document.getElementById('dlPick').style.display = '';
  document.getElementById('dlDone').style.display = 'none';
  document.getElementById('dlFoot').innerHTML = '<button class="btn btn-neu" onclick="closeModal(\'dlModal\')">취소</button><button class="btn btn-pri" onclick="doDownload()">내려받기</button>';
  openModal('dlModal');
}
function doDownload(){
  document.querySelectorAll('#dlItems .pick').forEach(p=>{ p.querySelector('input').checked = p.classList.contains('sel'); });
  const items = pickVals('dlItems');
  if(!items.length){ toast('err','받을 항목을 1개 이상 선택해주세요'); return; }
  const period = segVal('dlPeriod'), fmt = segVal('dlFormat'), method = segVal('dlMethod');
  const fmtShort = fmt.split(' ')[0];
  if(method === '이 기기에 저장'){
    const payload = {exported_at:nowStamp(), service:'agriG', period, items, format:fmtShort,
      note:'기계가독형 개인데이터 내려받기 (마이데이터 공통기능)', data:{sample:'시안 데모 데이터'}};
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'agriG_내데이터_' + fmtShort.toLowerCase() + '.json'; a.click();
  }
  const rid = issueReceipt('download', '개인데이터 내려받기 ('+fmtShort+')', {
    '내려받기 일시': nowStamp(), '항목': items.join(', '), '기간': period,
    '형식': fmtShort+' (기계가독형)', '전송 방식': method, '수신자': '정보주체 본인 (김농가)'
  });
  document.getElementById('dlPick').style.display = 'none';
  document.getElementById('dlDone').style.display = '';
  document.getElementById('dlDoneSum').innerHTML = `${method==='이 기기에 저장'?'이 기기의 내려받기 폴더에 저장했어요':method+' 방식으로 전송을 시작했어요'} · ${items.length}개 항목`;
  /* 내려받기 영수증 — 필수 표기 6항목 (M6) */
  document.getElementById('dlRcptTbl').innerHTML = [
    ['영수증 ID', `<span class="rcpt-id" style="font-size:11.5px;color:var(--txt)">${rid}</span>`],
    ['처리 일시', nowStamp()],
    ['대상 기관', '제공자: agriG(골든플래닛) / 받는 자: 본인'],
    ['데이터 항목', items.join(', ')],
    ['활용 목적', '정보주체 본인 보관'],
    ['파일 형식', fmtShort+' (UTF-8) · 엑셀 등에서 열 수 있음'],
  ].map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  document.getElementById('dlFoot').innerHTML = '<button class="btn btn-pri" style="width:100%" onclick="closeModal(\'dlModal\')">확인</button>';
}

/* ── 제3자 선별 공유 ── */
const SHARE_ORGS = [
  {k:'청송농협 조합원지원팀', d:'계약 출하 · 조합원 확인용', ic:'g'},
  {k:'NH농협손해보험', d:'농작물 재해보험 가입 심사용', ic:'b'},
  {k:'경상북도 정책자금 심사과', d:'정책자금 신청 심사 참고자료', ic:'o'},
];
const SHARE_ITEMS = [
  {k:'농업경영체 정보', d:'경영체번호 · 품목 · 면적'},
  {k:'출하 실적 요약', d:'연간 출하량 · 매출 요약'},
  {k:'재무 요약 정보', d:'소득금액 · 신용등급 구간'},
];
let shareStage = 1;
function openShare(){
  shareStage = 1;
  document.getElementById('shareOrgs').innerHTML = SHARE_ORGS.map((o,i)=>`
    <div class="share-org${i===0?' sel':''}" data-k="${o.k}" onclick="document.querySelectorAll('#shareOrgs .share-org').forEach(e=>e.classList.remove('sel'));this.classList.add('sel')">
      <div class="conn-ic" style="background:${ICON_BG[o.ic]};width:36px;height:36px">${ICON_SVG[o.ic]}</div>
      <div style="flex:1"><div class="on">${o.k}</div><div class="od">${o.d}</div></div>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#D6DBD8" stroke-width="1.5"/><path class="ck" d="M6 10.3L8.8 13L14 7.5" stroke="#0E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`).join('');
  document.getElementById('shareItems').innerHTML = SHARE_ITEMS.map((it,i)=>`
    <div class="pick${i===0?' sel':''}" data-k="${it.k}" onclick="togglePick(this)">
      <input type="checkbox" style="pointer-events:none" ${i===0?'checked':''} onclick="return false">
      <div><div>${it.k}</div><div style="font-size:11px;color:var(--mut);font-weight:400">${it.d}</div></div>
    </div>`).join('');
  document.getElementById('shareStep1').style.display = '';
  document.getElementById('shareStep2').style.display = 'none';
  document.getElementById('shareDone').style.display = 'none';
  const ss = document.getElementById('shareSearch'); if(ss){ ss.value=''; shareSearchFilter(''); }
  document.getElementById('shareStep').textContent = '1단계 · 공유할 대상과 데이터를 골라주세요';
  document.getElementById('shareFoot').innerHTML = '<button class="btn btn-neu" onclick="closeModal(\'shareModal\')">취소</button><button class="btn btn-pri" onclick="shareNext()">다음</button>';
  openModal('shareModal');
}
function shareTarget(){ const e=document.querySelector('#shareOrgs .share-org.sel'); return e?e.dataset.k:null; }
function shareNext(){
  document.querySelectorAll('#shareItems .pick').forEach(p=>{ p.querySelector('input').checked = p.classList.contains('sel'); });
  if(shareStage === 1){
    const org = shareTarget(), items = pickVals('shareItems');
    if(!org){ toast('err','공유 대상을 선택해주세요'); return; }
    if(!items.length){ toast('err','공유할 데이터를 1개 이상 선택해주세요'); return; }
    shareStage = 2;
    document.getElementById('shareStep1').style.display = 'none';
    document.getElementById('shareStep2').style.display = '';
    document.getElementById('shareStep').textContent = '2단계 · 이동 승인 확인';
    /* 승인 전 요약 — 보내는 사람/받는 곳/목적/자료/기간/방법 (SHR-03) */
    document.getElementById('shareSumTbl').innerHTML = [
      ['보내는 사람', '청송농원 · 김농가 (나)'],
      ['받는 곳', '<b>'+org+'</b>'],
      ['보내는 목적', (SHARE_ORGS.find(o=>o.k===org)||{}).d || '제3자 제공'],
      ['보내는 자료', items.join(', ')],
      ['갖고 있을 기간', '<u style="text-underline-offset:3px;text-decoration-color:var(--g400)"><b>보낸 날부터 '+segVal('sharePeriod')+'</b></u>'],
      ['보내는 방법', '표준 연계 규격 전송 (전 구간 암호화 · TLS 1.3)'],
    ].map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
    document.getElementById('shareFoot').innerHTML = '<button class="btn btn-neu" onclick="openShare()">이전</button><button class="btn btn-pri" style="flex:1" onclick="shareNext()">보내기</button>';
    return;
  }
  const org = shareTarget(), items = pickVals('shareItems'), period = segVal('sharePeriod');
  const rid = issueReceipt('share', org+'에 데이터 공유', {
    '공유 일시': nowStamp(), '목적': (SHARE_ORGS.find(o=>o.k===org)||{}).d || '제3자 제공',
    '제공자': '김농가 (agriG를 통해 전송)', '대상 기관': org,
    '개인데이터 항목': items.join(', '), '보유·이용 기간': period+' (기간 만료 시 파기)',
    '전송 방식': '표준 API · 기계가독형(JSON)'
  });
  document.getElementById('shareStep2').style.display = 'none';
  document.getElementById('shareDone').style.display = '';
  document.getElementById('shareStep').textContent = '공유가 완료되었어요';
  document.getElementById('shareDoneOrg').textContent = org+'에 안전하게 전달되었어요.';
  /* 공유 영수증 — 필수 표기 6항목 + 근거 동의 연결 (SHR-04) */
  document.getElementById('shareDoneTbl').innerHTML = [
    ['영수증 ID', `<span class="rcpt-id" style="font-size:11.5px;color:var(--txt)">${rid}</span>`],
    ['처리 일시', nowStamp()],
    ['대상 기관', '제공자: 김농가 / 받는 자: '+org],
    ['데이터 항목', items.join(', ')],
    ['활용 목적', (SHARE_ORGS.find(o=>o.k===org)||{}).d || '제3자 제공'],
    ['보유 및 이용 기간', '보낸 날부터 '+period],
    ['근거 동의 영수증', `<a href="#" class="rcpt-id" style="font-size:11.5px;color:var(--g700);font-weight:700" onclick="closeModal('shareModal');openReceipt('RCPT-C-260510-001');return false">RCPT-C-260510-001 ›</a>`],
  ].map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  document.getElementById('shareFoot').innerHTML = '<button class="btn btn-pri" style="width:100%" onclick="closeModal(\'shareModal\')">확인</button>';
  toast('ok','공유가 완료되었어요 — 공유 영수증이 발행되었어요');
}
/* 공유 대상 검색: 일치 기관만 표시, 없으면 '아직 연결할 수 없는 곳' 안내 (SHR-01) */
function shareSearchFilter(q){
  q = (q||'').trim();
  let visible = 0;
  document.querySelectorAll('#shareOrgs .share-org').forEach(el=>{
    const hit = !q || el.dataset.k.includes(q);
    el.style.display = hit ? '' : 'none';
    if(hit) visible++;
  });
  document.getElementById('shareEmpty').style.display = visible ? 'none' : '';
}

/* ══════════ 목적 기반 정밀 동의 — 소비처 2축 모듈 (화면설계서 v3.0) ══════════
   마이데이터의 소비처는 ① AI 상담(가명처리) ② 행정 서류 생성(실명 한시보유) 둘뿐이며,
   동의·관리·영수증·역추적이 모두 이 2개 목적 모듈을 기준으로 동작한다. */
const PURPOSES = [
  {id:'p1', no:'①', name:'출하 단가 분석용', proc:'가명처리', cls:'pl-pseudo', on:true, since:'2026-08-26',
   easy:'내 농사 자료로 언제 얼마에 팔면 좋을지 계산해 상담해 드려요. 이때 이름과 주소는 지우고 써요.',
   data:'재배 품목·면적·물량, 소재지, 출하 실적, 교육 이수 이력',
   org:'농정원 · 골든플래닛',
   how:'<u>이름·상세주소·생년월일을 지우고</u> 가상 번호로 바꿔 사용 (개인정보 보호법 제28조의2 가명처리)',
   period:'<u>서비스 이용 종료 시까지</u> · 사업 종료(2027-12-31) 후 6개월 이내 파기',
   where:'AI 상담 (출하 시기·단가 분석, 판로 추천, 경영 리스크 진단)',
   offNote:'끄면 AI 상담이 일반 시세 안내로만 동작해요',
   locks:[['AI 상담 개인화','①번에 동의하면 열려요']]},
  {id:'p2', no:'②', name:'정책자금 서류 생성용', proc:'실명 한시보유', cls:'pl-real', on:true, since:'2026-08-26',
   easy:'농협에 흩어져 있는 내 경영체 자료를 받아와 정부 서식을 대신 채워 드려요. 서류에는 실명이 들어가야 해서 이 목적에서만 이름·주소를 그대로 써요.',
   data:'경영체 등록정보(경영체번호·대표자·주소), 교육 이수 이력, 유통 실적, 재무 정보',
   org:'농림수산식품교육문화정보원 (농정원)',
   how:'<u>서류를 만드는 동안만 이름·주소를 유지</u>하고, 그 외 용도로는 쓰지 않음 · 열람 이력 전부 기록',
   period:'<u>서비스 이용 종료 시까지</u> · 사업 종료(2027-12-31) 후 6개월 이내 파기',
   where:'행정 서류 자동 작성 (정부 표준 서식 4종 자동 기입 · PDF 초안 생성)',
   offNote:'끄면 서류 자동 작성이 잠기고, 보관 중인 이름·주소를 즉시 없애요',
   locks:[['행정 서류 자동 작성','②번에 동의하면 열려요'],['정책자금 신청서 미리 채우기','②번에 동의하면 열려요']]},
];
let etcConsent = {news:false};   /* 그 밖의 동의 (새 소식 알림) */
function purposeOn(id){ const p = PURPOSES.find(x=>x.id===id); return p ? p.on : false; }

/* CMG-02 목적별 동의 관리: 토글 즉시 반영 + 미동의 목적의 기능은 '잠김'으로 노출 */
function renderPurposes(){
  const box = document.getElementById('purList'); if(!box) return;
  box.innerHTML = PURPOSES.map((p,i)=>`
    <div class="pur${p.on?' on':''}">
      <div class="pur-h">
        <span style="font-size:14px;font-weight:900;color:var(--g700)">${p.no}</span>
        <span class="pn">${p.name}</span>
        <span class="pl ${p.cls}">${p.proc}</span>
        <span class="pl ${p.on?'pl-on':'pl-off'}">${p.on?'동의 중':'동의 안 함'}</span>
        <span class="toggle ${p.on?'on':''}" onclick="togglePurpose(${i})"></span>
      </div>
      <div class="pur-d">${p.on ? p.easy+' · '+(p.since?p.since+' 동의':'') : p.offNote+'. 동의하면 바로 쓸 수 있어요.'}
        <a href="#" style="font-weight:700;color:var(--g700);margin-left:4px" onclick="purOpen(${i});return false">동의서 자세히 보기 ›</a></div>
    </div>`).join('') + `
    <div class="pur" style="border-style:dashed">
      <div class="pur-h">
        <span class="pn" style="font-size:13.5px">새 소식 · 지원사업 알림 받기</span>
        <span class="pl ${etcConsent.news?'pl-on':'pl-off'}">${etcConsent.news?'동의 중':'동의 안 함'}</span>
        <span class="toggle ${etcConsent.news?'on':''}" onclick="etcConsent.news=!etcConsent.news;renderPurposes()"></span>
      </div>
    </div>`;
  /* 잠긴 기능 노출 (기능 접근 제어) */
  const locks = PURPOSES.filter(p=>!p.on).flatMap(p=>p.locks.map(l=>[p.no, ...l]));
  document.getElementById('lockList').innerHTML = locks.length ? `
    <div style="font-size:12px;font-weight:800;color:var(--sub);margin:2px 0 7px">🔒 지금 쓸 수 없는 기능</div>
    <div style="display:flex;flex-direction:column;gap:7px">${locks.map(([no,t,d])=>`
      <div class="lockrow">
        <div class="lk"><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="3" y="6.5" width="10" height="7" rx="1.5" stroke="#6E7681" stroke-width="1.5"/><path d="M5.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" stroke="#6E7681" stroke-width="1.5"/></svg></div>
        <div style="flex:1"><div class="lt">${t}</div><div class="ld">잠김 · ${no}번에 동의하면 열려요</div></div>
        <button class="btn btn-out btn-sm" onclick="purOpen(${no==='①'?0:1})">동의하러 가기</button>
      </div>`).join('')}</div>
    <div style="font-size:11.5px;color:var(--sub);margin-top:8px;line-height:1.6">①②를 모두 끄면 서비스를 쓸 수 없어 탈퇴 절차로 넘어가요.</div>` : '';
  if(typeof renderDocLockState === 'function') renderDocLockState();
}
function togglePurpose(i){
  const p = PURPOSES[i];
  if(p.on){
    p.on = false;
    issueReceipt('consent', p.no+' '+p.name+' 동의 철회', {
      '철회 일시': nowStamp(), '동의 유형': '목적 동의 철회', '대상 목적': p.no+' '+p.name+' ('+p.proc+')',
      '처리 결과': p.id==='p2' ? '서류 자동 작성 잠김 · 보관 중인 식별정보(이름·주소) 즉시 파기' : 'AI 상담 개인화 중단 (일반 시세 안내만 동작)'
    });
    toast('warn', p.no+' '+p.name+' 동의를 철회했어요 — 동의 영수증에 기록돼요');
    renderPurposes();
  } else {
    purOpen(i);   /* 재동의는 동의서 상세를 확인한 뒤 진행 */
  }
}

/* CNS-04·05 동의서 상세 — 이용 목적/제공 항목/보유 기관/처리 방식/보유·이용 기간 5요소 표 */
let purIdx = 0, purAfter = null;
function purOpen(i, after){
  purIdx = i; purAfter = after || null;
  const p = PURPOSES[i];
  document.getElementById('purBadgeRow').innerHTML =
    `<span class="tag-req" style="background:${i?'var(--orange)':'var(--blue)'};font-size:10.5px">${p.no} ${i?'서류 생성':'분석용'}</span><span class="pl ${p.cls}">${p.proc}</span><span style="font-size:11px;color:var(--sub)">${i?'행정 서류 작성에 사용':'AI 상담에 사용'}</span>`;
  document.getElementById('purTitle').textContent = '동의서 상세 '+p.no+' '+p.name;
  document.getElementById('purBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="md-summary"><b style="font-size:14px">한 줄 요약</b><p>${p.easy}</p></div>
      <div>
        <div style="font-size:13px;font-weight:800;margin-bottom:6px">📋 무엇에 동의하나요?</div>
        <div style="border:1px solid var(--bd);border-radius:11px;padding:11px 15px"><table class="pur-tbl" style="margin-top:0">
          <tr><th>무엇에 쓰나요<br><small style="font-weight:400;color:var(--mut)">(이용 목적)</small></th><td>${p.where}</td></tr>
          <tr><th>어떤 자료를 받나요<br><small style="font-weight:400;color:var(--mut)">(제공 항목)</small></th><td>${p.data}</td></tr>
          <tr><th>어디에서 받나요<br><small style="font-weight:400;color:var(--mut)">(보유 기관)</small></th><td>${p.org}</td></tr>
          <tr><th>어떻게 처리하나요<br><small style="font-weight:400;color:var(--mut)">(처리 방식)</small></th><td style="font-weight:700">${p.how}</td></tr>
          <tr><th>얼마나 갖고 있나요<br><small style="font-weight:400;color:var(--mut)">(보유·이용 기간)</small></th><td>${p.period}</td></tr>
        </table></div>
        <div style="font-size:10.5px;color:var(--mut);margin-top:5px">※ 위 항목 중 핵심 문구는 본문보다 20% 크게·굵게 표기했어요.</div>
      </div>
      ${i===1 ? `
      <div style="font-size:12px;background:var(--orange-bg);border:1px solid #F1DDBE;border-radius:10px;padding:10px 14px;line-height:1.65;color:#7A4A0B">
        <b>①번(출하 단가 분석)과 다른 점</b><br>① 분석에는 이름을 지우고 쓰지만, ② 서류에는 <b>실명이 있어야 서류가 성립</b>하므로 그 목적에서만 이름·주소를 유지해요. 서류 만들기 외에는 쓰이지 않아요.</div>
      <div style="font-size:12px;background:#F5F8FD;border:1px solid #D8E4F5;border-radius:10px;padding:10px 14px;line-height:1.65;color:#24559E">이름·주소를 꺼내 쓸 때마다 <b>기록이 남아요.</b> [데이터 영수증 › 실명 사용 기록]에서 직접 확인할 수 있어요.</div>` : `
      <div style="font-size:12px;background:#F5F8FD;border:1px solid #D8E4F5;border-radius:10px;padding:10px 14px;line-height:1.65;color:#24559E">상담 답변을 만들 때 <b>내 경영 자료 원문은 밖으로 나가지 않아요.</b> 요약한 숫자만 사용해요. (폐쇄형 원칙)</div>`}
      <div class="md-rights"><b class="md-rights-lead">동의하지 않아도 돼요.</b><br>${i===1?'동의하지 않으면 서류 자동 작성만 잠기고, AI 상담 등 다른 기능은 그대로 쓸 수 있어요. 서류는 직접 작성해 제출할 수도 있어요.':'동의하지 않으면 AI 상담이 내 조건을 반영한 답을 드리지 못하고 일반 시세 정보만 안내해요. 다른 기능 이용에는 제한이 없어요.'}</div>
    </div>`;
  openModal('purModal');
}
function purAgree(){
  const p = PURPOSES[purIdx];
  if(!p.on){
    p.on = true; p.since = nowStamp().slice(0,10);
    issueReceipt('consent', p.no+' '+p.name+' 동의', {
      '동의 일시': nowStamp(), '동의 유형': '목적 동의 (재동의 포함)', '대상 목적': p.no+' '+p.name,
      '처리 방식': p.proc, '제공 항목': p.data, '보유 기관': p.org.replace(/<[^>]+>/g,''),
      '보유·이용 기간': p.period.replace(/<[^>]+>/g,''), '동의 방법': '본인 인증 후 동의서 상세 확인 · 화면 내 동의'
    });
    toast('ok', p.no+' '+p.name+' 동의가 완료되었어요 — 동의 영수증이 발행되었어요');
  }
  renderPurposes();
  closeModal('purModal');
  if(document.getElementById('mdwModal').classList.contains('open') && mdwStep === 2) mdwRenderPurs();
  if(purAfter === 'doc'){ purAfter=null; goDocView('s1'); }
}

/* CMG-03 원클릭 동의 취소 — 목적/그 밖의 동의 개별 선택 철회 */
function openWithdraw(){
  const rows = [];
  rows.push('<div style="font-size:12.5px;font-weight:800;color:var(--sub);margin-bottom:8px">◎ 자료를 쓰는 목적 취소</div>');
  PURPOSES.forEach((p,i)=>{
    rows.push(`<label class="md-allchk" style="margin:0 0 8px;${p.on?'':'opacity:.45'}">
      <input type="checkbox" class="wd-chk" data-i="${i}" ${p.on?'':'disabled'}>
      <span class="pl ${p.cls}">${p.proc}</span><b style="font-size:13px;white-space:nowrap">${p.no} ${p.name}</b>
      <span style="font-size:11px;color:var(--sub);margin-left:auto;text-align:right;line-height:1.5">${p.on?p.offNote:'이미 꺼져 있음'}</span></label>`);
  });
  rows.push('<div style="font-size:12.5px;font-weight:800;color:var(--sub);margin:10px 0 8px">◎ 그 밖의 동의 취소</div>');
  rows.push(`<label class="md-allchk" style="margin:0 0 8px;${etcConsent.news?'':'opacity:.45'}">
    <input type="checkbox" class="wd-chk" data-i="news" ${etcConsent.news?'':'disabled'}>
    <b style="font-size:13px">새 소식 · 지원사업 알림</b>
    <span style="font-size:11px;color:var(--sub);margin-left:auto">끄면 알림이 오지 않아요</span></label>`);
  document.getElementById('wdBody').innerHTML = rows.join('');
  openModal('wdModal');
}
function confirmWithdraw(){
  const sel = [...document.querySelectorAll('#wdModal .wd-chk:checked')];
  if(!sel.length){ toast('err','취소할 동의를 1개 이상 골라주세요'); return; }
  sel.forEach(c=>{
    if(c.dataset.i === 'news'){ etcConsent.news = false; return; }
    const p = PURPOSES[+c.dataset.i];
    p.on = false;
    issueReceipt('consent', p.no+' '+p.name+' 동의 철회 (원클릭)', {
      '철회 일시': nowStamp(), '동의 유형': '목적 동의 철회', '대상 목적': p.no+' '+p.name+' ('+p.proc+')',
      '처리 결과': p.id==='p2' ? '보관 중인 식별정보(이름·주소) 즉시 파기' : '가명 데이터 연결 키 파기 (복원 불가)'
    });
  });
  renderPurposes();
  closeModal('wdModal');
  toast('warn','고른 동의를 취소했어요 — 처리 결과는 동의 영수증에 기록돼요');
}

/* CMG-01 연결 대시보드 — 실시간 갱신 요청 · 데이터 삭제 */
function connRefresh(){
  CONNS.filter(c=>c.on).forEach(c=>c.last = nowStamp());
  renderConns();
  toast('ok','연결된 기관에 최신 자료 갱신을 요구했어요 — 도착하면 알려드려요');
}
function connPurge(){
  issueReceipt('use', '받아온 자료 즉시 삭제', {
    '처리 일시': nowStamp(), '목적': '정보주체 요청에 따른 보관 데이터 삭제',
    '대상': '연결 기관에서 받아 보관 중이던 전체 자료', '처리 결과': '즉시 삭제 완료 (연결 상태는 유지 — 다음 갱신부터 다시 수신)'
  });
  toast('warn','받아온 자료를 즉시 삭제했어요 — 처리 결과가 영수증에 기록돼요');
}

/* USE-04 · USE-05 — 역추적/감사 화면 */
function openTrace(){ openModal('traceModal'); }
function openRealname(){ openModal('rnModal'); }

/* ── 전송요구 위저드 (CNS-01~07): 고령 사용자 대응 3단계 축약 + 진행 상태 상시 표시 ── */
let mdwStep = 0, mdwRid = null;
const MDW_STT = ['시작', '1', '2', '3', '4', '5', '완료'];
const MDW_TITLE = ['내 자료 가져오기', '본인 확인', '사용할 곳', '약관 동의', '자료 받을 기관', '받을 자료', '요구 완료'];
function mdwOpen(){ mdwStep = 0; mdwRid = null; mdwRender(); openModal('mdwModal'); }
function mdwGo(n){
  /* 전진 검증: 목적 동의(2→3)와 약관 동의(3→4)는 별도 프로세스 */
  if(n === 3 && mdwStep === 2){
    const purs = [...document.querySelectorAll('#mdwPurs .mdw-pur-chk')];
    if(!purs.some(c=>c.checked)){ toast('err','①② 중 최소 하나의 목적에 동의해주세요'); return; }
  }
  if(n === 4 && mdwStep === 3){
    if(![...document.querySelectorAll('#mdwModal .mdw-terms')].every(c=>c.checked)){ toast('err','필수 약관에 동의해주세요'); return; }
  }
  if(n === 5 && mdwStep === 4){
    if(!document.querySelector('#mdwS4 .org-cell.sel')){ toast('err','자료를 받아올 기관을 1곳 이상 골라주세요'); return; }
  }
  if(n === 6) mdwIssue();
  mdwStep = n; mdwRender();
}
/* 좌상단 ← : 이전 단계로, 첫 화면에서는 닫기 */
function mdwBack(){
  if(mdwStep > 0 && mdwStep < 6){ mdwStep--; mdwRender(); }
  else closeModal('mdwModal');
}
function mdwDecline(){
  closeModal('mdwModal');
  toast('info','동의하지 않았어요 — 불이익은 없으며, 언제든 다시 시작할 수 있어요');
}
function mdwIssue(){
  if(mdwRid) return;
  const purs = PURPOSES.filter((p,i)=>{ const c = document.querySelector('#mdwPurs .mdw-pur-chk[data-i="'+i+'"]'); return c ? c.checked : true; });
  purs.forEach(p=>{ p.on = true; p.since = nowStamp().slice(0,10); });
  renderPurposes();
  mdwRid = issueReceipt('consent', '마이데이터 전송요구 동의 (자료 가져오기)', {
    '동의 일시': nowStamp(), '동의 유형': '신규 전송요구 동의',
    '동의 주체': '청송농원 · 김농가',
    '대상 기관': '제공자: 농정원 · 골든플래닛 / 제공받는 자: agriG',
    '데이터 항목': '농업경영체 등록정보, 교육 이수 이력, 유통 실적, 정책자금 수혜 내역',
    '활용 목적': purs.map(p=>p.no+' '+p.name+' ('+p.proc+')').join(' · '),
    '보유 및 이용 기간': '서비스 이용 종료 시까지 (사업 종료 후 6개월 이내 파기)'
  });
  document.getElementById('mdwRcptTbl').innerHTML = [
    ['영수증 ID', `<span class="rcpt-id" style="font-size:11.5px;color:var(--txt)">${mdwRid}</span>`],
    ['처리 일시', nowStamp()],
    ['동의 주체', '청송농원 · 김농가'],
    ['대상 기관', '제공자: 농정원·골든플래닛 / 제공받는 자: agriG'],
    ['데이터 항목', '경영체 등록정보, 교육 이수 이력, 유통 실적, 정책자금 수혜 내역'],
    ['활용 목적', purs.map(p=>p.no+' '+p.name+' <span class="pl '+p.cls+'">'+p.proc+'</span>').join('<br>')],
    ['보유 및 이용 기간', '서비스 이용 종료 시까지 (사업 종료 후 6개월 이내 파기)'],
  ].map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
}
function mdwRender(){
  for(let i=0;i<=6;i++){ const el = document.getElementById('mdwS'+i); if(el) el.style.display = i===mdwStep ? '' : 'none'; }
  document.getElementById('mdwBar').style.width = [8,20,36,52,68,84,100][mdwStep]+'%';
  var mdwSttEl = document.getElementById('mdwStt');            /* 진행 표시는 프로그레스바로 통일 — 텍스트는 남아 있을 때만 */
  if(mdwSttEl) mdwSttEl.textContent = MDW_STT[mdwStep];
  document.getElementById('mdwTitle').textContent = MDW_TITLE[mdwStep];
  if(mdwStep === 2) mdwRenderPurs();
  const foot = document.getElementById('mdwFoot');
  if(mdwStep === 0) foot.innerHTML = '<button class="btn-accept" style="flex:1" onclick="mdwGo(1)">시작하기</button>';
  else if(mdwStep === 1) foot.innerHTML = '<button class="btn-accept" style="flex:1" onclick="mdwGo(2)">휴대폰으로 확인하기</button>';
  else if(mdwStep === 2) foot.innerHTML = '<button class="btn-decline" onclick="mdwDecline()">동의하지 않음</button><button class="btn-accept" onclick="mdwGo(3)">동의합니다</button>';
  else if(mdwStep === 3) foot.innerHTML = '<button class="btn-decline" onclick="mdwDecline()">동의하지 않음</button><button class="btn-accept" onclick="mdwGo(4)">동의하고 계속</button>';
  else if(mdwStep === 4) foot.innerHTML = '<button class="btn-accept" style="flex:1" onclick="mdwGo(5)">다음</button>';
  else if(mdwStep === 5) foot.innerHTML = '<button class="btn-accept" style="flex:1" onclick="mdwGo(6)">전송 요구하기</button>';
  else foot.innerHTML = '<button class="btn-accept" style="flex:1" onclick="closeModal(\'mdwModal\')">확인</button>';
}
function mdwRenderPurs(){
  document.getElementById('mdwPurs').innerHTML = PURPOSES.map((p,i)=>`
    <div class="pur${p.on?' on':''}" id="mdwPur${i}">
      <div class="pur-h" style="cursor:pointer" onclick="mdwPurToggle(${i})">
        <input type="checkbox" class="mdw-pur-chk" data-i="${i}" ${p.on?'checked':''} onclick="event.stopPropagation();mdwPurSync()">
        <span style="font-size:14px;font-weight:900;color:var(--g700)">${p.no}</span>
        <span class="pn" style="font-size:15px">${p.name}</span>
        <span class="pl ${p.cls}">${p.proc}</span>
        <button class="pur-more" onclick="event.stopPropagation();purOpen(${i})" aria-label="${p.name} 동의서 자세히 보기"><svg width="8" height="13" viewBox="0 0 8 12" fill="none"><path d="M1.5 1.5L6 6L1.5 10.5" stroke="#9AA3A0" stroke-width="1.7" stroke-linecap="round"/></svg></button>
      </div>
      <div class="pur-d" style="margin-top:9px">${p.easy}</div>
    </div>`).join('');
  mdwPurSync();
}
/* 약관 요약 시트: › → 요약 → '전문 자세히 보기' → 약관 전문 팝업 */
const TSUM = {
  terms:  ['서비스 이용약관', 'agriG 서비스를 이용하는 기본 조건이에요.<br><br>· 계정과 서비스 제공 범위<br>· 이용자와 회사의 권리·책임<br>· 서비스 변경·중단 시의 안내 기준<br><br>을 담고 있어요.', ['epis', 0]],
  privacy:['개인정보 처리방침', '내 자료를 어떻게 다루는지 정한 약속이에요.<br><br>· 수집하는 항목과 이용 목적<br>· 보관 기간과 파기 원칙<br>· 목적 외 사용 금지<br><br>가 핵심이에요.', ['epis', 1]],
};
function showTsum(kind){
  const t = TSUM[kind]; if(!t) return;
  document.getElementById('tsumTitle').textContent = t[0];
  document.getElementById('tsumBody').innerHTML = t[1];
  document.getElementById('tsumMore').onclick = function(){ showTerms(t[2][0], t[2][1]); };
  openModal('tsumModal');
}
function mdwPurToggle(i){
  const c = document.querySelector('#mdwPurs .mdw-pur-chk[data-i="'+i+'"]');
  if(c){ c.checked = !c.checked; mdwPurSync(); }
}
function mdwPurSync(){
  const chks = [...document.querySelectorAll('#mdwPurs .mdw-pur-chk')];
  chks.forEach((c,i)=>{ const card = document.getElementById('mdwPur'+i); if(card) card.classList.toggle('on', c.checked); });
  const all = document.getElementById('mdwAllPur'); if(all) all.checked = chks.every(c=>c.checked);
}
function mdwPurAll(v){
  document.querySelectorAll('#mdwPurs .mdw-pur-chk').forEach(c=>c.checked=v);
  mdwPurSync();
}
function authPick(el){
  el.parentElement.querySelectorAll('.auth-opt').forEach(o=>{ o.classList.toggle('sel', o===el); o.querySelector('input').checked = (o===el); });
}

/* ACC-01 기능별 접근 제어 — 서류 자동 작성은 ② 동의가 있어야 열림 */
function renderDocLockState(){
  const box = document.getElementById('lockState'); if(!box) return;
  box.innerHTML = PURPOSES.map(p=>`
    <div class="lockrow" style="border-style:solid">
      <span class="pl ${p.cls}">${p.proc}</span>
      <div style="flex:1"><div class="lt">${p.no} ${p.name}</div>
        <div class="ld">${p.on ? (p.id==='p1'?'AI 상담은 지금도 쓸 수 있어요':'동의 중') : '동의 안 함 · 동의하면 서류 자동 작성이 바로 열려요'}</div></div>
      <span class="pl ${p.on?'pl-on':'pl-off'}">${p.on?'동의 중':'동의 안 함'}</span>
    </div>`).join('');
}
function unlockDocPurpose(){ purOpen(1, 'doc'); }

renderConns();
renderReceipts();
renderPurposes();
renderThreads();



/* ══════════ 세그먼트 탭: 활성 배경이 미끄러지듯 이동 ══════════ */
function segSync(seg){
  if(!seg) return;
  const on = seg.querySelector('button.on');
  if(!on){ seg.classList.remove('seg-ready'); return; }
  /* offsetLeft 는 부모의 padding edge 기준이고 ::before 의 left:0 도 같은 기준이라 보정값이 필요 없다.
     (예전의 -3 은 padding 3px 인 기본 세그에만 맞아서 활성 배경이 왼쪽으로 밀려 나갔다) */
  seg.style.setProperty('--seg-x', on.offsetLeft + 'px');
  seg.style.setProperty('--seg-w', on.offsetWidth + 'px');
  seg.classList.add('seg-ready');
}
function segSyncAll(){ document.querySelectorAll('.metric-seg').forEach(segSync); }
/* 클릭·리사이즈·화면 전환 시 재계산 (렌더 직후 offset 확정을 위해 rAF 2회) */
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('.metric-seg button');
  if(!b) return;
  const seg = b.parentElement;
  /* 각 세그의 onclick(setMetric/segPick/mktPickDate)이 .on 을 바꾼 뒤에 계산해야 한다 */
  setTimeout(()=>segSync(seg), 0);
  requestAnimationFrame(()=>segSync(seg));
});
window.addEventListener('resize', segSyncAll);
function segSyncSoon(){
  requestAnimationFrame(()=>requestAnimationFrame(segSyncAll));
  /* 페이지 전환 애니메이션·차트 렌더 뒤 offset 이 확정되는 경우가 있어 한 번 더 */
  setTimeout(segSyncAll, 260);
  setTimeout(segSyncAll, 700);
}
segSyncSoon();
window.addEventListener('load', segSyncSoon);
/* 세그가 화면에 나타나거나 크기가 확정되는 순간 자동 계산
   (탭 전환·모달 오픈·조건 바 재렌더 직후에는 offset 이 0 으로 잡힐 수 있다) */
if(window.IntersectionObserver){
  const segIO = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) segSync(e.target); }));
  const segRO = window.ResizeObserver ? new ResizeObserver(es=>es.forEach(e=>{
    if(e.contentRect.width > 0) segSync(e.target);
  })) : null;
  const segObserve = ()=>document.querySelectorAll('.metric-seg').forEach(el=>{
    segIO.observe(el);
    if(segRO) segRO.observe(el);
  });
  segObserve();
  window.segObserve = segObserve;
}

/* ══════════ 판로 검색 + 즐겨찾기 — Mock · 로컬 state ══════════
   기본 검색기(작물·날짜)는 지도에 항상 열려 있고, 즐겨찾기는 미리 세팅해 둔
   작물·시장(·청과)으로 빠르게 조회하는 별도 목록이다. 날짜는 즐겨찾기에 저장하지 않는다. */
const MKT_CROPS_CORE = ['양파','마늘','배추','무','고추'];       /* AI 예측·분석 제공 */
const MKT_CROPS_EXTRA = ['감자','대파','상추','시금치','사과','복숭아','딸기'];  /* 시세 조회만 */
const MKT_MARKETS = [
  {n:'가락시장 (서울)',      s:'가락시장',   d:'전국 기준가',  map:'m01', cq:['중앙청과','동화청과','서울청과','한국청과']},
  {n:'대구 북부 도매시장',   s:'대구 북부',  d:'주 출하처',    map:'m05', cq:['효성청과','대구중앙청과']},
  {n:'부산 엄궁 도매시장',   s:'부산 엄궁',  d:'',             map:'m04', cq:[]},        /* 청과별 자료 미제공 */
  {n:'청송 농협 공판장',     s:'청송 공판장',d:'산지 공판장',  map:'m08', cq:null},      /* 청과 개념 없음 */
];
const MKTSET = {
  crop: '양파',
  market: '대구 북부 도매시장', cq: '효성청과',   /* 현재 조회 조건 — 비우면 전국 평균 */
  /* 조회 기간은 항상 from~to 범위 (주식 차트처럼 최근 7일·30일 추이를 본다) */
  dateFrom: '2026-08-18', dateTo: '2026-08-18', preset: '어제',   /* 어제 | 7일 | 30일 | null(직접 선택) */
  favs: [
    {crop:'양파', market:'대구 북부 도매시장', cq:'효성청과'},
    {crop:'마늘', market:null, cq:null},          /* 설정을 끝내지 않은 예시 → '설정 필요' */
  ],
  inited: false,
};
const MKT_PRESETS = {'어제':['2026-08-18','2026-08-18'],'7일':['2026-08-12','2026-08-18'],'30일':['2026-07-20','2026-08-18']};
var rgnReady = false;     /* 지역 select 를 채울 수 있는 시점인지 (var: 호이스팅으로 TDZ 회피) */
let mktSel = null;        /* 즐겨찾기 편집 임시값 */
let mktFavIdx = -1;       /* 편집 중인 즐겨찾기 index (-1 = 새로 추가) */
/* 지도 ↔ 목록 보기. renderMktBars() 가 스크립트 평가 중에 읽으므로 여기서 미리 선언한다 (TDZ 방지) */
let mapView = 'map';

function mktFav(crop){ return MKTSET.favs.find(f=>f.crop===crop) || null; }
function mktMarket(n){ return MKT_MARKETS.find(m=>m.n===n) || null; }
function mdShort(d){ return d ? d.slice(5).replace('-','/') : ''; }
function mktDateLabel(){
  if(MKTSET.preset==='어제') return '어제 (08/18)';
  if(MKTSET.preset==='7일') return '최근 7일 (08/12~08/18)';
  if(MKTSET.preset==='30일') return '최근 30일 (07/20~08/18)';
  return mdShort(MKTSET.dateFrom)+'~'+mdShort(MKTSET.dateTo);
}
const TRUST_TIP = '청과(도매법인)의 실측 경락가를 그대로 쓰기 때문에, 시장 평균으로 추정한 값보다 데이터 신뢰도가 높아요.';
const TRUST_B = '<span class="trust-b">신뢰<span class="tip">'+TRUST_TIP+'</span></span>';

/* ── 기본 검색기 + 즐겨찾기 렌더 (대시보드 · 지도 공용) ── */
const PENCIL_SVG = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.9 1.8a1.5 1.5 0 0 1 2.12 2.12L4.6 11.35l-2.85.73.73-2.85 7.42-7.43Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const STAR_SVG = '<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M9 1.8l2.16 4.38 4.84.7-3.5 3.41.83 4.81L9 12.83l-4.33 2.27.83-4.81L2 6.88l4.84-.7L9 1.8Z" fill="currentColor"/></svg>';
const M_UI = document.documentElement.classList.contains('m');

/* 검색기 마크업은 두 곳에서 쓴다 — 실제 상태(MKTSET) 와 모바일 조건설정 모달의 초안(MKTDRAFT).
   D=true 면 핸들러가 초안을 건드리는 mktD* 계열로 바뀐다. */
function mktFindHtml(st, D, iconSearch){
  const F = D ? 'mktD' : 'mkt';
  const curMk = mktMarket(st.market);
  const cropOpt = (list, star) => list.map(c=>
    `<div class="select-opt${c===st.crop?' sel':''}" onclick="${F}PickCrop('${c}')"><span>${star?'<b class="star">★</b> ':''}${c}</span></div>`).join('');
  const searchVal = curMk ? curMk.s + (st.cq?' · '+st.cq:'') : '';
  return `
    <div class="mkt-row mkt-row-find">
      <div class="select mkt-crop-sel fld" data-select data-label="작물 선택">
        <button class="select-btn" onclick="tglSelect(this)">${st.crop} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#6E7681" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        <div class="select-list">
          <div class="select-grp">5대 작물 <span>AI 예측·분석 제공</span></div>${cropOpt(MKT_CROPS_CORE,true)}
          <div class="select-grp">그 외 작물 <span>시세 조회만</span></div>${cropOpt(MKT_CROPS_EXTRA,false)}
        </div>
      </div>
      ${iconSearch
        ? ''
        : `<div class="select mkt-search fld" data-select data-label="시장·청과 검색">
        <input class="inp ms-inp" placeholder="비워두면 전체" value="${searchVal}"
          onfocus="this.select();${F}SearchOpen(this,true)" oninput="${F}SearchOpen(this)" onclick="event.stopPropagation()">
        ${curMk?`<button class="ms-x" onclick="${F}SearchClear(event)" aria-label="조건 지우기">✕</button>`:''}
        <div class="select-list ms-list"></div>
      </div>`}
      ${D ? '' : '<button class="btn btn-neu btn-sm mkt-favbtn" onclick="openFavModal()" aria-label="즐겨찾기">'+STAR_SVG+'</button>'}
    </div>`;
}
function mktDatesHtml(st, D){
  const F = D ? 'mktD' : 'mkt';
  return `
    <div class="mkt-row mkt-row-dates">
      <div class="metric-seg mkt-dates">${['어제','7일','30일'].map(p=>
        `<button class="${st.preset===p?'on':''}" onclick="${F}PickPreset('${p}')">${p}</button>`).join('')}</div>
      <div class="mkt-range fld" data-label="조회 기간">
        <input type="date" class="inp mkt-date-inp" min="2025-08-19" max="2026-08-18" aria-label="시작일"
          value="${st.dateFrom}" onchange="${F}PickDateFrom(this.value)">
        <span class="mr-sep">~</span>
        <input type="date" class="inp mkt-date-inp" min="2025-08-19" max="2026-08-18" aria-label="종료일"
          value="${st.dateTo}" onchange="${F}PickDateTo(this.value)">
      </div>
    </div>`;
}
/* 모바일 지도: 지도 위에 겹치는 컴팩트 한 줄 — 작물 · 조회기간 · ★
   바를 누르거나 아래로 끌어내리면 조건설정 모달이 열린다 (핸들러는 bindCondDrag) */
function mktSummaryHtml(){
  return `
    <div class="mkt-sum" id="mktSumBar">
      <button class="mkt-sum-main" onclick="openMktCond()">
        <span class="ms-crop">${MKTSET.crop}</span>
        <span class="ms-dot">·</span>
        <span class="ms-date">${mktDateLabel()}</span>
      </button>
      <button class="mb-ico fav-ic" onclick="event.stopPropagation();openFavModal()" aria-label="즐겨찾기">${STAR_SVG}</button>
      <span class="mkt-sum-grip" aria-hidden="true"></span>
    </div>`;
}
/* 지도 ↔ 목록 전환 — 세그가 아니라 아이콘 토글 하나 */
const LIST_SVG = '<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M6 4.5h9M6 9h9M6 13.5h9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="3" cy="4.5" r="1.1" fill="currentColor"/><circle cx="3" cy="9" r="1.1" fill="currentColor"/><circle cx="3" cy="13.5" r="1.1" fill="currentColor"/></svg>';
const MAP_SVG = '<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M6.6 3.2 2.5 4.9v10l4.1-1.7 4.8 1.7 4.1-1.7v-10l-4.1 1.7-4.8-1.7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.6 3.2v10M11.4 4.9v10" stroke="currentColor" stroke-width="1.5"/></svg>';
const SEARCH_SVG = '<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.7"/><path d="M11.9 11.9 15.5 15.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
function mktViewIconHtml(){
  const toList = mapView === 'map';
  const lbl = toList ? '목록으로 보기' : '지도로 보기';
  return `<button class="mb-ico view-ico" onclick="setMapView('${toList?'table':'map'}')" title="${lbl}" aria-label="${lbl}">${toList?LIST_SVG:MAP_SVG}</button>`;
}
/* PC 지도: 컨테이너 없이 한 줄
   [보기 전환] [작물] [★ 즐겨찾기] [돋보기] [시도] [시군구] [읍면동] */
function mktPcBarHtml(){
  const curMk = mktMarket(MKTSET.market);
  const cond = curMk ? curMk.n + (MKTSET.cq ? ' · ' + MKTSET.cq : '') : '전국 평균';
  const cropOpt = (list, star) => list.map(c=>
    `<div class="select-opt${c===MKTSET.crop?' sel':''}" onclick="mktPickCrop('${c}')"><span>${star?'<b class="star">★</b> ':''}${c}</span></div>`).join('');
  return `
    <div class="mkt-row mkt-pcbar">
      ${mktViewIconHtml()}
      <div class="select mkt-crop-sel" data-select>
        <button class="select-btn" onclick="tglSelect(this)">${MKTSET.crop} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#6E7681" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        <div class="select-list">
          <div class="select-grp">5대 작물 <span>AI 예측·분석 제공</span></div>${cropOpt(MKT_CROPS_CORE,true)}
          <div class="select-grp">그 외 작물 <span>시세 조회만</span></div>${cropOpt(MKT_CROPS_EXTRA,false)}
        </div>
      </div>
      ${mktFavIcHtml()}
      <button class="mb-ico" onclick="openMktSearch()" title="시장·청과 검색 — 지금 ${cond}" aria-label="시장·청과 검색">${SEARCH_SVG}</button>
      <div class="rgn-sels" id="rgnSels"></div>
    </div>`;
}
/* 즐겨찾기 ★ + 호버 팝오버 (설정 필요 항목이 있으면 아이콘에 느낌표) */
function mktFavIcHtml(){
  const need = MKTSET.favs.some(f=>!f.market);
  return `
    <div class="fav-ic-wrap">
      <button class="mb-ico fav-ic" onclick="openFavModal()" aria-label="즐겨찾기">${STAR_SVG}
        ${need?'<span class="fav-warn" aria-hidden="true">!</span>':''}
      </button>
      <div class="fav-pop">
        <div class="fav-pop-inner">
          <div class="fav-pop-t">즐겨찾기 <span>내가 정해 둔 작물·시장</span>
            <button class="fav-pop-add" onclick="favAdd()">＋ 추가</button>
          </div>
          ${mktFavListHtml(true)}
        </div>
      </div>
    </div>`;
}
/* 즐겨찾기 칩 목록. pop=true 면 팝오버용 — 신뢰는 좌상단 배지, 설정필요는 느낌표로 줄인다 */
function mktFavListHtml(pop){
  return `<div class="mkt-row mkt-row-favs">${MKTSET.favs.map((fv,i)=>{
      const mk = mktMarket(fv.market);
      const badge = pop
        ? (!fv.market ? '<span class="fv-warn" aria-label="설정 필요">!<span class="fv-warn-tip">시장 설정이 필요해요</span></span>'
                      : fv.cq ? '<span class="fv-trust" aria-label="청과 실측 — 신뢰도 높음">신뢰</span>' : '')
        : (!fv.market ? '<span class="fv-need">설정 필요</span>' : fv.cq ? TRUST_B : '');
      return `<button class="fav-chip${pop?' fav-chip-pop':''}${fv.crop===MKTSET.crop && fv.market && fv.market===MKTSET.market?' on':''}" onclick="favApply(${i})">
        ${pop ? badge : ''}
        <span class="fedit" onclick="event.stopPropagation();favEdit(${i})" aria-label="${fv.crop} 즐겨찾기 수정">${PENCIL_SVG}</span>
        ${fv.crop}${mk?' <span class="fm">'+mk.s+'</span>':''}
        ${pop ? '' : badge}
        <span class="fx" onclick="favRemove(event,${i})" aria-label="${fv.crop} 즐겨찾기 빼기">✕</span>
      </button>`;}).join('')}
      ${(!pop && MKTSET.favs.length<5)?'<button class="fav-add" onclick="favAdd()">＋ 추가</button>':''}
    </div>`;
}
/* ── 지역 select (시도 › 시군구 › 읍면동) — 디자인시스템 커스텀 셀렉트, 지도·목록 공통 ── */
const CHEV_SVG = '<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#6E7681" stroke-width="1.5" stroke-linecap="round"/></svg>';
function rgnSelHtml(kind, label, cur, list, ph, disabled){
  const hit = list.find(o=>o.v===cur);
  return `<div class="select rgn-sel fld${disabled?' disabled':''}" data-select data-label="${label}">
    <button class="select-btn"${disabled?'':' onclick="tglSelect(this)"'}>${hit?hit.n:ph} ${CHEV_SVG}</button>
    <div class="select-list rgn-list">
      <div class="select-opt${cur?'':' sel'}" onclick="tfPick('${kind}','')">${ph}</div>
      ${list.map(o=>`<div class="select-opt${o.v===cur?' sel':''}" onclick="tfPick('${kind}','${o.v}')">${o.n}</div>`).join('')}
    </div>
  </div>`;
}
function tfPick(kind, v){
  if(typeof event !== 'undefined' && event) event.stopPropagation();
  document.querySelectorAll('.rgn-sel.open').forEach(e=>e.classList.remove('open'));
  tfChange(kind, v);
}

function renderMktBars(){
  const curMk = mktMarket(MKTSET.market);
  const find = mktFindHtml(MKTSET, false, true);   /* 대시보드도 지도처럼 돋보기 → 팝업 검색 */
  const dates = mktDatesHtml(MKTSET, false);
  const favs = mktFavListHtml(true);   /* 대시보드도 지도와 같은 배지 규격 */
  const d1 = document.getElementById('mktBarDash');
  if(d1) d1.innerHTML = `<div class="mkt-row-top">${find}${dates}</div>
    <div class="mkt-row-favwrap"><span class="flabel">즐겨찾기</span>${favs}</div>`;
  /* 지도 조건설정부: 모바일은 지도 위 컴팩트 한 줄, PC 는 컨테이너 없는 한 줄 */
  const d2 = document.getElementById('mktBarMap');
  /* 현황판은 조건바 행 안에 들어가 있다 — innerHTML 을 갈아엎기 전에 밖으로 꺼내 두지 않으면
     통째로 사라진다 (기간 세그를 누르면 패널이 없어지던 버그) */
  const mapRoot = document.querySelector('.map-full');
  const stEl = document.querySelector('.mf-stats');
  if(!M_UI && stEl && mapRoot && stEl.parentElement !== mapRoot) mapRoot.appendChild(stEl);
  if(d2){
    d2.innerHTML = M_UI ? mktSummaryHtml() : mktPcBarHtml();
    if(M_UI) bindCondDrag();
  }
  /* 지도 우측 하단(모바일) · 목록 필터 줄의 보기 전환 아이콘 */
  ['mapViewFab','mapViewFab2'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerHTML = mktViewIconHtml();
  });
  /* 지역 select 는 지도·목록 공통 — PC 는 상단 줄, 모바일은 탭 아래 한 줄 */
  const rg = document.getElementById(M_UI ? 'rgnSelsM' : 'rgnSels');
  /* 지역 목록은 지도 데이터(SIDO_DATA·GEO)가 준비된 뒤에만 채운다 — 스크립트 평가 중에는 아직 TDZ */
  if(rg && rgnReady) renderTableFilters();
  /* 기간 세그는 우측 현황판 옆 (PC) */
  const ds = document.getElementById('mktDateSeg');
  if(ds) ds.innerHTML = ['어제','7일','30일'].map(p=>
    `<button class="${MKTSET.preset===p?'on':''}" onclick="mktPickPreset('${p}')">${p}</button>`).join('');
  /* PC 는 조건바·기간·현황판을 한 줄에 둔다 — 현황판을 조건바 행 안으로 옮긴다 */
  if(!M_UI && d2){
    const st = document.querySelector('.mf-stats'), row = d2.querySelector('.mkt-pcbar');
    if(st && row) row.appendChild(st);
  }
  if(typeof segSyncSoon === 'function') segSyncSoon();
  if(typeof segObserve === 'function') segObserve();
  /* 차트 제목에 반영 */
  document.querySelectorAll('#page-dashboard .sec-t').forEach(el=>{
    if(el.textContent.indexOf('가격 추이')>-1){
      el.innerHTML = MKTSET.crop+' 가격 추이 · 예측 <span style="font-size:12px;color:var(--mut);font-weight:400">'
        + (curMk ? curMk.n+(MKTSET.cq?' · '+MKTSET.cq:'') : '전국 평균') + ' · ' + mktDateLabel() + ' · 원/kg</span>';
    }
  });
}

/* ── 모바일: 조건 바를 아래로 끌어내려도 조건설정이 열린다 (탭은 onclick 이 처리) ── */
function bindCondDrag(){
  const bar = document.getElementById('mktSumBar');
  if(!bar || bar.dataset.drag) return;
  bar.dataset.drag = '1';
  let y0 = null, fired = false;
  bar.addEventListener('touchstart', e=>{ y0 = e.touches[0].clientY; fired = false; }, {passive:true});
  bar.addEventListener('touchmove', e=>{
    if(y0 === null || fired) return;
    if(e.touches[0].clientY - y0 > 24){ fired = true; y0 = null; openMktCond(); }
  }, {passive:true});
  bar.addEventListener('touchend', ()=>{ y0 = null; }, {passive:true});
}

/* ── PC: 시장·청과 검색 팝업 (주소검색처럼 — 고르면 그때 지도가 이동) ── */
function openMktSearch(){
  openModal('mktSearchModal');
  mktSearchModalFill();
  setTimeout(()=>{ const i = document.getElementById('mktSearchInput'); if(i){ i.value = ''; i.focus(); } }, 60);
}
function mktSearchModalFill(){
  const inp = document.getElementById('mktSearchInput');
  const q = inp ? inp.value.trim() : '';
  const rows = [];
  MKT_MARKETS.forEach(m=>{
    const mHit = !q || m.n.includes(q) || m.s.includes(q);
    const cqHits = (m.cq||[]).filter(c=>!q || c.includes(q) || mHit);
    if(!mHit && !cqHits.length) return;
    rows.push(`<div class="select-opt" onclick="mktSearchModalPick('${m.n}',null)"><span><b>${m.n}</b></span><span class="dup">${m.d||'시장 평균'}</span></div>`);
    cqHits.forEach(c=>rows.push(`<div class="select-opt ms-cq" onclick="mktSearchModalPick('${m.n}','${c}')"><span>${c}</span><span class="dup">청과 실측</span></div>`));
  });
  const head = `<div class="select-opt" onclick="mktSearchModalPick(null,null)"><span><b>전국 평균으로 보기</b></span><span class="dup">조건 비우기</span></div>`;
  document.getElementById('mktSearchList').innerHTML = rows.length ? head + rows.join('')
    : head + '<div class="select-empty">검색 결과가 없어요</div>';
}
function mktSearchModalPick(market, cq){
  closeModal('mktSearchModal');
  if(!market){ MKTSET.market = null; MKTSET.cq = null; renderMktBars(); refreshMapDeps();
    toast('info','조건을 비워 전국 평균 기준으로 보여드려요'); return; }
  mktSearchPick(market, cq);
}
/* 조건이 바뀌면 표·차트 제목도 같이 따라간다 */
function refreshMapDeps(){
  if(typeof mapView !== 'undefined' && mapView === 'table' && typeof renderMapTable === 'function') renderMapTable();
}

/* ── 모바일 조건설정 모달: 초안을 편집하고 '적용' 에서만 반영 ── */
let MKTDRAFT = null;
function openMktCond(){
  MKTDRAFT = {crop:MKTSET.crop, market:MKTSET.market, cq:MKTSET.cq,
              dateFrom:MKTSET.dateFrom, dateTo:MKTSET.dateTo, preset:MKTSET.preset};
  renderMktCond();
  openModal('mktCondModal');
}
function renderMktCond(){
  const b = document.getElementById('mktCondBody'); if(!b) return;
  b.innerHTML = mktFindHtml(MKTDRAFT, true) + mktDatesHtml(MKTDRAFT, true);
  if(typeof segSyncSoon === 'function') segSyncSoon();
  if(typeof segObserve === 'function') segObserve();
}
function mktCondApply(){
  if(!MKTDRAFT) return;
  const moved = MKTDRAFT.market && MKTDRAFT.market !== MKTSET.market;
  MKTSET.crop = MKTDRAFT.crop; MKTSET.market = MKTDRAFT.market; MKTSET.cq = MKTDRAFT.cq;
  MKTSET.dateFrom = MKTDRAFT.dateFrom; MKTSET.dateTo = MKTDRAFT.dateTo; MKTSET.preset = MKTDRAFT.preset;
  closeModal('mktCondModal');
  renderMktBars();
  if(typeof renderMapTable === 'function') renderMapTable();
  if(moved) mktZoomTo(MKTSET.market);
  toast('ok','조건을 적용했어요');
}

/* ── 시장·청과 검색: 포커스 시 전체 목록, 입력 시 필터 ── */
function mktSearchOpen(inp, isFocus){ mktSearchFill(inp, isFocus, false); }
function mktSearchFill(inp, isFocus, D){
  const F = D ? 'mktD' : 'mkt';
  const wrap = inp.closest('.mkt-search');
  document.querySelectorAll('.select.open').forEach(el=>{ if(el!==wrap) el.classList.remove('open'); });
  wrap.classList.add('open');
  /* 포커스 직후에는 현재 표시값을 필터로 쓰지 않고 전체 목록을 보여준다 */
  const q = isFocus ? '' : inp.value.trim();
  const rows = [];
  MKT_MARKETS.forEach(m=>{
    const mHit = !q || m.n.includes(q) || m.s.includes(q);
    const cqHits = (m.cq||[]).filter(c=>!q || c.includes(q) || mHit);
    if(!mHit && !cqHits.length) return;
    rows.push(`<div class="select-opt" onmousedown="${F}SearchPick('${m.n}',null)"><span><b>${m.n}</b></span><span class="dup">${m.d||'시장 평균'}</span></div>`);
    cqHits.forEach(c=>rows.push(`<div class="select-opt ms-cq" onmousedown="${F}SearchPick('${m.n}','${c}')"><span>${c}</span><span class="dup">청과 실측</span></div>`));
  });
  wrap.querySelector('.ms-list').innerHTML = rows.length ? rows.join('')
    : '<div class="select-empty">검색 결과가 없어요</div>';
}

/* ── 조건설정 모달 초안(MKTDRAFT) 편집 핸들러 — '적용' 전까지 실제 상태는 그대로 ── */
function mktDPickCrop(c){
  if(typeof event !== 'undefined' && event) event.stopPropagation();
  document.querySelectorAll('#mktCondBody .select.open').forEach(el=>el.classList.remove('open'));
  MKTDRAFT.crop = c;
  const f = mktFav(c);
  if(f && f.market){ MKTDRAFT.market = f.market; MKTDRAFT.cq = f.cq; }   /* 즐겨찾기 세팅 자동 반영 */
  if(!MKT_CROPS_CORE.includes(c)) toast('info', c+'는 AI 예측 없이 시세 조회만 제공해요');
  renderMktCond();
}
function mktDSearchOpen(inp, isFocus){ mktSearchFill(inp, isFocus, true); }
function mktDSearchPick(market, cq){ MKTDRAFT.market = market; MKTDRAFT.cq = cq; renderMktCond(); }
function mktDSearchClear(ev){ ev.stopPropagation(); MKTDRAFT.market = null; MKTDRAFT.cq = null; renderMktCond(); }
function mktDPickPreset(p){ MKTDRAFT.preset = p; MKTDRAFT.dateFrom = MKT_PRESETS[p][0]; MKTDRAFT.dateTo = MKT_PRESETS[p][1]; renderMktCond(); }
function mktDPickDateFrom(v){ if(!v) return; MKTDRAFT.dateFrom = v; if(v > MKTDRAFT.dateTo) MKTDRAFT.dateTo = v; MKTDRAFT.preset = null; renderMktCond(); }
function mktDPickDateTo(v){ if(!v) return; MKTDRAFT.dateTo = v; if(v < MKTDRAFT.dateFrom) MKTDRAFT.dateFrom = v; MKTDRAFT.preset = null; renderMktCond(); }
function mktSearchPick(market, cq){
  MKTSET.market = market; MKTSET.cq = cq;
  renderMktBars(); mktZoomTo(market);
  const mk = mktMarket(market);
  toast('ok', mk.s+(cq?' · '+cq:'')+' 기준으로 보여드릴게요');
}
function mktSearchClear(ev){
  ev.stopPropagation();
  MKTSET.market = null; MKTSET.cq = null;
  renderMktBars();
  toast('info','조건을 비워 전국 평균 기준으로 보여드려요');
}
/* 지도에서는 그 시장으로 확대하고 시장 팝업을 띄운다 */
function mktZoomTo(marketN){
  const mk = mktMarket(marketN);
  if(currentPage==='map' && mk && typeof panMap!=='undefined' && panMap && typeof mkRef!=='undefined' && mkRef[mk.map]){
    const m = MARKETS.find(x=>x.id===mk.map);
    /* 모바일은 검색기 아래에 지도가 있어 확대가 안 보인다 — 지도를 화면에 먼저 데려온다 */
    const isM = document.documentElement.classList.contains('m');
    if(isM){
      const s = osScroller(document.getElementById('page-map')), pan = document.getElementById('panMap');
      if(s && pan) setTimeout(()=>{
        s.scrollTop = pan.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop - 8;
      }, 60);
    }
    /* 중심은 마커 그대로 둔다 — 중심을 옮기면 조준점이 옆 지역을 잡아 드릴이 튄다.
       모바일 팝업이 지도 높이를 넘는 문제는 CSS(컴팩트 팝업 + 지도 480px)로 해결 */
    const tgt = L.latLng(m.lat, m.lng);
    /* flyTo 아크가 잠깐 전국 밖으로 축소하며 날아가므로, 비행 동안만 최소 줌을 풀어 준다 */
    const minZ = panMap.getMinZoom();
    panMap.setMinZoom(5.5);
    let flown = false;
    panMap.once('moveend', ()=>{ flown = true; panMap.setMinZoom(minZ); });
    panMap.flyTo(tgt, 9.5, {duration:.8});
    /* 탭이 백그라운드라 rAF 가 멈춘 환경에서는 애니메이션 없이 즉시 이동 */
    setTimeout(()=>{ if(!flown){ panMap.setView(tgt, 9.5, {animate:false}); panMap.setMinZoom(minZ); } }, 1300);
    setTimeout(()=>{ try{ mkRef[mk.map].openPopup(); }catch(e){} }, 1400);
  }
}

/* ── 기본 검색기 동작 ── */
function mktPickCrop(c){
  if(event) event.stopPropagation();
  document.querySelectorAll('.mkt-crop-sel.open').forEach(el=>el.classList.remove('open'));
  MKTSET.crop = c;
  const f = mktFav(c);
  if(f && f.market){ MKTSET.market = f.market; MKTSET.cq = f.cq; }   /* 즐겨찾기 세팅 자동 반영 */
  if(!MKT_CROPS_CORE.includes(c)) toast('info', c+'는 AI 예측 없이 시세 조회만 제공해요');
  renderMktBars();
}
function mktPickPreset(p){
  MKTSET.preset = p; MKTSET.dateFrom = MKT_PRESETS[p][0]; MKTSET.dateTo = MKT_PRESETS[p][1];
  renderMktBars();
}
/* 직접 선택도 from~to — 한쪽이 다른 쪽을 넘어가면 같은 날로 맞춰 준다 */
function mktPickDateFrom(v){ if(!v) return; MKTSET.dateFrom = v; if(v > MKTSET.dateTo) MKTSET.dateTo = v; MKTSET.preset = null; renderMktBars(); }
function mktPickDateTo(v){ if(!v) return; MKTSET.dateTo = v; if(v < MKTSET.dateFrom) MKTSET.dateFrom = v; MKTSET.preset = null; renderMktBars(); }

/* ── 즐겨찾기 동작 ── */
function favApply(i){
  const f = MKTSET.favs[i];
  if(!f.market){ favEdit(i); return; }        /* 설정 필요 → 이어서 설정하도록 */
  MKTSET.crop = f.crop; MKTSET.market = f.market; MKTSET.cq = f.cq;
  renderMktBars(); mktZoomTo(f.market);
  toast('ok', f.crop+' · '+mktMarket(f.market).s+(f.cq?' · '+f.cq:'')+' 기준으로 보여드릴게요');
}
function favRemove(ev, i){
  ev.stopPropagation();
  const f = MKTSET.favs.splice(i,1)[0];
  renderMktBars();
  toast('info', f.crop+' 즐겨찾기를 뺐어요');
}
function favAdd(){
  if(MKTSET.favs.length>=5){ toast('err','즐겨찾기는 최대 5개까지 담을 수 있어요'); return; }
  mktFavIdx = -1; openMktset();
}
function favEdit(i){ mktFavIdx = i; openMktset(); }

/* ══════════ 단계형 진행 엔진 (PC·모바일 공용) ══════════
   모달 본문의 섹션을 한 번에 하나씩만 보여 준다 — "한 화면에 한 가지 일".
   진행 표시는 텍스트(n/m) 대신 헤더 아래 풀폭 프로그레스바로 통일.
   모바일은 헤더 ← (.sheet-back)로, PC 는 푸터 [이전] 버튼으로 되돌아간다. */
function sheetSections(host){
  const vp = host.querySelector('[data-overlayscrollbars-viewport]');
  const root = vp || host;
  /* OverlayScrollbars 가 끼워 넣은 os-* 엘리먼트는 섹션이 아니다 */
  return Array.prototype.filter.call(root.children, el => !/(^|\s)os-/.test(el.className || ''));
}
function stepFlow(cfg){
  const secs = cfg.sections; let i = 0;
  const modal = cfg.foot.closest('.modal');
  let prog = modal.querySelector('.sheet-prog');
  if(!prog){
    prog = document.createElement('div');
    prog.className = 'sheet-prog'; prog.innerHTML = '<i></i>';
    const head = modal.querySelector('.m-head');
    if(head && head.nextSibling) modal.insertBefore(prog, head.nextSibling); else modal.appendChild(prog);
  }
  const back = modal.querySelector('.sheet-back');
  function goBack(){ if(i===0){ cfg.cancel(); } else { i--; show(); } }
  function show(){
    secs.forEach((el, j)=>{ el.style.display = j===i ? '' : 'none'; });
    prog.querySelector('i').style.width = Math.round((i+1)/secs.length*100)+'%';
    if(cfg.stepLabel) cfg.stepLabel.textContent = cfg.labelPrefix;
    if(back) back.onclick = goBack;
    let html = cfg.footLead ? cfg.footLead() : '';
    if(cfg.prevInFoot) html += '<button class="btn btn-neu" id="'+cfg.key+'Prev">'+(i===0?'취소':'이전')+'</button>';
    html += '<button class="btn btn-pri"'+(cfg.prevInFoot?'':' style="flex:1"')+' id="'+cfg.key+'Next"></button>';
    cfg.foot.innerHTML = html;
    const prev = document.getElementById(cfg.key+'Prev');
    if(prev) prev.onclick = goBack;
    const next = document.getElementById(cfg.key+'Next');
    next.textContent = i===secs.length-1 ? cfg.doneLabel : '다음';
    next.onclick = function(){
      if(cfg.validate && !cfg.validate(i)) return;
      if(i===secs.length-1){ cfg.done(); } else { i++; show(); }
    };
    if(typeof osUpdateFades === 'function') setTimeout(osUpdateFades, 30);
  }
  show();
}

/* ── 즐겨찾기 설정 모달: 작물 → 시장(필수) → 청과(보조) 를 한 흐름씩 ── */
function openMktset(){
  const f = mktFavIdx>=0 ? MKTSET.favs[mktFavIdx] : null;
  mktSel = f ? {crop:f.crop, market:f.market, cq:f.cq} : {crop:null, market:null, cq:null};
  mktRenderModal();
  openModal('mktModal');
}
function mktRenderModal(){
  if(typeof segSyncSoon === 'function') segSyncSoon();
  /* ① 작물 (하나만) — 다른 즐겨찾기가 이미 쓰는 작물은 고를 수 없다 */
  const box = document.getElementById('mktCropSelect');
  box.querySelector('.select-btn').childNodes[0].textContent = (mktSel.crop || '작물을 골라주세요') + ' ';
  const usedByOther = c => MKTSET.favs.some((f,i)=>f.crop===c && i!==mktFavIdx);
  const opt = (list, star) => list.map(c=>{
    const dup = usedByOther(c);
    return `<div class="select-opt${c===mktSel.crop?' sel':''}${dup?' dis':''}"${dup?'':` onclick="mktPickCropSel('${c}')"`}>
      <span>${star?'<b class="star">★</b> ':''}${c}</span>${dup?'<span class="dup">이미 있어요</span>':''}</div>`;
  }).join('');
  document.getElementById('mktCropList').innerHTML =
    '<div class="select-grp">5대 작물 <span>AI 예측·분석 제공</span></div>' + opt(MKT_CROPS_CORE,true)
    + '<div class="select-grp">그 외 작물 <span>시세 조회만</span></div>' + opt(MKT_CROPS_EXTRA,false);
  /* ② 시장 — 작물을 고르기 전에는 잠가서 한 흐름씩 끝내도록 유도 */
  const cropN = mktSel.crop || '작물';
  document.getElementById('mktCropName').textContent = cropN;
  const last = cropN.charCodeAt(cropN.length-1);
  const josa = document.getElementById('mktCropJosa');
  if(josa) josa.textContent = (last>=0xAC00 && last<=0xD7A3 && (last-0xAC00)%28>0) ? '은' : '는';
  const mBox = document.getElementById('mktMarkets');
  if(!mktSel.crop){
    mBox.innerHTML = '<div class="mkt-wait">먼저 작물을 골라주세요 — 고르면 여기가 열려요.</div>';
  } else {
    mBox.innerHTML = MKT_MARKETS.map(m=>`
      <div class="share-org${mktSel.market===m.n?' sel':''}" onclick="mktPickMarket('${m.n}')">
        <div style="flex:1"><div class="on">${m.n}</div><div class="od">${m.d||' '}</div></div>
        ${m.cq===null?'':m.cq.length===0?'<span class="badge bg-mut">청과별 자료 없음</span>':'<span class="badge bg-ok">청과 '+m.cq.length+'곳</span>'}
      </div>`).join('');
  }
  /* ③ 청과 (보조) — 시장을 고르기 전에는 잠금 */
  const mk = mktMarket(mktSel.market);
  const cqBox = document.getElementById('mktCqs');
  const note = document.getElementById('mktCqNote');
  if(!mktSel.market){ cqBox.innerHTML = '<div class="mkt-wait">시장을 고르면 여기가 열려요.</div>'; note.style.display='none'; }
  else if(mk.cq===null){ cqBox.innerHTML = '<div class="tcap">산지 공판장은 청과 구분 없이 공판장 평균으로 보여드려요.</div>'; note.style.display='none'; mktSel.cq=null; }
  else if(mk.cq.length===0){ cqBox.innerHTML = '<div class="tcap">이 시장은 청과별 자료를 제공하지 않아요 — 시장 전체 평균으로 보여드려요.</div>'; note.style.display='none'; mktSel.cq=null; }
  else {
    note.style.display='';
    cqBox.innerHTML = mk.cq.map(q=>`
      <div class="share-org${mktSel.cq===q?' sel':''}" onclick="mktPickCq('${q}')">
        <div style="flex:1"><div class="on">${q}</div></div>
        ${mktSel.cq===q?'<span class="badge bg-ok">신뢰도 높음</span>':''}
      </div>`).join('')
      + `<div class="share-org${mktSel.cq===null?' sel':''}" onclick="mktPickCq(null)" style="border-style:dashed">
        <div style="flex:1"><div class="on" style="color:var(--sub)">건너뛰기 — 시장 전체 평균으로 볼게요</div></div></div>`;
  }
  /* 삭제 버튼은 기존 즐겨찾기를 열었을 때만 */
  const del = document.getElementById('mktDel');
  if(del) del.style.display = mktFavIdx>=0 ? '' : 'none';
}
function mktPickCropSel(c){
  if(event) event.stopPropagation();
  document.getElementById('mktCropSelect').classList.remove('open');
  mktSel.crop = c; mktSel.market = null; mktSel.cq = null;
  if(!MKT_CROPS_CORE.includes(c)) toast('info', c+'는 AI 예측 없이 시세 조회만 제공해요');
  mktRenderModal();
}
function mktPickMarket(n){ mktSel.market = n; mktSel.cq = null; mktRenderModal(); }
function mktPickCq(q){ mktSel.cq = q; mktRenderModal(); }
function mktSave(){
  if(!mktSel.crop){ toast('err','작물을 골라주세요'); return; }
  const item = {crop:mktSel.crop, market:mktSel.market, cq:mktSel.cq};
  if(mktFavIdx>=0) MKTSET.favs[mktFavIdx] = item; else MKTSET.favs.push(item);
  closeModal('mktModal');
  if(!item.market){
    toast('info', "시장 설정이 남아서 '설정 필요'로 담아뒀어요");
  } else {
    MKTSET.crop = item.crop; MKTSET.market = item.market; MKTSET.cq = item.cq;
    toast('ok', '즐겨찾기에 담았어요 — '+item.crop+' · '+mktMarket(item.market).s+(item.cq?' · '+item.cq:''));
  }
  renderMktBars();
}
const mktApply = mktSave;   /* 모바일 래퍼 호환 */
/* PC 도 모바일과 같은 단계형 흐름으로 (모바일은 mobile-flow.js 가 같은 엔진으로 감싼다) */
if(!document.documentElement.classList.contains('m')){
  const _openMktsetPC = openMktset;
  openMktset = function(){
    _openMktsetPC();
    stepFlow({
      key:'mk',
      sections: sheetSections(document.getElementById('mktBody')),
      foot: document.getElementById('mktFoot'),
      stepLabel: document.getElementById('mktStepLbl'),
      labelPrefix: '작물 → 시장 → 청과 순서로 하나씩 고르면 돼요',
      doneLabel: '저장',
      prevInFoot: true,
      footLead: ()=> mktFavIdx>=0
        ? '<button id="mktDel" class="mkt-del-link" onclick="favDelete()">즐겨찾기에서 빼기</button>' : '',
      validate: function(i){
        if(i===0 && !mktSel.crop){ toast('err','작물을 골라주세요'); return false; }
        if(i===1 && !mktSel.market){ toast('err','시장을 골라주세요'); return false; }
        return true;
      },
      cancel: function(){ closeModal('mktModal'); },
      done: function(){ mktSave(); },
    });
  };
}
/* 모바일: 즐겨찾기 버튼 → 바텀시트 목록 */
function openFavModal(){
  const body = document.getElementById('favModalBody');
  body.innerHTML = MKTSET.favs.map((fv,i)=>{
    const mk = mktMarket(fv.market);
    return `<div class="share-org" onclick="closeModal('favModal');favApply(${i})">
      <button class="fav-edit" onclick="event.stopPropagation();closeModal('favModal');favEdit(${i})" aria-label="${fv.crop} 수정">${PENCIL_SVG}</button>
      <div style="flex:1"><div class="on">${fv.crop}</div><div class="od">${mk?mk.s+(fv.cq?' · '+fv.cq:''):'시장을 아직 안 골랐어요'}</div></div>
      ${!fv.market
        ? '<span class="fv-warn fv-warn-row" aria-label="설정 필요">!<span class="fv-warn-tip">시장 설정이 필요해요</span></span>'
        : fv.cq ? '<span class="fv-trust fv-trust-row">신뢰</span>' : ''}
    </div>`;}).join('')
    + (MKTSET.favs.length<5?`<button class="btn btn-out" style="width:100%" onclick="closeModal('favModal');favAdd()">＋ 즐겨찾기 추가</button>`:'')
    + (MKTSET.favs.length?'':'<div class="tcap" style="text-align:center;padding:8px 0">아직 담아 둔 즐겨찾기가 없어요.</div>');
  openModal('favModal');
}
function favDelete(){
  if(mktFavIdx>=0) MKTSET.favs.splice(mktFavIdx,1);
  closeModal('mktModal'); renderMktBars();
  toast('info','즐겨찾기에서 뺐어요');
}
renderMktBars();

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
  home:'완성된 서류는 이 기기에만 저장되고, 내 데이터는 작성 시점마다 실시간으로 조회해요.',
  s1:'표준 서식을 고르거나, 갖고 있는 서식 파일을 올려 웹 양식으로 변환하세요.',
  s2:'마이데이터로 자동입력된 값을 확인하고, 비어 있는 항목만 채워주세요.',
  s3:'실제 서식 그대로 미리 확인해요. 초록 배경이 자동입력된 항목이에요.',
  s4:'생성된 서류는 내 서류함(이 기기)에 보관돼요.',
  lock:'서류 자동 작성은 \'② 정책자금 서류 생성용\' 동의가 있어야 열려요.'
};

function goDocView(v){
  /* 기능별 접근 제어: ② 서류 생성용 미동의 시 작성 플로우 대신 잠김 화면 (ACC-01) */
  if(['s1','s2','s3'].includes(v) && typeof purposeOn === 'function' && !purposeOn('p2')){
    v = 'lock';
    if(typeof renderDocLockState === 'function') renderDocLockState();
  }
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
  if(typeof osScrollTop === 'function') osScrollTop(document.getElementById('page-docs'), 0);
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
    box.innerHTML = '<div style="padding:36px;text-align:center;font-size:13px;color:var(--sub)">아직 작성한 서류가 없어요. <b>새 서류 작성</b>으로 시작해보세요.</div>';
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
      : `<button class="btn btn-neu btn-sm" onclick="toast('info','PDF 열기 — 시안에서는 생략돼요')">PDF 보기</button>`}
      <button class="btn btn-neu btn-sm" onclick="delDoc(${i})" title="이 기기에서 삭제">삭제</button>
    </div>`).join('');
}
function resumeDoc(i){
  curDoc = {name:docs[i].name, org:docs[i].org};
  setFormBar();
  goDocView('s2');
  toast('info','임시저장 상태를 불러왔어요 — 마이데이터는 최신 값으로 다시 조회했어요');
}
function delDoc(i){
  const nm = docs[i].name;
  docs.splice(i,1); persist(); renderDocList();
  toast('warn', '"'+nm+'" 서류를 이 기기에서 삭제했어요');
}
function saveDraft(){
  loadDocs();
  const today = fmtDate(new Date()).slice(0,10);
  const ex = docs.find(d=>d.name===curDoc.name && d.status==='draft');
  if(ex){ ex.date = today; }
  else docs.unshift({name:curDoc.name, org:curDoc.org, date:today, status:'draft', prog:60});
  persist();
  toast('ok','임시저장 완료 — 내 서류함(이 기기)에 보관되었어요');
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
  toast('ok','서식을 불러와 마이데이터로 자동입력했어요');
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
  toast('ok','변환된 서식에 자동입력을 적용했어요 — 값을 꼭 확인해주세요');
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
  toast('ok','저장된 변환 서식을 불러왔어요 — 마이데이터 최신 값으로 자동입력');
}
function delTpl(i){
  const nm = tpls[i].name;
  tpls.splice(i,1); persist(); renderTpls();
  toast('warn','"'+nm+'" 변환 서식을 삭제했어요');
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
  toast('info','마이데이터를 다시 조회했어요 — 저장본이 아닌 실시간 연계 값이에요');
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
  if(!phone){ toast('err','연락처를 입력해주세요 — 필수 항목이에요'); document.getElementById('phoneInput').focus(); return; }
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
  toast('ok','서류가 생성되었어요 — TSA 타임스탬프 적용');
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
    title: '알농이',
    subtitle: '시세 · 판로 · 행정 상담',
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
  if(kind === 'contact'){ toast('info', label + ' — 전화 연결은 시안 범위 외예요'); return; }
  toast('info', label + ' — 시안 범위 외 동작이에요');
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
  if(chatWidget){ chatWidget.newSession(); toast('ok','새 상담을 시작했어요'); }
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
  toast('ok','API 주소를 저장했어요 — 다시 연결해요');
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
/* 지도 툴팁(z 900)은 모달(.overlay z 110)보다 위층이라, 모달이 열려 있으면 아예 띄우지 않는다 */
function modalOpen(){ return !!document.querySelector('.overlay.open'); }
function showMapTip(html, e){
  if(modalOpen()) return;
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
  if(M_UI){ tipHover = false; t.classList.remove('show'); return; }
  if(modalOpen()){ tipHover = false; t.classList.remove('show'); return; }
  const ch = document.getElementById('crosshair');
  /* 지도가 안 보이는 상태(목록 보기·모바일 다른 탭)면 조준점 툴팁도 띄우지 않는다 */
  if(ch && !ch.offsetParent){ tipHover = false; t.classList.remove('show'); return; }
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
      const lm = L.marker(lyr.getBounds().getCenter(), {icon:L.divIcon({className:'custom-label', html:'<span class="label-text">'+name+'</span>'}), interactive:false, pane: level==='sido' ? 'markerPane' : 'drillLabels'});
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
  toast('info','읍면동 경계를 불러오는 중이에요…');
  fetch('data/emd_wgs84.json').then(r=>r.json()).then(g=>{
    GEO.emd = g;
    g.features.forEach(f=>{ const sig=f.properties.EMD_CD.slice(0,5); (emdBySig[sig]=emdBySig[sig]||[]).push(f); });
    cb();
  }).catch(()=>toast('err','읍면동 데이터를 불러오지 못했어요'));
}
function ensureEmdGroup(sigCd){
  if(!groups.emd[sigCd]) groups.emd[sigCd] = buildGroup(emdBySig[sigCd]||[], 'emd');
  return groups.emd[sigCd];
}

/* ── 뷰 전환 (전국 / 시도 포커스 / 읍면동 단독) ── */
/* 좌측 필터·우측 통계 패널에 지도가 가리지 않도록 여백 확보 */
let koreaBounds = null, natZoomLocked = false;
function lockNationZoom(){
  /* 컨테이너가 0 크기일 때 fit 하면 엉뚱한 줌이 나오므로, 실제 크기가 잡힌 뒤에만 잠근다 */
  if(natZoomLocked || !panMap || !koreaBounds) return;
  if(panMap.getSize().y < 150) return;
  panMap.setMinZoom(5.5);
  panMap.fitBounds(koreaBounds, fitPad());
  panMap.setMinZoom(panMap.getZoom());
  natZoomLocked = true;
}
function fitPad(){
  if(document.documentElement.classList.contains('m')){
    /* 모바일: 지도 위 플로팅 패널이 없으므로 여백 최소화 */
    return {paddingTopLeft:[14,14], paddingBottomRight:[14,44]};
  }
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
  /* 라벨 pane 은 타일과 같은 오프셋만 따라간다 (그림자는 글자가 번져서 제외) */
  const lp = panMap.getPane('drillLabels');
  if(lp) lp.classList.toggle('float-labels', !!on);
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
  if(M_UI) return;                 /* 모바일은 조준점 없이 터치로만 지역을 고른다 */
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
    /* select 로 명시적으로 고른 지역이 비행 중 조준점에 덮이지 않게 (suppressUntil 동안 유지) */
    if(!(PANEL.level === lv && PANEL.code === hit) && Date.now() >= suppressUntil){
      PANEL = {level:lv, code:hit};
      renderSel(); markRank();
      /* scrollIntoView 는 조상 스크롤(페이지 전체)까지 끌어내리므로 순위 목록 안에서만 스크롤 */
      const row = document.querySelector('#rankList .rank-row.sel');
      const rvp = osScroller(document.getElementById('rankScroll'));
      if(row && rvp){
        const rt = row.getBoundingClientRect(), vt = rvp.getBoundingClientRect();
        if(rt.top < vt.top) rvp.scrollTop += rt.top - vt.top;
        else if(rt.bottom > vt.bottom) rvp.scrollTop += rt.bottom - vt.bottom;
      }
    }
  } else {
    el.classList.remove('has');
  }
  updateCrosshairTip();
}
function queueCrosshair(){
  if(M_UI) return;
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
    panMap = L.map('panMap', {zoomControl:false, attributionControl:false, scrollWheelZoom:true, doubleClickZoom:false, zoomSnap:.25, zoomDelta:.5, minZoom:5.5, maxZoom:12, wheelPxPerZoomLevel:90});
    /* 드릴다운 타일 전용 pane — 포커스 시 그림자+오프셋으로 떠 보이게 (참조: web_bi sigfocus) */
    panMap.createPane('drill');
    panMap.getPane('drill').style.zIndex = 450;
    /* 지역명 라벨 전용 pane — 라벨을 drill pane 에 같이 넣으면 폴리곤 <svg> 와 DOM 순서를
       다투다가 일부 라벨이 타일 아래로 깔린다. 타일(450) 위, 판로 마커(600) 아래로 분리. */
    panMap.createPane('drillLabels');
    panMap.getPane('drillLabels').style.zIndex = 460;
    panMap.getPane('drillLabels').style.pointerEvents = 'none';
    panMap.on('zoomend', onZoomEnd);
    if(!M_UI) panMap.on('move zoom', queueCrosshair);   /* 모바일은 화면 이동으로 지역이 바뀌지 않는다 */
    panMap.on('movestart', function(){ if(Date.now() >= suppressUntil) userMoved = true; });
    groups.sido = buildGroup(GEO.sido.features, 'sido');
    panMap.addLayer(groups.sido);
    koreaBounds = L.geoJSON(GEO.sido).getBounds();
    panMap.fitBounds(koreaBounds, fitPad());
    lockNationZoom();                       /* 전국이 보이는 레벨 이하로는 축소 금지 */
    buildMarkets();
    rgnReady = true; renderTableFilters();  /* 이제 지역 select 를 채울 수 있다 */
    refreshAll();
  })
  .catch(function(){ panMap=null; toast('err','지도 데이터를 불러오지 못했어요'); });
}

/* ── 렌더 일괄 ── */
function refreshAll(){
  paintVisible(); renderCrumb(); renderSel(); renderRank(); renderLegend(); renderStats();
  if(mapView === 'table') renderMapTable();
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
/* ── 지역별 파생값 (표·정보 패널 공용) ── */
function mapValue(metric, lv, code){ const keep = mapMetric; mapMetric = metric; const v = valOf(lv, code); mapMetric = keep; return v; }
function volOf(lv, code){ const sd = SIDO_DATA[code.slice(0,2)]; return lv==='sido' ? sd.vol : Math.max(3, Math.round(sd.vol*(0.05+(h32(code+'v')%200)/1000))); }
function feeOf(lv, code){ const sd = SIDO_DATA[code.slice(0,2)]; return lv==='sido' ? sd.fee : Math.max(8, sd.fee + (h32(code+'f')%30)-15); }

/* ══════════ 지도 ↔ 목록(표) 전환 · 시도/시군구/읍면동 필터 ══════════ */
let TF = {sido:'', sig:'', emd:''};          /* 표 필터 — 비우면 상위 전체 */
function setMapView(v){
  mapView = v;
  const mf = document.querySelector('.map-full'); if(!mf) return;
  mf.dataset.view = v;
  renderMktBars();                            /* 세그 활성 표시 갱신 */
  if(v==='table'){ renderTableFilters(); renderMapTable(); syncTableTop(); }
  else if(panMap && panMap.invalidateSize) setTimeout(()=>panMap.invalidateSize(), 60);
  if(typeof updateCrosshairTip === 'function') updateCrosshairTip();
}
/* PC 는 표가 절대배치라 검색기·전광판 카드 아래로 내려 준다 (카드 높이가 가변) */
function syncTableTop(){
  const t = document.getElementById('mapTable'), mf = document.querySelector('.map-full');
  if(!t || !mf || document.documentElement.classList.contains('m')) return;
  const box = mf.getBoundingClientRect();
  let b = box.top;
  ['.mf-tlwrap','.mf-stats'].forEach(s=>{ const el = document.querySelector(s); if(el) b = Math.max(b, el.getBoundingClientRect().bottom); });
  t.style.top = Math.round(b - box.top + 12) + 'px';
}
function tfSigList(sd){ return (sigBySido[sd]||[]).map(f=>({v:f.properties.SIG_CD, n:f.properties.SIG_KOR_NM})); }
function tfEmdList(sig){ return (emdBySig[sig]||[]).map(f=>({v:f.properties.EMD_CD, n:f.properties.EMD_KOR_NM})); }
function fillSel(el, list, ph, val){
  if(!el) return;
  el.innerHTML = '<option value="">'+ph+'</option>'
    + list.map(o=>'<option value="'+o.v+'"'+(o.v===val?' selected':'')+'>'+o.n+'</option>').join('');
}
function renderTableFilters(){
  const host = document.getElementById(M_UI ? 'rgnSelsM' : 'rgnSels');
  if(!host) return;
  host.innerHTML =
      rgnSelHtml('sido','시도', TF.sido, Object.keys(SIDO_DATA).map(cd=>({v:cd, n:SIDO_DATA[cd].full})), '시도 전체', false)
    + rgnSelHtml('sig','시군구', TF.sig, TF.sido ? tfSigList(TF.sido) : [], TF.sido ? '시군구 전체' : '시도를 먼저 골라주세요', !TF.sido)
    + rgnSelHtml('emd','읍면동', TF.emd, TF.sig ? tfEmdList(TF.sig) : [], TF.sig ? '읍면동 전체' : '시군구를 먼저 골라주세요', !TF.sig);
}
function tfChange(k, v){
  if(k==='sido'){ TF.sido = v; TF.sig = ''; TF.emd = ''; }
  else if(k==='sig'){ TF.sig = v; TF.emd = ''; }
  else { TF.emd = v; }
  /* 읍면동 목록은 7MB 라 시군구를 고른 시점에 지연 로드한다 */
  if(k==='sig' && v && !GEO.emd){ ensureEmdIndex(()=>{ renderTableFilters(); renderMapTable(); tfApplyToMap(); }); }
  renderTableFilters(); renderMapTable(); tfApplyToMap();
}
/* select 를 바꾸면 지도·패널도 그 지역으로 따라간다 */
let tfSyncing = false;
function tfApplyToMap(){
  if(tfSyncing || !panMap || panMap === 'loading') return;
  tfSyncing = true;
  try{
    if(TF.emd && emdBySig[TF.sig]){
      /* 읍면동 → 읍면동 레벨 */
      PANEL = {level:'emd', code:TF.emd};
      if(VIEW.level !== 'emd' || VIEW.sig !== TF.sig) enterEmdView(TF.sig); else { renderSel(); markRank(); }
    } else if(TF.sig){
      /* 시군구 → 시군구 레벨(시도 포커스) + 그 시군구로 이동 */
      PANEL = {level:'sig', code:TF.sig};
      if(VIEW.level !== 'sido' || VIEW.sido !== TF.sido) focusSidoView(TF.sido, true);
      renderSel(); markRank();
      flyRegion(bnds.sig[TF.sig], SIGUNGU_ZOOM + 0.25, null);
    } else if(TF.sido){
      /* 시도 → 시도 레벨을 유지한 채 그 시도로 확대·이동 (시군구를 펼치지 않는다) */
      if(VIEW.level !== 'nation') showNationView(true);
      PANEL = {level:'sido', code:TF.sido};
      renderSel(); markRank();
      flyRegion(bnds.sido[TF.sido], null, SIGUNGU_ZOOM - 0.25);
    } else {
      if(VIEW.level !== 'nation') showNationView(true);
      flyRegion(koreaBounds, null, null);
    }
  } finally { tfSyncing = false; }
}
/* 지역 bounds 로 비행 — minZ 는 최소 줌 보장, maxZ 는 그 이상 확대 금지(레벨 자동 전환 방지) */
function flyRegion(b, minZ, maxZ){
  if(!b || !panMap || panMap === 'loading') return;
  const o = fitPad();
  const pad = L.point(o.paddingTopLeft[0]+o.paddingBottomRight[0], o.paddingTopLeft[1]+o.paddingBottomRight[1]);
  let z = panMap.getBoundsZoom(b, false, pad);
  if(minZ != null) z = Math.max(z, minZ);
  if(maxZ != null) z = Math.min(z, maxZ);
  /* 줌은 패딩(플로팅 패널)을 고려해 정하되, 중심은 지역의 실제 중심으로 잡는다.
     조준점이 곧 선택이라, 패딩된 중심으로 가면 조준점이 옆 지역에 떨어진다 */
  const c = b.getCenter();
  suppressUntil = Date.now() + 1000;      /* 비행 중 줌 기반 레벨 전환 억제 */
  userMoved = false;
  panMap.flyTo(c, z, {duration:.6});
}

/* 반대 방향 — 지도·표에서 지역을 고르면 select 도 따라 바뀐다 */
function syncTFfromPanel(){
  if(tfSyncing || !PANEL.code) return;
  const c = PANEL.code, lv = PANEL.level;
  const next = lv==='sido' ? {sido:c, sig:'', emd:''}
             : lv==='sig'  ? {sido:c.slice(0,2), sig:c, emd:''}
             :               {sido:c.slice(0,2), sig:c.slice(0,5), emd:c};
  if(next.sido===TF.sido && next.sig===TF.sig && next.emd===TF.emd) return;
  TF = next;
  renderTableFilters();
}
function tableRows(){
  if(TF.emd) return [['emd', TF.emd]];
  if(TF.sig) return (emdBySig[TF.sig]||[]).map(f=>['emd', f.properties.EMD_CD]);
  if(TF.sido) return (sigBySido[TF.sido]||[]).map(f=>['sig', f.properties.SIG_CD]);
  return Object.keys(SIDO_DATA).map(cd=>['sido', cd]);
}
function renderMapTable(){
  const body = document.getElementById('mapTableBody'); if(!body) return;
  const rows = tableRows().map(([lv,c])=>({lv, c,
    n: lv==='sido' ? SIDO_DATA[c].full : nameOf(lv,c),
    p: mapValue('price',lv,c), net: mapValue('net',lv,c), vol: volOf(lv,c), fee: feeOf(lv,c)
  })).sort((a,b)=>b.p-a.p);
  body.innerHTML = rows.length ? rows.map((r,i)=>`
    <tr class="${(PANEL.level===r.lv&&PANEL.code===r.c)?'sel':''}" data-code="${r.c}"
      onmouseenter="tableRowHover('${r.lv}','${r.c}')" onclick="tableRowDrill('${r.lv}','${r.c}')">
      <td class="rk">${i+1}</td>
      <td class="nm">${r.n}</td>
      <td class="num">${Math.round(r.p).toLocaleString()}</td>
      <td class="num ${r.net>=0?'up':'down'}">${(r.net>=0?'+':'')+r.net.toFixed(1)}</td>
      <td class="num">${r.vol.toLocaleString()}</td>
      <td class="num">${r.fee.toLocaleString()}</td>
    </tr>`).join('')
    : '<tr><td colspan="6" class="mt-empty">표시할 지역이 없어요 — 필터를 확인해주세요.</td></tr>';
  if(typeof osUpdateFades === 'function') osUpdateFades();
}
/* 지도와 같은 규칙: 올리면 정보만 바뀌고, 클릭하면 그 하위 레벨로 들어간다 */
function tableRowHover(lv, c){
  if(PANEL.level===lv && PANEL.code===c) return;
  PANEL = {level:lv, code:c};
  renderSel(); markRank();
  document.querySelectorAll('#mapTableBody tr').forEach(tr=>tr.classList.toggle('sel', tr.dataset.code===c));
}
function tableRowDrill(lv, c){
  if(lv==='sido'){ tfChange('sido', c); return; }        /* 시도 → 그 시도의 시군구 목록 */
  if(lv==='sig'){ tfChange('sig', c); return; }          /* 시군구 → 그 시군구의 읍면동 목록 */
  tableRowHover(lv, c);                                   /* 읍면동은 더 내려갈 곳이 없다 */
}

/* ══════════ 모바일 탭 (지도 · 순위 · 정보 · 차트) ══════════ */
function mapTab(t){
  const mf = document.querySelector('.map-full'); if(!mf) return;
  mf.dataset.tab = t;
  document.querySelectorAll('#mapTabs .mt-item').forEach(b=>b.classList.toggle('on', b.dataset.tab===t));
  document.querySelectorAll('#page-map [data-pane]').forEach(el=>
    el.classList.toggle('pane-on', (el.dataset.pane||'').split(' ').indexOf(t)>-1));
  if(t==='map' && panMap && panMap.invalidateSize) setTimeout(()=>panMap.invalidateSize(), 80);
  if(t==='chart') setTimeout(initMapChart, 140);
  if(t==='rank' && typeof osUpdateFades === 'function') setTimeout(osUpdateFades, 60);
  if(typeof updateCrosshairTip === 'function') updateCrosshairTip();   /* 지도를 벗어나면 툴팁도 내린다 */
}

function panelSido(){ return SIDO_DATA[PANEL.code.slice(0,2)] || SIDO_DATA['11']; }
function renderSel(){
  const sd = panelSido();
  const price = mapMetricSafe('price');
  const net = mapMetricSafe('net');
  document.getElementById('sr-name').textContent = nameOf(PANEL.level, PANEL.code);
  document.getElementById('sr-price').innerHTML = Math.round(price).toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">원/kg</span>';
  document.getElementById('sr-net').innerHTML = (net>=0?'+':'')+net.toFixed(1)+'<span style="font-size:11px;font-weight:500;color:var(--sub)">%</span>';
  const volJit = volOf(PANEL.level, PANEL.code);
  const feeJit = feeOf(PANEL.level, PANEL.code);
  document.getElementById('sr-vol').innerHTML = volJit.toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">톤</span>';
  document.getElementById('sr-fee').innerHTML = feeJit.toLocaleString()+'<span style="font-size:11px;font-weight:500;color:var(--sub)">원/kg</span>';
  document.getElementById('sr-ch').textContent = sd.ch;
  const nets = Object.values(SIDO_DATA).map(x=>x.net).sort((a,b)=>b-a);
  const rank = nets.indexOf(sd.net)+1;
  document.getElementById('sr-badge').textContent = '순수익 '+rank+'위';
  document.getElementById('sr-badge').className = 'badge '+(rank<=3?'bg-ok':'bg-mut');
  if(typeof syncTFfromPanel === 'function') syncTFfromPanel();   /* 지역 select 연동 */
}
function mapMetricSafe(metric){ return mapValue(metric, PANEL.level, PANEL.code); }
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
  if(typeof osUpdateFades === 'function') osUpdateFades();
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
function pickItem(opt){ applySelPick(opt); curItem = opt.textContent.trim(); refreshAll(); toast('info', '"'+curItem+'" 기준으로 갱신했어요'); }
function pickDate(opt){ applySelPick(opt); curDate = opt.textContent.trim(); refreshAll(); toast('info', curDate+' 기준 시세로 갱신했어요'); }
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
  {id:'m01', t:'auction', n:'서울 가락동 농수산물도매시장', lat:37.4970, lng:127.1190, price:1290, vol:412, fee:7.0, dist:298, settle:'D+3', hours:'경매 20:00~04:00', best:true, tags:['최고 단가','대량 출하'], note:'전국 최대 규모. 상품 등급이 좋을수록 낙찰가 편차가 커요.'},
  {id:'m02', t:'auction', n:'서울 강서 농수산물도매시장', lat:37.5510, lng:126.8490, price:1268, vol:186, fee:7.0, dist:312, settle:'D+3', hours:'경매 21:00~03:00', tags:['수도권 서부'], note:'가락시장 대비 반입량이 적어 물량 소진이 빠른 편.'},
  {id:'m03', t:'auction', n:'구리 농수산물도매시장', lat:37.5940, lng:127.1420, price:1258, vol:143, fee:6.5, dist:305, settle:'D+3', hours:'경매 20:30~03:30', tags:['수수료 낮음'], note:'수도권 동북부 소비지 접근성이 좋아요.'},
  {id:'m04', t:'auction', n:'부산 엄궁동 농산물도매시장', lat:35.1420, lng:128.9760, price:1245, vol:128, fee:7.0, dist:186, settle:'D+3', hours:'경매 20:00~02:00', tags:['영남권'], note:'영남권 소비지 물량 집중.'},
  {id:'m05', t:'auction', n:'대구 북부 농수산물도매시장', lat:35.8950, lng:128.5570, price:1238, vol:145, fee:6.5, dist:98, settle:'D+3', hours:'경매 20:00~02:30', tags:['근거리','운송비 절감'], note:'청송에서 가까워 운송비 부담이 가장 적은 도매시장.'},
  {id:'m06', t:'auction', n:'대전 오정 농수산물도매시장', lat:36.3620, lng:127.4090, price:1230, vol:76, fee:6.5, dist:214, settle:'D+3', hours:'경매 20:00~02:00', tags:['중부권'], note:'중부권 분산 출하 시 활용.'},
  {id:'m07', t:'auction', n:'광주 각화동 농산물도매시장', lat:35.1720, lng:126.9330, price:1215, vol:87, fee:7.0, dist:306, settle:'D+3', hours:'경매 20:00~02:00', tags:['호남권'], note:'호남권 물량이 많아 단가 경쟁이 있는 편.'},
  {id:'m08', t:'apc', n:'청송 농협 산지유통센터(APC)', lat:36.4360, lng:129.0570, price:1180, vol:42, fee:3.0, dist:12, settle:'D+7', hours:'접수 08:00~17:00', best:true, tags:['계약 출하','물류 부담 없음'], note:'계약 물량은 고정가 정산. 시세 변동 위험을 줄이고 싶을 때 유리.'},
  {id:'m09', t:'apc', n:'안동 농협 통합 APC', lat:36.5680, lng:128.7290, price:1195, vol:58, fee:3.5, dist:48, settle:'D+7', hours:'접수 08:00~17:00', tags:['선별·저장 지원'], note:'저온저장 연계로 출하 시점 조절 가능.'},
  {id:'m10', t:'apc', n:'무안 양파 전문 APC', lat:34.9900, lng:126.4820, price:1210, vol:96, fee:3.0, dist:392, settle:'D+7', hours:'접수 08:00~18:00', tags:['양파 특화'], note:'양파 주산지 전문 선별 라인 보유.'},
  {id:'m11', t:'retail', n:'롯데마트 중부 물류센터', lat:36.8060, lng:127.1140, price:1340, vol:64, fee:9.0, dist:246, settle:'D+30', hours:'입고 06:00~15:00', tags:['고단가','정산 김'], note:'규격·선별 기준이 엄격하지만 단가가 높아요. 정산 주기 확인 필요.'},
  {id:'m12', t:'retail', n:'이마트 후레쉬센터', lat:37.2410, lng:127.1780, price:1352, vol:78, fee:9.5, dist:288, settle:'D+30', hours:'입고 05:00~14:00', tags:['고단가','대량 계약'], note:'연간 계약 물량 위주. 소량 출하는 어려울 수 있어요.'},
  {id:'m13', t:'retail', n:'하나로마트 대구 유통센터', lat:35.8420, lng:128.6320, price:1285, vol:52, fee:7.5, dist:104, settle:'D+15', hours:'입고 06:00~16:00', tags:['근거리','농협 계열'], note:'농협 계열로 경영체 실적 연계가 수월해요.'},
  {id:'m14', t:'online', n:'온라인 B2B 직거래 (식자재 유통)', lat:37.3980, lng:127.1080, price:1350, vol:36, fee:5.0, dist:290, settle:'D+7', hours:'상시 접수', best:true, tags:['최소 5톤','순수익 우수'], note:'중간 유통 단계가 짧아 순수익이 높지만 최소 물량 조건이 있어요.'},
  {id:'m15', t:'online', n:'로컬푸드 직매장 (경북권)', lat:36.0190, lng:129.3430, price:1420, vol:8, fee:12.0, dist:86, settle:'D+1', hours:'상시 접수', tags:['소량 가능','즉시 정산'], note:'단가는 높으나 물량이 적어 보조 판로로 적합.'}
];
let mkGroup = null, mkOn = true, selMk = null;
const mkRef = {};   /* id → Leaflet marker (즐겨찾기 → 지도 확대용) */

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
    mkRef[m.id] = mk;
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
  {type:'warn', tt:'원가 급증 감지 · 비료비', desc:'최근 30일 지출이 평년 대비 +18% 상승했어요. 상세 내역을 확인해보세요.', time:'오늘 09:12', unread:true, go:'dashboard'},
  {type:'ok', tt:'교육 이수증 수신 완료', desc:'농정원에서 수신되어 작성 중인 서류에 자동 첨부되었어요.', time:'2시간 전', unread:true, go:'docs'},
  {type:'info', tt:'분산 출하 시작일 안내', desc:'AI 추천 출하 기간(8/22~8/29)이 3일 후 시작돼요.', time:'어제', unread:false, go:'dashboard'},
  {type:'ok', tt:'데이터 영수증 신규 기록 2건', desc:'정책자금 신청서 자동 첨부에 마이데이터가 활용되었어요.', time:'어제', unread:false, go:'mypage'}
];
const N_STYLE = {
  warn:{bg:'var(--orange-bg)', svg:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M9 2L16.5 15.5H1.5L9 2Z" stroke="#E17A17" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7V10.5" stroke="#E17A17" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="13" r=".9" fill="#E17A17"/></svg>'},
  ok:{bg:'var(--g100)', svg:'<svg width="17" height="17" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.2" stroke="#0E7A46" stroke-width="1.2"/><path d="M3.5 6.2L5.3 8L8.5 4.5" stroke="#0E7A46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
  info:{bg:'var(--blue-bg)', svg:'<svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#2E6BD6" stroke-width="1.4"/><path d="M8 7.5V11" stroke="#2E6BD6" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".9" fill="#2E6BD6"/></svg>'}
};
function renderNotifs(){
  document.getElementById('notifList').innerHTML = NOTIFS.map((n,i)=>`
    <div class="notif-item${n.unread?' unread':''}" onclick="openNotif(${i})">
      <div class="notif-ic" style="background:${N_STYLE[n.type].bg}">${N_STYLE[n.type].svg}</div>
      <div style="flex:1;min-width:0">
        <div class="notif-tt">${n.tt}<span class="dot"></span></div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('');
  if(typeof osUpdateFades === 'function') osUpdateFades();
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
  toast('ok','모든 알림을 읽음으로 표시했어요');
}
document.addEventListener('click', closeNotif);
renderNotifs();

/* ══════════ 디자인시스템 — 세그먼트 탭 데모 ══════════ */
function dsSeg(btn){
  btn.parentElement.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b === btn); });
  toast('info', '"' + btn.textContent.trim() + '" 선택됨');
}

/* ══════════ 증빙 캡처 모드 (#cap=CAPTURE-XXX) — 자가진단 증빙용 상태 연출 ══════════ */
function capEnter(page){
  document.getElementById('loginPage').style.display='none';
  document.getElementById('appShell').classList.add('on');
  document.getElementById('fab').classList.remove('hidden');
  document.getElementById('chatPanel').classList.remove('hidden');
  nav(page||'mypage');
  /* 본문만 스크롤되는 구조이므로 캡처 시 활성 페이지를 상단으로 되돌린다 */
  osScrollTop(document.querySelector('.page.active'), 0);
}
/* scrollIntoView 는 이 환경(OverlayScrollbars 뷰포트)에서 어긋나므로 뷰포트 scrollTop 을 직접 계산 */
function capScroll(sel, align){
  setTimeout(()=>{
    const el = document.querySelector(sel); if(!el) return;
    const page = document.querySelector('.page.active');
    const OS = osApi(); const inst = OS && OS(page);
    const vp = inst ? inst.elements().viewport : page;
    let y = el.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop;
    if(align === 'center') y -= Math.max(0, (vp.clientHeight - el.offsetHeight)/2);
    vp.scrollTop = Math.max(0, y - 12);
  }, 380);
}
const CAPTURE_STATES = {
  'CAPTURE-001': ()=>{ capEnter(); askConsent('mois'); },
  'CAPTURE-002': ()=>{ capEnter(); askConsent('mois'); showTerms('mois',0); },
  'CAPTURE-003': ()=>{ capEnter(); askConsent('mois'); document.querySelectorAll('#consentModal .md-item').forEach(e=>e.classList.add('open')); mdAllToggle(true); },
  'CAPTURE-004': ()=>{ capEnter(); },
  'CAPTURE-005': ()=>{ capEnter(); connOpen['epis']=true; connOpen['kplus']=true; CONNS.find(c=>c.id==='kplus').items[2].on=false; renderConns(); },
  'CAPTURE-006': ()=>{ capEnter(); askRevoke('kplus','법인 신용정보'); },
  'CAPTURE-007': ()=>{ capEnter(); openModal('quitModal'); },
  'CAPTURE-008': ()=>{ capEnter(); const el=document.querySelector('[data-capture="CAPTURE-008"]'); if(el) el.scrollIntoView({block:'center'}); },
  'CAPTURE-009': ()=>{ capEnter(); openDownload(); },
  'CAPTURE-009B': ()=>{ capEnter(); openDownload(); setTimeout(()=>doDownload(), 300); },
  'CAPTURE-010': ()=>{ capEnter(); openShare(); },
  'CAPTURE-011': ()=>{ capEnter(); openShare(); setTimeout(()=>shareNext(), 300); },
  'CAPTURE-011B': ()=>{ capEnter(); openShare(); setTimeout(()=>{ shareNext(); setTimeout(()=>shareNext(), 200); }, 300); },
  'CAPTURE-012': ()=>{ capEnter(); const el=document.querySelector('[data-capture="CAPTURE-012"]'); if(el) el.scrollIntoView({block:'start'}); },
  'CAPTURE-013': ()=>{ capEnter(); openReceipt('RCPT-U-260819-014'); },
  'CAPTURE-001B': ()=>{ capEnter(); askConsent('kplus'); },
  'CAPTURE-009C': ()=>{ capEnter(); openDownload(); setTimeout(()=>{ const h=document.querySelector('#dlModal .help-q'); if(h){ h.classList.add('force'); positionHelpTip(h); } }, 300); },
  /* ── 화면설계서 v3.0 화면 ID 기준 증빙 상태 ── */
  'CNS-01': ()=>{ capEnter(); mdwOpen(); },
  'CNS-02': ()=>{ capEnter(); mdwOpen(); mdwGo(1); },
  'CNS-03': ()=>{ capEnter(); mdwOpen(); mdwGo(2); },
  'CNS-04': ()=>{ capEnter(); purOpen(0); },
  'CNS-05': ()=>{ capEnter(); purOpen(1); },
  'CNS-06': ()=>{ capEnter(); mdwOpen(); mdwStep=5; mdwRender(); },
  'CNS-07': ()=>{ capEnter(); mdwOpen(); mdwGo(6); },
  'CMG-01': ()=>{ capEnter(); capScroll('[data-capture="CAPTURE-004"]'); },
  'CMG-02': ()=>{ capEnter(); PURPOSES[1].on=false; renderPurposes(); capScroll('[data-capture="CMG-02"]'); },
  'CMG-03': ()=>{ capEnter(); openWithdraw(); setTimeout(()=>{ const c=document.querySelector('#wdModal .wd-chk'); if(c) c.checked=true; }, 250); },
  'CMG-04': ()=>{ capEnter(); openModal('quitModal'); },
  'DLD-01': ()=>{ capEnter(); capScroll('[data-capture="CAPTURE-008"]','center'); },
  'DLD-02': ()=>{ capEnter(); openDownload(); },
  'DLD-03': ()=>{ capEnter(); openDownload(); setTimeout(()=>doDownload(), 300); },
  'SHR-01': ()=>{ capEnter(); openShare(); },
  'SHR-03': ()=>{ capEnter(); openShare(); setTimeout(()=>shareNext(), 300); },
  'SHR-04': ()=>{ capEnter(); openShare(); setTimeout(()=>{ shareNext(); setTimeout(()=>shareNext(), 200); }, 300); },
  'USE-01': ()=>{ capEnter(); capScroll('[data-capture="CAPTURE-012"]'); },
  'USE-02': ()=>{ capEnter(); rcptFilter='consent'; renderReceipts(); capScroll('[data-capture="CAPTURE-012"]'); },
  'USE-03': ()=>{ capEnter(); openReceipt('RCPT-U-260819-014'); },
  'USE-04': ()=>{ capEnter(); openTrace(); },
  'USE-05': ()=>{ capEnter(); openRealname(); },
  'DOC-01': ()=>{ capEnter('docs'); goDocView('s2'); },
  'ACC-01': ()=>{ PURPOSES[1].on=false; capEnter('docs'); goDocView('s1'); },
};
(function(){
  const m = location.hash.match(/cap=([A-Z0-9-]+)/);
  if(m && CAPTURE_STATES[m[1]]){
    document.documentElement.classList.add('cap-mode');
    setTimeout(()=>CAPTURE_STATES[m[1]](), 200);
  }
})();

/* ══════════ 오버레이 스크롤바 ══════════
   네이티브 스크롤바는 표시될 때 가로 폭을 잠식해 레이아웃이 흔들린다.
   OverlayScrollbars 로 콘텐츠 위에 겹쳐 그려 폭 변화를 없애고,
   스크롤 중 또는 스크롤바 영역 hover 시에만 보이게 한다. */
const OS_OPT = {
  scrollbars:{ theme:'os-theme-agri', autoHide:'never', clickScroll:true },
  overflow:{ x:'hidden', y:'scroll' }
};
const OS_HIDE_DELAY = 900;   /* 스크롤이 멈춘 뒤 숨기기까지 */
const OS_EDGE = 22;          /* 스크롤바로 인식하는 우측 가장자리 폭(px) */
/* 브라우저 번들은 OverlayScrollbarsGlobal 네임스페이스로 노출된다 */
function osApi(){
  const g = window.OverlayScrollbarsGlobal;
  return (g && g.OverlayScrollbars) || window.OverlayScrollbars || null;
}
function osInit(el, opt){
  const OS = osApi();
  if(!el || !OS) return null;
  if(OS(el)) return OS(el);                                 /* 중복 초기화 방지 */
  const inst = OS(el, opt || OS_OPT);
  osBindReveal(el, inst);
  if(el.hasAttribute('data-fade')) osBindFade(el, inst);
  return inst;
}
/* 스크롤 어포던스: 위/아래로 더 볼 내용이 있으면 그 방향에 페이드를 켠다 */
var OS_FADES = [];            /* 초기 렌더가 선행될 수 있어 호이스팅되는 var 사용 */
function osBindFade(host, inst){
  const vp = inst.elements().viewport;
  host.classList.add('osfade');
  const upd = ()=>{
    const max = vp.scrollHeight - vp.clientHeight;
    const t = vp.scrollTop;
    host.classList.toggle('fade-top', max > 4 && t > 4);
    host.classList.toggle('fade-bot', max > 4 && t < max - 4);
  };
  vp.addEventListener('scroll', upd, {passive:true});
  if(typeof inst.on === 'function'){ inst.on('scroll', upd); inst.on('updated', upd); }
  OS_FADES.push(upd);
  upd();
}
/* OverlayScrollbars 없이 페이드만 — 스크롤러 자신이 아니라 부모(고정)에 페이드를 얹는다.
   (스크롤러에 얹으면 ::before/::after 가 콘텐츠와 함께 스크롤돼 버린다) */
function bindPlainFade(scroller, host){
  if(!scroller || scroller.dataset.pfade) return;
  scroller.dataset.pfade = '1';
  host = host || scroller.parentElement;
  if(!host) return;
  host.classList.add('osfade');
  const upd = ()=>{
    const max = scroller.scrollHeight - scroller.clientHeight, t = scroller.scrollTop;
    host.classList.toggle('fade-top', max > 4 && t > 4);
    host.classList.toggle('fade-bot', max > 4 && t < max - 4);
  };
  scroller.addEventListener('scroll', upd, {passive:true});
  OS_FADES.push(upd);
  upd();
}
/* 목록을 다시 그린 뒤 호출 (콘텐츠 높이가 바뀌므로) */
function osUpdateFades(){ (OS_FADES||[]).forEach(f=>{ try{ f(); }catch(e){} }); }
/* 스크롤 중 또는 스크롤바 영역 hover 시에만 스크롤바를 노출한다 */
function osBindReveal(host, inst){
  const els = inst.elements();
  const vp = els.viewport;
  const bars = [els.scrollbarVertical, els.scrollbarHorizontal]
    .filter(Boolean).map(b=>b.scrollbar).filter(Boolean);
  if(!bars.length) return;
  let hideTimer = 0, nearEdge = false;
  const show = ()=>bars.forEach(b=>b.classList.add('is-shown'));
  const hide = ()=>{ if(!nearEdge) bars.forEach(b=>b.classList.remove('is-shown')); };
  const flash = ()=>{ show(); clearTimeout(hideTimer); hideTimer = setTimeout(hide, OS_HIDE_DELAY); };
  vp.addEventListener('scroll', flash, {passive:true});
  if(els.scrollEventElement && els.scrollEventElement !== vp) els.scrollEventElement.addEventListener('scroll', flash, {passive:true});
  if(typeof inst.on === 'function') inst.on('scroll', flash);   /* 라이브러리 이벤트로 보강 */
  host.addEventListener('mousemove', e=>{
    const r = host.getBoundingClientRect();
    const near = (r.right - e.clientX) <= OS_EDGE;
    if(near === nearEdge) return;
    nearEdge = near;
    if(near){ clearTimeout(hideTimer); show(); }
    else { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 200); }
  });
  host.addEventListener('mouseleave', ()=>{ nearEdge = false; clearTimeout(hideTimer); hideTimer = setTimeout(hide, 200); });
  /* 스크롤바 자체에 커서가 올라가 있는 동안은 계속 표시 */
  bars.forEach(b=>{
    b.addEventListener('mouseenter', ()=>{ nearEdge = true; clearTimeout(hideTimer); show(); });
    b.addEventListener('mouseleave', ()=>{ nearEdge = false; hideTimer = setTimeout(hide, 200); });
  });
}
/* 실제 스크롤되는 엘리먼트 (OverlayScrollbars 적용 시 내부 viewport) */
function osScroller(el){
  if(!el) return null;
  const OS = osApi();
  const inst = OS && OS(el);
  return inst ? inst.elements().viewport : el;
}
function osScrollTop(el, v){ const s = osScroller(el); if(s) s.scrollTop = v; }
function initScrollAreas(){
  if(!osApi()) return;
  document.querySelectorAll('.page').forEach(p=>osInit(p));
  /* innerHTML 이 통째로 교체되는 영역은 바깥 래퍼를 스크롤 호스트로 삼는다
     (호스트를 직접 교체하면 라이브러리가 만든 viewport 구조가 사라진다) */
  ['rcptScroll','rankScroll','termsScrollBody','rcptScrollBody','notifScroll'].forEach(id=>osInit(document.getElementById(id)));
  /* OverlayScrollbars 를 씌우면 DOM 이 재구성돼 레이아웃이 깨지는 목록은 평범한 스크롤 + 페이드로 */
  bindPlainFade(document.getElementById('mktSearchList'));
  bindPlainFade(document.getElementById('dsScrollDemo'));
  document.querySelectorAll('.mt-scroll').forEach(el=>bindPlainFade(el));
  document.querySelectorAll('.md-body').forEach(el=>osInit(el));
}
initScrollAreas();

/* ══════════ Help 툴팁 위치 ══════════
   스크롤 컨테이너(overflow:hidden)에 잘리지 않도록 position:fixed 로 띄우고,
   아이콘 기준 상단 중앙에 오도록 좌표를 직접 계산한다. 화면 밖으로 나가면 안쪽으로 보정. */
function positionHelpTip(q){
  const tip = q && q.querySelector('.tip');
  if(!tip) return;
  const r = q.getBoundingClientRect();
  const w = tip.offsetWidth, h = tip.offsetHeight, pad = 10;
  let x = r.left + r.width/2;
  x = Math.max(w/2 + pad, Math.min(x, window.innerWidth - w/2 - pad));
  let y = r.top - h - 9;
  if(y < pad) y = r.bottom + 9;              /* 위가 좁으면 아래로 */
  tip.style.left = Math.round(x) + 'px';
  tip.style.top  = Math.round(y) + 'px';
}
document.addEventListener('mouseover', e=>{
  const q = e.target.closest && e.target.closest('.help-q,.trust-b');
  if(q) positionHelpTip(q);
});


/* ══════════ 모바일(/mobile · ?m=1) 보정 ══════════ */
(function(){
  if(!document.documentElement.classList.contains('m')) return;
  /* 조준점을 지도 컨테이너 안으로 옮겨 세로 플로우에서도 지도 위에 겹쳐 보이게 한다.
     (지역명·판로 토글은 상시표시로 바뀌어 버튼 자체를 쓰지 않는다) */
  const pan = document.getElementById('panMap');
  const ch = document.getElementById('crosshair');
  if(ch) ch.remove();               /* 모바일은 조준점 자체를 쓰지 않는다 */
  /* 보기 전환 아이콘은 지도 우측 하단에 얹는다 */
  const fab = document.getElementById('mapViewFab');
  if(pan && fab) pan.appendChild(fab);
  mapTab('map');                     /* 첫 진입은 지도 탭 */
})();
