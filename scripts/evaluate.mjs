import {readFile,writeFile} from 'node:fs/promises';
import {attachEvidence} from '../src/evidence.js';
import {recommend,PRESETS} from '../src/engine.js';
const pois=attachEvidence(JSON.parse(await readFile(new URL('../data/pois.json',import.meta.url),'utf8')),JSON.parse(await readFile(new URL('../data/evidence.json',import.meta.url),'utf8')));
const at=id=>PRESETS.find(p=>p.id===id);
const cases=[
 {id:'group-coverage',input:{origin:at('expo'),budget:120,group:['coffee','nature','landmark']},expect:'All three chosen interests covered by a feasible shared route.'},
 {id:'monday-museum',input:{origin:at('museum'),budget:120,interests:['culture']},expect:'National Museum excluded on Monday using official hours.'},
 {id:'restricted-campus',input:{origin:at('expo'),budget:120,interests:['nature']},expect:'NU Park and Japanese Garden excluded due to campus access restrictions.'},
 {id:'baiterek-evidence',input:{origin:at('baiterek'),budget:60,interests:['landmark'],mood:'curious'},expect:'Baiterek retrieved with official architectural evidence and an exterior visit scope.'},
 {id:'expo-hour',input:{origin:at('expo'),budget:60,interests:['landmark','nature','coffee']},expect:'1–3 nearby options; total route including return ≤60 minutes.'},
 {id:'quiet-coffee',input:{origin:at('baiterek'),budget:60,query:'Хочу тихое кафе с розеткой'},expect:'Cafés only; quietness and sockets explicitly unverified.'},
 {id:'family-museum',input:{origin:at('museum'),budget:120,query:'Прогулка с ребёнком',departure:'2026-10-20T14:00'},expect:'Family candidate categories; no invented interactive exhibits.'},
 {id:'rainy-khan',input:{origin:at('khan'),budget:90,weather:'rain'},expect:'Indoor categories; weather labelled user-selected.'},
 {id:'too-little-time',input:{origin:at('museum'),budget:10,interests:['culture'],maxWalk:1},expect:'No invented match when nothing fits.'},
 {id:'wheelchair',input:{origin:at('baiterek'),budget:60,accessible:true},expect:'Only explicit wheelchair=yes; route access still unverified.'},
 {id:'airport-night',input:{origin:at('expo'),budget:120,query:'2 hours before my flight at night',departure:'2026-10-19T23:00'},expect:'Airport buffer and night safety warnings; no flight guarantee.'},
 {id:'outside-coverage',input:{origin:{lat:43.24,lon:76.92},budget:60},expect:'Empty result outside collected Astana areas.'},
];
const report=cases.map(c=>{
 const input={maxWalk:20,departure:'2026-10-19T14:00',returnToStart:true,...c.input};const r=recommend(input,pois);
 const checks={budget:r.route.totalMinutes<=r.trace.effectiveBudget,count:r.recommendations.length<=3,
  sourceLinks:r.recommendations.every(p=>p.source.url.startsWith('https://www.openstreetmap.org/')),
  noClosed:r.recommendations.every(p=>p.openingStatus!=='closed'),
  specific:c.id==='group-coverage'?r.group.length===3&&r.group.every(g=>g.covered):
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
  names:r.recommendations.map(p=>p.name),routeMinutes:r.route.totalMinutes,budget:r.trace.effectiveBudget,
  uncertainties:r.recommendations.map(p=>({id:p.id,unknowns:p.uncertainties})),warnings:r.warnings};
});
const output={evaluatedAt:new Date().toISOString(),datasetSize:pois.length,passed:report.filter(r=>r.pass).length,total:report.length,
 method:'Deterministic scenario acceptance checks on the collected snapshot. Not a user study or LLM quality benchmark.',scenarios:report};
await writeFile(new URL('../docs/evaluation.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(output.passed!==output.total)process.exitCode=1;
