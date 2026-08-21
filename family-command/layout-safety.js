/* Family Command · global layout safety audit · 2026-08-21 */
(()=>{
  const st=document.createElement('style');
  st.id='fc-layout-safety';
  st.textContent=`
  /* ---------- Global safety ---------- */
  *,*::before,*::after{min-width:0}
  .screen,.content,.pc-wrap,.pc-section,.pc-kid,.pc-mainrow,.pc-cell,
  .hw-screen,.hw-section,.hw-row,.hw-main,.fc-7day,.fc-7day-row,.fc-7day-items,
  .pro-events,.pro-month,.pro-event,.pro-event-body,.pro-event-top,.pro-event-foot,
  .pro-people,.pro-event-actions,.pro-doc-row,.pro-doc-open,.pro-setting-head,
  .setting,.card,.term-card{min-width:0!important;max-width:100%!important}
  h1,h2,h3,h4,b,strong,p,span,small,em,time,button,label{overflow-wrap:anywhere;word-break:normal}
  button{max-width:100%}

  /* ---------- Termine: no overlap, ever ---------- */
  .pro-event{
    display:grid!important;
    grid-template-columns:68px minmax(0,1fr)!important;
    align-items:start!important;
    gap:14px!important;
    height:auto!important;
    min-height:0!important;
    overflow:hidden!important;
  }
  .pro-event-date{align-self:start!important;height:auto!important;min-height:92px!important}
  .pro-event-body{display:flex!important;flex-direction:column!important;gap:0!important;position:static!important;overflow:visible!important}
  .pro-event-top{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    align-items:start!important;
    gap:8px 12px!important;
    position:static!important;
  }
  .pro-event-top>div{min-width:0!important}
  .pro-event-top h3{
    display:block!important;
    position:static!important;
    margin:2px 0 0!important;
    line-height:1.18!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    max-width:none!important;
  }
  .pro-event-top time{position:static!important;white-space:nowrap!important;align-self:start!important}
  .pro-event-body>p{position:static!important;margin:7px 0 0!important;line-height:1.4!important}
  .pro-event-foot{
    position:static!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:flex-start!important;
    gap:8px!important;
    margin-top:10px!important;
    width:100%!important;
  }
  .pro-people{
    position:static!important;
    display:flex!important;
    flex-wrap:wrap!important;
    gap:5px 7px!important;
    width:100%!important;
    margin:0!important;
  }
  .pro-people span{
    position:static!important;
    display:inline-flex!important;
    align-items:center!important;
    gap:5px!important;
    width:auto!important;
    max-width:100%!important;
    padding:4px 8px!important;
    border-radius:999px!important;
    background:#f4f7fb!important;
    border:1px solid #dde5ef!important;
    color:#48566a!important;
    font-size:11px!important;
    line-height:1.15!important;
    font-weight:750!important;
    white-space:normal!important;
    margin:0!important;
  }
  .pro-people span i{width:7px!important;height:7px!important;min-width:7px!important;border-radius:50%!important}
  .pro-event-actions{
    position:static!important;
    display:flex!important;
    flex-wrap:wrap!important;
    gap:6px!important;
    width:100%!important;
    margin:0!important;
  }
  .pro-event-actions button{
    position:static!important;
    width:auto!important;
    min-height:34px!important;
    padding:7px 10px!important;
    border-radius:10px!important;
    font-size:10px!important;
    line-height:1.15!important;
    white-space:normal!important;
    flex:0 1 auto!important;
  }
  .pro-event-actions .muted{margin-left:0!important}

  /* ---------- Today / children ---------- */
  .pc-kid{overflow:hidden!important;height:auto!important}
  .pc-kidtop{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important}
  .pc-name{display:flex!important;align-items:center!important;gap:7px!important;min-width:0!important;flex:1 1 130px!important}
  .pc-name span{white-space:normal!important}
  .fc-live-status{flex:0 1 auto!important;max-width:100%!important;white-space:normal!important;text-align:center!important}
  .pc-edit{flex:0 0 auto!important}
  .pc-mainrow{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
  .pc-cell{height:auto!important;min-height:66px!important;overflow:hidden!important}
  .pc-cell b{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
  .pc-pm,.pc-packchips,.fc-pickup-alert,.fc-ts-alert,.fc-tagesschule-alert{position:static!important;max-width:100%!important}

  /* ---------- Week ---------- */
  .pc-weektop{display:flex!important;flex-wrap:wrap!important;gap:10px!important}
  .pc-weekcontrols{display:flex!important;flex-wrap:wrap!important;gap:6px!important}
  .pc-weekbar{max-width:100%!important;overflow-x:auto!important;padding-bottom:3px!important}
  .pc-day{min-width:64px!important;flex:0 0 auto!important;height:auto!important}
  .pc-day span,.pc-day b,.pc-day em{white-space:normal!important}

  /* ---------- Homework ---------- */
  .hw-row{
    display:grid!important;
    grid-template-columns:auto minmax(0,1fr)!important;
    gap:9px!important;
    align-items:start!important;
    height:auto!important;
    overflow:hidden!important;
  }
  .hw-main{min-width:0!important}
  .hw-topline{display:flex!important;flex-wrap:wrap!important;gap:4px 8px!important;align-items:flex-start!important}
  .hw-task,.hw-note,.hw-due{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
  .hw-del{grid-column:2!important;justify-self:start!important;position:static!important;margin:2px 0 0!important}
  .hw-inline-head,.hw-sectionhead{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important}

  /* ---------- 7-day outlook ---------- */
  .fc-7day-row{grid-template-columns:58px minmax(0,1fr)!important;align-items:start!important}
  .fc-7day-items span{display:block!important;white-space:normal!important;overflow:visible!important}

  /* ---------- Documents / settings ---------- */
  .pro-setting-head{display:flex!important;align-items:flex-start!important;gap:10px!important;flex-wrap:wrap!important}
  .pro-setting-head>div{flex:1 1 220px!important}
  .pro-doc-fields{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
  .pro-doc-fields input,.pro-doc-fields select{width:100%!important;min-width:0!important}
  .pro-file-pick{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important}
  .pro-file-pick>div{flex:1 1 180px!important;min-width:0!important}
  .pro-file-pick span{white-space:normal!important;overflow-wrap:anywhere!important}
  .pro-doc-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important}
  .pro-doc-open{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:10px!important;text-align:left!important}
  .pro-doc-open div{min-width:0!important}
  .pro-doc-open b,.pro-doc-open small,.pro-doc-open em{display:block!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}

  /* ---------- Modals / quick menu ---------- */
  .sheet,.pro-sheet,.fcq-sheet{max-width:100%!important;overflow-x:hidden!important}
  .fields,.row2,.fcq-grid{min-width:0!important}
  .field input,.field select,.field textarea{min-width:0!important;max-width:100%!important}

  /* ---------- Bottom nav ---------- */
  .bottomnav-in{min-width:0!important}
  .navbtn{min-width:0!important;overflow:hidden!important}
  .navbtn span:last-child{max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

  @media(max-width:520px){
    .content{padding-left:13px!important;padding-right:13px!important}
    .pro-event{grid-template-columns:58px minmax(0,1fr)!important;gap:10px!important;padding:11px!important}
    .pro-event-date{min-height:82px!important}
    .pro-event-top{grid-template-columns:minmax(0,1fr)!important;gap:3px!important}
    .pro-event-top time{justify-self:start!important;margin-top:2px!important}
    .pro-event-top h3{font-size:16px!important;line-height:1.18!important}
    .pro-event-foot{margin-top:9px!important}
    .pro-event-actions{gap:5px!important}
    .pro-event-actions button{font-size:10px!important;min-height:32px!important;padding:6px 9px!important}
    .pc-mainrow{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .pc-cell{padding:9px 7px!important}
    .pc-cell span{font-size:8px!important;letter-spacing:.04em!important}
    .pc-cell b{font-size:14px!important}
    .pc-cell.primary b{font-size:18px!important}
    .fc-7day-row{grid-template-columns:50px minmax(0,1fr)!important;gap:8px!important}
    .hw-row{padding:10px!important}
    .row2{grid-template-columns:1fr!important}
  }

  @media(max-width:370px){
    .pro-event{grid-template-columns:52px minmax(0,1fr)!important;padding:9px!important}
    .pro-event-date{min-height:76px!important}
    .pro-event-top h3{font-size:15px!important}
    .pc-mainrow{grid-template-columns:1fr 1fr!important}
    .pc-mainrow .pc-cell:last-child{grid-column:1/-1!important}
    .fcq-grid{grid-template-columns:1fr!important}
  }
  `;
  document.head.appendChild(st);
})();
