/* Family Command · secure AI/document transport + monthly budget · 2026-08-21 */
(()=>{
  const AI_OLD='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai';
  const AI_SAFE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai-budgeted';
  const DOC='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents';
  const nativeFetch=window.fetch.bind(window);

  function accessKey(){
    try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(e){}
    try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}
  }
  function transform(raw){
    try{
      let s=String(raw||'');
      if(s.startsWith(AI_OLD))s=AI_SAFE+s.slice(AI_OLD.length);
      const secure=s.startsWith(AI_SAFE)||s.startsWith(DOC);
      if(!secure)return{url:s,secure:false};
      const u=new URL(s);u.searchParams.delete('key');
      return{url:u.toString(),secure:true};
    }catch(e){return{url:String(raw||''),secure:false}}
  }
  window.fetch=function(input,init={}){
    try{
      const req=input instanceof Request?input:null;
      const t=transform(req?req.url:input);
      if(!t.secure)return nativeFetch(input,init);
      const headers=new Headers(req?req.headers:undefined);
      new Headers(init?.headers||{}).forEach((v,k)=>headers.set(k,v));
      const k=accessKey();if(k)headers.set('x-fc-access',k);
      if(req){const next=new Request(t.url,req);return nativeFetch(next,{...init,headers})}
      return nativeFetch(t.url,{...init,headers});
    }catch(e){return nativeFetch(input,init)}
  };

  async function loadBudget(){
    const k=accessKey();if(!k)return null;
    try{
      const r=await nativeFetch(AI_SAFE+'/budget',{cache:'no-store',headers:{'x-fc-access':k}}),j=await r.json().catch(()=>({}));
      return r.ok&&j.ok?j.budget:null;
    }catch(e){return null}
  }
  function fmt(n){return Number(n||0).toFixed(2)}
  async function decorate(){
    const root=document.getElementById('fcAi');if(!root||root.querySelector('.fc-ai-budget'))return;
    const head=root.querySelector('.aisheet header');if(!head)return;
    const box=document.createElement('div');box.className='fc-ai-budget';box.textContent='KI-Budget wird geladen …';head.insertAdjacentElement('afterend',box);
    const b=await loadBudget();if(!b){box.textContent='Monatslimit: 10 CHF';return}
    const rem=Math.max(0,Number(b.remaining_chf||0));
    box.textContent=rem>0?'Monatsbudget: '+fmt(rem)+' CHF von 10.00 CHF übrig':'Monatslimit erreicht · Family AI bis nächsten Monat gesperrt';
    box.classList.toggle('blocked',rem<=0);
  }

  window.fcOpenOriginal=async function(id){
    const k=accessKey();if(!k){try{toast('Privater Zugang fehlt')}catch(e){}return}
    const popup=window.open('about:blank','_blank');
    try{
      const r=await nativeFetch(DOC+'/file?id='+encodeURIComponent(id)+'&json=1',{cache:'no-store',headers:{'x-fc-access':k}}),j=await r.json().catch(()=>({}));
      if(!r.ok||!j.url)throw new Error(j.error||'Dokument konnte nicht geöffnet werden');
      if(popup)popup.location.replace(j.url);else location.assign(j.url);
    }catch(e){
      try{popup?.close()}catch(_){}
      try{toast('Dokument konnte nicht geöffnet werden')}catch(_){}
    }
  };

  const style=document.createElement('style');style.textContent='.fc-ai-budget{margin:0 18px 10px;padding:9px 12px;border:1px solid #dce3ec;border-radius:12px;background:#f7f9fc;color:#526071;font-size:12px;font-weight:700}.fc-ai-budget.blocked{background:#fff1f2;border-color:#fecdd3;color:#9f1239}';document.head.appendChild(style);
  new MutationObserver(()=>decorate()).observe(document.documentElement,{childList:true,subtree:true});
  window.fcAiBudgetStatus=loadBudget;
})();