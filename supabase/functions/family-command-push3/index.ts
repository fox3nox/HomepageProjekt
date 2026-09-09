import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import * as webpush from "jsr:@negrel/webpush@0.5.0";
import { buildDigest } from "./digest.mjs";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type","cache-control":"no-store"};
let cached:{server:any;publicKey:string}|null=null;

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,"content-type":"application/json; charset=utf-8"}})}
function safe(v:unknown,max=240){return String(v??"").slice(0,max)}
async function appServer(){
  if(cached)return cached;
  const{data,error}=await admin.from("fc_push_config_v2").select("vapid_keys,public_key").eq("id",1).maybeSingle();if(error)throw error;
  let keys:CryptoKeyPair,publicKey:string;
  if(data?.vapid_keys&&data?.public_key){keys=await webpush.importVapidKeys(data.vapid_keys,{extractable:false});publicKey=data.public_key}
  else{const generated=await webpush.generateVapidKeys({extractable:true});const exported=await webpush.exportVapidKeys(generated);publicKey=await webpush.exportApplicationServerKey(generated);const{error:upErr}=await admin.from("fc_push_config_v2").upsert({id:1,vapid_keys:exported,public_key:publicKey,updated_at:new Date().toISOString()});if(upErr)throw upErr;keys=await webpush.importVapidKeys(exported,{extractable:false})}
  cached={server:await webpush.ApplicationServer.new({contactInformation:"https://fox3nox.github.io/HomepageProjekt/family-command/",vapidKeys:keys}),publicKey};return cached;
}
function cleanState(input:any){const a=input&&typeof input==="object"?input:{};return{
  people:Array.isArray(a.people)?a.people.slice(0,20).map((p:any)=>({id:safe(p.id,80),name:safe(p.name,80),color:safe(p.color,32),role:safe(p.role,40)})):[],
  settings:{travel:Number(a.settings?.travel||0)},
  events:Array.isArray(a.events)?a.events.slice(-3000).map((e:any)=>({id:safe(e.id,100),personId:safe(e.personId,80),title:safe(e.title),date:safe(e.date,10),endDate:safe(e.endDate,10),time:safe(e.time,5),end:safe(e.end,5),note:safe(e.note),reminderLead:Number.isFinite(Number(e.reminderLead))?Number(e.reminderLead):0})):[],
  tasks:Array.isArray(a.tasks)?a.tasks.slice(-5000).map((t:any)=>({id:safe(t.id,140),personId:safe(t.personId,80),title:safe(t.title),date:safe(t.date,10),note:safe(t.note),done:!!t.done})):[],
  rules:Array.isArray(a.rules)?a.rules.slice(-1500).map((r:any)=>({id:safe(r.id,120),personId:safe(r.personId,80),title:safe(r.title),day:Number(r.day),time:safe(r.time,5),depart:safe(r.depart,5),start:safe(r.start,5),end:safe(r.end,5),note:safe(r.note)})):[]
}}
async function sha256(s:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function row(deviceId:string){const{data,error}=await admin.from("fc_push_devices_v2").select("*").eq("device_id",deviceId).maybeSingle();if(error)throw error;return data}
async function authorize(deviceId:string,token:string){if(!deviceId||!token)return null;const r=await row(deviceId);if(!r)return null;return r.token_hash===await sha256(token)?r:null}
function localParts(tz:string,at=new Date()){const ps=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(at);const m:Record<string,string>={};for(const p of ps)if(p.type!=="literal")m[p.type]=p.value;const wd:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};const wl:Record<string,string>={Sun:"Sonntag",Mon:"Montag",Tue:"Dienstag",Wed:"Mittwoch",Thu:"Donnerstag",Fri:"Freitag",Sat:"Samstag"};return{date:`${m.year}-${m.month}-${m.day}`,time:`${m.hour}:${m.minute}`,weekday:wd[m.weekday]??0,weekdayLabel:wl[m.weekday]||m.weekday}}
function buildPayload(state:any,tz:string,daysAhead=0,mode:"morning"|"evening"="morning"){return buildDigest(state,tz,daysAhead,mode)}
async function send(subscription:any,p:any){const a=await appServer();const subscriber=a.server.subscribe(subscription);await subscriber.pushTextMessage(JSON.stringify(p),{})}

Deno.serve(async(req:Request)=>{try{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  const url=new URL(req.url),path=url.pathname.split("/family-command-push3")[1]||"/";
  if(req.method==="GET"&&path==="/key"){const a=await appServer();return json({ok:true,publicKey:a.publicKey})}
  if(req.method!=="POST")return json({ok:false,error:"method"},405);
  const body=await req.json().catch(()=>({}));
  if(path==="/subscribe"){
    const deviceId=safe(body.deviceId,120),token=safe(body.deviceToken,240);if(!deviceId||token.length<24||!body.subscription?.endpoint)return json({ok:false,error:"invalid subscription"},400);
    const existing=await row(deviceId),hash=await sha256(token);if(existing&&existing.token_hash!==hash)return json({ok:false,error:"device authorization failed"},403);
    const rec={device_id:deviceId,token_hash:hash,subscription:body.subscription,state:cleanState(body.state),timezone:safe(body.timezone||"Europe/Zurich",80),morning_time:safe(body.morningTime||"06:30",8),evening_time:safe(body.eveningTime||"19:00",8),enabled:true,last_error:null,updated_at:new Date().toISOString()};
    const{error}=await admin.from("fc_push_devices_v2").upsert(rec,{onConflict:"device_id"});if(error)throw error;const a=await appServer();return json({ok:true,publicKey:a.publicKey})
  }
  if(["/sync","/test","/test-evening","/unsubscribe"].includes(path)){
    const deviceId=safe(body.deviceId,120),token=safe(body.deviceToken,240),r=await authorize(deviceId,token);if(!r)return json({ok:false,error:"device authorization failed"},403);
    if(path==="/sync"){const{error}=await admin.from("fc_push_devices_v2").update({state:cleanState(body.state),timezone:safe(body.timezone||r.timezone,80),morning_time:safe(body.morningTime||"06:30",8),evening_time:safe(body.eveningTime||"19:00",8),enabled:true,updated_at:new Date().toISOString()}).eq("device_id",deviceId);if(error)throw error;return json({ok:true})}
    if(path==="/unsubscribe"){const{error}=await admin.from("fc_push_devices_v2").update({enabled:false,updated_at:new Date().toISOString()}).eq("device_id",deviceId);if(error)throw error;return json({ok:true})}
    const evening=path==="/test-evening",p=buildPayload(r.state||{},r.timezone||"Europe/Zurich",evening?1:0,evening?"evening":"morning");p.title=evening?"🌙 Family Command · Abend-Test":"☀️ Family Command · Morgen-Test";await send(r.subscription,p);return json({ok:true,preview:p})
  }
  if(path==="/cron"){
    const{data:rows,error}=await admin.from("fc_push_devices_v2").select("*").eq("enabled",true);if(error)throw error;let sent=0,skipped=0,failed=0;
    for(const r of rows||[]){const tz=r.timezone||"Europe/Zurich",lp=localParts(tz),morning=String(r.morning_time||"06:30:00").slice(0,5),evening=String(r.evening_time||"19:00:00").slice(0,5);let mode:"morning"|"evening"|null=null;if(lp.time===morning&&r.last_sent_date!==lp.date)mode="morning";else if(lp.time===evening&&r.last_evening_sent_date!==lp.date)mode="evening";if(!mode){skipped++;continue}try{const p=buildPayload(r.state||{},tz,mode==="evening"?1:0,mode);await send(r.subscription,p);const upd:any={last_error:null,updated_at:new Date().toISOString()};if(mode==="morning")upd.last_sent_date=lp.date;else upd.last_evening_sent_date=lp.date;await admin.from("fc_push_devices_v2").update(upd).eq("id",r.id);sent++}catch(e){await admin.from("fc_push_devices_v2").update({last_error:String(e).slice(0,500),updated_at:new Date().toISOString()}).eq("id",r.id);failed++}}
    return json({ok:true,sent,skipped,failed})
  }
  return json({ok:false,error:"not found"},404)
}catch(e){console.error(e);return json({ok:false,error:e instanceof Error?e.message:String(e)},500)}});

