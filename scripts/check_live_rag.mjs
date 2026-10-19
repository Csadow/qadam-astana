import {createRouter} from '../src/routing.js';
import {readFile,writeFile} from 'node:fs/promises';
import {recommend,PRESETS} from '../src/engine.js';
import {attachEvidence} from '../src/evidence.js';
import {generateSuggestions} from '../src/generate.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const pois=attachEvidence(await read('data/pois.json'),await read('data/evidence.json'));
const routing=createRouter(await read('data/walking-graph.json'));
const cases=[
 {id:'river-bridge-ru',ids:['osm-way-1239177393'],locale:'ru',context:{interests:['landmark'],mood:'curious',budget:60}},
 {id:'river-bridge-kk',ids:['osm-way-1239177393'],locale:'kk',context:{interests:['landmark'],mood:'curious',budget:60}},
 {id:'writer-museum-en',ids:['osm-way-240376692'],locale:'en',context:{interests:['culture'],mood:'curious',budget:90}},
 {id:'family-paleontology',input:{origin:PRESETS[2],interests:['family'],mood:'playful',budget:120},context:{family:true,mood:'playful',interests:['family'],budget:120}},
 {id:'curious-baiterek',input:{origin:PRESETS[1],interests:['landmark'],mood:'curious',budget:60},context:{mood:'curious',interests:['landmark'],budget:60}},
 {id:'mixed-group',input:{origin:PRESETS[0],group:['coffee','nature','landmark'],mood:'curious',budget:120},context:{group:['coffee','nature','landmark'],mood:'curious',budget:120}},
];
const retryFailed=process.argv.includes('--retry-failed');
const previous=retryFailed?await read('docs/live-rag-evaluation.json'):null;
const results=[];
for(const c of cases){
 const prior=previous?.results.find(r=>r.id===c.id);
 if(prior?.mode==='gemini-grounded'){results.push(prior);continue;}
 const plan=c.ids?{recommendations:pois.filter(p=>c.ids.includes(p.id)),route:{stops:[]}}:recommend({routing,maxWalk:20,departure:'2026-10-20T14:00',...c.input},pois);
 const generated=await generateSuggestions({ids:plan.recommendations.map(p=>p.id),visits:plan.recommendations.map(p=>({id:p.id,minutes:plan.route.stops.find(s=>s.id===p.id)?.visitMinutes||p.visitMinutes})),locale:c.locale||'ru',context:c.context},pois,process.env);
 const attempts=prior?[...(prior.attempts||[{mode:prior.mode,reason:prior.reason,checkedAt:previous.checkedAt}]),{mode:generated.mode,reason:generated.reason||null,checkedAt:new Date().toISOString()}]:[{mode:generated.mode,reason:generated.reason||null,checkedAt:new Date().toISOString()}];
 results.push({id:c.id,mode:generated.mode,reason:generated.reason||null,attempts,places:plan.recommendations.map(p=>({id:p.id,name:p.name,evidenceCount:p.evidence.length})),suggestions:generated.suggestions});
 console.log(JSON.stringify({scenario:c.id,mode:generated.mode,count:generated.suggestions.length,reason:generated.reason||null}));
}
const report={checkedAt:new Date().toISOString(),model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',method:'Six live scenarios (three route-based and three exact-place narratives) across EN/RU/KK with validated place/citation IDs. Explicit --retry-failed requests retain prior fallback attempts. Outputs retained for human review. Not an independent factuality benchmark or user study.',results};
await writeFile(new URL('docs/live-rag-evaluation.json',root),JSON.stringify(report,null,2)+'\n');
if(results.some(r=>r.mode!=='gemini-grounded'))process.exitCode=1;
