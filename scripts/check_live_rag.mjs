import {readFile,writeFile} from 'node:fs/promises';
import {recommend,PRESETS} from '../src/engine.js';
import {attachEvidence} from '../src/evidence.js';
import {generateSuggestions} from '../src/generate.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const pois=attachEvidence(await read('data/pois.json'),await read('data/evidence.json'));
const cases=[
 {id:'family-paleontology',input:{origin:PRESETS[2],interests:['family'],mood:'playful',budget:120},context:{family:true,mood:'playful',interests:['family'],budget:120}},
 {id:'curious-baiterek',input:{origin:PRESETS[1],interests:['landmark'],mood:'curious',budget:60},context:{mood:'curious',interests:['landmark'],budget:60}},
 {id:'mixed-group',input:{origin:PRESETS[0],group:['coffee','nature','landmark'],mood:'curious',budget:120},context:{group:['coffee','nature','landmark'],mood:'curious',budget:120}},
];
const results=[];
for(const c of cases){
 const plan=recommend({maxWalk:20,departure:'2026-10-20T14:00',...c.input},pois);
 const generated=await generateSuggestions({ids:plan.recommendations.map(p=>p.id),visits:plan.recommendations.map(p=>({id:p.id,minutes:plan.route.stops.find(s=>s.id===p.id)?.visitMinutes||p.visitMinutes})),locale:'ru',context:c.context},pois,process.env);
 results.push({id:c.id,mode:generated.mode,reason:generated.reason||null,places:plan.recommendations.map(p=>({id:p.id,name:p.name,evidenceCount:p.evidence.length})),suggestions:generated.suggestions});
 console.log(JSON.stringify({scenario:c.id,mode:generated.mode,count:generated.suggestions.length,reason:generated.reason||null}));
}
const report={checkedAt:new Date().toISOString(),model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',method:'Three real provider requests with validated place/citation IDs. Outputs retained for human review. Not an independent factuality benchmark or user study.',results};
await writeFile(new URL('docs/live-rag-evaluation.json',root),JSON.stringify(report,null,2)+'\n');
if(results.some(r=>r.mode!=='gemini-grounded'))process.exitCode=1;
