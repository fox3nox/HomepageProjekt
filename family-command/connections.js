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
function setSnapshot(j){snapshot={connections:j.connections||[],mail:j.mail||[]};document.dispatchEvent(new CustomEvent('fc:connections-updated',{detail:{mail:snapshot.mail,connections:snapshot.connections}}))}
function pad2(n){return String(n).padStart(2,'0')}
function isoDate(y,m,d){const dt=new Date(Number(y),Number(m)-1,Number(d),12);if(dt.getFullYear()!==Number(y)||dt.getMonth()!==Number(m)-1||dt.getDate()!==Number(d))return'';return `${y}-${pad2(m)}-${pad2(d)}`}
function mailDate(text,received){
  const s=String(text||'');
  let m=s.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);if(m)return isoDate(m[1],m[2],m[3]);
  m=s.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2}|\d{2})\b/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return isoDate(y,m[2],m[1])}
  m=s.match(/\b(\d{1,2})\.(\d{1,2})\.(?!\d)/);if(m){const base=received?new Date(received):new Date();let y=base.getFullYear(),x=isoDate(y,m[2],m[1]);if(x&&x<String(new Date().getFullYear())+'-01-01')x=isoDate(y+1,m[2],m[1]);return x}
  const months={januar:1,februar:2,märz:3,maerz:3,april:4,mai:5,juni:6,juli:7,august:8,september:9,oktober:10,november:11,dezember:12};
  m=s.toLowerCase().match(/\b(\d{1,2})\.?\s+(januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s+(20\d{2}))?/);
  if(m){const y=Number(m[3]||(received?new Date(received).getFullYear():new Date().getFullYear()));return isoDate(y,months[m[2]],m[1])}
  const base=new Date();if(/\bmorgen\b/i.test(s)){base.setDate(base.getDate()+1);return `${base.getFullYear()}-${pad2(base.getMonth()+1)}-${pad2(base.getDate())}`}
  if(/\bheute\b/i.test(s))return `${base.getFullYear()}-${pad2(base.getMonth()+1)}-${pad2(base.getDate())}`;
  return'';
}
function mailTime(text){
  const s=String(text||'');let m=s.match(/\b(?:um\s*)?(\d{1,2})[:.](\d{2})(?:\s*Uhr)?\b/i);if(m&&Number(m[1])<24&&Number(m[2])<60)return pad2(m[1])+':'+pad2(m[2]);
  m=s.match(/\bum\s+(\d{1,2})\s*Uhr\b/i);if(m&&Number(m[1])<24)return pad2(m[1])+':00';return'';
}
function mailImportance(mail,text){
  const subject=String(mail.subject||''),sender=String(mail.sender||''),all=(text||'').toLowerCase();
  const critical=/\b(sicherheit|security|kritisch|login|anmeldung|passwort|kennwort|account|konto|rechnung|invoice|zahlung|mahnung|frist|termin|arzt|zahnarzt|schule|kindergarten|eltern|versicherung|behörde|behoerde|steuer|sozial|spital|ambulanz|reservation|reservierung|bestätigung|bestaetigung)\b/i.test(all);
  if(critical)return{importance:'important',reason:'Wichtige Konto-, Termin- oder Verwaltungsinformation'};
  if(/notifications@github\.com/i.test(sender)&&!/security|dependabot|vulnerability|secret scanning/i.test(subject))return{importance:'unimportant',reason:'GitHub-Workflow-/Entwicklungsbenachrichtigung'};
  if(/\b(wog\.ch|world of games|just eat|newsletter|promo|marketing)\b/i.test(sender+' '+subject))return{importance:'unimportant',reason:'Newsletter oder Werbung'};
  if(/\b(rabatt|sale|angebot|angebote|deal|gutschein|entdecke|beliebtesten|jetzt sichern|nur heute|shopping|neuheiten|news(letter)?|aktion)\b/i.test(subject))return{importance:'unimportant',reason:'Werbung oder Angebot'};
  if(/\b(unsubscribe|abbestellen|newsletter abmelden)\b/i.test(all)&&!/rechnung|termin|sicherheit/i.test(all))return{importance:'unimportant',reason:'Newsletter'};
  return{importance:'normal',reason:''};
}
function mailInsight(mail){
  const text=[mail.subject,mail.preview].filter(Boolean).join(' ');
  const lower=text.toLowerCase(),date=mailDate(text,mail.received_at),time=mailTime(text);
  const event=/\b(termin|appointment|reservation|reservierung|einladung|elternabend|sprechstunde|arzt|zahnarzt|kontrolle|meeting|gespräch|besprechung|veranstaltung|abholung|liefertermin|buchung|führung|kurs|training)\b/i.test(lower);
  const todo=/\b(rechnung|zahlung|bezahlen|fällig|faellig|mahnung|frist|deadline|formular|anmeldung|anmelden|einreichen|rückmeldung|rueckmeldung|antworten|bestätigen|bestaetigen|unterschrift|unterlagen|erledigen)\b/i.test(lower);
  const type=event?'event':todo?'todo':'info';
  const confidence=type==='event'?(date?(time?'high':'medium'):'low'):type==='todo'?'medium':'low';
  const imp=mailImportance(mail,text);
  return{...mail,...imp,type,date,time,confidence,title:String(mail.subject||'Bluewin-Mail').trim(),actionable:type!=='info'&&imp.importance!=='unimportant'};
}
function mailInsightsAll(){return(snapshot.mail||[]).map(mailInsight)}
function mailInsights(){return mailInsightsAll().filter(x=>(x.triage_status||'pending')==='pending'&&x.importance!=='unimportant')}

function dateTime(v){if(!v)return'Noch nie';try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return String(v)}}
function stateLabel(c){if(!c)return['Nicht verbunden','off'];if(c.last_status==='error')return['Fehler','error'];if(c.last_status==='connected'&&c.last_error)return['Verbunden · Hinweis','saved'];if(c.last_status==='connected')return['Verbunden','ok'];return['Eingerichtet','saved']}
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
    (c?.last_error?'<div class="fcc-error '+(c.last_status==='connected'?'warning':'')+'">'+esc(c.last_error)+'</div>':'')+
    '<div class="fcc-actions">'+
      (c?'<button type="button" data-fcc-sync="'+provider+'" class="primary">Jetzt synchronisieren</button><button type="button" data-fcc-setup="'+provider+'">'+(provider==='icloud'?'App-Passwort eintragen':'Zugang ändern')+'</button><button type="button" data-fcc-disconnect="'+provider+'" class="danger">Trennen</button>':'<button type="button" data-fcc-setup="'+provider+'" class="primary">Verbinden</button>')+
    '</div>'+
    (provider==='icloud'&&c?'<label class="fcc-toggle"><input type="checkbox" data-fcc-push '+(c.settings?.push_family_events?'checked':'')+'><span></span><div><b>Familienzentrale → iCloud</b><small>Meine zukünftigen Termine zusätzlich in den iCloud-Kalender schreiben.</small></div></label>':'')+
  '</article>';
}
function renderMailAssistant(){
  const all=(snapshot.mail||[]).map(mailInsight);
  const active=all.filter(x=>(x.triage_status||'pending')==='pending');
  const relevant=active.filter(x=>x.importance!=='unimportant').slice(0,12);
  const unimportant=active.filter(x=>x.importance==='unimportant');
  const done=all.filter(x=>(x.triage_status||'pending')!=='pending').slice(0,4);
  if(!all.length)return'<div class="fcc-empty">Noch keine E-Mails synchronisiert.</div>';
  return '<div class="fcc-mail-groups">'+
    '<section class="fcc-mail-group"><div class="fcc-mail-group-head"><div><small>RELEVANT</small><b>'+relevant.length+' Mail'+(relevant.length===1?'':'s')+'</b></div></div>'+
      (relevant.length?'<div class="fcc-mail-list">'+relevant.map(mailCard).join('')+'</div>':'<div class="fcc-empty compact">Aktuell nichts Relevantes.</div>')+'</section>'+
    (unimportant.length?'<details class="fcc-unimportant"><summary><span><small>AUTOMATISCH ERKANNT</small><b>Unwichtig · '+unimportant.length+'</b></span><em>anzeigen</em></summary><div class="fcc-unimportant-tools"><span>Werbung, Newsletter und technische Benachrichtigungen</span><button type="button" data-delete-unimportant>Alle in Papierkorb</button></div><div class="fcc-mail-list">'+unimportant.map(mailCard).join('')+'</div></details>':'')+
    (done.length?'<details class="fcc-processed"><summary>Zuletzt verarbeitet · '+done.length+'</summary><div class="fcc-mail-list">'+done.map(mailCard).join('')+'</div></details>':'')+
  '</div>';
}
function render(){
  const m=modal(),body=m.querySelector('#fccBody');
  body.innerHTML=
    '<div class="fcc-intro"><b>Direkt verbunden</b><span>Passwörter werden serverseitig verschlüsselt gespeichert und nie im Browser angezeigt.</span></div>'+
    card('icloud','Apple Kalender','iCloud-Kalender mit Terminen der Familienzentrale synchronisieren.','📅')+
    card('bluewin','Bluewin E-Mail','Posteingang lesen und wichtige Mails in der Familienzentrale sichtbar machen.','✉️')+
    (conn('bluewin')?'<section class="fcc-mail"><div class="fcc-section-head"><div><small>BLUEWIN</small><h3>Mail-Assistent</h3></div><button type="button" data-fcc-sync="bluewin">Aktualisieren</button></div>'+renderMailAssistant()+'</section>':'')+
    '<div class="fcc-note"><b>Apple:</b> Verwende ein app-spezifisches Passwort, nicht dein normales Apple-Account-Passwort. <b>Bluewin:</b> Verwende dein E-Mail-Passwort, nicht das Swisscom-Login-Passwort.</div>';
  bind(body);
}
function cleanPreview(v){
  const s=String(v||'').trim();if(!s)return'';
  const noisy=/^(this is a multi-part|mime-version|content-type|content-transfer-encoding|--[-_a-z0-9]+)/i.test(s)||/\{margin:|@media|font-family:|background-color:/i.test(s)||/^[A-Za-z0-9+/=\s]{140,}$/.test(s.slice(0,500));
  return noisy?'':s.replace(/\s+/g,' ').slice(0,300);
}
function mailCard(mail){
  const i=mailInsight(mail),done=(mail.triage_status||'pending')!=='pending';
  const badge=i.importance==='unimportant'?'Unwichtig':i.type==='event'?'Termin':i.type==='todo'?'Aufgabe':i.importance==='important'?'Wichtig':'Info';
  const badgeClass=i.importance==='unimportant'?'unimportant':i.importance==='important'?'important':i.type;
  const meta=[i.date?i.date.split('-').reverse().join('.'):null,i.time||null].filter(Boolean).join(' · ');
  return '<article class="fcc-mail-card '+(done?'done ':'')+(i.importance==='unimportant'?'is-unimportant':'')+'" data-mail="'+esc(mail.message_uid)+'"><div class="fcc-mail-main"><div class="fcc-mail-top"><span class="fcc-mail-kind '+badgeClass+'">'+badge+'</span><time>'+esc(mail.received_at?dateTime(mail.received_at):'')+'</time></div><b>'+esc(mail.subject||'(Ohne Betreff)')+'</b><span>'+esc(mail.sender||'Unbekannter Absender')+'</span>'+(cleanPreview(mail.preview)?'<p>'+esc(cleanPreview(mail.preview))+'</p>':'')+(i.reason?'<em>'+esc(i.reason)+'</em>':meta?'<em>Erkannt: '+esc(meta)+'</em>':'')+'</div>'+
    (done?'<div class="fcc-mail-done-row"><div class="fcc-mail-done">'+(mail.triage_status==='ignored'?'Ignoriert':'Übernommen')+'</div><button type="button" class="fcc-mail-delete-done" data-mail-delete="'+esc(mail.message_uid)+'">Löschen</button></div>':'<div class="fcc-mail-actions">'+
      (i.type==='event'&&i.date&&i.importance!=='unimportant'?'<button type="button" class="primary" data-mail-action="event" data-mail-uid="'+esc(mail.message_uid)+'">Termin übernehmen</button>':'')+
      (i.type!=='info'&&i.importance!=='unimportant'?'<button type="button" data-mail-action="todo" data-mail-uid="'+esc(mail.message_uid)+'">Als Aufgabe</button>':'')+
      (i.importance!=='unimportant'?'<button type="button" data-mail-action="ignore" data-mail-uid="'+esc(mail.message_uid)+'">Ignorieren</button>':'')+
      '<button type="button" class="danger" data-mail-delete="'+esc(mail.message_uid)+'">Löschen</button></div>')+
    '</article>';
}
async function takeMailAction(uid,type){
  const mail=(snapshot.mail||[]).find(x=>String(x.message_uid)===String(uid));if(!mail)return;
  const i=mailInsight(mail);
  if(type==='event'&&!i.date){notice('In dieser Mail wurde kein eindeutiges Datum erkannt.','error');return}
  const what=type==='event'?'Termin':type==='todo'?'Aufgabe':'Mail';
  if(type!=='ignore'&&!confirm(what+' aus „'+i.title+'“ in die Familienzentrale übernehmen?'))return;
  try{
    const j=await api({action:'mail_action',uid,type,payload:{title:i.title,date:i.date,time:i.time}});
    setSnapshot(j);render();notice(type==='ignore'?'Mail ignoriert.':what+' wurde übernommen.','ok');
    try{window.__fcCloudState?.bootstrap?.()}catch{}
  }catch(e){notice(e.message||String(e),'error')}
}
async function deleteMails(uids){
  const clean=[...new Set((uids||[]).map(String).filter(Boolean))];if(!clean.length)return;
  const label=clean.length===1?'Diese E-Mail':'Diese '+clean.length+' E-Mails';
  if(!confirm(label+' wirklich in den Bluewin-Papierkorb verschieben?'))return;
  try{
    const j=await api({action:'mail_delete',uids:clean});
    setSnapshot(j);render();notice(j.result?.count+' E-Mail'+(j.result?.count===1?'':'s')+' in den Papierkorb verschoben.','ok');
  }catch(e){notice(e.message||String(e),'error')}
}
function bind(root){
  root.querySelectorAll('[data-fcc-setup]').forEach(b=>b.onclick=()=>setup(b.dataset.fccSetup));
  root.querySelectorAll('[data-fcc-sync]').forEach(b=>b.onclick=()=>sync(b.dataset.fccSync,b));
  root.querySelectorAll('[data-fcc-disconnect]').forEach(b=>b.onclick=()=>disconnect(b.dataset.fccDisconnect));
  const push=root.querySelector('[data-fcc-push]');if(push)push.onchange=async()=>{try{await api({action:'settings',provider:'icloud',settings:{push_family_events:push.checked}});await refresh(false)}catch(e){notice(e.message,'error')}};
  root.querySelectorAll('[data-mail-action]').forEach(b=>b.onclick=()=>takeMailAction(b.dataset.mailUid,b.dataset.mailAction));
  root.querySelectorAll('[data-mail-delete]').forEach(b=>b.onclick=()=>deleteMails([b.dataset.mailDelete]));
  root.querySelector('[data-delete-unimportant]')?.addEventListener('click',()=>{
    const ids=mailInsightsAll().filter(x=>x.importance==='unimportant'&&(x.triage_status||'pending')==='pending').map(x=>x.message_uid);
    deleteMails(ids);
  });
}
function notice(message,tone='info'){
  const body=document.getElementById('fccBody');if(!body)return;let n=body.querySelector('.fcc-toast');if(!n){n=document.createElement('div');n.className='fcc-toast';body.prepend(n)}n.className='fcc-toast '+tone;n.textContent=message;setTimeout(()=>n?.remove(),4500);
}
async function refresh(showLoading=true){
  if(busy)return;busy=true;
  try{if(showLoading){const b=modal().querySelector('#fccBody');b.innerHTML='<div class="fcc-loading">Verbindungen werden geladen …</div>'}
    const j=await api();setSnapshot(j);render();
  }catch(e){const b=modal().querySelector('#fccBody');b.innerHTML='<div class="fcc-errorbox"><b>Verbindungen konnten nicht geladen werden.</b><span>'+esc(e.message)+'</span><button type="button" data-retry>Erneut versuchen</button></div>';b.querySelector('[data-retry]').onclick=()=>refresh()}
  finally{busy=false}
}
function setup(provider){
  const c=conn(provider),body=modal().querySelector('#fccBody'),icloud=provider==='icloud';
  body.innerHTML='<button type="button" class="fcc-back" data-back>‹ Zurück</button><form class="fcc-form" id="fccSetupForm">'+
    '<div class="fcc-form-title"><span>'+(icloud?'📅':'✉️')+'</span><div><small>'+esc(icloud?'APPLE KALENDER':'BLUEWIN E-MAIL')+'</small><h3>'+esc(c?'Zugang aktualisieren':'Verbindung einrichten')+'</h3></div></div>'+
    '<label><span>'+esc(icloud?'Apple Account E-Mail':'Bluewin E-Mail-Adresse')+'</span><input name="account" type="email" autocomplete="username" required value="'+esc(c?.account_identifier||'')+'"></label>'+
    (icloud?'<div class="fcc-error"><b>Wichtig:</b> Hier funktioniert dein normales Apple-Account-Passwort nicht. Erstelle zuerst bei Apple ein <b>app-spezifisches Passwort</b> und füge genau dieses hier ein.</div>':'')+'<label><span>'+esc(icloud?'App-spezifisches Apple-Passwort':'Bluewin E-Mail-Passwort')+'</span><input name="secret" type="password" autocomplete="new-password" required placeholder="'+(icloud?'App-spezifisches Passwort von Apple':'Wird verschlüsselt gespeichert')+'"></label>'+
    (icloud?'<label class="fcc-toggle in-form"><input name="push" type="checkbox" '+(c?.settings?.push_family_events!==false?'checked':'')+'><span></span><div><b>Termine auch zu iCloud schreiben</b><small>Zukünftige Termine für Oli werden zusätzlich im iCloud-Kalender geführt.</small></div></label><div class="fcc-help"><b>Schritt 1:</b> Öffne <a href="https://account.apple.com/" target="_blank" rel="noopener">account.apple.com</a>. <b>Schritt 2:</b> Anmeldung und Sicherheit → App-spezifische Passwörter → Passwort erstellen. <b>Schritt 3:</b> Dieses neu erzeugte Passwort hier einfügen.</div>':'<div class="fcc-help">Das Bluewin E-Mail-Passwort ist das Passwort deines Postfachs. Es ist nicht dasselbe wie dein Swisscom Login.</div>')+
    '<div class="fcc-form-actions"><button type="submit" class="primary">Speichern, prüfen & synchronisieren</button><button type="button" data-cancel>Abbrechen</button></div><div class="fcc-form-status" aria-live="polite"></div></form>';
  body.querySelector('[data-back]').onclick=render;body.querySelector('[data-cancel]').onclick=render;
  body.querySelector('#fccSetupForm').onsubmit=async e=>{
    e.preventDefault();const f=e.currentTarget,st=f.querySelector('.fcc-form-status'),btn=f.querySelector('button[type="submit"]');
    btn.disabled=true;st.className='fcc-form-status';st.textContent='Zugang wird sicher gespeichert …';
    try{
      await api({action:'save',provider,account:f.account.value.trim(),secret:f.secret.value,settings:icloud?{push_family_events:!!f.push.checked}:{}});
      st.textContent='Verbindung wird geprüft …';await api({action:'test',provider});
      st.textContent='Synchronisation läuft …';const j=await api({action:'sync',provider});setSnapshot(j);
      render();notice((icloud?'Apple Kalender':'Bluewin E-Mail')+' ist verbunden.','ok');
    }catch(err){st.className='fcc-form-status error';st.textContent=err.message||String(err);btn.disabled=false}
  };
}
async function sync(provider,button){
  const old=button?.textContent;if(button){button.disabled=true;button.textContent='Synchronisiert …'}
  try{const j=await api({action:'sync',provider});setSnapshot(j);render();const r=j.results?.[provider];if(r?.error)notice(r.error,'error');else if(r?.warning)notice('Verbunden. Hinweis: '+r.warning,'info');else notice((provider==='icloud'?'Kalender':'Bluewin')+' aktualisiert.','ok');try{window.__fcCloudState?.bootstrap?.()}catch{}}
  catch(e){notice(e.message,'error');if(button){button.disabled=false;button.textContent=old}}
}
async function disconnect(provider){
  if(!confirm((provider==='icloud'?'Apple Kalender':'Bluewin E-Mail')+' wirklich von der Familienzentrale trennen?'))return;
  try{const j=await api({action:'disconnect',provider});setSnapshot(j);render();notice('Verbindung getrennt.','ok')}catch(e){notice(e.message,'error')}
}
async function maybeAutoSync(){
  if(Date.now()-lastAuto<20*60*1000)return;lastAuto=Date.now();
  try{const j=await api();setSnapshot(j);const connected=snapshot.connections.filter(x=>x.enabled&&x.last_status==='connected');if(!connected.length)return;
    const stale=connected.some(x=>!x.last_sync_at||Date.now()-new Date(x.last_sync_at).getTime()>20*60*1000);if(stale){const s=await api({action:'sync',provider:'all'});setSnapshot(s);if(document.getElementById('fcConnectionsModal'))render()}
  }catch(e){console.warn('fc_connectors_autosync',e)}
}
window.fcOpenConnections=()=>{modal();refresh();};
window.__fcConnections={open:window.fcOpenConnections,refresh,maybeAutoSync,status:()=>snapshot,insights:mailInsights,allInsights:mailInsightsAll};
document.addEventListener('fc:v11-ready',()=>setTimeout(maybeAutoSync,1800));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeAutoSync()});
})();