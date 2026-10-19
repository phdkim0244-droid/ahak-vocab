
/* ===== 학생용 어휘 카드 ===== */
const $=s=>document.querySelector(s);
/* ----- 학급 설정: URL 해시(#g=5&s=1&sc=학교&c=반&sub=국어:국정,수학:출판사) → localStorage ----- */
const CFG_KEY='vocabCard:cfg';
const enc=v=>encodeURIComponent(String(v));
function parseHash(){
  const h=location.hash.slice(1); if(!h||!h.includes('=')) return null;
  const p=new URLSearchParams(h), g=+p.get('g'), s=+p.get('s');
  const subs=(p.get('sub')||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!g||!s||!subs.length) return null;
  const subjects=[], publishers={};
  subs.forEach(x=>{ const i=x.indexOf(':'); const a=(i<0?x:x.slice(0,i)).trim(), b=(i<0?'':x.slice(i+1)).trim(); if(a&&!subjects.includes(a)){ subjects.push(a); publishers[a]=b; } });
  return {school:(p.get('sc')||'').trim(), className:(p.get('c')||'').trim(), grade:g, semester:s, subjects, publishers, preview:p.get('pv')==='1'};
}
function cfgToHash(c){ return '#g='+c.grade+'&s='+c.semester+'&sc='+enc(c.school)+(c.className?'&c='+enc(c.className):'')+'&sub='+c.subjects.map(x=>enc(x)+':'+enc(c.publishers[x]||'')).join(','); }
function finalize(c){
  c.subjects.forEach(sub=>{ const avail=[...new Set(ROWS.filter(x=>x.g===c.grade&&x.s===c.semester&&x.sub===sub).map(x=>x.p))]; if(!avail.includes(c.publishers[sub])) c.publishers[sub]=avail[0]||''; });
  c.subjects=c.subjects.filter(sub=>c.publishers[sub]);
  c.classId=[c.school,c.grade,c.className,c.semester,c.subjects.map(s=>s+c.publishers[s]).join(',')].join('_');
  return c;
}
let CONFIG=null, PREVIEW=false;
{ const h=parseHash();
  if(h){ PREVIEW=h.preview; delete h.preview; CONFIG=finalize(h); if(!PREVIEW) try{ localStorage.setItem(CFG_KEY,JSON.stringify(CONFIG)); }catch(e){} }
  else{ try{ const v=localStorage.getItem(CFG_KEY); if(v) CONFIG=finalize(JSON.parse(v)); }catch(e){} }
}
if(!CONFIG||!CONFIG.subjects.length){ showSetup(); throw new Error('no config'); }
/* 홈 화면에 추가할 때 학급 설정이 주소에 함께 담기도록 해시를 항상 유지 */
if(!PREVIEW){ const want=cfgToHash(CONFIG); if(location.hash!==want) history.replaceState(null,'',location.pathname+location.search+want); }
window.addEventListener('hashchange',()=>location.reload());
const DATA=ROWS.filter(x=>x.g===CONFIG.grade&&x.s===CONFIG.semester&&CONFIG.publishers[x.sub]===x.p).map(x=>Object.assign({},x));
const NS=(PREVIEW?'vocabP:':'vocab:')+CONFIG.classId+':';
function lsGet(k,d){ try{ const v=localStorage.getItem(NS+k); return v===null?d:JSON.parse(v); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(NS+k,JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function plain(w){ return w.replace(/\s*\(.*?\)\s*/g,' ').replace(/\s+/g,' ').trim(); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ----- 어휘 인덱스 ----- */
const UNITS=[], UIDX={};
DATA.forEach((x,i)=>{ x._i=i; const k=[x.g,x.s,x.sub,x.unit].join('|'); if(!(k in UIDX)){ UIDX[k]=UNITS.length; UNITS.push(k); } x._u=UIDX[k]; });

/* ----- 학습 기록(이 기기에만 저장) ----- */
let PROG=lsGet('prog',{seen:[],quiz:{},wrong:{},at:0});
const seenSet=new Set(PROG.seen||[]);
function saveProg(){ PROG.seen=[...seenSet]; PROG.at=Date.now(); if(!PREVIEW) lsSet('prog',PROG); }
function bestOf(u){ const q=PROG.quiz[u]; return (q&&q[1])?{score:q[0],total:q[1]}:null; }

/* ----- 카드 학습 상태 ----- */
const S=Object.assign({sub:CONFIG.subjects[0],unit:'전체',idx:0,q:''}, lsGet('state',{}));
S.g=CONFIG.grade; S.s=CONFIG.semester; if(!CONFIG.subjects.includes(S.sub)) S.sub=CONFIG.subjects[0];
function save(){ lsSet('state',S); }
function uniqUnits(){ const us=[...new Set(DATA.filter(x=>x.sub===S.sub).map(x=>x.unit))]; return us; }
let LIST=[];
function build(){
  LIST=DATA.filter(x=>x.sub===S.sub&&(S.unit==='전체'||x.unit===S.unit));
  if(S.q){ const q=S.q.trim(); LIST=LIST.filter(x=>x.w.includes(q)||x.hj.some(h=>h.h===q)||x.m.includes(q)); }
  if(S.idx>=LIST.length) S.idx=0;
  if(S.idx<0) S.idx=0;
}
function seg(el,items,cur,fmt,onpick){
  el.innerHTML='';
  items.forEach(v=>{ const b=document.createElement('button'); b.textContent=fmt(v); if(v===cur) b.classList.add('on'); b.onclick=()=>onpick(v); el.appendChild(b); });
}
function renderFilters(){
  const subs=CONFIG.subjects;
  $('#fSub').parentElement.style.display=subs.length>1?'':'none';
  seg($('#fSub'),subs,S.sub,v=>v,v=>{ S.sub=v; S.unit='전체'; S.idx=0; refresh(); });
  const us=uniqUnits(); if(S.unit!=='전체'&&!us.includes(S.unit)) S.unit='전체';
  seg($('#fUnit'),['전체',...us],S.unit,v=>v,v=>{ S.unit=v; S.idx=0; refresh(); });
}
function renderList(){
  const ul=$('#list'); ul.innerHTML='';
  if(!LIST.length){ ul.innerHTML='<li class="empty">해당하는 어휘가 없습니다.</li>'; $('#cnt').textContent='0개'; return; }
  let lastU=null, lastX=null;
  LIST.forEach((x,i)=>{
    if(lastX&&x.unit!==lastX.unit) addQuizRow(ul,lastX);
    lastX=x;
    if(S.unit==='전체'&&x.unit!==lastU){ const h=document.createElement('li'); h.className='uh'; h.textContent=x.unit; h.style.cursor='default'; h.style.display='block'; ul.appendChild(h); lastU=x.unit; }
    const li=document.createElement('li'); li.dataset.i=i;
    if(i===S.idx) li.classList.add('on');
    if(seenSet.has(x._i)) li.classList.add('done');
    li.innerHTML='<span class="no">'+x.n+'</span><span class="w">'+esc(x.w)+'</span><span class="h">'+esc(x.hj.map(h=>h.h).join(''))+'</span>';
    li.onclick=()=>{ closeQuiz(); S.idx=i; renderCard(); markList(); if(document.body.classList.contains('sideOpen')) document.body.classList.remove('sideOpen'); };
    ul.appendChild(li);
  });
  if(lastX) addQuizRow(ul,lastX);
  $('#cnt').textContent=LIST.length+'개';
  scrollActive();
}
function markList(){ document.querySelectorAll('#list li[data-i]').forEach(li=>{ li.classList.toggle('on',+li.dataset.i===S.idx); if(seenSet.has(LIST[+li.dataset.i]._i)) li.classList.add('done'); }); scrollActive(); }
function scrollActive(){ const el=document.querySelector('#list li.on:not(.quizRow)'); if(el) el.scrollIntoView({block:'nearest'}); }
function hl(ex,w){
  const e=esc(ex); const core=w.replace(/\s|\(.*?\)/g,'');
  const cands=[w,core]; for(let k=core.length;k>=2;k--){ cands.push(core.slice(0,k)); }
  for(const c of cands){ if(c.length>=2&&e.includes(c)) return e.split(c).join('<mark>'+c+'</mark>'); }
  return e;
}
function renderCard(){
  const card=$('#card'); card.classList.remove('flip'); $('#reveal').textContent='뜻 보기';
  if(!LIST.length){ $('#front').innerHTML='<div class="empty">조건에 맞는 어휘가 없습니다.</div>'; $('#back').innerHTML=''; $('#pos').textContent=''; $('#bar').style.width='0'; $('#crumb').textContent=''; return; }
  const x=LIST[S.idx];
  const hjHtml=x.hj.length?'<div class="hanja">'+x.hj.map(h=>'<div class="hz"><b>'+esc(h.h)+'</b><small>'+esc(h.t||'')+'</small></div>').join('')+'</div>':'<div class="nohanja">고유어 · 한자 표기 없음</div>';
  $('#front').innerHTML='<div class="tag">'+x.g+'-'+x.s+' '+x.sub+' · '+esc(x.unit)+' · '+x.n+'번</div><div class="word">'+esc(x.w)+'</div>'+hjHtml+'<div class="hint">카드를 누르면 뜻이 나타납니다</div>';
  $('#back').innerHTML='<div class="tag">'+x.g+'-'+x.s+' '+x.sub+' · '+esc(x.unit)+'</div><div class="word">'+esc(x.w)+'</div><div class="hjline">'+esc(x.hj.map(h=>h.h).join(' '))+'</div>'
    +'<div class="blk"><h4>뜻</h4><p>'+esc(x.m||'—')+'</p></div>'
    +'<div class="blk"><h4>예시 표현</h4><p>'+(x.e?hl(x.e,x.w):'—')+'</p></div>';
  $('#pos').textContent=(S.idx+1)+' / '+LIST.length;
  $('#bar').style.width=((S.idx+1)/LIST.length*100)+'%';
  $('#crumb').textContent=S.g+'학년 '+S.s+'학기 · '+S.sub+' · '+(S.unit==='전체'?'전체 단원':S.unit);
  $('#prev').disabled=S.idx===0; $('#next').disabled=S.idx===LIST.length-1;
  save();
}
function flip(){
  if(!LIST.length) return; const c=$('#card'); c.classList.toggle('flip'); const on=c.classList.contains('flip');
  $('#reveal').textContent=on?'어휘 보기':'뜻 보기';
  if(on){ const x=LIST[S.idx]; if(!seenSet.has(x._i)){ seenSet.add(x._i); saveProg(); } markList(); }
}
function go(d){ if(!LIST.length) return; const n=S.idx+d; if(n<0||n>=LIST.length) return; S.idx=n; renderCard(); markList(); }
function refresh(){ closeQuiz(); renderFilters(); build(); renderList(); renderCard(); }

/* ===== 어휘력 퀴즈 (단원 1개 = 1세트, 한자 문제 없음) ===== */
let QZ=null;
const asked={};
function uKey(x){ return [x.g,x.s,x.sub,x.unit].join('|'); }
function unitWords(x){
  const seenW=new Set();
  return DATA.filter(d=>d._u===x._u&&d.m&&(seenW.has(d.w)?false:(seenW.add(d.w),true)));
}
function bestLabel(x,n){ const b=bestOf(x._u); return b?('최고 '+b.score+' / '+b.total+'점'):(n+'개 낱말 · 단원 마무리'); }
function addQuizRow(ul,x){
  const n=unitWords(x).length, li=document.createElement('li');
  li.className='quizRow'; li.dataset.qk=uKey(x); li.setAttribute('role','button');
  if(QZ&&QZ.key===uKey(x)) li.classList.add('on');
  li.innerHTML='<span class="qr1">📝 어휘력 퀴즈!</span><small class="qr2">'+esc(bestLabel(x,n))+'</small>';
  li.onclick=()=>{ openQuiz(x); document.body.classList.remove('sideOpen'); };
  ul.appendChild(li);
}
function updateQuizRows(){
  document.querySelectorAll('#list li.quizRow').forEach(r=>{
    r.classList.toggle('on',!!QZ&&r.dataset.qk===QZ.key);
    const x=DATA.find(d=>uKey(d)===r.dataset.qk); if(!x) return;
    const s=r.querySelector('.qr2'); if(s) s.textContent=bestLabel(x,unitWords(x).length);
  });
}
function openQuiz(x){
  QZ={g:x.g,s:x.s,sub:x.sub,unit:x.unit,u:x._u,key:uKey(x),words:unitWords(x),phase:'start',qs:[],i:0,score:0,wrong:[],answered:false,full:true};
  document.body.classList.add('quizOn');
  updateQuizRows(); renderQuiz();
}
function closeQuiz(){ QZ=null; document.body.classList.remove('quizOn'); updateQuizRows(); }

function candidates(x){
  const same=d=>d.g===x.g&&d.s===x.s&&d.sub===x.sub, t1=[],t2=[],t3=[],t4=[];
  for(const d of DATA){
    if(d===x||d.w===x.w||!d.m) continue;
    if(same(d)&&d.unit===x.unit) t1.push(d); else if(same(d)) t2.push(d); else if(d.sub===x.sub) t3.push(d); else t4.push(d);
  }
  return {near:[...shuffle(t1),...shuffle(t2)], far:[...shuffle(t3),...shuffle(t4)]};
}
function pickDistractors(x,field,extraOk){
  const {near,far}=candidates(x), base=field==='w'?plain(x.w):x.m;
  const similar=d=>{ const a=field==='w'?plain(d.w):d.m; return field==='w'?Math.abs(a.length-base.length)<=1:(a.length>=base.length*.5&&a.length<=base.length*2); };
  const order=[...near.filter(similar),...near.filter(d=>!similar(d)),...far.filter(similar),...far.filter(d=>!similar(d))];
  const out=[], used=new Set([base]);
  for(const d of order){
    if(out.length>=3) break;
    const v=field==='w'?plain(d.w):d.m;
    if(used.has(v)) continue;
    if(field==='w'){ if(v.includes(base)||base.includes(v)||d.m===x.m) continue; }
    if(extraOk&&!extraOk(d,v)) continue;
    used.add(v); out.push(v);
  }
  return out;
}
function blankInfo(x){
  if(!x.e) return null;
  const cs=[x.w,plain(x.w)].filter((c,i,a)=>c.length>=2&&a.indexOf(c)===i);
  for(const c of cs){ if(x.e.includes(c)) return {c,parts:x.e.split(c)}; }
  return null;
}
function maskMeaning(x){
  let m=x.m;
  [x.w,plain(x.w)].filter((c,i,a)=>c.length>=2&&a.indexOf(c)===i).forEach(c=>{ m=m.split(c).join('○○'); });
  return m;
}
function mkQ(x,type,alt){
  let b=null;
  if(type==='blank'){ b=blankInfo(x); if(!b){ type=alt; } }
  if(type==='blank'){
    const ans=b.c, ds=pickDistractors(x,'w',(d,v)=>!x.e.includes(v));
    return {x,type,label:'빈칸에 알맞은 낱말 고르기',
      html:'<p class="qAsk">빈칸에 들어갈 알맞은 낱말은 무엇일까요?</p><p class="qText">'+b.parts.map(esc).join('<span class="blank"></span>')+'</p>',
      choices:shuffle([{t:ans,ok:true},...ds.map(t=>({t,ok:false}))])};
  }
  if(type==='m2w'){
    const ds=pickDistractors(x,'w');
    return {x,type,label:'뜻을 보고 낱말 고르기',
      html:'<p class="qAsk">이 뜻에 알맞은 낱말은 무엇일까요?</p><p class="qText">'+esc(maskMeaning(x))+'</p>',
      choices:shuffle([{t:plain(x.w),ok:true},...ds.map(t=>({t,ok:false}))])};
  }
  const ds=pickDistractors(x,'m');
  return {x,type:'w2m',label:'낱말의 뜻 고르기',
    html:'<p class="qAsk">다음 낱말의 뜻으로 알맞은 것을 골라 보세요.</p><p class="qWord">'+esc(plain(x.w))+'</p>',
    choices:shuffle([{t:x.m,ok:true},...ds.map(t=>({t,ok:false}))])};
}
function pickWords(count){
  const a=asked[QZ.key]||(asked[QZ.key]=new Set()), id=w=>w._i;
  const pool=shuffle(QZ.words), fresh=pool.filter(w=>!a.has(id(w)));
  const chosen=[...fresh,...pool.filter(w=>a.has(id(w)))].slice(0,count);
  if(fresh.length<=count) a.clear();
  chosen.forEach(w=>a.add(id(w)));
  return chosen;
}
function startRun(words,full){
  const types=shuffle(['m2w','w2m','blank']);
  QZ.qs=shuffle(words).map((x,i)=>mkQ(x,types[i%3],i%2?'m2w':'w2m'));
  QZ.i=0; QZ.score=0; QZ.wrong=[]; QZ.answered=false; QZ.full=full; QZ.phase='ask';
  renderQuiz();
}
function renderQuiz(){
  if(!QZ) return;
  $('#qCrumb').textContent='어휘력 퀴즈! · '+QZ.g+'학년 '+QZ.s+'학기 · '+QZ.sub+' · '+QZ.unit;
  $('#qNav').style.display='none';
  const m=$('#qMain');
  if(QZ.phase==='start') renderQStart(m); else if(QZ.phase==='ask') renderQAsk(m); else renderQResult(m);
  $('#qBody').scrollTop=0;
}
function renderQStart(m){
  const N=QZ.words.length, opts=[...new Set([5,10,N].filter(v=>v<=N))];
  let sel=opts.filter(v=>v<=10).pop();
  $('#qPos').textContent=''; $('#qBar').style.width='0';
  const b=bestOf(QZ.u);
  m.innerHTML='<div class="qCard"><div class="qBig">📝</div><h2>어휘력 퀴즈!</h2>'
    +'<p class="qSub">'+esc(QZ.g+'학년 '+QZ.s+'학기 · '+QZ.sub+' · '+QZ.unit)+'</p>'
    +'<ul class="qInfo"><li>이 단원의 낱말 '+N+'개로 문제를 만들어요.</li><li>뜻 보고 낱말 찾기, 낱말 보고 뜻 찾기, 빈칸 채우기가 섞여 나와요.</li><li>한 문제씩 고르면 바로 정답을 알려 줘요.</li></ul>'
    +'<div class="qCnt">'+(opts.length>1?'<label>문제 수</label><div class="seg" id="qOpts"></div>':'<label>총 '+N+'문제</label>')+'</div>'
    +'<button class="qGo" id="qGo">퀴즈 시작</button>'
    +(b?'<div class="qBest">내 최고 기록: '+b.score+' / '+b.total+'점</div>':'')+'</div>';
  if(opts.length>1){
    const box=$('#qOpts');
    const draw=()=>{ box.innerHTML=''; opts.forEach(v=>{ const bt=document.createElement('button'); bt.textContent=(v===N&&v!==5&&v!==10)?'전체 '+v+'문제':v+'문제'; if(v===sel) bt.classList.add('on'); bt.onclick=()=>{ sel=v; draw(); }; box.appendChild(bt); }); };
    draw();
  }
  $('#qGo').onclick=()=>{ const c=opts.length>1?sel:N; startRun(pickWords(c),true); };
}
function renderQAsk(m){
  const q=QZ.qs[QZ.i], total=QZ.qs.length;
  $('#qPos').textContent=(QZ.i+1)+' / '+total+' · 맞힌 문제 '+QZ.score;
  $('#qBar').style.width=(QZ.i/total*100)+'%';
  QZ.answered=false;
  m.innerHTML='<div style="text-align:center"><span class="qType">문제 '+(QZ.i+1)+' · '+q.label+'</span></div>'
    +'<div class="qPrompt">'+q.html+'</div><div class="qChoices" id="qCh"></div><div id="qFb"></div>';
  const ch=$('#qCh');
  q.choices.forEach((c,k)=>{
    const bt=document.createElement('button'); bt.className='qc';
    bt.innerHTML='<span class="no">'+(k+1)+'</span><span>'+esc(c.t)+'</span>';
    bt.onclick=()=>answer(k);
    ch.appendChild(bt);
  });
}
function answer(k){
  if(!QZ||QZ.phase!=='ask'||QZ.answered) return;
  const q=QZ.qs[QZ.i]; QZ.answered=true;
  const ok=q.choices[k].ok;
  if(ok) QZ.score++; else QZ.wrong.push(q.x);
  [...$('#qCh').children].forEach((bt,j)=>{
    bt.disabled=true;
    if(q.choices[j].ok){ bt.classList.add('ok'); bt.querySelector('.no').textContent='✓'; }
    else if(j===k){ bt.classList.add('no'); bt.querySelector('.no').textContent='✕'; }
    else bt.classList.add('dim');
  });
  const x=q.x;
  $('#qFb').innerHTML='<div class="qFb '+(ok?'ok':'no')+'"><div class="res">'+(ok?'⭕ 정답이에요!':'❌ 아쉬워요. 다시 기억해 봐요!')+'</div>'
    +'<div><b>'+esc(plain(x.w))+'</b> : '+esc(x.m)+'</div>'
    +(x.e?'<div class="ex">예) '+hl(x.e,x.w)+'</div>':'')+'</div>';
  $('#qPos').textContent=(QZ.i+1)+' / '+QZ.qs.length+' · 맞힌 문제 '+QZ.score;
  $('#qBar').style.width=((QZ.i+1)/QZ.qs.length*100)+'%';
  const last=QZ.i===QZ.qs.length-1;
  $('#qNext').textContent=last?'결과 보기 ›':'다음 문제 ›';
  $('#qNav').style.display='flex';
  $('#qFb').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function recordQuiz(){
  const total=QZ.qs.length, cur=PROG.quiz[QZ.u]||[0,0,0,0,0];
  cur[2]++; cur[3]=QZ.score; cur[4]=total;
  if(QZ.full){
    const b=cur[1]?cur[0]/cur[1]:-1, p=QZ.score/total;
    if(p>b||(p===b&&total>cur[1])){ cur[0]=QZ.score; cur[1]=total; }
  }
  PROG.quiz[QZ.u]=cur;
  QZ.wrong.forEach(x=>{ PROG.wrong[x._i]=(PROG.wrong[x._i]||0)+1; });
  saveProg();
}
function nextQ(){
  if(!QZ||QZ.phase!=='ask'||!QZ.answered) return;
  if(QZ.i<QZ.qs.length-1){ QZ.i++; renderQuiz(); }
  else{ QZ.phase='result'; recordQuiz(); updateQuizRows(); renderQuiz(); }
}
function renderQResult(m){
  const total=QZ.qs.length, sc=QZ.score, pct=sc/total;
  $('#qPos').textContent='결과'; $('#qBar').style.width='100%';
  const msg=pct===1?'🎉 완벽해요! 모두 맞혔어요!':pct>=.8?'👏 아주 잘했어요!':pct>=.6?'😊 잘했어요. 조금만 더 힘내요!':'💪 카드를 다시 보고 한 번 더 도전해 봐요!';
  const wrong=QZ.wrong;
  m.innerHTML='<div class="qCard"><div class="qBig">📝</div><h2>퀴즈 결과</h2>'
    +'<div class="qScore">'+sc+'<small> / '+total+'</small></div><p class="qMsg">'+msg+'</p>'
    +(wrong.length?'<div class="qWrong"><h3>다시 확인해 볼 어휘 ('+wrong.length+'개)</h3>'+wrong.map(x=>'<div class="it"><b>'+esc(plain(x.w))+'</b> : '+esc(x.m)+'</div>').join('')+'</div>':'')
    +'<div class="qActs">'
    +(wrong.length?'<button class="pri" id="qRetryW">틀린 어휘 다시 풀기</button>':'')
    +'<button id="qAgain">'+(wrong.length?'새로 풀기':'한 번 더 풀기')+'</button>'
    +'<button id="qBack">어휘 카드 보기</button></div></div>';
  if(wrong.length) $('#qRetryW').onclick=()=>startRun(wrong.slice(),false);
  $('#qAgain').onclick=()=>{ QZ.phase='start'; renderQuiz(); };
  $('#qBack').onclick=()=>closeQuiz();
}
function quizKey(e){
  if(QZ.phase==='ask'&&/^[1-4]$/.test(e.key)){ answer(+e.key-1); }
  else if(QZ.phase==='ask'&&e.key==='ArrowRight'){ nextQ(); }
  else if(e.key==='Escape'){ closeQuiz(); }
}

/* ===== 표지 ===== */
const cover=$('#cover');
function periodText(){ return CONFIG.grade+'학년 '+CONFIG.semester+'학기 · '+CONFIG.subjects.join('·'); }
function enter(){ cover.classList.add('hide'); }

/* ===== 시작 ===== */
$('#brandSub').textContent=CONFIG.school+' · '+periodText();
$('#coverSchool').textContent=CONFIG.school;
const PUBS=CONFIG.publishers||{}, pl=CONFIG.subjects.filter(x=>PUBS[x]).map(x=>x+' '+PUBS[x]).join(' · ');
$('#coverSub').textContent=periodText();
if(pl){ const e=document.createElement('span'); e.textContent=pl; $('#coverSub').parentNode.appendChild(e); }
$('#coverGrade').textContent=CONFIG.grade;
document.title='청자골 아학-교과서 어휘력 카드 · '+CONFIG.school+' ('+CONFIG.grade+'학년 '+CONFIG.semester+'학기)';
if(PREVIEW) $('#pvChip').hidden=false;
$('#coverGo').onclick=enter;
$('#cfgReset').onclick=()=>{ if(!confirm('학급 설정을 다시 고를까요?\n(학습 기록은 지워지지 않아요)')) return; try{ localStorage.removeItem(CFG_KEY); }catch(e){} history.replaceState(null,'',location.pathname+location.search); location.reload(); };
$('.brand').onclick=()=>cover.classList.remove('hide');
$('#card').addEventListener('click',flip);
$('#reveal').onclick=flip;
$('#prev').onclick=()=>go(-1);
$('#next').onclick=()=>go(1);
$('#toggleSide').onclick=()=>document.body.classList.toggle('sideOpen');
$('#q').value=S.q||'';
$('#q').addEventListener('input',e=>{ S.q=e.target.value; S.idx=0; build(); renderList(); renderCard(); });
$('#qNext').onclick=nextQ;
$('#qExit').onclick=()=>closeQuiz();
$('#qSide').onclick=()=>document.body.classList.toggle('sideOpen');
document.addEventListener('keydown',e=>{
  const tg=e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA') return;
  if(!cover.classList.contains('hide')) return;
  if(QZ){ quizKey(e); return; }
  if(e.key==='ArrowRight') go(1); else if(e.key==='ArrowLeft') go(-1); else if(e.key===' '){ e.preventDefault(); flip(); }
});
let tx=null,ty=null;
const stage=document.querySelector('.stage');
stage.addEventListener('touchstart',e=>{ tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
stage.addEventListener('touchend',e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null; if(Math.abs(dx)>60&&Math.abs(dy)<80){ go(dx<0?1:-1); } },{passive:true});
refresh();

