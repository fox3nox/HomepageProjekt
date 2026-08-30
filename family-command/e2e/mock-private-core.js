/* Deterministic generic local-state fixture for Familienzentrale browser tests */
(()=>{
  const state={
    version:'e2e-v1',
    people:[
      {id:'oli',name:'Elternteil',role:'Elternteil',color:'#263a67',teachers:[],notes:[]},
      {id:'child-a',name:'Kind A',role:'Kind',school:'Schule',color:'#3478f6',teachers:[],notes:[]},
      {id:'child-b',name:'Kind B',role:'Kind',school:'Schule',color:'#d97914',teachers:[],notes:[]},
      {id:'child-c',name:'Kind C',role:'Kindergarten',school:'Kindergarten',color:'#16a477',teachers:[],notes:[]}
    ],
    schedules:{
      'child-a':{5:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}]},
      'child-b':{5:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}]},
      'child-c':{5:[{start:'08:20',end:'11:50',depart:'08:10',label:'Kindergarten'}]}
    },
    reminders:[],
    events:[
      {id:'coffee-fixture',personIds:['oli'],title:'Kaffee-Termin',date:'2026-08-28',time:'08:20',end:'09:00',note:'Deterministischer Wochenplan-Test.'},
      {id:'past-fixture',personIds:['oli'],title:'Vergangener Testtermin',date:'2026-08-27',time:'16:00',end:'17:00',note:'Deterministischer Kalender-History-Test.'},
      {id:'care-fixture',personIds:['oli'],title:'Betreuungstermin',date:'2026-08-29',time:'07:20',end:'17:15',note:'Deterministischer Tagesplan-Test.'},
      {id:'visit-fixture',personIds:['child-a'],title:'Besuchswoche',date:'2026-08-31',endDate:'2026-09-04',time:'',end:'',note:'Mehrtaegiger Testtermin.'}
    ],
    todos:[],
    homework:[{id:'hw1',personId:'child-a',dueDate:'2026-08-31',subject:'Mathe',title:'Seite 42',note:'Heft mitnehmen',done:false}],
    pendencies:[{id:'pend1',personId:'oli',title:'Testpendenz',amount:31.8,currency:'CHF',note:'Noch offen',done:false}],
    common:{school:{name:'Testschule',address:'Testort',phone:'000 000 00 00'},care:[]}
  };
  try{localStorage.setItem('family-command-personal-v4',JSON.stringify(state))}catch(e){}
})();
