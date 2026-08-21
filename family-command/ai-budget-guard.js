/* Family Command · AI monthly budget guard · 2026-08-21 */
(()=>{
  const OLD='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai';
  const SAFE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai-budgeted';
  const nativeFetch=window.fetch.bind(window);
  function accessKey(){
    try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(e){}
    try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}
  }
  window.fetch=function(input,init){
    try{
      if(typeof input==='string'&&input.startsWith(OLD)) input=SAFE+input.slice(OLD.length);
      else if(input instanceof Request&&input.url.startsWith(OLD)) input=new Request(SAFE+input.url.slice(OLD.length),input);
    }catch(e){}
    return nativeFetch(input,init);
  };
  async function loadBudget(){
    const key=accessKey();if(!key)return null;
    try{const r=await nativeFetch(SAFE+'/budget?key='+encodeURIComponent(key),{cache:'no-store'});const j=await r.json();return r.ok&&j.ok?j.budget:null}catch(e){return null}
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
  const style=document.createElement('style');style.textContent='.fc-ai-budget{margin:0 18px 10px;padding:9px 12px;border:1px solid #dce3ec;border-radius:12px;background:#f7f9fc;color:#526071;font-size:12px;font-weight:700}.fc-ai-budget.blocked{background:#fff1f2;border-color:#fecdd3;color:#9f1239}';document.head.appendChild(style);
  new MutationObserver(()=>decorate()).observe(document.documentElement,{childList:true,subtree:true});
  window.fcAiBudgetStatus=loadBudget;
})();