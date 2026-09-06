/* Shared keyboard/focus behavior for the existing modal modules.
   Only direct body children are observed; edits inside dialogs never retrigger it. */
(()=>{'use strict';
if(window.__fcDialogs)return;
const selector=['.fc9-modal','.fc-detail-modal','.fc-picker-modal','.fc-event-edit-modal','.fc-shopping-modal','.fc-shopping-edit-modal','.fc-meal-modal','.fc-meal-edit-modal','.fc-recipes-modal','.fc-recipe-edit-modal','.fc-recipe-plan-modal','.fc-budget-modal','.fc-budget-edit-modal','.fc-contact-edit-modal','.fc-dv-modal','.fc-dc-modal'].join(',');
const records=new Map();let serial=0,stack=[],appWasInert=false,lastActivation=null;
const visible=e=>e instanceof HTMLElement&&!e.hidden&&!e.closest('[hidden],[inert]')&&e.getClientRects().length>0;
const focusable=root=>[...root.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[tabindex]')].filter(e=>!e.disabled&&e.tabIndex>=0&&visible(e));
const nativeOpen=()=>document.querySelector('dialog[open]');
function enhance(root){
  if(records.has(root))return;
  const opener=lastActivation?.target.isConnected&&performance.now()-lastActivation.at<1000?lastActivation.target:document.activeElement,heading=root.querySelector('h1,h2,h3'),focus=()=>{if(stack.at(-1)!==root||nativeOpen()||root.contains(document.activeElement))return;(root.querySelector('input:not([type="hidden"]):not([type="checkbox"]),textarea,select')||focusable(root)[0]||root).focus({preventScroll:true});};
  for(const nested of root.querySelectorAll('[role=dialog]')){nested.removeAttribute('role');nested.removeAttribute('aria-modal');}
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.tabIndex=-1;
  if(heading){heading.id ||= 'fcDialogHeading'+(++serial);root.setAttribute('aria-labelledby',heading.id);}else root.setAttribute('aria-label','Familienzentrale');
  for(const label of root.querySelectorAll('.fc9-field>label,.fc-event-edit-field>label')){const field=label.parentElement.querySelector('input,textarea,select');if(field?.id)label.htmlFor=field.id;}
  for(const button of root.querySelectorAll('button'))if(!button.getAttribute('aria-label')){const text=button.textContent.trim();if(text==='×'||text==='✕')button.setAttribute('aria-label','Schliessen');}
  for(const field of root.querySelectorAll('#fc9TodoTitle,#fc9TodoDate,#fc9HwTitle,#fc9HwDate,#fc9PendTitle'))field.required=true;
  records.set(root,{opener,focus});lastActivation=null;
  requestAnimationFrame(focus);
}
function sync(){
  const next=[...document.body.children].filter(e=>e.matches(selector));
  for(const root of next)enhance(root);
  const closed=stack.filter(e=>!next.includes(e)),lastClosed=closed.at(-1),record=records.get(lastClosed);
  for(const root of closed){root.inert=false;records.delete(root);}
  const app=document.querySelector('.app');if(!stack.length&&next.length){appWasInert=!!app?.inert;if(app)app.inert=true;}
  stack=next;stack.forEach((root,i)=>{root.inert=i<stack.length-1;if(root.inert)root.setAttribute('aria-hidden','true');else root.removeAttribute('aria-hidden');});
  if(!stack.length&&closed.length&&app)app.inert=appWasInert;
  if(record&&!nativeOpen()){const target=record.opener;if(target?.isConnected&&!target.closest('[inert]'))target.focus({preventScroll:true});else if(stack.length)records.get(stack.at(-1))?.focus();}
}
function invalid(root){
  const fields=[...root.querySelectorAll('input,textarea,select')],bad=fields.filter(e=>!e.checkValidity());
  fields.forEach(e=>{if(bad.includes(e))e.setAttribute('aria-invalid','true');else e.removeAttribute('aria-invalid');});
  let message=root.querySelector('.fc-form-error');if(bad.length){if(!message){message=document.createElement('p');message.className='fc-form-error';message.setAttribute('role','alert');root.querySelector('.fc9-form')?.appendChild(message);}message.textContent='Bitte fülle die markierten Felder aus.';bad[0].focus();return true;}message?.remove();return false;
}
document.addEventListener('click',e=>{const target=e.target.closest?.('button,a[href],summary,[tabindex]');if(target)lastActivation={target,at:performance.now()};},true);
document.addEventListener('click',e=>{const save=e.target.closest('#fc9Modal [data-save]');if(save&&invalid(save.closest('#fc9Modal'))){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('input',e=>{if(e.target.matches?.('[aria-invalid]')&&e.target.checkValidity())e.target.removeAttribute('aria-invalid');});
document.addEventListener('keydown',e=>{
  if(nativeOpen())return;const top=stack.at(-1);if(!top)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();const close=top.querySelector('.fc9-close,.fc-detail-close,.fc-picker-close,.fc-event-edit-close,.fc-shopping-close,.fc-meal-close,.fc-recipes-close,.fc-budget-close,.fc-dv-close,[data-close],[data-cancel]');if(close)close.click();else top.remove();return;}
  if(e.key==='Tab'){const items=focusable(top),first=items[0],last=items.at(-1);if(!first){e.preventDefault();top.focus();}else if(e.shiftKey&&(document.activeElement===first||!top.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!top.contains(document.activeElement))){e.preventDefault();first.focus();}}
},true);
document.addEventListener('focusin',e=>{const top=stack.at(-1);if(top&&!nativeOpen()&&!top.contains(e.target))records.get(top)?.focus();});
const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true});sync();
window.__fcDialogs={sync,health:()=>({open:stack.length,focusManaged:true})};
})();
