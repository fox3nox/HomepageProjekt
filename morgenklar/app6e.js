// MorgenKlar V6.3 – kindzentriertes Hinzufügen
(function childFirstAdd(){
  const style=document.createElement('style');
  style.textContent=`
    .child-card{padding-bottom:12px!important}
    .child-addbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #edf1f5}
    .child-add-main{border:0;border-radius:14px;background:#edf4ff;color:#2f65b8;padding:11px 12px;font-weight:900;font-size:12px;text-align:left}
    .child-add-photo{width:46px;border:0;border-radius:14px;background:#f5f1ff;color:#6a55b3;font-size:20px}
    .add-choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:14px}
    .add-choice{border:1px solid #e2e8f0;background:#fff;border-radius:18px;padding:15px 10px;text-align:left;min-height:86px}
    .add-choice span{display:block;font-size:26px;margin-bottom:7px}.add-choice b{font-size:13px}.add-choice small{display:block;font-size:9px;color:#7a8798;margin-top:3px;line-height:1.35}
    .chosen-child{display:flex;align-items:center;gap:9px;background:#f6f8fb;border-radius:15px;padding:10px 12px;margin-top:10px;font-size:12px;font-weight:850}
    .chosen-child i{font-style:normal;font-size:22px}
    .quick-secondary{margin-top:8px}.quick-secondary summary{list-style:none;cursor:pointer;font-size:11px;font-weight:850;color:#607188;padding:8px 2px}.quick-secondary summary::-webkit-details-marker{display:none}
    @media(max-width:390px){.add-choice-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
  if(!document.getElementById('childAddModal')){
    const modal=document.createElement('div');modal.id='childAddModal';modal.className='modal';
    modal.innerHTML=`<div class="sheet"><h3>Was möchtest du hinzufügen?</h3><div class="chosen-child"><i>👦</i><span id="childAddName">Kind</span></div><div class="add-choice-grid">
      <button class="add-choice" data-kind="homework"><span>✏️</span><b>Hausaufgabe</b><small>z. B. Mathematik, Französisch</small></button>
      <button class="add-choice" data-kind="test"><span>📝</span><b>Test / Prüfung</b><small>z. B. NMG-Test am Donnerstag</small></button>
      <button class="add-choice" data-kind="study"><span>📖</span><b>Lernen / Üben</b><small>Wörter, Blitztest, Lesen …</small></button>
      <button class="add-choice" data-kind="material"><span>🎒</span><b>Mitnehmen</b><small>Flasche, Helm, Geld, Buch …</small></button>
      <button class="add-choice" data-kind="other"><span>📌</span><b>Andere Aufgabe</b><small>frei beschreiben</small></button>
      <button class="add-choice" data-kind="photo"><span>📸</span><b>Foto / Schulzettel</b><small>automatisch erkennen</small></button>
    </div><div class="modal-footer"><button class="btn soft" id="childAddCancel">Abbrechen</button></div></div>`;
    document.body.appendChild(modal);
  }
})();

let childAddTarget=null;
function openChildAdd(childId){childAddTarget=childId;document.getElementById('childAddName').textContent=`Für ${child(childId)?.name||'Kind'}`;document.getElementById('childAddModal').classList.add('on')}
function closeChildAdd(){document.getElementById('childAddModal').classList.remove('on')}
function attachChildAddButtons(){
  taskList.querySelectorAll('.child-card').forEach(card=>{
    if(card.querySelector('.child-addbar'))return;
    const name=card.querySelector('.child-title b')?.textContent||'';
    const c=state.children.find(x=>x.name===name);if(!c)return;
    const bar=document.createElement('div');bar.className='child-addbar';
    bar.innerHTML=`<button class="child-add-main">＋ Für ${esc(c.name)} hinzufügen</button><button class="child-add-photo" aria-label="Foto hinzufügen">📸</button>`;
    bar.querySelector('.child-add-main').onclick=()=>openChildAdd(c.id);
    bar.querySelector('.child-add-photo').onclick=()=>openChildPhoto(c.id);
    card.appendChild(bar);
  });
}
function openChildPhoto(childId){
  childAddTarget=childId;closeChildAdd();
  const docNav=[...document.querySelectorAll('.nav button')].find(b=>b.dataset.tab==='documents');if(docNav)docNav.click();
  setTimeout(()=>{if(docChild){docChild.value=childId}if(docType)docType.value='auto';if(docFile)docFile.click()},80)
}
function startChildPreset(kind){
  const cid=childAddTarget;closeChildAdd();if(!cid)return;
  todayFilterValue=cid;
  const preset={type:kind};
  openTaskEditor(cid,null,preset);
  if(kind==='material')customTaskTitle.textContent=`Mitnehmen für ${child(cid)?.name}`;
  if(kind==='other')customTaskTitle.textContent=`Neuer Eintrag für ${child(cid)?.name}`;
  customTaskChild.value=cid;
}

document.getElementById('childAddCancel').onclick=closeChildAdd;
document.getElementById('childAddModal').onclick=e=>{if(e.target===document.getElementById('childAddModal'))closeChildAdd()};
document.querySelectorAll('#childAddModal [data-kind]').forEach(b=>b.onclick=()=>{const k=b.dataset.kind;if(k==='photo')openChildPhoto(childAddTarget);else startChildPreset(k)});

const renderTodayBeforeChildAdd=renderToday;
renderToday=function(){renderTodayBeforeChildAdd();attachChildAddButtons()};

// Die globale Schnellwahl wird sekundär, weil das Hinzufügen jetzt direkt beim Kind passiert.
const quickPanel=document.querySelector('.quick')?.parentElement;
if(quickPanel && !quickPanel.querySelector('.quick-secondary')){
  const quick=document.querySelector('.quick');
  const details=document.createElement('details');details.className='quick-secondary';details.innerHTML='<summary>Weitere Schnell-Auswahl anzeigen ▾</summary>';
  quick.parentNode.insertBefore(details,quick);details.appendChild(quick);
}
renderToday();
