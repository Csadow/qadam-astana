import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIntent,recommend} from '../src/engine.js';
import {recoveryOptions} from '../src/recovery.js';
const origin={lat:51.1,lon:71.4},base={origin,budget:120,maxWalk:20,departure:'2026-10-20T14:00'};
const pois=[{id:'park',name:'Park',category:'park',...origin,tags:{},hours:'24/7',source:{url:'https://www.openstreetmap.org/node/1'}}];
test('word durations, fractions and compact units preserve the available time',()=>{
 for(const [q,n] of [['I have half an hour',30],['У меня полчаса',30],['Жарты сағатым бар',30],['I have one hour',60],['один час',60],['бір сағат',60],['1h 30m',90],['1h30m',90],['полтора часа',90],['бір жарым сағат',90],['one and a half hours',90],['quarter of an hour',15],['тридцать минут',30],['отыз минут',30],['30–60 minutes',30],['30–60 минут',30],['1–2 hours',60]]){
  const p=parseIntent(q);assert.equal(p.budget,n,q);assert.deepEqual(p.timeIssues,[],q);assert.equal(recommend({...base,query:q},pois).trace.effectiveBudget,n,q);
 }
});
test('Kazakh deadline order and explicit walking caps affect the same bounded itinerary',()=>{
 for(const q of ['15:00-ге дейін қайту','сағат 15:00 дейін оралу','вернуться к 15:00','return by 15:00']){const r=recommend({...base,query:q,bufferMinutes:10},pois);assert.equal(r.trace.effectiveBudget,50,q);assert.equal(r.returnToStart,true);}
 const p=parseIntent('half an hour, max ten minutes walking');assert.equal(p.budget,30);assert.equal(p.maxWalk,10);assert.deepEqual(p.timeIssues,[]);
});
test('unknown, conflicting, out-of-range and ambiguous time requests cannot silently plan',()=>{
 for(const query of ['a couple of hours','сорок пять минут','бірнеше сағат','60–30 minutes','30 minutes or 2 hours','return by 25:00','back by three','tomorrow morning','вечером','5 min','999 minutes','-30 minutes','back by 15:00 and return by 16:00']){
  const r=recommend({...base,query},pois);assert.ok(r.warnings.includes('timing_confirmation'),query);assert.equal(r.route.stops.length,0,query);assert.deepEqual(recoveryOptions({...base,query},pois,r),{reason:'timing',options:[]});
 }
});
test('explicit confirmation uses controls and cannot retain hidden parsed time limits',()=>{
 const r=recommend({...base,query:'half an hour tomorrow, back by 15:00',timingOverride:true,budget:90,returnBy:'2026-10-20T15:20',bufferMinutes:10},pois);assert.equal(r.trace.effectiveBudget,70);assert.ok(r.route.stops.length);assert.ok(r.warnings.includes('timing_controls_used'));
});
test('ordinary preferences do not trigger temporal confirmation',()=>{
 for(const q of ['I am hungry','A park and coffee','Тихое кафе с розеткой','Баламен серуендеу'])assert.deepEqual(parseIntent(q).timeIssues,[],q);
});
