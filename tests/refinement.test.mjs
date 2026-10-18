import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recommend,parseIntent,editPlan,PRESETS,backupPlans} from '../src/engine.js';
import {attachEvidence} from '../src/evidence.js';
import {validateNarrative} from '../src/narrative.js';
const origin={lat:51.1,lon:71.4},base={origin,budget:60,maxWalk:20,departure:'2026-10-20T14:00'};
const poi=(id,category,extra={})=>({id,name:id,category,...origin,tags:{},hours:'24/7',source:{url:'https://www.openstreetmap.org/node/1'},...extra});
const data=[poi('cafe1','cafe'),poi('cafe2','cafe',{lat:51.1005}),poi('park','park'),poi('art','artwork')];
test('negative requests exclude cafe stops in English, Russian and Kazakh, including stale selected interests',()=>{
 for(const query of ['No coffee, just a park','Не хочу кофе, только парк','Кофе керек емес, тек саябақ']){const r=recommend({...base,query,interests:['coffee','landmark']},data);assert.ok(r.recommendations.length);assert.ok(r.recommendations.every(p=>p.category==='park'));assert.ok(r.intent.excluded.includes('coffee'));}
 assert.deepEqual(parseIntent('Not only coffee, but also nature').excluded,[]);
});
test('indoor and outdoor wording constrains actual candidates; free entry remains unknown',()=>{
 const indoor=recommend({...base,query:'A free indoor place'},data);assert.ok(indoor.recommendations.every(p=>p.category==='cafe'));assert.ok(indoor.warnings.includes('cost_unknown'));assert.ok(indoor.recommendations.every(p=>p.uncertainties.includes('cost')));
 for(const query of ['Not indoors, please','На свежем воздухе'])assert.ok(recommend({...base,query},data).recommendations.every(p=>p.category!=='cafe'));
 assert.equal(recommend({...base,query:'indoors and outdoors'},data).route.stops.length,0);
});
test('per-leg walking language does not consume the whole visit budget',()=>{
 const r=recommend({...base,query:'coffee within 10 minutes walk'},data);assert.equal(r.trace.effectiveBudget,60);assert.equal(r.intent.maxWalk,10);
});
test('short visits qualify at retrieval time and closing boundaries use that same duration',()=>{
 const r=recommend({...base,budget:15,interests:['nature']},[poi('park','park',{hours:'Tu 14:00-14:10'})]);assert.equal(r.recommendations.length,1);assert.equal(r.route.totalMinutes,10);assert.equal(r.recommendations[0].visitMinutes,10);assert.equal(r.recommendations[0].shortStop,true);
});
test('all route stops, recommendation cards and visit lengths agree in 100 real planning combinations',()=>{
 const pois=attachEvidence(JSON.parse(readFileSync(new URL('../data/pois.json',import.meta.url))),JSON.parse(readFileSync(new URL('../data/evidence.json',import.meta.url))));let count=0;
 for(const origin of PRESETS)for(const budget of [30,60,90,120])for(const interests of [[],['coffee','nature'],['family'],['culture'],['landmark']]){const r=recommend({...base,origin,budget,interests},pois);assert.deepEqual(r.recommendations.map(p=>p.id),r.route.stops.map(p=>p.id));assert.deepEqual(r.recommendations.map(p=>p.visitMinutes),r.route.stops.map(p=>p.visitMinutes));assert.ok(r.route.totalMinutes<=budget);count++;}assert.equal(count,100);
});
test('keeping a stop survives replanning but cannot override closures or other hard constraints',()=>{
 const r=recommend({...base,pinnedIds:['park'],weather:'rain'},data);assert.equal(r.route.stops.length,0);assert.deepEqual(r.conflicts.map(c=>c.id),['park']);
 const open=recommend({...base,pinnedIds:['cafe2']},data);assert.ok(open.route.stops.some(p=>p.id==='cafe2'));
 for(const backup of backupPlans({...base,pinnedIds:['park']},data)){if(backup.id==='rain')assert.equal(backup.result.route.stops.length,0);}
});
test('replace changes only the requested stop and preserves the rest of the route',()=>{
 const start=recommend(base,data),target=start.route.stops.find(p=>p.category==='cafe');assert.ok(target);
 const edited=editPlan(base,data,start,{type:'replace',id:target.id});assert.equal(edited.ok,true);assert.equal(edited.result.route.stops.length,start.route.stops.length);assert.ok(!edited.result.route.stops.some(p=>p.id===target.id));
 for(const p of start.route.stops.filter(p=>p.id!==target.id))assert.ok(edited.result.route.stops.some(q=>q.id===p.id));assert.equal(base.excludedIds,undefined);
});
test('failed replacements are transactional and kept stops require unlocking',()=>{
 const limited=[poi('cafe','cafe')],start=recommend(base,limited);assert.equal(editPlan(base,limited,start,{type:'replace',id:'cafe'}).ok,false);assert.equal(start.route.stops[0].id,'cafe');
 const kept=editPlan(base,limited,start,{type:'keep',id:'cafe'});assert.equal(editPlan(kept.input,limited,start,{type:'remove',id:'cafe'}).reason,'unkeep_first');
});
test('remove does not refill the slot and can leave an explicitly empty itinerary',()=>{
 const start=recommend(base,data),removed=editPlan(base,data,start,{type:'remove',id:start.route.stops[0].id});assert.equal(removed.result.route.stops.length,start.route.stops.length-1);
 const only=recommend(base,[data[0]]),empty=editPlan(base,[data[0]],only,{type:'remove',id:data[0].id});assert.equal(empty.ok,true);assert.equal(empty.result.route.stops.length,0);assert.equal(empty.input.maxStops,0);
});
test('source restrictions stay outside generated prose and unverified route access is rejected',()=>{
 const p={...poi('park','park'),operationalNotes:[{en:'Photos require special permission.'}]};
 const s={id:p.id,why:'A small outdoor pause could fit your interests.',activity:'Observe a detail in the landscape.',mission:'Describe one detail you noticed.',evidenceIds:[p.id+':category']};
 assert.throws(()=>validateNarrative({suggestions:[{...s,why:'This park provides an accessible route for a stroll.'}]},[p]));
 assert.throws(()=>validateNarrative({suggestions:[{...s,activity:'Photography is prohibited here.'}]},[p]));
});
