/* Deterministic generic private-rules fixture for Familienzentrale browser tests */
window.FC_PRIVATE_RULES={
  version:'e2e-v2',
  mutations:[
    {
      op:'upsert',collection:'todos',
      matchAny:[{id:'todo-e2e-next-day'}],
      value:{id:'todo-e2e-next-day',title:'Testaufgabe für morgen – bereits erledigt vorbereitet',date:'2026-08-29',section:'day',priority:true,done:false,archived:false}
    }
  ],
  scheduleRules:{departures:[],notes:[],pickupRules:[]},
  pushRules:{ruleTransforms:[],taskFilters:[]}
};
