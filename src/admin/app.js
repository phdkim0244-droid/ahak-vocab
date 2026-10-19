
const DATA=ROWS;
/* 학생용 앱 주소: 같은 사이트의 ../card/ (http(s)로 열렸을 때). 그 밖엔 아래 기본값 */
const DEFAULT_CARD_URL='__CARD_URL__';
const CARD_KEY='vocabDeploy:cardUrl';
function cardUrl(){ try{ const v=localStorage.getItem(CARD_KEY); if(v) return v; }catch(e){} if(/^https?:/.test(location.protocol)) return new URL('../card/',location.href).href; return DEFAULT_CARD_URL; }
const enc=v=>encodeURIComponent(String(v));
const $=s=>document.querySelector(s);
const SUBJ=['국어','수학','사회','과학'];
const KEEP='기존 탑재 자료';
const LS='vocabDeploy:v2';
function lget(){ try{ return JSON.parse(localStorage.getItem(LS))||{}; }catch(e){ return {}; } }
function lset(){ try{ localStorage.setItem(LS,JSON.stringify(ST)); }catch(e){} }
const ST=Object.assign({school:'',cls:'',g:5,s:1,on:{},pub:{}}, lget());
ST.on=ST.on||{}; ST.pub=ST.pub||{};

/* 인덱스: g|s|sub -> {pub -> {rows, units}} (자료에 나온 순서 유지) */
const IDX={};
DATA.forEach(x=>{
  const k=x.g+'|'+x.s+'|'+x.sub, m=IDX[k]||(IDX[k]=new Map());
  let o=m.get(x.p); if(!o){ o={n:0,units:new Set()}; m.set(x.p,o); }
  o.n++; o.units.add(x.unit);
});
function pubsOf(g,s,sub){ const m=IDX[g+'|'+s+'|'+sub]; return m?[...m.keys()]:[]; }
function pubLabel(p){ return p===KEEP?'기존 탑재 자료':p; }
function toast(t){ const e=$('#toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>e.classList.remove('on'),2600); }
function key(sub){ return ST.g+'-'+ST.s+'|'+sub; }

function renderSeg(id,vals,cur,fn,suffix){
  const b=$(id); b.innerHTML='';
  vals.forEach(v=>{ const e=document.createElement('button'); e.type='button'; e.textContent=v+suffix; if(v===cur) e.className='on'; e.onclick=()=>{ fn(v); }; b.appendChild(e); });
}
function renderSubs(){
  const box=$('#subs'); box.innerHTML='';
  SUBJ.forEach(sub=>{
    const opts=pubsOf(ST.g,ST.s,sub), kk=key(sub);
    const row=document.createElement('div'); row.className='subRow';
    const has=opts.length>0;
    if(!(kk in ST.on)) ST.on[kk]=has;
    if(!has) ST.on[kk]=false;
    if(!opts.includes(ST.pub[kk])) ST.pub[kk]=opts[0]||'';
    const on=ST.on[kk];
    if(!on) row.classList.add('off');
    const id='ck_'+sub;
    row.innerHTML='<label class="ck" for="'+id+'"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+(has?'':' disabled')+'>'+sub+'</label>'
      +'<select aria-label="'+sub+' 출판사"'+((on&&has)?'':' disabled')+'></select><div class="meta"></div>';
    const sel=row.querySelector('select');
    if(!has){ sel.innerHTML='<option>자료 없음</option>'; }
    opts.forEach(p=>{
      const o=document.createElement('option'); o.value=p;
      const inf=IDX[ST.g+'|'+ST.s+'|'+sub].get(p);
      o.textContent=(sub==='국어'&&p==='국정'?'국정':pubLabel(p))+'  ('+inf.n+'개)';
      if(p===ST.pub[kk]) o.selected=true; sel.appendChild(o);
    });
    if(sub==='국어'&&opts.length===1) sel.disabled=true;
    if(sub==='국어'&&opts.length===1&&on) sel.disabled=false, sel.title='국어는 국정 교과서예요';
    row.querySelector('input').onchange=e=>{ ST.on[kk]=e.target.checked; lset(); render(true); };
    sel.onchange=()=>{ ST.pub[kk]=sel.value; lset(); renderSum(); const inf=IDX[ST.g+'|'+ST.s+'|'+sub].get(sel.value); row.querySelector('.meta').textContent=inf?('단원 '+inf.units.size+'개 · 어휘 '+inf.n+'개'):''; };
    const inf=IDX[ST.g+'|'+ST.s+'|'+sub]&&IDX[ST.g+'|'+ST.s+'|'+sub].get(ST.pub[kk]);
    row.querySelector('.meta').textContent=inf?('단원 '+inf.units.size+'개 · 어휘 '+inf.n+'개'):(has?'':'이 학년·학기에는 자료가 없어요.');
    if(!has) row.querySelector('.meta').style.display='block';
    box.appendChild(row);
  });
}
function chosen(){
  const out=[];
  SUBJ.forEach(sub=>{ const kk=key(sub); if(ST.on[kk]&&ST.pub[kk]) out.push({sub,p:ST.pub[kk]}); });
  return out;
}
function pick(){
  const c=chosen(), map=new Map(c.map(x=>[x.sub,x.p]));
  return DATA.filter(x=>x.g===ST.g&&x.s===ST.s&&map.get(x.sub)===x.p);
}
function renderSum(){
  const c=chosen(), rows=pick();
  const ul=c.map(x=>{ const inf=IDX[ST.g+'|'+ST.s+'|'+x.sub].get(x.p); return '<li><b style="font-size:15px;color:inherit">'+x.sub+'</b> · '+(x.sub==='국어'?'국정':pubLabel(x.p))+' <span style="color:#6b7280">(어휘 '+inf.n+'개)</span></li>'; }).join('');
  $('#sum').innerHTML='<b>'+esc(ST.school.trim()||'(학교 이름 입력)')+' '+ST.g+'학년 '+(ST.cls.trim()?esc(ST.cls.trim())+' ':'')+ST.s+'학기</b> · 어휘 '+rows.length+'개'+(c.length?'<ul>'+ul+'</ul>':'<div style="margin-top:6px;color:#6b7280">선택된 과목이 없어요.</div>');
  $('#deploy').disabled=$('#preview').disabled=!c.length;
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function render(subsToo){
  renderSeg('#gSeg',[3,4,5,6],ST.g,v=>{ ST.g=v; lset(); render(true); },'학년');
  renderSeg('#sSeg',[1,2],ST.s,v=>{ ST.s=v; lset(); render(true); },'학기');
  renderSubs(); renderSum();
}
function build(){
  const school=ST.school.trim(), c=chosen();
  if(!school){ $('#warn').textContent='학교 이름을 입력해 주세요.'; $('#school').focus(); return null; }
  if(!c.length){ $('#warn').textContent='과목을 하나 이상 선택해 주세요.'; return null; }
  $('#warn').textContent='';
  const subjects=c.map(x=>x.sub), publishers={};
  c.forEach(x=>{ publishers[x.sub]=x.sub==='국어'?'국정':pubLabel(x.p); });
  const cls=ST.cls.trim();
  const cfg={school, className:cls, grade:ST.g, semester:ST.s, subjects, publishers};
  const hash='#g='+cfg.grade+'&s='+cfg.semester+'&sc='+enc(school)+(cls?'&c='+enc(cls):'')+'&sub='+subjects.map(s=>enc(s)+':'+enc(publishers[s])).join(',');
  return {cfg, hash, url:cardUrl()+hash, n:pick().length};
}
function label(cfg){ return cfg.school+' '+cfg.grade+'학년 '+(cfg.className?cfg.className+' ':'')+cfg.semester+'학기'; }
function guideText(r){
  const c=r.cfg;
  return '📚 청자골 아학 어휘카드 · '+label(c)+'\n'
    +'과목: '+c.subjects.map(s=>s+'('+c.publishers[s]+')').join(', ')+' · 어휘 '+r.n+'개\n\n'
    +'아래 링크를 한 번만 열고 "홈 화면에 추가"하면, 그다음부터는 인터넷이 없어도 쓸 수 있어요.\n'
    +'▶ '+r.url+'\n\n'
    +'[아이폰·아이패드] Safari로 링크 열기 → 아래쪽 공유 버튼(네모에 화살표) → "홈 화면에 추가" → 추가\n'
    +'[안드로이드] Chrome으로 링크 열기 → 오른쪽 위 ⋮ 메뉴 → "홈 화면에 추가"(또는 "앱 설치")\n'
    +'※ 꼭 홈 화면의 "어휘카드" 아이콘으로 열어야 학습 기록이 이어져요.';
}
let QRDATA=null;
function drawQR(url){
  const box=$('#qr'); box.innerHTML='';
  if(typeof qrcode!=='function'){ box.innerHTML='<p class="note" style="width:232px;margin:0">QR 그리기 도구를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.</p>'; QRDATA=null; return; }
  try{
    const q=qrcode(0,'M'); q.addData(url); q.make(); /* 링크는 이미 ASCII(퍼센트 인코딩) */
    const img=document.createElement('img'); img.src=q.createDataURL(6,8); img.alt='학급 QR 코드'; box.appendChild(img); QRDATA=img.src;
  }catch(e){ box.textContent='QR을 만들지 못했어요: '+e.message; QRDATA=null; }
}
async function copyText(t,msg){ try{ await navigator.clipboard.writeText(t); toast(msg); }catch(e){ const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); toast(msg); }catch(_){ toast('복사가 막혀 있어요. 직접 드래그해서 복사해 주세요.'); } ta.remove(); } }
let LAST=null;
$('#deploy').onclick=()=>{
  const r=build(); if(!r) return; LAST=r;
  $('#link').value=r.url; $('#guide').textContent=guideText(r); drawQR(r.url);
  $('#out').hidden=false; $('#out').scrollIntoView({behavior:'smooth',block:'start'});
  toast('학급 링크와 QR을 만들었어요 · 어휘 '+r.n+'개');
};
$('#copyLink').onclick=()=>{ if(LAST) copyText(LAST.url,'링크를 복사했어요'); };
$('#copyGuide').onclick=()=>{ if(LAST) copyText(guideText(LAST),'안내문을 복사했어요'); };
$('#qrSave').onclick=()=>{
  if(!QRDATA||!LAST) return;
  const im=new Image(); im.onload=()=>{ const cv=document.createElement('canvas'); cv.width=im.width*2; cv.height=im.height*2; const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#fff'; g.fillRect(0,0,cv.width,cv.height); g.drawImage(im,0,0,cv.width,cv.height);
    const a=document.createElement('a'); a.href=cv.toDataURL('image/png'); a.download=('QR_'+label(LAST.cfg)).replace(/[\\\/:*?"<>|\s]+/g,'_')+'.png'; document.body.appendChild(a); a.click(); a.remove(); };
  im.src=QRDATA;
};
$('#printGuide').onclick=()=>{
  if(!LAST) return; const c=LAST.cfg, w=window.open('','_blank'); if(!w){ toast('팝업이 막혔어요. 팝업을 허용해 주세요.'); return; }
  const steps='<ol><li><b>링크 열기</b> — 아래 QR을 카메라로 찍거나, 알림장의 링크를 눌러요.<br><small>아이폰·아이패드는 꼭 <b>Safari</b>로, 안드로이드는 <b>Chrome</b>으로 열어요.</small></li>'
    +'<li><b>홈 화면에 추가</b><br>· 아이폰·아이패드: 아래쪽 <b>공유 버튼</b>(네모에 화살표 ⬆) → <b>홈 화면에 추가</b> → <b>추가</b><br>· 안드로이드: 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b>(또는 앱 설치)</li>'
    +'<li><b>아이콘으로 열기</b> — 홈 화면의 <b>어휘카드</b> 아이콘을 눌러요. 한 번 추가하면 <b>인터넷이 없어도</b> 돼요.</li></ol>';
  w.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>어휘카드 설치 안내 · '+esc(label(c))+'</title><style>body{font-family:-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;margin:0;padding:28px 32px;color:#111827;line-height:1.6}h1{font-size:28px;margin:0 0 4px}.sub{color:#4b5563;font-size:16px;margin:0 0 22px}.wrap{display:flex;gap:30px;align-items:flex-start}.qr img{width:300px;height:300px;image-rendering:pixelated;border:1px solid #d1d5db;padding:6px;border-radius:12px}ol{padding-left:22px;font-size:18px;margin:0}li{margin:0 0 14px}small{color:#4b5563;font-size:15px}.url{margin-top:18px;font-size:14px;color:#374151;word-break:break-all;background:#f3f4f6;padding:10px 12px;border-radius:10px}.foot{margin-top:24px;font-size:13px;color:#6b7280}@media print{body{padding:10mm 12mm}}</style></head><body>'
    +'<h1>📚 청자골 아학 어휘카드 설치 안내</h1><p class="sub">'+esc(label(c))+' · '+esc(c.subjects.map(s=>s+'('+c.publishers[s]+')').join(', '))+' · 어휘 '+LAST.n+'개</p>'
    +'<div class="wrap"><div class="qr">'+(QRDATA?'<img src="'+QRDATA+'" alt="QR">':'')+'</div><div>'+steps+'<div class="url">'+esc(LAST.url)+'</div></div></div>'
    +'<p class="foot">※ 학습 기록은 각자 기기에만 저장돼요. 홈 화면 아이콘으로 열어야 기록이 이어져요. 새 학기에는 선생님이 새 링크를 줘요.</p>'
    +'<script>setTimeout(function(){window.print()},300)<\/script></body></html>');
  w.document.close();
};
$('#preview').onclick=()=>{
  const r=build(); if(!r) return;
  const w=window.open(r.url+'&pv=1','_blank'); if(!w) toast('팝업이 막혔어요. 팝업을 허용해 주세요.');
};
$('#cardUrl').value=cardUrl();
$('#cardUrl').addEventListener('change',e=>{ const v=e.target.value.trim(); try{ if(v) localStorage.setItem(CARD_KEY,v.endsWith('/')?v:v+'/'); else localStorage.removeItem(CARD_KEY); }catch(_){} e.target.value=cardUrl(); if(LAST) $('#deploy').click(); });
$('#school').value=ST.school; $('#cls').value=ST.cls;
$('#school').addEventListener('input',e=>{ ST.school=e.target.value; lset(); renderSum(); });
$('#cls').addEventListener('input',e=>{ ST.cls=e.target.value; lset(); renderSum(); });
render();
