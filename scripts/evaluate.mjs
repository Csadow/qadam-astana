import {journeyStory} from '../src/journeys.js';
import {recoveryOptions} from '../src/recovery.js';
import {createRouter} from '../src/routing.js';
import {readFile,writeFile} from 'node:fs/promises';
import {attachEvidence} from '../src/evidence.js';
import {recommend,PRESETS} from '../src/engine.js';
const pois=attachEvidence(JSON.parse(await readFile(new URL('../data/pois.json',import.meta.url),'utf8')),JSON.parse(await readFile(new URL('../data/evidence.json',import.meta.url),'utf8')));
const routing=createRouter(JSON.parse(await readFile(new URL('../data/walking-graph.json',import.meta.url),'utf8')));
const journeys=JSON.parse(await readFile(new URL('../data/journeys.json',import.meta.url),'utf8')).journeys;
const at=id=>PRESETS.find(p=>p.id===id);
const cases=[
 ...journeys.map(j=>({id:'story-'+j.id,journey:j,input:{origin:at(j.origin),budget:120,maxWalk:30,departure:'2026-10-20T14:00',journeyIds:j.stops.map(s=>s.poiId),preferredIds:j.stops.map(s=>s.poiId),maxStops:2},expect:'Both source-backed chapters fit; every factual chapter resolves to its exact evidence record.'})),
 {id:'mapped-expo',input:{origin:at('expo'),budget:60,interests:['coffee','nature'],departure:'2026-10-20T14:00'},expect:'Route uses mapped EXPO geometry while retaining explicit estimated endpoint connections.'},
 {id:'compound-duration',input:{origin:at('expo'),budget:120,query:'1 hour 30 minutes, max 10 minutes walking'},expect:'Effective time is 90 minutes and walking cap is 10 minutes.'},
 {id:'deadline-buffer',input:{origin:at('expo'),budget:90,returnToStart:false,returnBy:'2026-10-19T15:00',bufferMinutes:10},expect:'The deadline forces a return; visits, walking and ten-minute reserve fit before 15:00.'},
 {id:'expired-deadline',input:{origin:at('expo'),budget:90,returnBy:'2026-10-19T13:00'},expect:'Past deadline yields no stops and a visible deadline warning.'},
 {id:'recovery-museum',input:{origin:at('museum'),budget:15,maxWalk:1,interests:['culture'],departure:'2026-10-20T14:00'},expect:'Empty short museum plan offers a recomputed time increase without relaxing the walking limit.'},
 ...['No coffee, just a park','Не хочу кофе, только парк','Кофе керек емес, тек саябақ'].map((query,i)=>({id:`no-coffee-${['en','ru','kk'][i]}`,input:{origin:at('expo'),budget:90,query,interests:['coffee','nature']},expect:'Park request overrides stale coffee interest; cafes excluded.'})),
 {id:'indoor-only',input:{origin:at('khan'),budget:90,query:'Only indoors'},expect:'No outdoor category in an indoor-only itinerary.'},
 {id:'short-park-visit',input:{origin:pois.find(p=>p.id==='osm-way-69232075'),budget:15,interests:['nature'],maxWalk:1},expect:'A nearby park can fit as a labelled short visit within 15 minutes.'},
 {id:'group-coverage',input:{origin:at('expo'),budget:120,group:['coffee','nature','landmark']},expect:'All three chosen interests covered by a feasible shared route.'},
 {id:'monday-museum',input:{origin:at('museum'),budget:120,interests:['culture']},expect:'National Museum excluded on Monday using official hours.'},
 {id:'restricted-campus',input:{origin:at('expo'),budget:120,interests:['nature']},expect:'NU Park and Japanese Garden excluded due to campus access restrictions.'},
 {id:'baiterek-evidence',input:{origin:at('baiterek'),budget:60,interests:['landmark'],mood:'curious'},expect:'Baiterek retrieved with official architectural evidence and an exterior visit scope.'},
 {id:'expo-hour',input:{origin:at('expo'),budget:60,interests:['nature','coffee']},expect:'1–3 nearby options; total route including return ≤60 minutes.'},
 {id:'quiet-coffee',input:{origin:at('baiterek'),budget:60,query:'Хочу тихое кафе с розеткой'},expect:'Cafés only; quietness and sockets explicitly unverified.'},
 {id:'family-museum',input:{origin:at('museum'),budget:120,query:'Прогулка с ребёнком',departure:'2026-10-20T14:00'},expect:'Family candidate categories; no invented interactive exhibits.'},
 {id:'rainy-khan',input:{origin:at('khan'),budget:90,weather:'rain'},expect:'Indoor categories; weather labelled user-selected.'},
 {id:'too-little-time',input:{origin:at('museum'),budget:10,interests:['culture'],maxWalk:1},expect:'No invented match when nothing fits.'},
 {id:'wheelchair',input:{origin:at('baiterek'),budget:60,accessible:true},expect:'Only explicit wheelchair=yes; route access still unverified.'},
 {id:'airport-night',input:{origin:at('expo'),budget:120,query:'2 hours before my flight at night',departure:'2026-10-19T23:00'},expect:'Airport buffer and night safety warnings; no flight guarantee.'},
 {id:'outside-coverage',input:{origin:{lat:43.24,lon:76.92},budget:60},expect:'Empty result outside collected Astana areas.'},
];
const report=cases.map(c=>{
 const input={routing,maxWalk:20,departure:'2026-10-19T14:00',returnToStart:true,...c.input};const r=recommend(input,pois);
 const checks={budget:r.route.totalMinutes<=r.trace.effectiveBudget,count:r.recommendations.length<=3,
  itineraryAgreement:JSON.stringify(r.recommendations.map(p=>[p.id,p.visitMinutes]))===JSON.stringify(r.route.stops.map(p=>[p.id,p.visitMinutes])),
  sourceLinks:r.recommendations.every(p=>p.source.url.startsWith('https://www.openstreetmap.org/')),
  noClosed:r.recommendations.every(p=>p.openingStatus!=='closed'),
  specific:c.journey?journeyStory(c.journey,pois,r).complete:
   c.id==='mapped-expo'?r.route.legs.some(l=>l.mode==='mapped'&&l.points.length>20):
   c.id==='compound-duration'?r.trace.effectiveBudget===90&&r.intent.maxWalk===10:
   c.id==='deadline-buffer'?r.returnToStart&&r.trace.effectiveBudget===50&&r.timing.reservedEnd<=r.timing.returnBy:
   c.id==='expired-deadline'?r.route.stops.length===0&&r.warnings.includes('deadline_passed'):
   c.id==='recovery-museum'?r.route.stops.length===0&&recoveryOptions(input,pois,r).options.some(o=>o.id==='more-time'&&o.result.route.stops.length>0&&o.result.intent.maxWalk===1):
   c.id.startsWith('no-coffee-')?r.recommendations.length>0&&r.recommendations.every(p=>['park','garden'].includes(p.category)):
   c.id==='indoor-only'?r.recommendations.length>0&&r.recommendations.every(p=>['cafe','restaurant','museum','mall'].includes(p.category)):
   c.id==='short-park-visit'?r.recommendations.some(p=>p.id==='osm-way-69232075'&&p.shortStop):
   c.id==='group-coverage'?r.group.length===3&&r.group.every(g=>g.covered):
   c.id==='monday-museum'?!r.recommendations.some(p=>p.id==='osm-node-4894937300')&&r.trace.exclusions.closed>0:
   c.id==='restricted-campus'?r.trace.exclusions.restricted>=2&&r.route.stops.every(p=>!['osm-way-1467797207','osm-way-1470723968'].includes(p.id)):
   c.id==='baiterek-evidence'?r.recommendations.some(p=>p.id==='osm-way-230401645'&&p.evidence.length>0&&p.visitScope==='exterior'):
   c.id==='quiet-coffee'?r.recommendations.length>0&&r.recommendations.every(p=>p.category==='cafe'&&p.uncertainties.includes('quiet')&&p.uncertainties.includes('socket')):
   c.id==='family-museum'?r.recommendations.length>0&&r.recommendations.every(p=>['museum','park','playground','mall'].includes(p.category)):
   c.id==='rainy-khan'?r.recommendations.every(p=>!['park','garden','playground','viewpoint'].includes(p.category)):
   ['too-little-time','outside-coverage'].includes(c.id)?r.recommendations.length===0:
   c.id==='wheelchair'?r.recommendations.every(p=>p.wheelchair==='yes'):
   c.id==='airport-night'?r.warnings.includes('airport')&&r.warnings.includes('night'):r.recommendations.length>0};
 return {id:c.id,expect:c.expect,pass:Object.values(checks).every(Boolean),checks,resultCount:r.recommendations.length,
  names:r.recommendations.map(p=>p.name),routeMinutes:r.route.totalMinutes,budget:r.trace.effectiveBudget,timing:r.timing,routingModes:r.route.legs.map(l=>l.mode),routingLegs:r.route.legs.map(l=>({mode:l.mode,minutes:l.minutes,distanceM:l.distanceM,connectorMeters:l.connectorMeters||0,geometryPoints:l.points.length,wayIds:l.wayIds||[],reason:l.reason||null,exteriorViewpoint:!!l.exteriorViewpoint})),
  uncertainties:r.recommendations.map(p=>({id:p.id,unknowns:p.uncertainties})),warnings:r.warnings};
});
const output={evaluatedAt:new Date().toISOString(),datasetSize:pois.length,passed:report.filter(r=>r.pass).length,total:report.length,
 appVersion:'6.1.0',method:'Deterministic scenario acceptance checks on the collected snapshot using the same pedestrian router as the browser. Not a user study or LLM quality benchmark.',scenarios:report};
await writeFile(new URL('../docs/evaluation.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(output.passed!==output.total)process.exitCode=1;
