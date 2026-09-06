import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const code = readFileSync(new URL('../cloud-state.js', import.meta.url), 'utf8');
const copy = x => JSON.parse(JSON.stringify(x));
const initial = () => ({people:[], events:[{id:'e', title:'Original', note:''}], todos:[], homework:[], reminders:[], pendencies:[], schedules:{}, common:{}});
const response = (state, revision = 1, conflict = false) => new Response(JSON.stringify({ok:!conflict, state, revision, conflict}), {status:conflict ? 409 : 200});
function runtime(storage = new Map(), state = initial()) {
  const timers = new Map(); let timerId = 0;
  const ctx = vm.createContext({console:{error(){}}, Headers, Response, Date, Math, JSON,
    location:{hostname:'family.example'}, document:{cookie:'', addEventListener(){}, querySelector(){return null}},
    localStorage:{getItem:k=>storage.get(k)||null, setItem:(k,v)=>storage.set(k,String(v))},
    setTimeout:fn=>{timers.set(++timerId,fn);return timerId;}, clearTimeout:id=>timers.delete(id),
    data:copy(state), save(){storage.set('app', JSON.stringify(ctx.data));},
    fetch:async()=>response(initial())});
  storage.set('fc-private-access-v1','isolated-fixture'); ctx.window=ctx;
  vm.runInContext(code, ctx);
  return {ctx, api:ctx.__fcCloudState, storage};
}

test('a save made while POST is in flight survives its canonical acknowledgement', async () => {
  const {ctx,api}=runtime(); await api.bootstrap();
  ctx.data.events[0].title='First save'; ctx.save();
  let finish; ctx.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const saving=api.pushNow();
  ctx.data.events[0].note='Typed while saving'; ctx.save();
  const acknowledged=initial(); acknowledged.events[0].title='First save';
  finish(response(acknowledged,2)); await saving;
  assert.equal(ctx.data.events[0].note,'Typed while saving');
  let posted; ctx.fetch=async(_url,options)=>{posted=JSON.parse(options.body);return response(posted.state,3);};
  await api.pushNow(); assert.equal(posted.baseRevision,2); assert.equal(posted.state.events[0].note,'Typed while saving');
});

test('offline edits and deletions survive restart and merge with another device', async () => {
  const first=runtime(); await first.api.bootstrap();
  first.ctx.data.events[0].note='Offline note'; first.ctx.data.todos.push({id:'offline',title:'Remember',done:false}); first.ctx.save();
  first.ctx.fetch=async()=>{throw Error('offline');}; await first.api.pushNow();
  const restarted=runtime(first.storage, JSON.parse(first.storage.get('app')));
  const remote=initial(); remote.events[0].title='Other device';
  restarted.ctx.fetch=async()=>response(remote,5); await restarted.api.bootstrap();
  assert.equal(restarted.ctx.data.events[0].title,'Other device');
  assert.equal(restarted.ctx.data.events[0].note,'Offline note');
  assert.equal(restarted.ctx.data.todos[0]?.id,'offline');
  restarted.ctx.data.events=[]; restarted.ctx.save();
  const again=runtime(first.storage,JSON.parse(first.storage.get('app')));
  again.ctx.fetch=async()=>response(remote,6); await again.api.bootstrap();
  assert.equal(again.ctx.data.events.length,0); assert.ok(again.ctx.data._syncDeleted.events.e);
});

test('conflict retry includes edits and tombstones made during the rejected POST', async () => {
  const {ctx,api}=runtime(); await api.bootstrap();
  ctx.data.events[0].note='Local'; ctx.save();
  let finish,posted; ctx.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const saving=api.pushNow(); ctx.data.todos.push({id:'during-conflict',title:'Do it'}); ctx.save();
  const remote=initial(); remote.events[0].title='Remote';
  ctx.fetch=async(_url,options)=>{posted=JSON.parse(options.body);return response(posted.state,3);};
  finish(response(remote,2,true)); await saving;
  assert.equal(posted.state.todos[0]?.id,'during-conflict');
  assert.equal(posted.state.events[0].title,'Remote'); assert.equal(posted.state.events[0].note,'Local');
});

test('a clean restart follows canonical deletions without resurrecting stale rows', async () => {
  const first=runtime(); await first.api.bootstrap();
  const next=runtime(first.storage, initial()),remote=initial(); remote.events=[];
  next.ctx.fetch=async()=>response(remote,4); await next.api.bootstrap();
  assert.equal(next.ctx.data.events.length,0);
});
