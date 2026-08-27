/* ═══════════════════════════════════════════════════════════════
   agriG 모바일 UX Flow 프로토타입 (html.m 전용)
   - 목적: 실기능이 아니라 "모바일에서의 입력 순서·화면 전환·정보 노출" 검증
   - 데이터는 전부 Mock + 로컬 state. PC 플로우(app.js)는 건드리지 않는다.
   구성:
   ① 전체 메뉴 — 탭바 '전체' → 바둑판 그리드 (사이드바 대체)
   ② 몰입 모드 — 프로세스 진행 중 헤더·탭바 숨김, 좌상단 취소/이전
   ③ 행정서류 작성 6단계 플로우 (한 화면 = 한 질문)
   ④ 내려받기·공유 바텀시트의 단계형 분할 (Progressive Disclosure)
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var M = document.documentElement.classList.contains('m');
var CAP = document.documentElement.classList.contains('cap-mode');
if(!M) return;   /* PC에는 아무 영향도 주지 않는다 */

/* ══════════ ① 전체 메뉴 (바둑판) ══════════ */
var AM_SVC = [
  {nav:'dashboard', n:'대시보드',   d:'시세 · 예측 · 오늘 할 일', bg:'var(--g100)',    ic:'<rect x="2.5" y="2.5" width="5.5" height="7" rx="1.2"/><rect x="10" y="2.5" width="5.5" height="4.5" rx="1.2"/><rect x="10" y="9" width="5.5" height="6.5" rx="1.2"/><rect x="2.5" y="11.5" width="5.5" height="4" rx="1.2"/>', c:'#0E7A46'},
  {nav:'chatbot',   n:'AI 챗봇',    d:'출하 시기 · 판로 상담', bg:'var(--blue-bg)', ic:'<path d="M9 2.5C5.1 2.5 2 5 2 8.2C2 10.2 3.2 12 5.1 13L4.4 15.7C4.3 16 4.6 16.2 4.9 16L8.2 13.9C8.5 13.9 8.7 14 9 14C12.9 14 16 11.4 16 8.2C16 5 12.9 2.5 9 2.5Z"/>', c:'#2E6BD6'},
  {nav:'map',       n:'판로 지도',  d:'전국 경락가 · 판로 찾기', bg:'var(--orange-bg)', ic:'<path d="M9 16C9 16 14.5 11.5 14.5 7.5C14.5 4.5 12 2 9 2C6 2 3.5 4.5 3.5 7.5C3.5 11.5 9 16 9 16Z"/><circle cx="9" cy="7.5" r="2"/>', c:'#E17A17'},
  {nav:'docs',      n:'행정서류',   d:'서식 자동 작성 · 내 서류함', bg:'var(--g100)', ic:'<path d="M4 2.5H11L14.5 6V15.5H4V2.5Z"/><path d="M11 2.5V6H14.5"/><path d="M6.5 9.5H12M6.5 12H12"/>', c:'#0E7A46'},
  {nav:'mypage',    n:'마이페이지', d:'동의 · 영수증 · 내려받기', bg:'var(--blue-bg)', ic:'<circle cx="9" cy="6" r="3"/><path d="M3.5 15.5C3.5 12.7 6 11 9 11C12 11 14.5 12.7 14.5 15.5"/>', c:'#2E6BD6'},
  {nav:'design',    n:'디자인시스템', d:'컴포넌트 데모', bg:'#EFEAFB', ic:'<circle cx="9" cy="9" r="6.5"/><path d="M9 2.5C9 2.5 11.5 5.5 11.5 9C11.5 12.5 9 15.5 9 15.5"/><path d="M2.8 7H15.2M2.8 11H15.2"/>', c:'#6D4FC4'},
];
var AM_QUICK = [
  {fn:'mdwOpen',      n:'내 자료 가져오기', d:'마이데이터 전송요구'},
  {fn:'amRcpt',       n:'데이터 영수증',    d:'이용내역 확인'},
  {fn:'openDownload', n:'내 데이터 내려받기', d:'파일로 저장'},
  {fn:'openShare',    n:'제3자 선별 공유',  d:'원하는 곳에만 보내기'},
  {fn:'openRealname', n:'실명 사용 기록',   d:'이름·주소 사용 내역'},
  {fn:'openTrace',    n:'AI 상담 근거',     d:'답변 근거 역추적'},
];
function svgWrap(paths, color){
  return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="'+color+'" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">'+paths+'</svg>';
}
function renderAllMenu(){
  var svc = document.getElementById('amSvc'); if(!svc) return;
  svc.innerHTML = AM_SVC.map(function(s){
    return '<button class="am-cell" data-nav="'+s.nav+'" onclick="amGo(\''+s.nav+'\')">'
      +'<div class="ic" style="background:'+s.bg+'">'+svgWrap(s.ic, s.c)+'</div>'
      +'<b>'+s.n+'</b><span>'+s.d+'</span></button>';
  }).join('');
  /* 자주 쓰는 기능은 바둑판이 아니라 ROW 리스트로 */
  var qk = document.getElementById('amQuick');
  qk.className = 'am-rows';
  qk.innerHTML = AM_QUICK.map(function(q){
    return '<button class="am-row" onclick="amRun(\''+q.fn+'\')">'
      +'<b>'+q.n+'</b><span>'+q.d+'</span>'
      +'<svg width="7" height="12" viewBox="0 0 8 12" fill="none"><path d="M1.5 1.5L6 6L1.5 10.5" stroke="#C2C9C4" stroke-width="1.6" stroke-linecap="round"/></svg></button>';
  }).join('');
}
window.toggleAllMenu = function(force){
  var el = document.getElementById('allMenu');
  var open = (force === undefined) ? !el.classList.contains('open') : !!force;
  el.classList.toggle('open', open);
  /* '전체' 탭 활성 표시 — 닫으면 현재 페이지 탭으로 복원 */
  document.getElementById('tbAll').classList.toggle('active', open);
  if(open){
    renderAllMenu();
    document.querySelectorAll('#amSvc .am-cell').forEach(function(c){
      c.classList.toggle('now', c.dataset.nav === window.currentPage);
    });
    document.querySelectorAll('.tb-item[data-nav]').forEach(function(b){ b.classList.remove('active'); });
  } else {
    document.querySelectorAll('.tb-item[data-nav]').forEach(function(b){
      b.classList.toggle('active', b.dataset.nav === window.currentPage);
    });
  }
};
window.amGo = function(page){ toggleAllMenu(false); nav(page); };
window.amRun = function(fn){
  toggleAllMenu(false);
  if(fn === 'amRcpt'){ nav('mypage'); msubOpen('rcpt'); return; }
  if(typeof window[fn] === 'function') window[fn]();
};
/* 탭으로 페이지 이동 시 전체 메뉴가 열려 있으면 닫는다 */
var _nav = window.nav;
window.nav = function(id){
  var am = document.getElementById('allMenu');
  if(am && am.classList.contains('open')) toggleAllMenu(false);
  _nav(id);
};

/* ══════════ ② 몰입 모드 ══════════
   토스처럼 "무언가를 진행 중"일 때는 상단 헤더·하단 탭바를 치워 화면을 넓게 쓰고,
   끝나면 기본 UI 를 복구한다. 대상: 몰입 플로우 · 모든 바텀시트(모달) · 챗봇 패널 */
/* 규칙: 2단계 이상 '프로세스'(풀스크린)만 기본 UI 를 숨기고 좌상단 뒤로가기.
   1단계 조회성 팝업(영수증·근거·기록·약관 등)은 바텀시트 — X/배경 클릭으로 닫고 기본 UI 유지 */
function syncFocus(){
  var busy = document.querySelector('.overlay.open.fullpage')
    || document.querySelector('.chat-panel.open')
    || document.querySelector('.mdoc.on');            /* 몰입 플로우 + 기능 서브페이지 */
  document.documentElement.classList.toggle('focus', !!busy);
}
function focusOn(){ syncFocus(); }
function focusOff(){ syncFocus(); }
if(!CAP){
  /* 열림/닫힘 경로가 여러 곳(openModal · 배경 클릭 · X 버튼)이라 클래스 변화를 직접 감시 */
  var mo = new MutationObserver(syncFocus);
  document.querySelectorAll('.overlay, .chat-panel').forEach(function(el){
    mo.observe(el, {attributes:true, attributeFilter:['class']});
  });
}

/* ══════════ ③ 행정서류 작성 — 몰입형 6단계 플로우 ══════════ */
/* Mock 데이터 — 실데이터·API 없이 로컬 state로만 동작 */
var MDOC_TPLS = [
  {n:'농업경영회생자금 신청서', org:'농림축산식품부', auto:'7/8 자동'},
  {n:'면세유 배정 신청서',      org:'지역 농협',       auto:'6/7 자동'},
  {n:'농업경영체 변경 신고서',  org:'국립농산물품질관리원', auto:'8/9 자동'},
  {n:'재해보험 가입 신청서',    org:'지역 농협 · NH손해보험', auto:'5/8 자동'},
];
var MDOC_LOADS = ['간편인증 본인 확인', '농정원 경영체 정보 조회', '국세청 증빙 서류 수신', '서식에 자동 기입'];
var MDOC_FIELDS = [
  {l:'성명 / 법인명',       v:'김농가',                     src:'자동 · 간편인증', real:true},
  {l:'농업경영체 등록번호', v:'1234-5678-9012',             src:'자동 · 농정원'},
  {l:'사업자등록번호',      v:'123-45-67890',               src:'자동 · 공공마이데이터'},
  {l:'주소 (농지 소재지)',  v:'경상북도 청송군 청송읍 ○○리 123', src:'자동 · 농정원', real:true},
  {l:'재배 품목 · 면적',    v:'양파 · 1.2 ha (노지)',       src:'자동 · 농정원'},
  {l:'전년도 출하 실적',    v:'96톤 · 118,400천원',         src:'자동 · 유통 데이터'},
  {l:'의무교육 이수 여부',  v:'이수 완료 (2026-03-14)',     src:'자동 · 농업교육포털'},
];
var MDOC_EVID = [
  {n:'농업경영체 등록확인서', org:'공공마이데이터 (농림축산식품부)', ok:true},
  {n:'사업자등록증명',        org:'공공마이데이터 (국세청)', ok:true},
  {n:'소득금액증명',          org:'공공마이데이터 (국세청)', ok:true},
  {n:'교육 이수증',           org:'농정원 (농업교육포털)', ok:false},
];
var mdoc = {step:0, tpl:-1, phone:'', loaded:false};
var MDOC_TITLES = ['서식 고르기','내 자료 불러오기','자동입력 확인','연락처 입력','증빙 서류 확인','최종 확인','완료'];

window.mdocStart = function(){
  mdoc = {step:0, tpl:-1, phone:'', loaded:false};
  document.getElementById('mdoc').classList.add('on');
  focusOn();
  mdocRender();
};
window.mdocExit = function(){
  document.getElementById('mdoc').classList.remove('on');
  focusOff();
  if(mdoc.step < 6) toast('info','서류 작성을 중단했어요 — 언제든 다시 시작할 수 있어요');
  /* 종료 후 기본 UI(행정서류 홈)로 복귀 */
  if(window.currentPage === 'docs' && typeof goDocView === 'function') _goDocView('home');
};
window.mdocPrev = function(){
  if(mdoc.step <= 0) return;
  if(mdoc.step === 2) mdoc.loaded = false;   /* 불러오기 화면은 처음부터 다시 */
  mdoc.step--;
  mdocRender();
};
window.mdocNext = function(){
  /* 단계별 검증 (프로토타입 — 최소한만) */
  if(mdoc.step === 0 && mdoc.tpl < 0){ toast('err','서식을 하나 골라주세요'); return; }
  if(mdoc.step === 3){
    var v = (document.getElementById('mdocPhone')||{}).value || '';
    if(v.replace(/[^0-9]/g,'').length < 10){ toast('err','휴대전화 번호를 확인해주세요'); return; }
    mdoc.phone = v;
  }
  mdoc.step++;
  mdocRender();
};
window.mdocPickTpl = function(i){
  mdoc.tpl = i;
  document.querySelectorAll('#mdocBody .mtpl').forEach(function(el,j){ el.classList.toggle('sel', j===i); });
  /* 선택 즉시 다음 단계로 — 탭 수 최소화 */
  setTimeout(mdocNext, 220);
};
function mdocRender(){
  var s = mdoc.step;
  var tplName = mdoc.tpl >= 0 ? MDOC_TPLS[mdoc.tpl].n : '';
  document.getElementById('mdocTitle').textContent = s >= 6 ? (tplName || MDOC_TITLES[s]) : MDOC_TITLES[s];
  document.getElementById('mdocStep').textContent = s >= 6 ? '완료' : (s+1)+' / 6';
  document.getElementById('mdocBar').style.width = s >= 6 ? '100%' : Math.round((s+1)/6*100)+'%';
  document.getElementById('mdocBack').classList.toggle('hidden', s===0 || s>=6);
  document.getElementById('mdocX').classList.toggle('hidden', s>=6);
  var body = document.getElementById('mdocBody');
  var foot = document.getElementById('mdocFoot');
  var h = '';

  if(s === 0){
    h = '<div class="mstep-in"><div class="mq">어떤 서류를<br>만들까요?</div>'
      + '<div class="mq-sub">고르면 내 자료로 자동으로 채워 드려요.</div>'
      + MDOC_TPLS.map(function(t,i){
          return '<button class="trow" onclick="mdocPickTpl('+i+')">'
            + '<div style="width:42px;height:42px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;flex-shrink:0">'
            + svgWrap('<path d="M4 2.5H11L14.5 6V15.5H4V2.5Z"/><path d="M6.5 9.5H12M6.5 12H12"/>', '#0E7A46') + '</div>'
            + '<div class="tl"><b>'+t.n+'</b><span>'+t.org+'</span></div>'
            + '<div class="tr"><span class="badge bg-ok">'+t.auto+'</span>'
            + '<svg width="7" height="12" viewBox="0 0 8 12" fill="none"><path d="M1.5 1.5L6 6L1.5 10.5" stroke="#C2C9C4" stroke-width="1.6" stroke-linecap="round"/></svg></div></button>';
        }).join('')
      + '<div class="tcap">목록에 없는 서식은 <b>PC에서 파일 업로드 → AI 변환</b>으로 만들 수 있어요.</div></div>';
    foot.innerHTML = '';
  }

  else if(s === 1){
    h = '<div class="mstep-in"><div class="mq" id="mdocLoadTitle">서류에 필요한 자료를<br>가져오고 있어요</div>'
      + '<div class="mq-sub" id="mdocLoadSub">'+tplName+'에 쓸 자료만 실시간으로 조회해요. 서버에는 저장하지 않아요.</div>'
      + '<div id="mdocLoads">'
      + MDOC_LOADS.map(function(t,i){
          return '<div class="trow" id="mload'+i+'"><div class="tl"><b style="font-size:15.5px;font-weight:600;color:var(--mut)">'+t+'</b></div><div class="tr"></div></div>';
        }).join('')
      + '</div>'
      + '<div class="tcap">🔒 서류를 만드는 동안만 <b>이름·주소를 잠시 사용</b>해요. 기록은 [데이터 영수증 › 실명 사용 기록]에 남아요.</div></div>';
    foot.innerHTML = '<button class="btn btn-pri" id="mdocLoadBtn" disabled>가져오는 중…</button>';
  }

  else if(s === 2){
    h = '<div class="mstep-in"><div class="mq">자동으로 채운 내용이<br>맞는지 확인해주세요</div>'
      + '<div class="mq-sub">'+MDOC_FIELDS.length+'개 항목을 내 자료로 채웠어요.</div>'
      + MDOC_FIELDS.map(function(f){
          return '<div class="tfield"><div class="fl"><span>'+f.l+'</span>'
            + '<span class="bd">'
            + (f.real?'<span class="pl pl-real" style="font-size:9.5px">실명</span>':'')
            + '<span class="badge bg-ok" style="font-size:10px">'+f.src+'</span>'
            + '</span></div><div class="fv">'+f.v+'</div></div>';
        }).join('')
      + '<div class="tcap">값이 다르면 지금은 그대로 두고, 만든 서류에서 직접 고칠 수 있어요.</div></div>';
    foot.innerHTML = '<button class="btn btn-pri" onclick="mdocNext()">맞아요, 다음</button>';
  }

  else if(s === 3){
    h = '<div class="mstep-in"><div class="mq">연락처를 입력해주세요</div>'
      + '<div class="mq-sub">자동으로 채우지 못한 마지막 1개 항목이에요. 심사 결과 안내에 쓰여요.</div>'
      + '<input class="tinput" id="mdocPhone" type="tel" inputmode="numeric" placeholder="010-0000-0000" value="'+mdoc.phone+'">'
      + '<div class="tcap">입력한 번호는 이 서류에만 쓰이고 저장되지 않아요.</div></div>';
    foot.innerHTML = '<button class="btn btn-pri" onclick="mdocNext()">다음</button>';
    setTimeout(function(){ var i=document.getElementById('mdocPhone'); if(i) i.focus(); }, 350);
  }

  else if(s === 4){
    h = '<div class="mstep-in"><div class="mq">증빙 서류는<br>자동으로 첨부돼요</div>'
      + '<div class="mq-sub">본인 동의로 기관에서 직접 받아왔어요.</div>'
      + MDOC_EVID.map(function(e){
          return '<div class="trow"><div class="tl"><b style="font-size:15.5px">'+e.n+'</b><span>'+e.org+'</span></div>'
            + '<div class="tr">'
            + (e.ok
               ? '<span style="display:flex;align-items:center;gap:5px;color:var(--g700);font-size:13px;font-weight:800"><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.8 9L10 3.5" stroke="#0A5C36" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>수신 완료</span>'
               : '<span style="color:var(--orange-t);font-size:13px;font-weight:800">수신 대기</span>')
            + '</div></div>';
        }).join('')
      + '<div class="tcap">대기 중인 서류는 도착하는 대로 자동 첨부돼요.</div></div>';
    foot.innerHTML = '<button class="btn btn-pri" onclick="mdocNext()">확인했어요, 다음</button>';
  }

  else if(s === 5){
    var sumRows = [
      ['서류', tplName],
      ['자동입력', MDOC_FIELDS.length+'개 항목 · 실시간 조회'],
      ['직접 입력', '연락처 '+(mdoc.phone||'010-****-0000')],
      ['증빙 첨부', '3부 · 1부 수신 시 자동 첨부'],
      ['보관 위치', '내 서류함 (이 기기)'],
    ];
    h = '<div class="mstep-in"><div class="mq">이대로 서류를<br>만들까요?</div>'
      + '<div class="mq-sub">확정하면 PDF가 생성되고 시점확인(TSA)과 전자서명이 적용돼요.</div>'
      + sumRows.map(function(r){
          return '<div class="trow"><div class="tl"><span style="font-size:14px;color:var(--sub)">'+r[0]+'</span></div>'
            + '<div class="tr" style="max-width:62%"><b style="font-size:15px;text-align:right;letter-spacing:-.2px">'+r[1]+'</b></div></div>';
        }).join('')
      + '<div class="tcap">이번 작성에 활용된 마이데이터 내역은 <b>데이터 영수증</b>에 기록돼요.</div></div>';
    foot.innerHTML = '<button class="btn btn-pri" onclick="mdocNext()">확정하고 PDF 만들기</button>';
  }

  else {
    var now = new Date(); var p = function(n){ return String(n).padStart(2,'0'); };
    var stamp = now.getFullYear()+'-'+p(now.getMonth()+1)+'-'+p(now.getDate())+' '+p(now.getHours())+':'+p(now.getMinutes());
    var doneRows = [
      ['문서 번호', 'DOC-'+now.getFullYear()+p(now.getMonth()+1)+p(now.getDate())+'-0001'],
      ['생성 시각', stamp],
      ['시점확인', '<span style="color:var(--g700)">TSA 적용 · 검증 가능</span>'],
      ['전자서명', '시스템 서명 (PAdES)'],
    ];
    h = '<div class="mstep-in" style="padding-top:22px">'
      + '<div style="text-align:center"><div class="done-mini" style="width:64px;height:64px"><svg width="30" height="30" viewBox="0 0 38 38" fill="none"><path d="M8 20L16 28L30 11" stroke="#0E7A46" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      + '<div style="font-size:22px;font-weight:900;margin-top:10px">서류가 생성되었어요</div>'
      + '<div style="font-size:14px;color:var(--sub);margin-top:5px">'+tplName+'</div></div>'
      + '<div style="margin-top:22px">'
      + doneRows.map(function(r){
          return '<div class="trow"><div class="tl"><span style="font-size:14px;color:var(--sub)">'+r[0]+'</span></div>'
            + '<div class="tr"><b style="font-size:15px">'+r[1]+'</b></div></div>';
        }).join('') + '</div>'
      + '<div class="tcap" style="text-align:center">제출은 접수기관 방문·우편 또는 온라인 접수처에서 진행해주세요.</div></div>';
    foot.innerHTML = '<button class="btn btn-neu" onclick="toast(\'ok\',\'보안 링크가 복사되었어요 — 7일 후 만료\')">보안 링크</button>'
      + '<button class="btn btn-pri" style="flex:1.6" onclick="mdocExit()">내 서류함으로</button>';
  }

  body.innerHTML = h;
  body.scrollTop = 0;
  if(s === 1) mdocLoadPlay();
}
/* 자료 불러오기 연출 — 스피너 → 체크 순차 전환, 완료 시 제목·버튼 전환 (Mock) */
var CHECK_ROW = '<span class="tchk"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.8 9L10 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
var mdocLoadSeq = 0;   /* 재진입 시 이전 타이머가 이어 돌지 않도록 세션 토큰 */
function mdocLoadPlay(){
  var i = 0, seq = ++mdocLoadSeq;
  function tick(){
    if(mdoc.step !== 1 || seq !== mdocLoadSeq) return;   /* 이전으로 나가거나 재시작되면 중단 */
    var rows = document.querySelectorAll('#mdocLoads .trow');
    if(i > 0 && rows[i-1]){
      rows[i-1].querySelector('.tr').innerHTML = CHECK_ROW;
      rows[i-1].querySelector('.tl b').style.color = 'var(--txt)';
    }
    if(i < rows.length){
      rows[i].querySelector('.tr').innerHTML = '<span class="spin"></span>';
      i++; setTimeout(tick, CAP?60:520);
    } else {
      mdoc.loaded = true;
      var t = document.getElementById('mdocLoadTitle');
      var sub = document.getElementById('mdocLoadSub');
      if(t) t.innerHTML = '불러오기 완료!';
      if(sub) sub.textContent = '필요한 자료를 모두 가져왔어요.';
      var b = document.getElementById('mdocLoadBtn');
      if(b){ b.disabled = false; b.textContent = '다음 단계로'; b.onclick = mdocNext; }
    }
  }
  tick();
}

/* 행정서류 진입 후킹: 모바일에서 '새 서류 작성'/'이어쓰기'는 몰입형 플로우로.
   잠김(② 미동의)·캡처 모드는 기존 PC 플로우 로직을 그대로 태운다. */
var _goDocView = window.goDocView;
window.goDocView = function(v){
  if((v==='s1' || v==='s2') && !CAP
     && typeof purposeOn === 'function' && purposeOn('p2')){
    mdocStart();
    return;
  }
  _goDocView(v);
};

/* ══════════ ④ 바텀시트 단계형 분할 (내려받기 · 공유) ══════════ */
/* 시트 안의 섹션 div 를 한 번에 하나씩 보여주고 [이전/다음] 으로 잇는다 */
/* data-fade 컨테이너는 OverlayScrollbars 가 자식을 뷰포트로 감싸므로,
   실제 콘텐츠 섹션은 뷰포트 안에서 찾는다 */
function sheetSections(host){
  var vp = host.querySelector('[data-overlayscrollbars-viewport]');
  var root = vp || host;
  return Array.prototype.filter.call(root.children, function(el){
    return !/(^|\s)os-/.test(el.className || '');
  });
}
function sheetSteps(cfg){
  var secs = cfg.sections, i = 0;
  /* 진행 표시는 텍스트(n/m) 대신 헤더 아래 풀폭 프로그레스바로 통일 */
  var modal = cfg.foot.closest('.modal');
  var prog = modal.querySelector('.sheet-prog');
  if(!prog){
    prog = document.createElement('div');
    prog.className = 'sheet-prog'; prog.innerHTML = '<i></i>';
    var head = modal.querySelector('.m-head');
    if(head && head.nextSibling) modal.insertBefore(prog, head.nextSibling); else modal.appendChild(prog);
  }
  function show(){
    secs.forEach(function(el, j){ el.style.display = j===i ? '' : 'none'; });
    prog.querySelector('i').style.width = Math.round((i+1)/secs.length*100)+'%';
    if(cfg.stepLabel) cfg.stepLabel.textContent = cfg.labelPrefix;
    cfg.foot.innerHTML =
      '<button class="btn btn-neu" id="'+cfg.key+'Prev"></button>' +
      '<button class="btn btn-pri" style="flex:1.4" id="'+cfg.key+'Next"></button>';
    var prev = document.getElementById(cfg.key+'Prev');
    var next = document.getElementById(cfg.key+'Next');
    prev.textContent = i===0 ? '취소' : '이전';
    prev.onclick = function(){ if(i===0){ cfg.cancel(); } else { i--; show(); } };
    next.textContent = i===secs.length-1 ? cfg.doneLabel : '다음';
    next.onclick = function(){
      if(cfg.validate && !cfg.validate(i)) return;
      if(i===secs.length-1){ cfg.done(); } else { i++; show(); }
    };
  }
  show();
}

/* 내려받기: 항목 → 기간 → 형식 → 받는 방법 (4단계) */
var _openDownload = window.openDownload;
window.openDownload = function(){
  _openDownload();
  var pick = document.getElementById('dlPick');
  sheetSteps({
    key:'dl',
    sections: sheetSections(pick),
    foot: document.getElementById('dlFoot'),
    stepLabel: document.querySelector('#dlModal .m-head div > div:nth-child(2)'),
    labelPrefix: '하나씩 고르면 돼요',
    doneLabel: '내려받기',
    validate: function(i){
      if(i===0 && !pickVals('dlItems').length){ toast('err','받을 항목을 1개 이상 선택해주세요'); return false; }
      return true;
    },
    cancel: function(){ closeModal('dlModal'); },
    done: function(){ doDownload(); },
  });
};

/* 공유: 보낼 곳 → 보낼 자료 → 보관 기간 (3단계) → 기존 승인·완료 단계로 연결 */
var _openShare = window.openShare;
window.openShare = function(){
  _openShare();
  var s1 = document.getElementById('shareStep1');
  sheetSteps({
    key:'sh',
    sections: sheetSections(s1),
    foot: document.getElementById('shareFoot'),
    stepLabel: document.getElementById('shareStep'),
    labelPrefix: '1단계 · 고르기',
    doneLabel: '다음 (승인 확인)',
    validate: function(i){
      if(i===0 && !shareTarget()){ toast('err','공유 대상을 선택해주세요'); return false; }
      if(i===1 && !pickVals('shareItems').length){ toast('err','공유할 데이터를 1개 이상 선택해주세요'); return false; }
      return true;
    },
    cancel: function(){ closeModal('shareModal'); },
    done: function(){
      /* 다음 단계(승인 확인)로 넘어가기 전에 섹션 전체를 복원 — shareNext 검증이 DOM 을 읽는다 */
      sheetSections(s1).forEach(function(el){ el.style.display = ''; });
      shareNext();
    },
  });
};

/* ══════════ ⑤ 모바일 IA v3 — 기능은 전부 '페이지 전체'로 ══════════ */
if(!CAP){

/* ①-a 2단계 이상 프로세스만 풀스크린 (CSS .fullpage 스코프).
   조회성 1단계 팝업(영수증·근거·기록·약관·동의서 상세·동의 취소)은 바텀시트 유지 */
var BACK_SVG = '<svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#4B5563" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
['consentModal','mdwModal','dlModal','shareModal'].forEach(function(id){
  var e = document.getElementById(id); if(!e) return;
  e.classList.add('fullpage');
  /* 풀스크린은 좌상단 ← 로 통일 (mdwModal 은 마크업에서 이미 처리) */
  if(id !== 'mdwModal'){
    var head = e.querySelector('.m-head');
    var mx = head && head.querySelector('.m-x');
    if(head && mx){
      mx.innerHTML = BACK_SVG;
      head.insertBefore(mx, head.firstChild);
      if(head.children[1]) head.children[1].style.flex = '1';
    }
  }
});
['rcptModal','traceModal','rnModal','purModal','termsModal','wdModal']
  .forEach(function(id){ var e = document.getElementById(id); if(e) e.classList.add('sheet-lg'); });

/* ⑤-a 기능 서브페이지(#msub): 마이페이지의 카드를 통째로 옮겨 와 전체 화면으로 보여준다 */
var msubEl = null, msubMoved = [];   /* [{card, ph}] — 서브페이지로 옮겨 간 카드들 */
var MSUB_MAP = {
  use: ['데이터 활용 동의', ['[data-capture="CMG-02"]']],       /* 받아온 자료를 '어디에 쓸지' (목적 2축) */
  conn:['데이터 연동 관리', ['[data-capture="CAPTURE-004"]']],  /* 어느 기관에서 '무엇을 받아올지' */
  rcpt:['데이터 이용내역 · 영수증', ['[data-capture="CAPTURE-012"]']],
};
function ensureMsub(){
  if(msubEl) return;
  msubEl = document.createElement('div');
  msubEl.className = 'mdoc'; msubEl.id = 'msub';
  msubEl.innerHTML =
    '<div class="mdoc-top">'
    + '<button class="mdoc-x" onclick="msubClose()" aria-label="뒤로">'
    + '<svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#4B5563" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
    + '<div class="mdoc-title" id="msubTitle"></div></div>'
    + '<div class="mdoc-body" id="msubBody"></div>';
  document.body.appendChild(msubEl);
}
window.msubOpen = function(key){
  ensureMsub();
  var m = MSUB_MAP[key]; if(!m) return;
  if(msubMoved.length) msubClose();
  var body = document.getElementById('msubBody');
  m[1].forEach(function(sel){
    var card = document.querySelector(sel); if(!card) return;
    var ph = document.createComment('msub-ph');
    card.parentNode.insertBefore(ph, card);
    card.classList.remove('m-hide');
    body.appendChild(card);
    msubMoved.push({card:card, ph:ph});
  });
  document.getElementById('msubTitle').textContent = m[0];
  body.scrollTop = 0;
  msubEl.classList.add('on');
  syncFocus();
};
window.msubClose = function(){
  msubMoved.forEach(function(x){
    x.card.classList.add('m-hide');              /* 루트에서는 계속 숨김 */
    x.ph.parentNode.insertBefore(x.card, x.ph);
    x.ph.remove();
  });
  msubMoved = [];
  msubEl.classList.remove('on');
  syncFocus();
};

/* ⑤-b 마이페이지 루트 재구성: 메인 기능 1개(자료를 쓰는 목적)만 남기고
   나머지 기능은 네비게이터 리스트 → depth 로 진입 */
(function(){
  var mp = document.getElementById('page-mypage'); if(!mp) return;
  var head = mp.querySelector('.wrap>div:first-child');
  if(head){
    var t = head.querySelector('div:first-child');
    var st = head.querySelector('div:nth-child(2)');
    if(t) t.textContent = '마이페이지';
    if(st) st.textContent = '내 데이터가 어떻게 쓰이는지 확인하고 직접 관리해요.';
  }
  /* 루트에는 본인정보(프로필+정보수정)와 메뉴 목록만 — 나머지 기능은 전부 depth 로 */
  var hero = mp.querySelector('[data-capture="CNS-01"]');
  var pur  = mp.querySelector('[data-capture="CMG-02"]');
  var conn = mp.querySelector('[data-capture="CAPTURE-004"]');
  var rcpt = mp.querySelector('[data-capture="CAPTURE-012"]');
  var dl   = mp.querySelector('[data-capture="CAPTURE-008"]');
  [hero, pur, conn, rcpt, dl && dl.parentElement].forEach(function(el){ if(el) el.classList.add('m-hide'); });
  var CHEV = '<svg width="7" height="12" viewBox="0 0 8 12" fill="none"><path d="M1.5 1.5L6 6L1.5 10.5" stroke="#C2C9C4" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var rows = [
    ['내 자료 가져오기', "mdwOpen()", '전송요구'],
    ['데이터 활용 동의', "msubOpen('use')", 'AI 상담 · 서류 생성'],
    ['데이터 연동 관리', "msubOpen('conn')", '3 / 4 기관'],
    ['데이터 이용내역 · 영수증', "msubOpen('rcpt')", ''],
    ['내 데이터 내려받기', "openDownload()", ''],
    ['제3자 선별 공유', "openShare()", ''],
    ['실명 사용 기록', "openRealname()", ''],
    ['AI 상담 근거 보기', "openTrace()", ''],
    ['알림 설정', "toast('info','알림 설정 — 시안 범위 외')", ''],
  ];
  var nav = document.createElement('div');
  nav.className = 'card'; nav.id = 'mpNav';
  nav.innerHTML = '<div style="padding:4px 20px 6px">'
    + rows.map(function(r){
        return '<button class="mnav-row" onclick="'+r[1]+'"><b>'+r[0]+'</b>'
          + (r[2] ? '<span class="mv">'+r[2]+'</span>' : '') + CHEV + '</button>';
      }).join('') + '</div>';
  var profile = mp.querySelector('[data-capture="CAPTURE-000"]');
  if(profile) profile.after(nav); else if(pur) pur.after(nav);
})();

/* ④ 행정서류 홈: [내 서류함 + ⓘ] → [서류 목록] → [새 서류 작성 버튼] 3블록 */
(function(){
  var home = document.getElementById('dv-home'); if(!home) return;
  var card = home.querySelector('.card');
  var head = card && card.querySelector(':scope>div:first-child');
  var btn  = head && head.querySelector('.btn');
  var ttl  = head && head.querySelector('.sec-t');
  if(!btn || !ttl) return;
  btn.innerHTML = '새 서류 작성';                       /* '+' 아이콘 제거 */
  var wrap = document.createElement('div');
  wrap.style.cssText = 'padding:6px 16px 18px';
  btn.style.width = '100%';
  wrap.appendChild(btn);
  card.appendChild(wrap);                               /* 목록 아래 3번째 블록으로 */
  var info = document.createElement('button');
  info.className = 'ihelp'; info.textContent = 'i'; info.setAttribute('aria-label','내 서류함 도움말');
  info.onclick = function(){ toast('info','완성 서류와 변환한 서식은 이 기기(브라우저)에만 저장돼요. 개인정보 원본은 서버에 보관하지 않고, 작성할 때마다 마이데이터를 실시간 조회해 최신 값으로 채워요.'); };
  ttl.after(info);
})();

}

/* 캡처 모드(#cap=)에서는 시트 단계 분할을 걷어내 기존 증빙 화면 그대로 재현 */
if(CAP){ window.openDownload = _openDownload; window.openShare = _openShare; window.goDocView = _goDocView; }

})();
