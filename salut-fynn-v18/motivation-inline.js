(()=>{
'use strict';
const files=[
'papa-1.js','papa-2.js','papa-3.js',
'papa-4-1.js','papa-4-2.js','papa-4-3.js','papa-4-4.js','papa-4-5.js',
'papa-5-1.js','papa-5-2.js','papa-5-3.js','papa-5-4.js',
'papa-6-1.js','papa-6-2.js','papa-6-3.js','papa-6-4.js',
'papa-7-1.js','papa-7-2.js','papa-7-3.js'
];
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src+'?v=18a';s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Audio-Modul konnte nicht geladen werden: '+src));document.head.appendChild(s)})}
(async()=>{
 try{
  window.PAPA_CLIPS=window.PAPA_CLIPS||[];
  window.PAPA_B64=window.PAPA_B64||{};
  for(const file of files) await loadScript(file);
  for(const i of [4,5,6,7]) if(window.PAPA_B64[i]) window.PAPA_CLIPS.push('data:audio/mp4;base64,'+window.PAPA_B64[i]);
  if(window.PAPA_CLIPS.length!==7) throw new Error('Es wurden '+window.PAPA_CLIPS.length+' statt 7 Papa-Aufnahmen geladen.');
  await loadScript('motivation-core.js');
  window.__PAPA_AUDIO_READY=true;
 }catch(e){console.warn(e);window.__PAPA_AUDIO_READY=false;}
})();
