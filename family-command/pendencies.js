/* Family Command · Pendenzen · privacy-safe · 2026-08-23 */
(()=>{
  if(typeof data==='undefined')return;
  if(!Array.isArray(data.pendencies))data.pendencies=[];

  const escP=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=x=>Number(x||0).toFixed(2);
  const openItems=()=>data.pendencies.filter(x=>!x.done);
  const rerender=()=>{
    try{if(typeof renderToday==='function')renderToday()}catch(e){}
    try{if(typeof renderMore==='function'&&document.getElementById('more')?.classList.contains('active'))renderMore()}catch(e){}
  };

  window.fcTogglePendency=function(id,on){
    const x=data.pendencies.find(p=>String(p.id)===String(id));if(!x)return;
    x.done=!!on;x.doneAt=on?new Date().toISOString():null;
    try{if(typeof save==='function')save()}catch(e){}
    rerender();
    try{if(typeof toast==='function')toast(on?'Pendenz erledigt':'Pendenz wieder geöffnet')}catch(e){}
  };

  window.fcDeletePendency=function(id){
    if(!confirm('Pendenz wirklich löschen?'))return;
    data.pendencies=data.pendencies.filter(p=>String(p.id)!==String(id));
    try{if(typeof save==='function')save()}catch(e){}
    rerender();
  };

  window.fcOpenAddPendency=function(){
    document.getElementById('fcPendModal')?.remove();
    const m=document.createElement('div');m.id='fcPendModal';m.className='fcp-modal';
    m.innerHTML='<div class="fcp-sheet" role="dialog" aria-modal="true" aria-labelledby="fcpTitleHeading"><div class="fcp-head"><div><small>NEU</small><h3 id="fcpTitleHeading">Pendenz hinzufügen</h3></div><button type="button" aria-label="Schliessen">×</button></div><label for="fcpTitle">TITEL</label><input id="fcpTitle" autocomplete="off" placeholder="z. B. Rechnung zurückfordern"><label for="fcpAmount">BETRAG <span>optional</span></label><input id="fcpAmount" inputmode="decimal" autocomplete="off" placeholder="0.00"><label for="fcpNote">NOTIZ <span>optional</span></label><textarea id="fcpNote" placeholder="Worum geht es?"></textarea><button type="button" class="fcp-save">Speichern</button></div>';
    const close=()=>m.remove();m.querySelector('.fcp-head button').onclick=close;m.onclick=e=>{if(e.target===m)close()};m.querySelector('.fcp-save').onclick=window.fcSavePendency;
    document.body.appendChild(m);setTimeout(()=>document.getElementById('fcpTitle')?.focus(),50);
  };

  window.fcSavePendency=function(){
    const title=(document.getElementById('fcpTitle')?.value||'').trim();
    const raw=(document.getElementById('fcpAmount')?.value||'').trim().replace(',','.');
    const amount=raw?Number(raw):0,note=(document.getElementById('fcpNote')?.value||'').trim();
    if(!title){try{toast('Bitte Titel eingeben')}catch(e){};return}
    if(raw&&!Number.isFinite(amount)){try{toast('Bitte einen gültigen Betrag eingeben')}catch(e){};return}
    data.pendencies.push({id:'pend-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),personId:'oli',title,amount:Number.isFinite(amount)?amount:0,currency:'CHF',note,done:false,createdAt:new Date().toISOString()});
    try{if(typeof save==='function')save()}catch(e){}
    document.getElementById('fcPendModal')?.remove();rerender();
    try{if(typeof toast==='function')toast('Pendenz gespeichert')}catch(e){}
  };

  function row(x,full=false){
    const id=JSON.stringify(String(x.id));
    return '<div class="fcp-row '+(x.done?'done':'')+'"><label class="fcp-check"><input type="checkbox" '+(x.done?'checked':'')+' onchange="fcTogglePendency('+id+',this.checked)" aria-label="'+escP(x.title)+' '+(x.done?'wieder öffnen':'erledigen')+'"><span></span></label><div class="fcp-main"><div class="fcp-title"><b>'+escP(x.title)+'</b>'+(Number(x.amount)>0?'<strong>'+escP(x.currency||'CHF')+' '+money(x.amount)+'</strong>':'')+'</div>'+(x.note?'<p>'+escP(x.note)+'</p>':'')+'</div>'+(full?'<button type="button" class="fcp-del" onclick="fcDeletePendency('+id+')">Löschen</button>':'')+'</div>';
  }

  function todayBlock(){
    const list=openItems();if(!list.length)return'';
    return '<section class="fcp-today"><div class="fcp-minihead"><div><small>PENDENZEN</small><h3>'+list.length+' offen</h3></div><button type="button" onclick="fcOpenAddPendency()" aria-label="Pendenz hinzufügen">＋</button></div>'+list.slice(0,3).map(x=>row(x,false)).join('')+(list.length>3?'<p class="fcp-more">+'+(list.length-3)+' weitere unter Mehr</p>':'')+'</section>';
  }

  function moreBlock(){
    const open=openItems(),done=data.pendencies.filter(x=>x.done).slice().sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''));
    return '<div class="setting fcp-box"><div class="fcp-boxhead"><div><h4>Pendenzen</h4><p>'+open.length+' offen</p></div><button type="button" onclick="fcOpenAddPendency()">＋ Pendenz</button></div>'+(open.length?'<div class="fcp-list">'+open.map(x=>row(x,true)).join('')+'</div>':'<div class="fcp-empty">✓ Keine offenen Pendenzen.</div>')+(done.length?'<details class="fcp-done"><summary>Erledigte anzeigen ('+done.length+')</summary>'+done.map(x=>row(x,true)).join('')+'</details>':'')+'</div>';
  }

  const prevToday=typeof renderToday==='function'?renderToday:null;
  if(prevToday){
    const wrapped=function(){const out=prevToday.apply(this,arguments);const root=document.getElementById('today');if(root){root.querySelector('.fcp-today')?.remove();const html=todayBlock();if(html)root.insertAdjacentHTML('afterbegin',html)}return out};
    window.renderToday=wrapped;try{renderToday=wrapped}catch(e){}
  }
  const prevMore=typeof renderMore==='function'?renderMore:null;
  if(prevMore){
    const wrapped=function(){const out=prevMore.apply(this,arguments);const root=document.getElementById('more');if(root){root.querySelector('.fcp-box')?.remove();const stack=root.querySelector('.settings-stack');if(stack)stack.insertAdjacentHTML('afterbegin',moreBlock());else root.insertAdjacentHTML('beforeend',moreBlock())}return out};
    window.renderMore=wrapped;try{renderMore=wrapped}catch(e){}
  }

  const st=document.createElement('style');st.id='fc-pendencies-style';st.textContent=`
    .fcp-today{background:#fff;border:1px solid #dce3ec;border-radius:18px;padding:12px;display:grid;gap:8px;box-shadow:0 6px 18px rgba(23,32,51,.055);margin-bottom:10px}.fcp-minihead,.fcp-boxhead{display:flex;justify-content:space-between;align-items:center;gap:10px}.fcp-minihead small{font-size:8px;font-weight:1000;letter-spacing:.12em;color:#667085}.fcp-minihead h3{margin:2px 0 0;font-size:17px;color:#172033}.fcp-minihead button,.fcp-boxhead button{border:1px solid #dce3ec;background:#edf3fb;color:#27466f;border-radius:12px;padding:8px 10px;font-weight:900}.fcp-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:9px;align-items:start;padding:10px;border:1px solid #e3e8ef;border-radius:14px;background:#fbfcfe}.fcp-row.done{opacity:.58}.fcp-check input{position:absolute;opacity:0;pointer-events:none}.fcp-check span{width:22px;height:22px;border:2px solid #9aa7b7;border-radius:7px;display:block;background:#fff;position:relative}.fcp-check input:focus-visible+span{outline:3px solid rgba(49,95,150,.28);outline-offset:2px}.fcp-check input:checked+span{background:#426aa3;border-color:#426aa3}.fcp-check input:checked+span:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:14px;font-weight:1000}.fcp-main{min-width:0}.fcp-title{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.fcp-title b{font-size:12px;line-height:1.3;color:#172033;overflow-wrap:anywhere}.fcp-title strong{font-size:12px;white-space:nowrap;color:#27466f}.fcp-main p{margin:4px 0 0;font-size:9px;line-height:1.4;color:#667085}.fcp-del{border:0;background:transparent;color:#8a3b3b;font-size:9px;padding:6px}.fcp-more,.fcp-empty{margin:0;font-size:9px;color:#667085}.fcp-boxhead h4{margin:0}.fcp-boxhead p{margin:2px 0 0}.fcp-list{display:grid;gap:7px;margin-top:10px}.fcp-done{margin-top:10px}.fcp-done summary{font-size:9px;font-weight:900;color:#667085;margin-bottom:8px}.fcp-done .fcp-row{margin-top:6px}.fcp-modal{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:100050;display:flex;align-items:flex-end;justify-content:center;padding:12px}.fcp-sheet{width:min(520px,100%);background:#fff;border-radius:22px;padding:15px;margin-bottom:max(4px,env(safe-area-inset-bottom));box-shadow:0 20px 60px rgba(15,23,42,.3)}.fcp-head{display:flex;justify-content:space-between;align-items:start;margin-bottom:12px}.fcp-head small{font-size:8px;font-weight:1000;color:#667085;letter-spacing:.12em}.fcp-head h3{margin:3px 0 0}.fcp-head button{border:0;background:#f1f5f9;width:36px;height:36px;border-radius:999px;font-size:20px}.fcp-sheet label{display:block;font-size:8px;font-weight:1000;color:#667085;letter-spacing:.08em;margin:10px 0 5px}.fcp-sheet label span{font-weight:700}.fcp-sheet input,.fcp-sheet textarea{width:100%;box-sizing:border-box;border:1px solid #dce3ec;border-radius:12px;padding:11px;font:inherit}.fcp-sheet textarea{min-height:82px;resize:vertical}.fcp-save{width:100%;min-height:44px;border:0;background:#263651;color:#fff;border-radius:13px;padding:12px;font-weight:1000;margin-top:12px}
    @media(max-width:430px){.fcp-row{grid-template-columns:26px minmax(0,1fr)}.fcp-del{grid-column:2;justify-self:start}.fcp-title{flex-direction:column;gap:3px}.fcp-title strong{white-space:normal}}
  `;document.head.appendChild(st);

  try{if(typeof renderToday==='function')renderToday();if(document.getElementById('more')?.classList.contains('active')&&typeof renderMore==='function')renderMore()}catch(e){}
})();
