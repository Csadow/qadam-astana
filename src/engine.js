/** Pure retrieval and planning engine. No network, storage, user logging, or model dependency. */
export const VERSION = '1.0.0';
export const PRESETS = [
  {id:'expo',name:'EXPO / MEGA Silk Way',lat:51.0893,lon:71.4076},
  {id:'baiterek',name:'Baiterek',lat:51.1282,lon:71.4304},
  {id:'museum',name:'National Museum',lat:51.1183,lon:71.4695},
  {id:'river',name:'Ishim riverfront',lat:51.1607,lon:71.4287},
  {id:'khan',name:'Khan Shatyr',lat:51.1325,lon:71.4039},
];
const VISITS = {cafe:20,restaurant:35,museum:45,gallery:30,park:20,garden:15,playground:25,mall:30,library:30,viewpoint:15,attraction:20,artwork:10,arts_centre:30};
const CONCEPTS = {
 coffee:{re:/coffee|café|cafe|коф|кафе/i,categories:['cafe']},
 culture:{re:/museum|culture|art\b|музе|культур|өнер/i,categories:['museum','gallery','arts_centre','artwork','attraction']},
 nature:{re:/park|nature|green|парк|природ|саябақ|табиғат/i,categories:['park','garden','viewpoint']},
 family:{re:/child|kid|family|реб[её]н|дет|семь|семей|баламен|бала|отбасы/i,categories:['playground','museum','park','mall']},
 landmark:{re:/architecture|landmark|photo|архитект|фото|достоприм|сәулет/i,categories:['attraction','artwork','viewpoint','museum']},
};
const STOP = new Set('i a an the in near me my want to for with and of is on at a я у в на с хочу мне рядом меня и для возле около как что за это'.split(' '));
export const CATEGORIES = Object.keys(VISITS);
export function tokens(text='') {return String(text).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(t=>t.length>1&&!STOP.has(t))||[];}
export function distanceM(a,b) {
 const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
 const x=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
export function walkMinutes(a,b,pace='normal'){return Math.ceil(distanceM(a,b)*1.3/(pace==='gentle'?55:75));}
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
export function parseIntent(query='',interests=[]) {
 const concepts=new Set(interests.filter(k=>CONCEPTS[k]));
 for(const [key,v] of Object.entries(CONCEPTS)) if(v.re.test(query)) concepts.add(key);
 const nums=[...query.matchAll(/(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s*(?:min|мин|минут)/gi)];
 let budget=nums.length?Number(nums.at(-1)[2]):undefined;
 if(!budget){const m=query.match(/(\d{1,3})\s*(?:minutes?|mins?|минут[ауы]?|мин)(?=$|[\s,.!?])/i);if(m)budget=Number(m[1]);}
 if(!budget){const h=query.match(/(\d)\s*(?:hours?|hrs?|час[аов]*|сағат)/i);if(h)budget=Number(h[1])*60;}
 return {concepts:[...concepts],budget,
  quiet:/quiet|тиш|тих|тыныш/i.test(query), socket:/socket|outlet|розет|қуат/i.test(query),
  accessible:/wheelchair|step.free|коляск|кресл|арбамен/i.test(query),
  airport:/flight|airport|вылет|аэропорт|ұшақ|әуежай/i.test(query),
  night:/night|ноч|түн/i.test(query)};
}
export function validateInput(input) {
 if(!input||typeof input!=='object') throw new Error('Invalid request.');
 const lat=Number(input.origin?.lat),lon=Number(input.origin?.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('Choose a valid starting location.');
 const budget=Number(input.budget??60),maxWalk=Number(input.maxWalk??20);
 if(!Number.isFinite(budget)||budget<10||budget>240||!Number.isFinite(maxWalk)||maxWalk<1||maxWalk>60)throw new Error('Time budget must be 10–240 minutes and walking limit 1–60 minutes.');
 const query=String(input.query||'').slice(0,600);
 const intent=parseIntent(query,Array.isArray(input.interests)?input.interests:[]);
 return {origin:{lat,lon},budget:Math.min(budget,intent.budget||budget),maxWalk,query,intent,
  departure:parseDeparture(input.departure||astanaNow()),locale:['en','ru','kk'].includes(input.locale)?input.locale:'en',
  weather:['rain','cold'].includes(input.weather)?input.weather:'fair',pace:input.pace==='gentle'?'gentle':'normal',
  accessible:input.accessible===true||intent.accessible,verifiedHours:input.verifiedHours===true,returnToStart:input.returnToStart!==false};
}
function searchable(p){return [p.name,...Object.values(p.names||{}),p.category,p.description,...Object.values(p.tags||{})].join(' ');}
function bm25(queryTokens,pois){
 const docs=pois.map(p=>tokens(searchable(p))), avg=docs.reduce((a,d)=>a+d.length,0)/(docs.length||1);
 const df=new Map(queryTokens.map(t=>[t,docs.filter(d=>d.includes(t)).length]));
 return docs.map(d=>queryTokens.reduce((sum,t)=>{const f=d.filter(x=>x===t).length;return sum+Math.log(1+(docs.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5))*(f*2.2)/(f+1.2*(.25+.75*d.length/(avg||1)));},0));
}
function isIndoor(p){return ['cafe','restaurant','museum','gallery','mall','library','arts_centre'].includes(p.category)||p.tags?.indoor==='yes';}
function reasons(p,input,walk,matched){const out=['nearby','fits_time'];if(matched.length)out.push(...matched.map(x=>'interest_'+x));if(input.weather!=='fair'&&isIndoor(p))out.push('indoor');if(p.wheelchair==='yes')out.push('wheelchair_source');return out;}
export function recommend(raw,pois) {
 const input=validateInput(raw), {origin,intent}=input;
 const scores=bm25(tokens(input.query),pois), exclusions={distance:0,time:0,closed:0,accessibility:0,hoursUnknown:0,weather:0,interest:0};
 const candidates=[];
 pois.forEach((p,index)=>{
  const walk=walkMinutes(origin,p,input.pace),visit=VISITS[p.category]||20;
  if(walk>input.maxWalk){exclusions.distance++;return;}
  const total=walk*(input.returnToStart?2:1)+visit;
  if(total>input.budget){exclusions.time++;return;}
  if(input.accessible&&p.wheelchair!=='yes'){exclusions.accessibility++;return;}
  if(input.weather!=='fair'&&!isIndoor(p)){exclusions.weather++;return;}
  const matched=intent.concepts.filter(c=>CONCEPTS[c].categories.includes(p.category));
  // Coffee is an explicit place request. A child constraint limits appropriate categories.
  if(intent.concepts.length===1&&intent.concepts.includes('coffee')&&p.category!=='cafe'){exclusions.interest++;return;}
  if(intent.concepts.includes('family')&&!CONCEPTS.family.categories.includes(p.category)&&!intent.concepts.includes('coffee')){exclusions.interest++;return;}
  if(intent.concepts.length&&!matched.length){exclusions.interest++;return;}
  const arrival=new Date(input.departure.getTime()+walk*60000),status=openingStatus(p.hours,arrival,visit);
  if(status==='closed'){exclusions.closed++;return;}
  if(input.verifiedHours&&status==='unknown'){exclusions.hoursUnknown++;return;}
  const uncertainties=[];
  if(status==='unknown')uncertainties.push('hours');
  if(intent.quiet&&p.tags?.quiet!=='yes')uncertainties.push('quiet');
  if(intent.socket&&!['yes','available'].includes(p.tags?.socket))uncertainties.push('socket');
  if(input.accessible)uncertainties.push('step_free_route');
  if(intent.concepts.includes('family')&&p.category==='museum')uncertainties.push('interactive');
  const score=matched.length*5+Math.min(scores[index],6)+3*(1-walk/input.maxWalk)+(status==='open'?.6:0)+(p.description?.length?.2:0);
  candidates.push({...p,walkMinutes:walk,distanceM:Math.round(distanceM(origin,p)),visitMinutes:visit,totalMinutes:total,
   openingStatus:status,score:Math.round(score*100)/100,reasons:reasons(p,input,walk,matched),uncertainties,match:uncertainties.some(u=>['quiet','socket'].includes(u))?'partial':'context'});
 });
 candidates.sort((a,b)=>b.score-a.score||a.walkMinutes-b.walkMinutes||a.id.localeCompare(b.id));
 const selected=[];
 // Prefer category variety for broad discovery, while preserving ranking within each category.
 for(const p of candidates)if(!selected.some(q=>q.category===p.category)&&selected.length<3)selected.push(p);
 for(const p of candidates)if(!selected.some(q=>q.id===p.id)&&selected.length<3)selected.push(p);
 const route=planRoute(candidates.slice(0,12),input);
 const warnings=['estimates'];
 if(intent.airport) warnings.push('airport');
 if(intent.night||input.departure.getUTCHours()+5>=22||(input.departure.getUTCHours()+5)%24<6) warnings.push('night');
 if(input.weather!=='fair')warnings.push('weather_manual');
 return {recommendations:selected,route,warnings,trace:{datasetSize:pois.length,candidates:candidates.length,exclusions,
  concepts:intent.concepts,effectiveBudget:input.budget,retrieval:'BM25 + multilingual concepts + hard constraints'},
  mode:'retrieval-template',locale:input.locale,departure:raw.departure||astanaNow(),returnToStart:input.returnToStart};
}
export function planRoute(candidates,input){
 let best={stops:[],totalMinutes:0,walkMinutes:0,visitMinutes:0,returnMinutes:0,score:0};
 const explore=(stops,last,elapsed,walked,score)=>{
  const back=input.returnToStart?walkMinutes(last,input.origin,input.pace):0;
  if(stops.length&&elapsed+back<=input.budget){
   const utility=stops.length*20+score;
   if(utility>best.score)best={stops:[...stops],totalMinutes:elapsed+back,walkMinutes:walked+back,visitMinutes:elapsed-walked,returnMinutes:back,score:utility};
  }
  if(stops.length===3)return;
  for(const p of candidates){
   if(stops.some(s=>s.id===p.id||s.category===p.category||s.name.toLowerCase()===p.name.toLowerCase()))continue;
   const leg=walkMinutes(last,p,input.pace),next=elapsed+leg+p.visitMinutes;
   if(leg>input.maxWalk||next>input.budget)continue;
   const status=openingStatus(p.hours,new Date(input.departure.getTime()+(elapsed+leg)*60000),p.visitMinutes);
   if(status==='closed'||(input.verifiedHours&&status!=='open'))continue;
   explore([...stops,{id:p.id,name:p.name,names:p.names,lat:p.lat,lon:p.lon,category:p.category,legMinutes:leg,visitMinutes:p.visitMinutes,arrivalMinutes:elapsed+leg,openingStatus:status,source:p.source}],p,next,walked+leg,score+p.score);
  }
 };
 explore([],input.origin,0,0,0);return best;
}
