/** Ephemeral, manually confirmed walk state. No location watching, storage, or network. */
import {recommend,validateInput,travelLeg,astanaNow} from './engine.js';
const MINUTE=60000;
const stamp=ms=>astanaNow(new Date(ms));
const liveMinute=now=>Math.ceil(Number(now)/MINUTE)*MINUTE;
export function startWalk(raw,pois,{mode='rehearsal',now=Date.now()}={}){
 if(!['live','rehearsal'].includes(mode))throw new Error('Invalid walk mode.');
 const initial=recommend(raw,pois),v=validateInput(raw);
 if(!initial.returnToStart||!initial.route.stops.length)throw new Error('Choose a feasible return walk first.');
 const startedAt=v.departure.getTime(),deadline=startedAt+v.grossBudget*MINUTE;
 const base={...raw,originLabel:raw.origin?.name||null,origin:{...v.origin},returnOrigin:{...v.returnOrigin},budget:v.requestedBudget,maxWalk:v.maxWalk,bufferMinutes:v.bufferMinutes,returnToStart:true,setting:v.setting,accessible:v.accessible,timingOverride:true,group:[...v.group],interests:[...(raw.interests||[])],pinnedIds:[...v.pinnedIds],excludedIds:[...v.excludedIds],maxStops:v.maxStops};
 const session={base,mode,startedAt,deadline,clock:mode==='live'?Math.max(startedAt,liveMinute(now)):startedAt,position:{...v.origin},completed:[],unavailable:[],weather:v.weather,returnOnly:false,event:'start',previousIds:initial.route.stops.map(s=>s.id)};
 return replanWalk(session,pois);
}
export function replanWalk(session,pois){
 const excluded=[...new Set([...(session.base.excludedIds||[]),...session.completed,...session.unavailable])];
 const remaining=Math.max(0,Math.floor((session.deadline-session.clock)/MINUTE));
 const raw={...session.base,origin:{...session.position},departure:stamp(session.clock),returnBy:stamp(session.deadline),budget:Math.max(10,Math.min(240,remaining)),weather:session.weather,excludedIds:excluded,pinnedIds:session.base.pinnedIds.filter(id=>!excluded.includes(id)),preferredIds:session.previousIds.filter(id=>!excluded.includes(id)),maxStops:session.returnOnly?0:Math.max(0,session.base.maxStops-session.completed.length)};
 let result=recommend(raw,pois.filter(p=>!excluded.includes(p.id)));
 result={...result,warnings:result.warnings.filter(w=>w!=='timing_controls_used')};
 const direct=travelLeg(validateInput(raw),raw.origin,raw.returnOrigin);
 if(!result.route.stops.length&&Number.isFinite(direct.minutes)){
  const route={...result.route,totalMinutes:direct.minutes,walkMinutes:direct.minutes,returnMinutes:direct.minutes,legs:[direct]};
  result={...result,route,timing:{...result.timing,plannedEnd:stamp(session.clock+direct.minutes*MINUTE),reservedEnd:stamp(session.clock+(direct.minutes+raw.bufferMinutes)*MINUTE),slackMinutes:remaining-raw.bufferMinutes-direct.minutes}};
 }
 const reachable=result.route.stops.length>0||Number.isFinite(direct.minutes),total=result.route.totalMinutes;
 const lateMinutes=reachable?Math.max(0,Math.ceil((session.clock+total*MINUTE-session.deadline)/MINUTE)):null;
 const reserveShortfall=reachable?Math.max(0,Math.ceil((session.clock+(total+raw.bufferMinutes)*MINUTE-session.deadline)/MINUTE)):null;
 const after=result.route.stops.map(s=>s.id);
 const completedCoverage=session.base.group.map((interest,index)=>({index,interest,covered:session.completed.some(id=>pois.find(p=>p.id===id)&&session.coverage?.[id]?.includes(index))||result.group[index]?.covered}));
 return {...session,input:raw,result,direct,remaining,lateMinutes,reserveShortfall,reachable,walkCapExceeded:!after.length&&Number.isFinite(direct.minutes)&&direct.minutes>raw.maxWalk,coverage:session.coverage||{},group:completedCoverage,changes:{removed:session.previousIds.filter(id=>!after.includes(id)&&!excluded.includes(id)),added:after.filter(id=>!session.previousIds.includes(id)),retained:after.filter(id=>session.previousIds.includes(id))}};
}
export function updateWalk(session,event,pois,{now=Date.now()}={}){
 let next={...session,previousIds:session.result.route.stops.map(s=>s.id),completed:[...session.completed],unavailable:[...session.unavailable],coverage:{...session.coverage},event:event.type};
 if(session.mode==='live')next.clock=Math.max(session.clock,liveMinute(now));
 if(['complete','unavailable'].includes(event.type)){
  const stop=session.result.route.stops[0];
  if(!stop||event.id!==stop.id)throw new Error('Confirm the next stop in this walk.');
  next.position={lat:stop.lat,lon:stop.lon};next.positionId=stop.id;
  if(session.mode==='rehearsal')next.clock+=(stop.legMinutes+(event.type==='complete'?stop.visitMinutes:0))*MINUTE;
  next[event.type==='complete'?'completed':'unavailable'].push(stop.id);
  if(event.type==='complete')next.coverage[stop.id]=stop.groupMatches;
 }else if(event.type==='delay'){
  if(session.mode!=='rehearsal'||!Number.isInteger(event.minutes)||event.minutes<1||event.minutes>120)throw new Error('Simulated delays are available in rehearsal only.');
  next.clock+=event.minutes*MINUTE;
 }else if(event.type==='weather'){
  if(!['rain','cold','fair'].includes(event.weather))throw new Error('Choose a supported weather report.');
  next.weather=event.weather;
 }else if(event.type==='return')next.returnOnly=true;
 else if(event.type!=='refresh')throw new Error('Unknown walk action.');
 return replanWalk(next,pois);
}
