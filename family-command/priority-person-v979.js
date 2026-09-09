/* Shared person identity and explicit assignment controls. No DOM enhancement pass. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const people=()=>typeof data!=='undefined'?(data.people||[]):[];
const ids=value=>[...new Set((Array.isArray(value)?value:[]).map(String).filter(Boolean))];
function badge(id){const p=people().find(x=>String(x.id)===String(id));if(!p)return'';const color=/^#[\da-f]{3,8}$/i.test(p.color||'')?p.color:'#526881';return `<span class="fc-person-badge" data-person-id="${esc(p.id)}" style="--fc-person:${color}"><i aria-hidden="true">${esc(String(p.name||'?').trim().charAt(0))}</i>${esc(p.name)}</span>`}
function picker(id,selected=[]){const chosen=ids(selected),known=people().map(p=>String(p.id)),all=[...people(),...chosen.filter(x=>!known.includes(x)).map(id=>({id,name:'Nicht mehr hinterlegte Person ('+id+')'}))];return `<fieldset class="fc-person-picker" id="${esc(id)}"><legend>Personen</legend>${all.map(p=>`<label><input type="checkbox" value="${esc(p.id)}" ${chosen.includes(String(p.id))?'checked':''}>${badge(p.id)||esc(p.name)}</label>`).join('')}</fieldset>`}
function selection(root,original=[],latest=original){const initial=ids(original),selected=ids([...root.querySelectorAll('input:checked')].map(x=>x.value)),removed=initial.filter(x=>!selected.includes(x));return ids([...ids(latest).filter(x=>!removed.includes(x)),...selected.filter(x=>!initial.includes(x))])}
// A statement of money owed is a memo, not a deadline. Explicit payment/collection actions stay actionable.
function isMoneyNote(x){const title=String(x?.title||'');return x?.kind!=='homework'&&/^(?:.+\bschuldet mir\b|ich schulde\b)/i.test(title)&&!/(?:\b(?:bezahlen|zahlen|überweisen|ueberweisen|einfordern|mahnen|frist|fällig|faellig)\b|\bbis\s+(?:\d|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|heute))/i.test(title)}
function compareWork(a,b,date){const rank=x=>{if(isMoneyNote(x))return 6;const d=String(x.date||'');if(d&&d<date)return 0;if(d&&d>date)return 4;if(x.priority)return 1;if(x.kind==='homework')return 2;return d?3:5};return rank(a)-rank(b)||String(a.date||'9999').localeCompare(String(b.date||'9999'))||Number(!!b.priority)-Number(!!a.priority)||Number(b.kind==='homework')-Number(a.kind==='homework')}
window.__fcPersonIdentity={badge,picker,selection,compareWork,isMoneyNote};
})();
