/** Pure retrieval and planning engine. No network, storage, user logging, or model dependency. */
import {CONCEPTS,parseIntent} from './intent.js';
import {distanceM,walkMinutes} from './geo.js';
export {distanceM,walkMinutes} from './geo.js';
export {parseIntent} from './intent.js';
export const VERSION = '6.1.0';
export const PRESETS = [
  {id:'expo',name:'EXPO / MEGA Silk Way',lat:51.0893,lon:71.4076},
  {id:'baiterek',name:'Baiterek',lat:51.1282,lon:71.4304},
  {id:'museum',name:'National Museum',lat:51.1183,lon:71.4695},
  {id:'river',name:'Ishim riverfront',lat:51.1607,lon:71.4287},
  {id:'khan',name:'Khan Shatyr',lat:51.1325,lon:71.4039},
];
const VISITS = {cafe:20,restaurant:35,museum:45,gallery:30,park:20,garden:15,playground:25,mall:30,library:30,viewpoint:15,attraction:20,artwork:10,arts_centre:30};
const SHORT_VISITS={cafe:10,restaurant:25,museum:35,gallery:20,park:10,garden:10,playground:15,mall:15,library:20,viewpoint:10,attraction:10,artwork:8,arts_centre:20};
const STOP = new Set('i a an the in near me my want to for with and of is on at a я у в на с хочу мне рядом меня и для возле около как что за это'.split(' '));
export const CATEGORIES = Object.keys(VISITS);
export function tokens(text='') {return String(text).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(t=>t.length>1&&!STOP.has(t))||[];}
export function travelLeg(input,a,b){return input.routing?.leg(a,b,{pace:input.pace,avoidSteps:input.accessible||input.intent?.stroller})||{minutes:walkMinutes(a,b,input.pace),distanceM:Math.round(distanceM(a,b)*1.3),mode:'estimated',reason:'outside_graph',points:[[a.lon,a.lat],[b.lon,b.lat]],connectors:[]};}
export function astanaNow(date=new Date()) {return new Date(date.getTime()+5*3600000).toISOString().slice(0,16);}
export function parseDeparture(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid departure date and time.');
 const d=new Date(value+':00+05:00');
 if(!Number.isFinite(d.getTime())||astanaNow(d)!==value) throw new Error('Choose a valid departure date and time.');
 return d;
}
const DAYS=['Su','Mo','Tu','We','Th','Fr','Sa'];
function dayList(spec){
 const out=new Set();
 for(const piece of spec.split(',')) {
  if(piece.includes('-')){let [a,b]=piece.split('-').map(x=>DAYS.indexOf(x)); if(a<0||b<0) return null; for(let i=0;i<7;i++){out.add(a); if(a===b) break;a=(a+1)%7;}}
  else {const day=DAYS.indexOf(piece);if(day<0) return null;out.add(day);}
 }
 return out;
}
/** Recognizes only simple weekly hours; special dates, PH, sunrise, comments etc. remain unknown. */
export function openingStatus(hours, arrival, duration=0) {
 if(!hours||typeof hours!=='string') return 'unknown';
 if(hours.trim()==='24/7') return 'open';
 const rules=[];
 for(const part of hours.split(';')) {
  const m=part.trim().match(/^(?:(Mo|Tu|We|Th|Fr|Sa|Su)([A-Za-z,\-]*)\s+)?((?:\d{2}:\d{2}-\d{2}:\d{2})(?:,\s*\d{2}:\d{2}-\d{2}:\d{2})*|off|closed)$/);
  if(!m) return 'unknown';
  const days=m[1]?dayList(m[1]+m[2]):new Set([0,1,2,3,4,5,6]);if(!days) return 'unknown';
  const ranges=[];
  if(!['off','closed'].includes(m[3])) for(const range of m[3].split(',')) {
   const [start,end]=range.trim().split('-').map(t=>{const [h,min]=t.split(':').map(Number);return h>24||min>59||(h===24&&min!==0)?NaN:h*60+min;});
   if(!Number.isFinite(start)||!Number.isFinite(end)||start===end) return 'unknown';
   ranges.push([start,end]);
  }
  // Multiple overlapping day rules need full OSM semantics; do not guess.
  if(rules.some(r=>[...days].some(d=>r.days.has(d)))) return 'unknown';
  rules.push({days,ranges});
 }
 const local=new Date(arrival.getTime()+5*3600000), day=local.getUTCDay(), minute=local.getUTCHours()*60+local.getUTCMinutes();
 for(const r of rules) for(const [start,end] of r.ranges) {
  if(r.days.has(day)&&end>start&&minute>=start&&minute+duration<=end&&minute<end) return 'open';
  if(end<start&&((r.days.has(day)&&minute>=start&&minute+duration<=1440+end)||(r.days.has((day+6)%7)&&minute<end&&minute+duration<=end))) return 'open';
 }
 return 'closed';
}
export function validateInput(input) {
 if(!input||typeof input!=='object') throw new Error('Invalid request.');
 const lat=Number(input.origin?.lat),lon=Number(input.origin?.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('Choose a valid starting location.');
 const returnOrigin={lat:Number(input.returnOrigin?.lat??lat),lon:Number(input.returnOrigin?.lon??lon)};
 if(!Number.isFinite(returnOrigin.lat)||!Number.isFinite(returnOrigin.lon)||Math.abs(returnOrigin.lat)>90||Math.abs(returnOrigin.lon)>180)throw new Error('Choose a valid return location.');
 const budget=Number(input.budget??60),maxWalk=Number(input.maxWalk??20);
 if(!Number.isFinite(budget)||budget<10||budget>240||!Number.isFinite(maxWalk)||maxWalk<1||maxWalk>60)throw new Error('Time budget must be 10–240 minutes and walking limit 1–60 minutes.');
 const query=String(input.query||'').slice(0,600);
 const intent=parseIntent(query,Array.isArray(input.interests)?input.interests:[]);
 const timingBlocked=intent.timeIssues.length>0&&input.timingOverride!==true;
 if(input.timingOverride===true){intent.budget=undefined;intent.maxWalk=undefined;intent.returnByClock=undefined;}
 const group=Array.isArray(input.group)?input.group:[];
 if(group.length>5||group.some(x=>!CONCEPTS[x]&&x!=='any'))throw new Error('Choose up to five supported group interests.');
 const boundedIds=(value,max)=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'))].slice(0,max):[];
 const pinnedIds=boundedIds(input.pinnedIds,3),preferredIds=boundedIds(input.preferredIds,3);
 const maxStops=Number.isInteger(input.maxStops)?Math.min(3,Math.max(0,input.maxStops)):3;
 const mode=['curious','calm','playful'].includes(input.mood)?input.mood:'balanced';
 const departure=parseDeparture(input.departure||astanaNow()),bufferMinutes=Number(input.bufferMinutes??0);
 if(!Number.isInteger(bufferMinutes)||bufferMinutes<0||bufferMinutes>60)throw new Error('Buffer must be 0–60 minutes.');
 const clock=intent.returnByClock?.padStart(5,'0'),returnBy=input.returnBy||(clock?astanaNow(departure).slice(0,10)+'T'+clock:null);
 const deadline=returnBy?parseDeparture(returnBy):null,deadlineMinutes=deadline?Math.floor((deadline-departure)/60000):null;
 const requestedBudget=Math.min(budget,intent.budget??budget),grossBudget=Math.max(0,Math.min(requestedBudget,deadlineMinutes??Infinity));
 return {timingBlocked,group:[...group],mood:mode,pinnedIds,preferredIds,maxStops,journeyIds:boundedIds(input.journeyIds,3),excludedIds:boundedIds(input.excludedIds,50),origin:{lat,lon},budget:Math.max(0,grossBudget-bufferMinutes),requestedBudget,grossBudget,bufferMinutes,deadline,deadlineMinutes,routing:input.routing,maxWalk:Math.min(maxWalk,intent.maxWalk??maxWalk),query,intent,
  returnOrigin,setting:['indoor','outdoor'].includes(input.setting)?input.setting:intent.setting,
  departure,locale:['en','ru','kk'].includes(input.locale)?input.locale:'en',
  weather:['rain','cold'].includes(input.weather)?input.weather:'fair',pace:input.pace==='gentle'?'gentle':'normal',
  accessible:input.accessible===true||intent.accessible,verifiedHours:input.verifiedHours===true,returnToStart:!!deadline||input.returnToStart!==false};
}
function searchable(p){return [p.name,...Object.values(p.names||{}),p.category,p.description,...(p.evidence||[]).flatMap(f=>typeof f.text==='string'?[f.text]:Object.values(f.text)),...(p.themes||[]),...Object.values(p.tags||{})].join(' ');}
function bm25(queryTokens,pois){
 const docs=pois.map(p=>tokens(searchable(p))), avg=docs.reduce((a,d)=>a+d.length,0)/(docs.length||1);
 const df=new Map(queryTokens.map(t=>[t,docs.filter(d=>d.includes(t)).length]));
 return docs.map(d=>queryTokens.reduce((sum,t)=>{const f=d.filter(x=>x===t).length;return sum+Math.log(1+(docs.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5))*(f*2.2)/(f+1.2*(.25+.75*d.length/(avg||1)));},0));
}
function isIndoor(p){return ['cafe','restaurant','museum','gallery','mall','library','arts_centre'].includes(p.category)||p.tags?.indoor==='yes';}
function reasons(p,input,walk,matched){const out=['nearby','fits_time'];if(matched.length)out.push(...matched.map(x=>'interest_'+x));if(input.weather!=='fair'&&isIndoor(p))out.push('indoor');if(p.wheelchair==='yes')out.push('wheelchair_source');return out;}
export function recommend(raw,pois) {
 const input=validateInput(raw), {origin,intent}=input;
 const scores=bm25(tokens(input.query),pois), exclusions={distance:0,time:0,closed:0,accessibility:0,hoursUnknown:0,weather:0,interest:0,restricted:0,skipped:0,excludedInterest:0,setting:0,path:0,journey:0};
 const candidates=[];
 const desired=input.group.length?[...new Set(input.group.filter(x=>x!=='any'))]:intent.concepts;
 pois.forEach((p,index)=>{
  if(input.timingBlocked)return;
  if(input.journeyIds.length&&!input.journeyIds.includes(p.id)){exclusions.journey++;return;}
  if(p.accessRestricted||['private','no'].includes(p.tags?.access)){exclusions.restricted++;return;}
  if(input.excludedIds.includes(p.id)){exclusions.skipped++;return;}
  const outward=travelLeg(input,origin,p),backward=input.returnToStart?travelLeg(input,p,input.returnOrigin):{minutes:0};
  const walk=outward.minutes,idealVisit=VISITS[p.category]||20,shortVisit=Math.min(idealVisit,SHORT_VISITS[p.category]||idealVisit);
  let visit=idealVisit;
  if(!Number.isFinite(walk)||!Number.isFinite(backward.minutes)){exclusions.path++;return;}
  if(walk>input.maxWalk||backward.minutes>input.maxWalk){exclusions.distance++;return;}
  const travel=walk+backward.minutes;
  if(travel+visit>input.budget)visit=shortVisit;
  const total=travel+visit;
  if(total>input.budget){exclusions.time++;return;}
  if(input.accessible&&p.wheelchair!=='yes'){exclusions.accessibility++;return;}
  if(input.intent.settingConflict){exclusions.setting++;return;}
  if((input.setting==='indoor'&&!isIndoor(p))||(input.setting==='outdoor'&&isIndoor(p))){exclusions.setting++;return;}
  if(intent.excludedCategories.includes(p.category)||intent.excluded.some(c=>c!=='family'&&CONCEPTS[c].categories.includes(p.category))){exclusions.excludedInterest++;return;}
  if(input.weather!=='fair'&&!isIndoor(p)){exclusions.weather++;return;}
  const matched=desired.filter(c=>CONCEPTS[c].categories.includes(p.category));
  const groupMatches=input.group.map((interest,i)=>(interest==='any'||CONCEPTS[interest].categories.includes(p.category))?i:-1).filter(i=>i>=0);
  // Coffee is an explicit place request. A child constraint limits appropriate categories.
  if(desired.length===1&&desired.includes('coffee')&&p.category!=='cafe'){exclusions.interest++;return;}
  if((input.group.length?input.group.includes('family'):intent.concepts.includes('family'))&&!CONCEPTS.family.categories.includes(p.category)&&!desired.includes('coffee')){exclusions.interest++;return;}
  if(desired.length&&!matched.length){exclusions.interest++;return;}
  const arrival=new Date(input.departure.getTime()+walk*60000);let status=openingStatus(p.hours,arrival,visit);
  if(status==='closed'&&visit>shortVisit){visit=shortVisit;status=openingStatus(p.hours,arrival,visit);}
  if(status==='closed'){exclusions.closed++;return;}
  if(input.verifiedHours&&status==='unknown'){exclusions.hoursUnknown++;return;}
  const uncertainties=[];
  if(status==='unknown')uncertainties.push('hours');
  if(intent.quiet&&p.tags?.quiet!=='yes')uncertainties.push('quiet');
  if(intent.socket&&!['yes','available'].includes(p.tags?.socket))uncertainties.push('socket');
  if(input.accessible)uncertainties.push('step_free_route');
  if(intent.free)uncertainties.push('cost');
  if(intent.concepts.includes('family')&&p.category==='museum')uncertainties.push(p.capabilities?.some(c=>c.capability==='interactiveInterpretation'&&c.value===true)?'interactive_availability':'interactive');
  const moodBoost=input.mood==='curious'?(p.evidence?.length?2:0)+(['museum','artwork','attraction','gallery'].includes(p.category)?2:0):input.mood==='calm'?(['park','garden'].includes(p.category)?2:0):input.mood==='playful'?(['playground','museum'].includes(p.category)?2:0):0;
  const score=moodBoost+matched.length*5+Math.min(scores[index],6)+3*(1-walk/Math.max(1,input.maxWalk))+(status==='open'?.6:0)+(p.description?.length?.2:0);
  candidates.push({...p,walkMinutes:walk,distanceM:Math.round(distanceM(origin,p)),visitMinutes:visit,idealVisitMinutes:idealVisit,totalMinutes:travel+visit,
   openingStatus:status,groupMatches,score:Math.round(score*100)/100,reasons:reasons(p,input,walk,matched),uncertainties,match:uncertainties.some(u=>['quiet','socket'].includes(u))?'partial':'context'});
 });
 candidates.sort((a,b)=>b.score-a.score||a.walkMinutes-b.walkMinutes||a.id.localeCompare(b.id));
 const pool=[];
 // Required/retained stops must survive the bounded candidate pool.
 for(const id of [...input.pinnedIds,...input.preferredIds]){const p=candidates.find(p=>p.id===id);if(p&&!pool.includes(p))pool.push(p);}
 for(const p of candidates)if(!pool.includes(p)&&pool.filter(q=>q.category===p.category).length<2&&pool.length<18)pool.push(p);
 const route=planRoute(pool,input);
 const selected=route.stops.map(stop=>({...candidates.find(p=>p.id===stop.id),...stop}));
 const conflicts=input.pinnedIds.filter(id=>!route.stops.some(p=>p.id===id)).map(id=>({id,reason:candidates.some(p=>p.id===id)?'combination':'constraint'}));
 const coverage=input.group.map((interest,index)=>({index,interest,covered:route.stops.some(p=>p.groupMatches.includes(index))}));
 const warnings=['estimates'];
 if(intent.budgetRange&&raw.timingOverride!==true)warnings.push('timing_range_lower');
 if(input.timingBlocked)warnings.push('timing_confirmation');
 if(raw.timingOverride===true)warnings.push('timing_controls_used');
 if(intent.airport) warnings.push('airport');
 if(intent.night||input.departure.getUTCHours()+5>=22||(input.departure.getUTCHours()+5)%24<6) warnings.push('night');
 if(input.weather!=='fair')warnings.push('weather_manual');
 if(intent.settingConflict)warnings.push('setting_conflict');
 if(intent.free)warnings.push('cost_unknown');
 if(conflicts.length)warnings.push('kept_conflict');
 if(input.deadlineMinutes!==null&&input.deadlineMinutes<=0)warnings.push('deadline_passed');
 if(input.bufferMinutes&&input.budget===0)warnings.push('buffer_exhausted');
 const plannedEnd=new Date(input.departure.getTime()+route.totalMinutes*60000),reservedEnd=new Date(plannedEnd.getTime()+input.bufferMinutes*60000);
 const timing={departure:astanaNow(input.departure),plannedEnd:astanaNow(plannedEnd),reservedEnd:astanaNow(reservedEnd),returnBy:input.deadline?astanaNow(input.deadline):null,bufferMinutes:input.bufferMinutes,grossBudget:input.grossBudget,requestedBudget:input.requestedBudget,slackMinutes:input.budget-route.totalMinutes};
 return {recommendations:selected,route,timing,warnings,conflicts,intent:{...intent,setting:input.setting,maxWalk:input.maxWalk},group:coverage,mood:input.mood,trace:{datasetSize:pois.length,candidates:candidates.length,exclusions,
  concepts:desired,effectiveBudget:input.budget,retrieval:'BM25 + multilingual concepts + hard constraints'},
  mode:'retrieval-template',locale:input.locale,departure:astanaNow(input.departure),returnOrigin:input.returnOrigin,returnToStart:input.returnToStart};
}
export function planRoute(candidates,input){
 input={pinnedIds:[],preferredIds:[],maxStops:3,...input};
 let best={stops:[],totalMinutes:0,walkMinutes:0,visitMinutes:0,returnMinutes:0,legs:[],score:0};
 const explore=(stops,last,elapsed,walked,score)=>{
  const backLeg=input.returnToStart?travelLeg(input,last,input.returnOrigin||input.origin):null,back=backLeg?.minutes||0;
  if(stops.length&&input.pinnedIds.every(id=>stops.some(p=>p.id===id))&&elapsed+back<=input.budget&&back<=input.maxWalk){
   const covered=new Set(stops.flatMap(p=>p.groupMatches||[])).size;
   const retained=stops.filter(p=>input.preferredIds.includes(p.id)).length;
   const utility=retained*200+covered*45+stops.length*20+score+(elapsed-walked)*.08-walked*.03;
   if(utility>best.score)best={stops:[...stops],totalMinutes:elapsed+back,walkMinutes:walked+back,visitMinutes:elapsed-walked,returnMinutes:back,legs:[...stops.map(p=>p.travel),...(backLeg?[backLeg]:[])],score:utility};
  }
  if(stops.length===input.maxStops)return;
  for(const p of candidates){
   if(stops.some(s=>s.id===p.id||(s.category===p.category&&!input.pinnedIds.includes(p.id))||s.name.toLowerCase()===p.name.toLowerCase()))continue;
   const travel=travelLeg(input,last,p),leg=travel.minutes;
   if(leg>input.maxWalk)continue;
   for(const visit of [...new Set([p.visitMinutes,Math.min(p.visitMinutes,SHORT_VISITS[p.category]||p.visitMinutes)])]){
    const next=elapsed+leg+visit;if(next>input.budget)continue;
    const status=openingStatus(p.hours,new Date(input.departure.getTime()+(elapsed+leg)*60000),visit);
    if(status==='closed'||(input.verifiedHours&&status!=='open'))continue;
    explore([...stops,{id:p.id,name:p.name,names:p.names,lat:p.lat,lon:p.lon,category:p.category,travel,legMinutes:leg,visitMinutes:visit,shortStop:visit<(p.idealVisitMinutes||p.visitMinutes),arrivalMinutes:elapsed+leg,openingStatus:status,source:p.source,groupMatches:p.groupMatches||[]}],p,next,walked+leg,score+p.score);
   }
  }
 };
 explore([],input.origin,0,0,0);return best;
}

/** Preview a changed context without weakening any other user constraint. */
export function backupPlans(raw,pois) {
 const base=recommend(raw,pois), budget=base.timing.grossBudget;
 return [
  {id:'shorter',changes:{budget:Math.max(15,budget-15)}},
  {id:'rain',changes:{weather:'rain'}},
 ].filter(p=>(p.id!=='rain'||raw.weather!=='rain')&&(p.id!=='shorter'||budget>15)).map(p=>({...p,result:recommend({...raw,...p.changes},pois)}));
}

/** Transactional route edits: a failed replacement keeps the existing plan. */
export function editPlan(raw,pois,current,action){
 const ids=current.route.stops.map(p=>p.id);
 if(!ids.includes(action.id))return {ok:false,reason:'unknown_stop'};
 const pinned=new Set(raw.pinnedIds||[]),excluded=new Set(raw.excludedIds||[]);
 if(action.type==='keep'){
  if(pinned.has(action.id))pinned.delete(action.id);else pinned.add(action.id);
  return {ok:true,input:{...raw,pinnedIds:[...pinned],preferredIds:ids},result:current};
 }
 if(!['replace','remove'].includes(action.type))return {ok:false,reason:'unknown_action'};
 if(pinned.has(action.id))return {ok:false,reason:'unkeep_first'};
 const others=ids.filter(id=>id!==action.id);excluded.add(action.id);
 const input={...raw,excludedIds:[...excluded],preferredIds:others,maxStops:action.type==='remove'?others.length:ids.length};
 const next=recommend({...input,pinnedIds:[...new Set([...pinned,...others])]},pois);
 if(action.type==='replace'&&(next.route.stops.length!==ids.length||!others.every(id=>next.route.stops.some(p=>p.id===id))))return {ok:false,reason:'no_replacement'};
 return {ok:true,input,result:next};
}
