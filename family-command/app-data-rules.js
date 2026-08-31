/* Familienzentrale · generic private schedule/push/UI rules bridge · V9.18 · 2026-08-31 */
(()=>{
  'use strict';
  if(window.__fcDataRulesInstalled)return;
  window.__fcDataRulesInstalled=true;

  const cfg=()=>window.FC_PRIVATE_RULES||{};
  const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
  const dayOf=date=>{try{return new Date(String(date)+'T12:00:00').getDay()}catch(_){return-1}};
  const includes=(arr,v)=>!Array.isArray(arr)||!arr.length||arr.map(String).includes(String(v));
  const mins=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?(Number(m[1])*60+Number(m[2])):null};

  function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc_rules_save',e)}}

  function applyScheduleRules(){
    const rules=cfg().scheduleRules||{},state=D();
    if(!state.schedules||typeof state.schedules!=='object')return false;
    let changed=false;

    for(const rule of (rules.departures||[])){
      for(const [pid,days] of Object.entries(state.schedules||{})){
        if(!includes(rule.personIds,pid))continue;
        for(const [day,slots] of Object.entries(days||{})){
          if(!includes(rule.days,Number(day)))continue;
          for(const slot of (Array.isArray(slots)?slots:[])){
            const start=String(slot?.start||'');
            if(rule.start&&start!==String(rule.start))continue;
            if(rule.startGte&&start<String(rule.startGte))continue;
            if(rule.startLte&&start>String(rule.startLte))continue;
            if(String(slot.depart||'')!==String(rule.depart||'')){slot.depart=String(rule.depart||'');changed=true}
          }
        }
      }
    }

    for(const rule of (rules.notes||[])){
      for(const [pid,days] of Object.entries(state.schedules||{})){
        if(!includes(rule.personIds,pid))continue;
        for(const [day,slots] of Object.entries(days||{})){
          if(!includes(rule.days,Number(day))||!Array.isArray(slots)||!slots.length)continue;
          const indexes=Number.isInteger(Number(rule.slotIndex))?[Number(rule.slotIndex)]:slots.map((_,i)=>i);
          for(const i of indexes){
            const slot=slots[i];if(!slot)continue;
            if(rule.start&&String(slot.start||'')!==String(rule.start))continue;
            if(rule.note!==undefined&&String(slot.note||'')!==String(rule.note)){slot.note=String(rule.note||'');changed=true}
            if(rule.labelIncludes&&!String(slot.label||'').toLowerCase().includes(String(rule.labelIncludes).toLowerCase())){slot.label=((slot.label||'')+' · '+rule.labelIncludes).replace(/^ · /,'');changed=true}
          }
        }
      }
    }

    if(Array.isArray(rules.pickupRules)){
      try{
        let local={};try{local=JSON.parse(localStorage.getItem('fc-pickup-rules-v1')||'{}')||{}}catch(_){local={}}
        let localChanged=false;
        for(const rule of rules.pickupRules){for(const d of (rule.days||[])){const k=String(rule.personId)+'|'+Number(d),v=!!rule.enabled;if(local[k]!==v){local[k]=v;localChanged=true}}}
        if(localChanged)localStorage.setItem('fc-pickup-rules-v1',JSON.stringify(local));
      }catch(e){console.error('fc_pickup_rules',e)}
    }
    return changed;
  }

  function matchPushRule(rule,row){
    if(!row)return false;
    if(Array.isArray(rule.personIds)&&rule.personIds.length&&!rule.personIds.map(String).includes(String(row.personId)))return false;
    if(Array.isArray(rule.days)&&rule.days.length&&!rule.days.map(Number).includes(Number(row.day)))return false;
    if(rule.start!==undefined&&String(row.start||'')!==String(rule.start))return false;
    return true;
  }

  function installPushBridge(){
    if(typeof pushSnapshot!=='function'||window.__fcSchedulePushWrapped)return false;
    window.__fcSchedulePushWrapped=true;
    const raw=pushSnapshot;
    const wrapped=function(...args){
      const snapshot=raw.apply(this,args),rules=cfg().pushRules||{};
      if(Array.isArray(snapshot?.rules))for(const row of snapshot.rules)for(const rule of (rules.ruleTransforms||[]))if(matchPushRule(rule,row))Object.assign(row,rule.set||{});
      if(Array.isArray(snapshot?.tasks)&&Array.isArray(rules.taskFilters)){
        snapshot.tasks=snapshot.tasks.filter(task=>{
          for(const rule of rules.taskFilters){
            if(rule.idPrefix&&!String(task?.id||'').startsWith(String(rule.idPrefix)))continue;
            if(Array.isArray(rule.days)&&rule.days.length&&!rule.days.map(Number).includes(dayOf(task?.date)))continue;
            return rule.keep!==false;
          }
          return true;
        });
      }
      return snapshot;
    };
    window.pushSnapshot=wrapped;try{pushSnapshot=wrapped}catch(_){ }
    return true;
  }

  function normalizeFileInputs(root=document){
    try{
      root.querySelectorAll?.('input[type="file"]').forEach(input=>{
        if(input.hasAttribute('capture'))input.removeAttribute('capture');
        const accept=String(input.getAttribute('accept')||'');
        if(!/application\/pdf|\.pdf/i.test(accept))input.setAttribute('accept',[accept,'application/pdf','.pdf'].filter(Boolean).join(','));
      });
    }catch(e){console.error('fc_file_picker_guard',e)}
  }

  function scheduleLabel(slot){return String(slot?.label||'').replace(/^Schule\s*·\s*/i,'').trim()}
  function relevantSlot(pid,day,live){
    const slots=[...((D().schedules?.[pid]?.[day])||[])].sort((a,b)=>String(a?.start||'').localeCompare(String(b?.start||'')));
    if(!slots.length)return null;
    if(!live)return slots[0];
    const n=new Date(),cur=n.getHours()*60+n.getMinutes();
    return slots.find(s=>{const end=mins(s?.end);return end===null||end>=cur})||null;
  }
  function decorateScheduleRows(){
    const people=Array.isArray(D().people)?D().people:[];
    for(const [screen,offset,live] of [['today',0,true],['tomorrow',1,false]]){
      const root=document.getElementById(screen);if(!root)continue;
      const d=new Date();d.setDate(d.getDate()+offset);const day=d.getDay();
      root.querySelectorAll('.fc9-person').forEach(row=>{
        const name=String(row.querySelector('b')?.textContent||'').trim(),p=people.find(x=>String(x?.name||'').trim()===name),sub=row.querySelector('span');
        if(!p||!sub)return;
        const slot=relevantSlot(p.id,day,live),label=scheduleLabel(slot),old=String(sub.dataset.fcScheduleSpecial||''),suffix=label?' · '+label:'';
        if(old===label&&(!label||String(sub.textContent||'').endsWith(suffix)))return;
        if(old&&String(sub.textContent||'').endsWith(' · '+old))sub.textContent=String(sub.textContent||'').slice(0,-(' · '+old).length);
        sub.dataset.fcScheduleSpecial='';
        if(!label||/^(Schule|Kindergarten)$/i.test(label))return;
        sub.append(document.createTextNode(suffix));sub.dataset.fcScheduleSpecial=label;
      });
    }
  }
  function installUiGuards(){
    let queued=false;
    const run=()=>{queued=false;normalizeFileInputs();decorateScheduleRows()};
    const queue=()=>{if(queued)return;queued=true;queueMicrotask(run)};
    const obs=new MutationObserver(queue);obs.observe(document.documentElement,{childList:true,subtree:true});queue();return obs;
  }

  const changed=applyScheduleRules();
  if(changed)persist();
  const pushWrapped=installPushBridge();
  const uiObserver=installUiGuards();
  window.__fcDataRulesHealth={version:6,privateConfigVersion:String(cfg().version||''),scheduleChanged:changed,pushWrapped,iosFilePickerGuard:true,scheduleLabelsVisible:true,uiObserver:!!uiObserver,managedBoot:!!window.__fcManagedBoot,installedAt:new Date().toISOString()};
})();
