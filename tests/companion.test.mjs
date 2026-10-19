import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recommend,parseDeparture,validateInput,PRESETS} from '../src/engine.js';
import {startWalk,updateWalk} from '../src/companion.js';
import {attachEvidence} from '../src/evidence.js';
import {createRouter} from '../src/routing.js';
const home={lat:51.1,lon:71.4},base={origin:home,budget:90,maxWalk:30,bufferMinutes:5,departure:'2026-10-20T14:00',interests:['coffee','nature'],group:[],returnToStart:true};
const poi=(id,extra={})=>({id,name:id,names:{en:id},category:'cafe',lat:51.101,lon:71.4,hours:'24/7',tags:{},wheelchair:'yes',...extra});
const pois=[poi('cafe'),poi('park',{category:'park',lat:51.102}),poi('other',{lat:51.103})];
const start=(raw=base,places=pois,options={})=>startWalk(raw,places,options);
const event=(s,type,extra={})=>updateWalk(s,{type,...extra},pois);
test('engine uses a fixed return target distinct from the current point',()=>{
 const calls=[],routing={leg(a,b){calls.push([a,b]);return {minutes:a.lat===b.lat?0:5,distanceM:100,points:[[a.lon,a.lat],[b.lon,b.lat]],connectors:[],mode:'estimated'};}};
 const raw={...base,origin:{lat:51.11,lon:71.41},returnOrigin:home,routing};const r=recommend(raw,pois);
 assert.deepEqual(r.returnOrigin,home);assert.deepEqual(r.route.legs.at(-1).points.at(-1),[home.lon,home.lat]);assert.ok(calls.some(([a,b])=>a.id==='cafe'&&b.lat===home.lat));
 assert.throws(()=>validateInput({...raw,returnOrigin:{lat:95,lon:0}}));
});
test('session deadline freezes the stricter original deadline and budget',()=>{
 for(const [returnBy,expected] of [['2026-10-20T15:00','2026-10-20T15:00'],['2026-10-20T18:00','2026-10-20T15:30']]){
  const s=start({...base,returnBy});assert.equal(s.deadline,parseDeparture(expected).getTime());assert.equal(s.base.bufferMinutes,5);
 }
});
test('elapsed delay shrinks available time and never restarts the budget',()=>{
 const a=start(),b=event(a,'delay',{minutes:15});assert.equal(b.remaining,a.remaining-15);assert.equal(b.result.trace.effectiveBudget,b.remaining-5);assert.equal(b.deadline,a.deadline);assert.deepEqual(b.base.returnOrigin,home);assert.equal(a.remaining,90);
});
test('finishing a stop advances walking plus visit time and changes only current position',()=>{
 const a=start(),stop=a.result.route.stops[0],b=event(a,'complete',{id:stop.id});assert.equal(b.clock-a.clock,(stop.legMinutes+stop.visitMinutes)*60000);assert.deepEqual(b.position,{lat:stop.lat,lon:stop.lon});assert.deepEqual(b.base.returnOrigin,home);assert.ok(b.completed.includes(stop.id));assert.ok(!b.result.route.stops.some(s=>s.id===stop.id));assert.deepEqual(b.result.route.legs.at(-1).points.at(-1),[home.lon,home.lat]);
});
test('unavailable on arrival advances walking only and never edits source facts',()=>{
 const source=JSON.stringify(pois),a=start(),stop=a.result.route.stops[0],b=event(a,'unavailable',{id:stop.id});assert.equal(b.clock-a.clock,stop.legMinutes*60000);assert.ok(b.unavailable.includes(stop.id));assert.ok(!b.result.route.stops.some(s=>s.id===stop.id));assert.equal(JSON.stringify(pois),source);assert.equal(b.completed.length,0);
});
test('rain preserves original access, walk cap, group, pace, exclusions and reserve',()=>{
 const a=start({...base,accessible:true,pace:'gentle',verifiedHours:true,group:['coffee','nature'],excludedIds:['other']}),b=event(a,'weather',{weather:'rain'});
 assert.ok(b.result.recommendations.every(p=>p.category==='cafe'));for(const k of ['accessible','pace','verifiedHours','maxWalk','bufferMinutes'])assert.equal(b.input[k],a.input[k]);assert.deepEqual(b.input.group,a.input.group);assert.ok(b.input.excludedIds.includes('other'));assert.equal(b.clock,a.clock);
});
test('sub-ten-minute remaining time gives a return route rather than a fresh minimum budget',()=>{
 const a=start(),stop=a.result.route.stops[0],b=event(a,'unavailable',{id:stop.id}),c=event(b,'delay',{minutes:b.remaining-7});assert.equal(c.remaining,7);assert.equal(c.result.route.stops.length,0);assert.equal(c.result.trace.effectiveBudget,2);assert.ok(c.result.route.legs.length===1);assert.ok(c.result.route.returnMinutes>0);
});
test('past deadline is reported, with no new visit and no silently spent reserve',()=>{
 let s=start();s=event(s,'unavailable',{id:s.result.route.stops[0].id});s=event(s,'delay',{minutes:100});assert.equal(s.result.route.stops.length,0);assert.ok(s.lateMinutes>0);assert.equal(s.reserveShortfall,s.lateMinutes+5);assert.equal(s.base.bufferMinutes,5);
});
test('return now removes all visits and keeps original destination',()=>{
 let s=start();s=event(s,'complete',{id:s.result.route.stops[0].id});s=event(s,'return');assert.equal(s.result.route.stops.length,0);assert.ok(s.returnOnly);assert.deepEqual(s.result.route.legs.at(-1).points.at(-1),[home.lon,home.lat]);
});
test('live clock uses elapsed wall time without double-counting planned visit time',()=>{
 const now=parseDeparture(base.departure).getTime();const a=start(base,pois,{mode:'live',now});const b=updateWalk(a,{type:'complete',id:a.result.route.stops[0].id},pois,{now:now+12*60000+1});assert.equal(b.clock-now,13*60000);assert.equal(b.remaining,77);const c=updateWalk(b,{type:'refresh'},pois,{now:now+10*60000});assert.equal(c.clock,b.clock);assert.throws(()=>updateWalk(b,{type:'delay',minutes:15},pois,{now}));
});
test('stale live start consumes elapsed time instead of shifting the deadline',()=>{
 const now=parseDeparture(base.departure).getTime();const s=start(base,pois,{mode:'live',now:now+30*60000});assert.equal(s.remaining,60);assert.equal(s.deadline,now+90*60000);
});
test('opening hours are rechecked at the revised arrival, including full visit length',()=>{
 const places=[poi('early',{hours:'Tu 14:00-14:25'})],a=start({...base,interests:['coffee']},places),b=updateWalk(a,{type:'delay',minutes:20},places);assert.equal(b.result.route.stops.length,0);assert.ok(b.result.trace.exclusions.closed>0);
});
test('missing return connectivity is not presented as a zero-minute safe route',()=>{
 const routing={leg(a,b){return {minutes:a.lat===51.2?Infinity:5,distanceM:100,points:[],connectors:[],mode:'estimated'};}};
 const a=start({...base,routing}),moved={...a,position:{lat:51.2,lon:71.4}},b=updateWalk(moved,{type:'return'},pois);assert.equal(b.reachable,false);assert.equal(b.lateMinutes,null);assert.equal(b.result.route.legs.length,0);
});
test('an unavoidable return above walking cap is disclosed',()=>{
 const a=start(),b=updateWalk({...a,position:{lat:51.12,lon:71.4}},{type:'return'},pois);assert.ok(b.walkCapExceeded);assert.equal(b.result.route.stops.length,0);
});
test('completed group interests remain covered after removing their stop from the future plan',()=>{
 const a=start({...base,group:['coffee','nature']}),stop=a.result.route.stops.find(s=>s.groupMatches.length);assert.equal(stop.id,a.result.route.stops[0].id);const b=event(a,'complete',{id:stop.id});for(const i of stop.groupMatches)assert.equal(b.group[i].covered,true);
});
test('one-way plans, no-result plans, arbitrary stop confirmations and invalid weather cannot start or mutate a walk',()=>{
 assert.throws(()=>start({...base,returnToStart:false}));assert.throws(()=>start({...base,budget:10,bufferMinutes:10}));const s=start();for(const e of [{type:'complete',id:'not-next'},{type:'weather',weather:'storm'},{type:'delay',minutes:-1},{type:'other'}])assert.throws(()=>updateWalk(s,e,pois));assert.equal(s.completed.length,0);
});
test('real EXPO rehearsal preserves return deadline through delay, unavailable stop and rain',async()=>{
 const read=async f=>JSON.parse(await readFile(new URL('../data/'+f,import.meta.url),'utf8'));
 const places=attachEvidence(await read('pois.json'),await read('evidence.json')),routing=createRouter(await read('walking-graph.json'));
 let s=start({...base,origin:PRESETS[0],budget:60,maxWalk:20,routing},places);const deadline=s.deadline,home={lat:PRESETS[0].lat,lon:PRESETS[0].lon};
 for(const e of [{type:'delay',minutes:15},{type:'unavailable',id:s.result.route.stops[0].id},{type:'weather',weather:'rain'}]){
  // The first remaining stop can change after a delay.
  if(e.type==='unavailable')e.id=s.result.route.stops[0]?.id;if(e.type==='unavailable'&&!e.id)continue;
  s=updateWalk(s,e,places);assert.equal(s.deadline,deadline);assert.deepEqual(s.base.returnOrigin,home);for(const p of s.result.route.stops)assert.ok(!s.completed.includes(p.id)&&!s.unavailable.includes(p.id));
  if(s.result.route.stops.length)assert.ok(s.result.route.totalMinutes+s.base.bufferMinutes<=s.remaining);
 }
});
