/* ===== 학급 설정 화면(링크 없이 열렸을 때만) ===== */
function showSetup(){
  const $=s=>document.querySelector(s), SUBJ=['국어','수학','사회','과학'];
  document.body.classList.add('setupOn');
  $('#setup').hidden=false;
  const st={g:5,s:1,on:{},pub:{}};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pubsOf=(sub)=>[...new Set(ROWS.filter(x=>x.g===st.g&&x.s===st.s&&x.sub===sub).map(x=>x.p))];
  const seg=(el,vals,cur,fn,suf)=>{ el.innerHTML=''; vals.forEach(v=>{ const b=document.createElement('button'); b.type='button'; b.textContent=v+suf; if(v===cur) b.classList.add('on'); b.onclick=()=>fn(v); el.appendChild(b); }); };
  function draw(){
    seg($('#suG'),[3,4,5,6],st.g,v=>{ st.g=v; draw(); },'학년');
    seg($('#suS'),[1,2],st.s,v=>{ st.s=v; draw(); },'학기');
    const box=$('#suSubs'); box.innerHTML='';
    SUBJ.forEach(sub=>{
      const opts=pubsOf(sub), k=st.g+'-'+st.s+'|'+sub, has=opts.length>0;
      if(!(k in st.on)) st.on[k]=has; if(!has) st.on[k]=false;
      if(!opts.includes(st.pub[k])) st.pub[k]=opts[0]||'';
      const row=document.createElement('div'); row.className='suRow';
      row.innerHTML='<label><input type="checkbox"'+(st.on[k]?' checked':'')+(has?'':' disabled')+'>'+sub+'</label><select'+((st.on[k]&&has)?'':' disabled')+'></select>';
      const sel=row.querySelector('select');
      if(!has) sel.innerHTML='<option>이 학년·학기 자료 없음</option>';
      opts.forEach(p=>{ const o=document.createElement('option'); o.value=p; const n=ROWS.filter(x=>x.g===st.g&&x.s===st.s&&x.sub===sub&&x.p===p).length; o.textContent=p+' ('+n+'개)'; if(p===st.pub[k]) o.selected=true; sel.appendChild(o); });
      row.querySelector('input').onchange=e=>{ st.on[k]=e.target.checked; draw(); };
      sel.onchange=()=>{ st.pub[k]=sel.value; };
      box.appendChild(row);
    });
  }
  draw();
  $('#suGo').onclick=()=>{
    const school=$('#suSchool').value.trim(), cls=$('#suCls').value.trim();
    if(!school){ $('#suWarn').textContent='학교 이름을 입력해 주세요.'; $('#suSchool').focus(); return; }
    const subs=SUBJ.filter(sub=>st.on[st.g+'-'+st.s+'|'+sub]&&st.pub[st.g+'-'+st.s+'|'+sub]);
    if(!subs.length){ $('#suWarn').textContent='과목을 하나 이상 골라 주세요.'; return; }
    const enc=v=>encodeURIComponent(String(v));
    const hash='#g='+st.g+'&s='+st.s+'&sc='+enc(school)+(cls?'&c='+enc(cls):'')+'&sub='+subs.map(sub=>enc(sub)+':'+enc(st.pub[st.g+'-'+st.s+'|'+sub])).join(',');
    history.replaceState(null,'',location.pathname+location.search+hash); location.reload();
  };
}
