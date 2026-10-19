
const DATA=VDATA;
const SUBJ=['국어','수학','사회','과학'];
const $=id=>document.getElementById(id);
const S={g:null,s:null,sub:null,pub:null,unit:null,i:0};
const BELL='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a1.6 1.6 0 0 1 1.6 1.6v.5A6.5 6.5 0 0 1 18.5 10.5v3.2l1.7 2.6a1 1 0 0 1-.84 1.55H4.64a1 1 0 0 1-.84-1.55l1.7-2.6v-3.2a6.5 6.5 0 0 1 4.9-6.4v-.5A1.6 1.6 0 0 1 12 2zm-2.2 17h4.4a2.2 2.2 0 0 1-4.4 0z"/></svg>';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
const keysOf=(o,num)=>{const k=Object.keys(o);return num?k.sort((a,b)=>a-b):k};
function fill(sel,vals,cur,fmt){
  sel.innerHTML=vals.map(v=>`<option value="${esc(v)}">${esc(fmt?fmt(v):v)}</option>`).join('');
  const use=vals.map(String).includes(String(cur))?String(cur):String(vals[0]);
  sel.value=use;return use;
}
function sync(from){
  if(from==='init'){Object.assign(S,store('ja-sel')||{})}
  const gs=keysOf(DATA,1);S.g=fill($('selGrade'),gs,S.g,v=>v+'학년');
  const ss=keysOf(DATA[S.g],1);S.s=fill($('selSem'),ss,S.s,v=>v+'학기');
  const subs=SUBJ.filter(x=>DATA[S.g][S.s][x]);S.sub=fill($('selSubject'),subs,S.sub);
  const pubs=keysOf(DATA[S.g][S.s][S.sub]);S.pub=fill($('selPub'),pubs,S.pub);
  const units=keysOf(book());S.unit=fill($('selUnit'),units,S.unit);
  if(from!=='idx'&&from!=='init')S.i=0;
  if(S.i>=units_items().length)S.i=0;
  store('ja-sel',{g:S.g,s:S.s,sub:S.sub,pub:S.pub,unit:S.unit});
  renderList();renderDetail();renderBell();
}
const book=()=>DATA[S.g][S.s][S.sub][S.pub];
const units_items=()=>book()[S.unit]||[];
function renderList(){
  const it=units_items();
  $('unitName').textContent=S.unit;$('unitSub').textContent=S.g+'학년 '+S.s+'학기 '+S.sub;$('cnt').textContent=it.length+'개';
  $('vocab').innerHTML=it.map((w,i)=>`<li><button type="button" data-i="${i}" aria-current="${i===S.i}"><span class="n">${i+1}</span><span>${esc(w[0])}</span></button></li>`).join('');
  const cur=$('vocab').querySelector('[aria-current="true"]');if(cur)cur.scrollIntoView({block:'nearest'});
}
function renderDetail(){
  const it=units_items(),w=it[S.i],d=$('detail');
  if(!w){d.innerHTML='<p class="empty">왼쪽에서 어휘를 골라 보세요.</p>';return}
  const [word,hz,hun,mean,ex]=w;
  const parts=hun?hun.split('|'):[];
  const wordH=esc(word);
  let h='';
  if(hz){
    if(parts.length===hz.length) h='<div class="hanja">'+[...hz].map((c,i)=>{const tk=parts[i].trim().split(/\s+/),um=tk.pop();return `<div class="hz"><big>${c}</big><small>${esc(tk.join(' '))} <span class="um">${esc(um)}</span></small></div>`}).join('')+'</div>';
    else h=`<div><div class="hzline">${hz}</div><div class="muted" style="font-size:13px">${esc(parts.join(' '))}</div></div>`;
  }else h='<div class="muted" style="font-size:14px">한자 표기가 없는 어휘예요.</div>';
  const exh=ex?esc(ex).split(esc(word)).join(`<mark>${esc(word)}</mark>`):'<span class="muted">교재에 예시 표현이 없어요.</span>';
  d.innerHTML=`<div class="crumb">${S.g}학년 ${S.s}학기 · ${S.sub} · ${esc(S.pub)} · ${esc(S.unit)}</div>
  <h2 class="word">${wordH}</h2>
  <div class="sec"><h3>한자</h3>${h}</div>
  <div class="sec"><h3>뜻</h3><p>${mean?esc(mean):'<span class="muted">교재에 뜻풀이가 없어요.</span>'}</p></div>
  <div class="sec"><h3>예시 표현</h3><p class="ex">${exh}</p></div>
  <div class="nav"><button class="btn ghost" id="prev" type="button" ${S.i===0?'disabled':''}>‹ 이전</button><button class="btn" id="next" type="button" ${S.i>=it.length-1?'disabled':''}>다음 ›</button></div>`;
  d.scrollTop=0;
}
function pick(i){S.i=i;renderList();renderDetail()}
function renderBell(){
  const n=units_items().length,b=store('ja-best')||{};
  const best=b[[S.g,S.s,S.sub,S.pub,S.unit].join('/')];
  $('bellInfo').textContent=n<2?'어휘가 부족해요.':`이 단원 어휘로 ${Math.min(10,n)}문제. 기회는 3번이에요.`+(best!=null?` 최고 ${best}점`:'');
  $('bellBtn').disabled=n<2;
}
['Grade','Sem','Subject','Pub','Unit'].forEach(k=>$('sel'+k).addEventListener('change',e=>{
  const m={Grade:'g',Sem:'s',Subject:'sub',Pub:'pub',Unit:'unit'}[k];S[m]=e.target.value;sync(k==='Unit'?'unit':k)}));
$('vocab').addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(+b.dataset.i)});
$('detail').addEventListener('click',e=>{
  if(e.target.id==='prev')pick(S.i-1);if(e.target.id==='next')pick(S.i+1)});
document.addEventListener('keydown',e=>{
  if($('ov').hidden&&!/SELECT|INPUT/.test(document.activeElement.tagName)){
    if(e.key==='ArrowDown'&&S.i<units_items().length-1){pick(S.i+1);e.preventDefault()}
    if(e.key==='ArrowUp'&&S.i>0){pick(S.i-1);e.preventDefault()}}
  if(e.key==='Escape'){closeQuiz();closeIx()}});

/* ---------- 골든벨 ---------- */
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
let Q=null;
function makeQuestions(){
  const items=units_items(),pool=[].concat(...Object.values(book()));
  const uniq=a=>{const s=new Set();return a.filter(x=>!s.has(x)&&s.add(x))};
  const qs=[];
  const lastT=[];
  shuf(items).slice(0,10).forEach(w=>{
    const [word,hz,hun,mean,ex]=w,types=[];
    if(mean)types.push('mean');
    if(hz)types.push('hanja');
    if(ex&&ex.includes(word))types.push('blank');
    if(mean)types.push('rev');
    if(!types.length)types.push('hanja0');
    const pref=types.filter(t=>t!==lastT[lastT.length-1]);
    const t=shuf(pref.length?pref:types)[0];lastT.push(t);
    const near=shuf(items.filter(x=>x[0]!==word)).concat(shuf(pool.filter(x=>x[0]!==word)));
    let ans,opts,prompt,hint='',type;
    if(t==='rev'){
      type='뜻 고르기';prompt=`‘${word}’의 뜻으로 알맞은 것은?`;
      ans=mean;opts=uniq([mean].concat(near.filter(x=>x[3]&&x[3]!==mean).map(x=>x[3]))).slice(0,4);
    }else{
      ans=word;
      opts=uniq([word].concat(near.map(x=>x[0]))).slice(0,4);
      if(t==='mean'){type='뜻풀이';prompt='다음 뜻에 알맞은 어휘는?';hint=mean.split(word).join('○○')}
      else if(t==='blank'){type='빈칸 채우기';prompt='빈칸에 들어갈 알맞은 어휘는?';hint=ex.split(word).join('(　　　)')}
      else{type='한자 어휘';prompt='다음 한자로 이루어진 어휘는?';
        const p=hun?hun.split('|'):[];hint=`<span class="qhz">${hz}</span>`+(p.length?`<div class="muted" style="font-size:13px">${esc(p.join(' · '))}</div>`:'');}
    }
    qs.push({type,prompt,hint,html:t==='hanja'||t==='hanja0',ans,opts:shuf(opts),w});
  });
  return qs;
}
function openQuiz(){
  Q={qs:makeQuestions(),i:0,lives:3,res:[],score:0,done:false,picked:null};
  $('ov').hidden=false;drawQ();$('quiz').scrollTop=0;
}
function closeQuiz(){$('ov').hidden=true;Q=null;renderBell()}
const ladder=()=>'<div class="ladder">'+Q.qs.map((_,i)=>`<span class="${Q.res[i]||(i===Q.i&&!Q.done?'cur':'')}"></span>`).join('')+'</div>';
const lives=()=>'<div class="lives" aria-label="남은 기회 '+Q.lives+'번">기회 '+[0,1,2].map(i=>`<i class="${i<Q.lives?'':'off'}"></i>`).join('')+'</div>';
function drawQ(){
  const q=Q.qs[Q.i],box=$('quiz');
  const hint=q.hint?(q.html?q.hint:`<p class="qtext" style="background:var(--celadon-soft);border-radius:10px;padding:10px 12px">${esc(q.hint)}</p>`):'';
  const L='①②③④';
  box.innerHTML=`<div class="qtop"><h2>${BELL}어휘 골든벨</h2>${lives()}</div>${ladder()}
  <div class="qcard"><div class="qtype">${Q.i+1} / ${Q.qs.length} · ${q.type}</div><p class="qtext">${esc(q.prompt)}</p>${hint}</div>
  <div class="opts">${q.opts.map((o,i)=>`<button type="button" class="opt" data-o="${i}"><b>${L[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>
  <div id="fb"></div>
  <button class="btn ghost" type="button" id="qquit">그만하기</button>`;
}
function answer(oi){
  const q=Q.qs[Q.i];if(Q.picked!==null)return;
  Q.picked=oi;const ok=q.opts[oi]===q.ans;
  document.querySelectorAll('.opt').forEach((b,i)=>{b.disabled=true;
    if(q.opts[i]===q.ans)b.classList.add('right');else if(i===oi)b.classList.add('wrong')});
  Q.res[Q.i]=ok?'ok':'bad';if(ok)Q.score++;else Q.lives--;
  const [word,hz,hun,mean,ex]=q.w;
  const last=Q.i>=Q.qs.length-1,out=Q.lives<=0;
  $('fb').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><strong>${ok?'정답이에요!':'아쉬워요. 정답은 ‘'+esc(q.type==='뜻 고르기'?word:q.ans)+'’'}</strong>${esc(word)}${hz?' ('+hz+')':''} · ${esc(mean||'')}</div>
  <button class="btn" type="button" id="qnext" style="width:100%;margin-top:8px">${out||last?'결과 보기':'다음 문제'}</button>`;
  document.querySelector('.qtop .lives').outerHTML=lives();
  document.querySelector('.ladder').outerHTML=ladder();
  $('qnext').scrollIntoView({block:'nearest'});$('qnext').focus({preventScroll:true});
}
function nextQ(){
  const out=Q.lives<=0,last=Q.i>=Q.qs.length-1;
  Q.picked=null;
  if(out||last){return result()}
  Q.i++;drawQ();$('quiz').scrollTop=0;
}
function result(){
  Q.done=true;
  const total=Q.qs.length,pts=Math.round(Q.score/total*100),win=Q.lives>0&&Q.res.length===total;
  const key=[S.g,S.s,S.sub,S.pub,S.unit].join('/'),b=store('ja-best')||{};
  if(b[key]==null||pts>b[key]){b[key]=pts;store('ja-best',b)}
  const wrong=Q.qs.filter((_,i)=>Q.res[i]==='bad');
  const skipped=total-Q.res.length;
  $('quiz').innerHTML=`<div class="res ${win?'win':''}">
    <div class="big">${BELL}</div>
    <h2>${win?'골든벨을 울렸어요!':'다음엔 꼭 울려 봐요'}</h2>
    <div class="muted">${Q.score}문제 정답 · ${pts}점${skipped?` · ${skipped}문제 남음`:''}</div>
    ${wrong.length?`<div class="wr"><strong style="font-size:13px" class="muted">다시 볼 어휘</strong>${wrong.map(q=>`<div><b>${esc(q.w[0])}</b>${q.w[1]?' ('+q.w[1]+')':''}<br><span class="muted">${esc(q.w[3]||'')}</span></div>`).join('')}</div>`:''}
    <div class="row"><button class="btn gold" type="button" id="qagain">다시 도전</button><button class="btn ghost" type="button" id="qclose">닫기</button></div></div>`;
  $('quiz').scrollTop=0;
}
$('bellBtn').addEventListener('click',openQuiz);
$('ov').addEventListener('click',e=>{
  if(e.target===$('ov'))return;
  const o=e.target.closest('.opt');if(o)return answer(+o.dataset.o);
  const id=e.target.id;
  if(id==='qnext')nextQ();else if(id==='qagain')openQuiz();else if(id==='qclose'||id==='qquit')closeQuiz();
});

/* ---------- 전체 색인 ---------- */
const ALL=[];
for(const g of keysOf(DATA,1))for(const s of keysOf(DATA[g],1))for(const sub of SUBJ.filter(x=>DATA[g][s][x]))for(const p of keysOf(DATA[g][s][sub]))for(const u of keysOf(DATA[g][s][sub][p]))DATA[g][s][sub][p][u].forEach((w,i)=>ALL.push({g,s,sub,p,u,i,w}));
const cntOf=o=>Object.values(o).reduce((a,v)=>a+(Array.isArray(v)?v.length:cntOf(v)),0);
function treeHTML(){
  let h='';
  for(const g of keysOf(DATA,1)){
    h+=`<details class="l1"><summary>${g}학년<em>${cntOf(DATA[g])}개</em></summary><div class="kid">`;
    for(const s of keysOf(DATA[g],1)){
      h+=`<details class="l2"><summary>${s}학기<em>${cntOf(DATA[g][s])}개</em></summary><div class="kid">`;
      for(const sub of SUBJ.filter(x=>DATA[g][s][x])){
        h+=`<details class="l3"><summary>${sub}<em>${cntOf(DATA[g][s][sub])}개</em></summary><div class="kid">`;
        for(const p of keysOf(DATA[g][s][sub])){
          h+=`<details class="l4"><summary>${esc(p)}<em>${cntOf(DATA[g][s][sub][p])}개</em></summary><div class="kid">`;
          for(const u of keysOf(DATA[g][s][sub][p])){
            h+=`<details class="l5" data-k="${esc([g,s,sub,p,u].join('\u0001'))}"><summary>${esc(u)}<em>${DATA[g][s][sub][p][u].length}개</em></summary><div class="chips"></div></details>`;
          }
          h+='</div></details>';
        }
        h+='</div></details>';
      }
      h+='</div></details>';
    }
    h+='</div></details>';
  }
  return h;
}
let treeDone=false;
function openIx(){
  $('ixov').hidden=false;
  if(!treeDone){$('ixbody').innerHTML=treeHTML();treeDone=true}
  $('ixsum').textContent='전체 '+ALL.length.toLocaleString()+'개 어휘 · 학년 › 학기 › 교과 › 출판사 › 단원';
  $('ixq').focus({preventScroll:true});
}
function closeIx(){$('ixov').hidden=true}
function jump(g,s,sub,p,u,i){
  Object.assign(S,{g:String(g),s:String(s),sub,pub:p,unit:u,i:+i});
  closeIx();sync('idx');
}
$('ixBtn').addEventListener('click',openIx);
$('ixClose').addEventListener('click',closeIx);
$('ixov').addEventListener('click',e=>{if(e.target===$('ixov'))closeIx()});
$('ixbody').addEventListener('toggle',e=>{
  const d=e.target;
  if(d.classList&&d.classList.contains('l5')&&d.open){
    const c=d.querySelector('.chips');
    if(!c.children.length){
      const [g,s,sub,p,u]=d.dataset.k.split('\u0001');
      c.innerHTML=DATA[g][s][sub][p][u].map((w,i)=>`<button type="button" class="chip" data-j="${esc(d.dataset.k)}\u0001${i}">${esc(w[0])}${w[1]?`<small>${w[1]}</small>`:''}</button>`).join('');
    }
  }
},true);
$('ixbody').addEventListener('click',e=>{
  const b=e.target.closest('[data-j]');if(!b)return;
  const [g,s,sub,p,u,i]=b.dataset.j.split('\u0001');jump(g,s,sub,p,u,i);
});
let qt=0;
$('ixq').addEventListener('input',e=>{
  clearTimeout(qt);const q=e.target.value.trim();
  qt=setTimeout(()=>{
    if(!q){$('ixbody').innerHTML=treeHTML();$('ixsum').textContent='전체 '+ALL.length.toLocaleString()+'개 어휘 · 학년 › 학기 › 교과 › 출판사 › 단원';return}
    const r=ALL.filter(x=>x.w[0].includes(q)||x.w[1].includes(q));
    $('ixsum').textContent=`‘${q}’ 검색 결과 ${r.length.toLocaleString()}개`+(r.length>200?' (앞 200개만 표시)':'');
    $('ixbody').innerHTML=r.slice(0,200).map(x=>`<button type="button" class="hit" data-j="${esc([x.g,x.s,x.sub,x.p,x.u,x.i].join('\u0001'))}"><b>${esc(x.w[0])}${x.w[1]?`<small>${x.w[1]}</small>`:''}</b><span>${x.g}학년 ${x.s}학기 · ${x.sub} · ${esc(x.p)} · ${esc(x.u)}</span></button>`).join('')||'<p class="muted" style="text-align:center">검색 결과가 없어요.</p>';
  },150);
});
sync('init');
