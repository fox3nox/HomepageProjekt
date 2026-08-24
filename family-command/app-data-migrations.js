/* Family Command · one-time data migrations · 2026-08-24 */
(()=>{
  if(window.__fcDataMigrations20260824)return;window.__fcDataMigrations20260824=true;
  const FLAG='fc-migration-social-20261027-v1';
  try{
    if(localStorage.getItem(FLAG)==='done')return;
  }catch(e){}
  try{
    if(typeof data==='undefined'||!Array.isArray(data?.events))return;
    let event=data.events.find(e=>String(e.id)==='oli-social')||data.events.find(e=>String(e.date)==='2026-10-26'&&String(e.time||'')==='14:00'&&/sozial/i.test(String(e.title||'')));
    if(!event){
      event={id:'oli-social',personIds:['oli'],title:'Termin Sozialabteilung Herzogenbuchsee',date:'2026-10-27',time:'10:00',end:'',endDate:'',note:'Termin zur Klärung der Finanzierung der Kinderbetreuung an Samstagen ab 01.01.2027. Sozialabteilung Herzogenbuchsee. Frau Kuert, Sozialarbeiterin von Frau Hager, nimmt ebenfalls teil. Ersetzt den Termin vom 26.10.2026 um 14:00 Uhr.'};
      data.events.push(event);
    }else{
      event.id='oli-social';
      event.personIds=['oli'];
      event.title='Termin Sozialabteilung Herzogenbuchsee';
      event.date='2026-10-27';
      event.time='10:00';
      event.end='';
      event.endDate='';
      event.note='Termin zur Klärung der Finanzierung der Kinderbetreuung an Samstagen ab 01.01.2027. Sozialabteilung Herzogenbuchsee. Frau Kuert, Sozialarbeiterin von Frau Hager, nimmt ebenfalls teil. Ersetzt den Termin vom 26.10.2026 um 14:00 Uhr.';
    }
    try{if(typeof save==='function')save()}catch(e){}
    try{if(typeof syncPush==='function')syncPush()}catch(e){}
    try{localStorage.setItem(FLAG,'done')}catch(e){}
  }catch(e){console.error('fc_data_migration_social_20261027',e)}
})();
