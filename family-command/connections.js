/* Family Command · iCloud Calendar + Bluewin connectors · 2026-09-25 */
(()=>{
'use strict';
if(window.__fcConnectionsInstalled)return;window.__fcConnectionsInstalled=true;
const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-connectors';
const STORE='fc-private-access-v1',COOKIE='fc_private_access';
let snapshot={connections:[],mail:[]},busy=false,lastAuto=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));if(p)return decodeURIComponent(p.slice(COOKIE.length+1))}catch{}try{return localStorage.getItem(STORE)||''}catch{return''}}
async function api(body=null){
  const headers={'x-fc-access':accessKey()};if(body)headers['content-type']='application/json';
  const r=await fetch(BASE,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;
}
function conn(p){return(snapshot.connections||[]).find(x=>x.provider===p)||null}
function dateTime(v){if(!v)return'Noch nie';try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return String(v)}}
function stateLabel(c){if(!c)return['Nicht verbunden','off'];if(c.last_status==='error')return['Fehler','error'];if(c.last_status==='connected')return['Verbunden','ok'];return['Eingerichtet','saved']}
function modal(){
  let m=document.getElementById('fcConnectionsModal');if(m)return m;
  m=document.createElement('div');m.id='fcConnectionsModal';m.className='fcc-modal';
  m.innerHTML='<section class="fcc-sheet" role="dialog" aria-modal="true" aria-labelledby="fccTitle"><div class="fcc-head"><div><small>SYSTEM & SICHERHEIT</small><h2 id="fccTitle">Verbindungen</h2><p>Kalender und E-Mail direkt mit der Familienzentrale verbinden.</p></div><button type="button" data-fcc-close aria-label="Schliessen">×</button></div><div class="fcc-body" id="fccBody"></div></section>';
  m.querySelector('[data-fcc-close]').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m);return m;
}
function card(provider,title,sub,icon){
  const c=conn(provider),[label,tone]=stateLabel(c);
  return '<article class="fcc-card" data-provider="'+provider+'"><div class="fcc-card-top"><span class="fcc-provider-icon">'+icon+'</span><div><h3>'+esc(title)+'</h3><p>'+esc(sub)+'</p></div><span class="fcc-state '+tone+'">'+esc(label)+'</span></div>'+
    (c?'<div class="fcc-meta"><span><b>Konto</b>'+esc(c.account_identifier||'')+'</span><span><b>Letzte Synchronisation</b>'+esc(dateTime(c.last_sync_at))+'</span></div>':'')+
    (c?.last_error?'<div class="fcc-error">'+esc(c.last_error)+'</div>':'')+
    '<div class="fcc-actions">'+
      (c?'<button type="button" data-fcc-sync="'+provider+'" class="primary">Jetzt synchronisieren</button><button type="button" data-fcc-setup="'+provider+'">Zugang ändern</button><button type="button" data-fcc-disconnect="'+provider+'" class="danger">Trennen</button>':'<button type="button" data-fcc-setup="'+provider+'" class="primary">Verbinden</button>')+
    '</div>'+
    (provider==='icloud'&&c?'<label class="fcc-toggle"><input type="checkbox" data-fcc-push '+(c.settings?.push_family_events?'checked':'')+'><span></span><div><b>Familienzentrale → iCloud</b><small>Meine zukünftigen Termine zusätzlich in den iCloud-Kalender schreiben.</small></div></label>':'')+
  '</article>';
}
function render(){
  const m=modal(),body=m.querySelector('#fccBody');
  const mail=(snapshot.mail||[]).slice(0,8);
  body.innerHTML=
    '<div class="fcc-intro"><b>Direkt verbunden</b><span>Passwörter werden serverseitig verschlüsselt gespeichert und nie im Browser angezeigt.</span></div>'+
    card('icloud','Apple Kalender','iCloud-Kalender mit Terminen der Familienzentrale synchronisieren.','📅')+
    card('bluewin','Bluewin E-Mail','Posteingang lesen und wichtige Mails in der Familienzentrale sichtbar machen.','✉️')+
    (conn('bluewin')?'<section class="fcc-mail"><div class="fcc-section-head"><div><small>BLUEWIN</small><h3>Letzte E-Mails</h3></div><button type="button" data-fcc-sync="bluewin">Aktualisieren</button></div>'+
      (mail.length?'<div class="fcc-mail-list">'+mail.map(x=>'<div class="fcc-mail-row"><div><b>'+esc(x.subject||'(Ohne Betreff)')+'</b><span>'+esc(x.sender||'Unbekannter Absender')+'</span></div><time>'+esc(x.received_at?dateTime(x.received_at):'')+'</time></div>').join('')+'</div>':'<div class="fcc-empty">Noch keine E-Mails synchronisiert.</div>')+'</section>':'')+
    '<div class="fcc-note"><b>Apple:</b> Verwende ein app-spezifisches Passwort, nicht dein normales Apple-Account-Passwort. <b>Bluewin:</b> Verwende dein E-Mail-Passwort, nicht das Swisscom-Login-Passwort.</div>';
  bind(body);
}
function bind(root){
  root.querySelectorAll('[data-fcc-setup]').forEach(b=>b.onclick=()=>setup(b.dataset.fccSetup));
  root.querySelectorAll('[data-fcc-sync]').forEach(b=>b.onclick=()=>sync(b.dataset.fccSync,b));
  root.querySelectorAll('[data-fcc-disconnect]').forEach(b=>b.onclick=()=>disconnect(b.dataset.fccDisconnect));
  const push=root.querySelector('[data-fcc-push]');if(push)push.onchange=async()=>{try{await api({action:'settings',provider:'icloud',settings:{push_family_events:push.checked}});await refresh(false)}catch(e){notice(e.message,'error')}};
}
function notice(message,tone='info'){
  const body=document.getElementById('fccBody');if(!body)return;let n=body.querySelector('.fcc-toast');if(!n){n=document.createElement('div');n.className='fcc-toast';body.prepend(n)}n.className='fcc-toast '+tone;n.textContent=message;setTimeout(()=>n?.remove(),4500);
}
async function refresh(showLoading=true){
  if(busy)return;busy=true;
  try{if(showLoading){const b=modal().querySelector('#fccBody');b.innerHTML='<div class="fcc-loading">Verbindungen werden geladen …</div>'}
    const j=await api();snapshot={connections:j.connections||[],mail:j.mail||[]};render();
  }catch(e){const b=modal().querySelector('#fccBody');b.innerHTML='<div class="fcc-errorbox"><b>Verbindungen konnten nicht geladen werden.</b><span>'+esc(e.message)+'</span><button type="button" data-retry>Erneut versuchen</button></div>';b.querySelector('[data-retry]').onclick=()=>refresh()}
  finally{busy=false}
}
function setup(provider){
  const c=conn(provider),body=modal().querySelector('#fccBody'),icloud=provider==='icloud';
  body.innerHTML='<button type="button" class="fcc-back" data-back>‹ Zurück</button><form class="fcc-form" id="fccSetupForm">'+
    '<div class="fcc-form-title"><span>'+(icloud?'📅':'✉️')+'</span><div><small>'+esc(icloud?'APPLE KALENDER':'BLUEWIN E-MAIL')+'</small><h3>'+esc(c?'Zugang aktualisieren':'Verbindung einrichten')+'</h3></div></div>'+
    '<label><span>'+esc(icloud?'Apple Account E-Mail':'Bluewin E-Mail-Adresse')+'</span><input name="account" type="email" autocomplete="username" required value="'+esc(c?.account_identifier||'')+'"></label>'+
    '<label><span>'+esc(icloud?'App-spezifisches Passwort':'Bluewin E-Mail-Passwort')+'</span><input name="secret" type="password" autocomplete="new-password" required placeholder="Wird verschlüsselt gespeichert"></label>'+
    (icloud?'<label class="fcc-toggle in-form"><input name="push" type="checkbox" '+(c?.settings?.push_family_events!==false?'checked':'')+'><span></span><div><b>Termine auch zu iCloud schreiben</b><small>Zukünftige Termine für Oli werden zusätzlich im iCloud-Kalender geführt.</small></div></label><div class="fcc-help">Das app-spezifische Passwort erstellst du unter <a href="https://account.apple.com/" target="_blank" rel="noopener">account.apple.com</a> → Anmeldung und Sicherheit → App-spezifische Passwörter.</div>':'<div class="fcc-help">Das Bluewin E-Mail-Passwort ist das Passwort deines Postfachs. Es ist nicht dasselbe wie dein Swisscom Login.</div>')+
    '<div class="fcc-form-actions"><button type="submit" class="primary">Speichern, prüfen & synchronisieren</button><button type="button" data-cancel>Abbrechen</button></div><div class="fcc-form-status" aria-live="polite"></div></form>';
  body.querySelector('[data-back]').onclick=render;body.querySelector('[data-cancel]').onclick=render;
  body.querySelector('#fccSetupForm').onsubmit=async e=>{
    e.preventDefault();const f=e.currentTarget,st=f.querySelector('.fcc-form-status'),btn=f.querySelector('button[type="submit"]');
    btn.disabled=true;st.className='fcc-form-status';st.textContent='Zugang wird sicher gespeichert …';
    try{
      await api({action:'save',provider,account:f.account.value.trim(),secret:f.secret.value,settings:icloud?{push_family_events:!!f.push.checked}:{}});
      st.textContent='Verbindung wird geprüft …';await api({action:'test',provider});
      st.textContent='Synchronisation läuft …';const j=await api({action:'sync',provider});snapshot={connections:j.connections||[],mail:j.mail||[]};
      render();notice((icloud?'Apple Kalender':'Bluewin E-Mail')+' ist verbunden.','ok');
    }catch(err){st.className='fcc-form-status error';st.textContent=err.message||String(err);btn.disabled=false}
  };
}
async function sync(provider,button){
  const old=button?.textContent;if(button){button.disabled=true;button.textContent='Synchronisiert …'}
  try{const j=await api({action:'sync',provider});snapshot={connections:j.connections||[],mail:j.mail||[]};render();const r=j.results?.[provider];if(r?.error)notice(r.error,'error');else notice((provider==='icloud'?'Kalender':'Bluewin')+' aktualisiert.','ok');try{window.__fcCloudState?.bootstrap?.()}catch{}}
  catch(e){notice(e.message,'error');if(button){button.disabled=false;button.textContent=old}}
}
async function disconnect(provider){
  if(!confirm((provider==='icloud'?'Apple Kalender':'Bluewin E-Mail')+' wirklich von der Familienzentrale trennen?'))return;
  try{const j=await api({action:'disconnect',provider});snapshot={connections:j.connections||[],mail:j.mail||[]};render();notice('Verbindung getrennt.','ok')}catch(e){notice(e.message,'error')}
}
async function maybeAutoSync(){
  if(Date.now()-lastAuto<20*60*1000)return;lastAuto=Date.now();
  try{const j=await api();snapshot={connections:j.connections||[],mail:j.mail||[]};const connected=snapshot.connections.filter(x=>x.enabled&&x.last_status==='connected');if(!connected.length)return;
    const stale=connected.some(x=>!x.last_sync_at||Date.now()-new Date(x.last_sync_at).getTime()>20*60*1000);if(stale){const s=await api({action:'sync',provider:'all'});snapshot={connections:s.connections||[],mail:s.mail||[]};if(document.getElementById('fcConnectionsModal'))render()}
  }catch(e){console.warn('fc_connectors_autosync',e)}
}
window.fcOpenConnections=()=>{modal();refresh();};
window.__fcConnections={open:window.fcOpenConnections,refresh,maybeAutoSync,status:()=>snapshot};
document.addEventListener('fc:v11-ready',()=>setTimeout(maybeAutoSync,1800));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeAutoSync()});
})();