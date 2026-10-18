// Targeted discovery audit: documents gaps, rather than claiming a representative quality score.
import {writeFile} from 'node:fs/promises';
import {parseIntent,recommend} from '../src/engine.js';
const cases=[
 {id:'mixed-duration-en',query:'I have 1 hour 30 minutes',expected:{budget:90}},
 {id:'not-only',query:'Not only coffee but also a park',expected:{concepts:['coffee','nature'],excluded:[]}},
 {id:'specific-category-exclusion',query:'No museums, architecture please',expected:{museumExcluded:true,artworkRetained:true}},
 {id:'walking-cap',query:'90 minutes total, max 10 minutes walking',expected:{budget:90,maxWalk:10}},
 {id:'mixed-duration-ru',query:'Есть 1 час 30 минут',expected:{budget:90}},
 {id:'duration-kk',query:'30 минут серуендеуге уақыт бар',expected:{budget:30}},
 {id:'double-negation',query:'I do not want to skip coffee',expected:{concepts:['coffee'],excluded:[]}},
 {id:'free-wifi',query:'Coffee with free wifi',expected:{free:false}},
 {id:'stroller-context',query:'Walking with a stroller',expected:{concepts:['family']}},
 {id:'basic-negation',query:'No coffee, just a park',expected:{concepts:['nature'],excluded:['coffee']}},
];
const origin={lat:51.1,lon:71.4};
const fixtures=['museum','artwork'].map(category=>({id:category,name:category,category,...origin,hours:'24/7',tags:{},source:{url:'https://www.openstreetmap.org/node/1'}}));
const same=(a,b)=>Array.isArray(b)?Array.isArray(a)&&JSON.stringify([...a].sort())===JSON.stringify([...b].sort()):a===b;
const results=cases.map(c=>{
 const intent=parseIntent(c.query);
 let actual=Object.fromEntries(Object.keys(c.expected).map(k=>[k,intent[k]??null]));
 if(c.id==='specific-category-exclusion'){
  const r=recommend({origin,query:c.query,budget:120,maxWalk:20,departure:'2026-10-20T14:00'},fixtures);
  actual={museumExcluded:!r.recommendations.some(p=>p.category==='museum'),artworkRetained:r.recommendations.some(p=>p.category==='artwork')};
 }
 return {...c,actual,pass:Object.entries(c.expected).every(([k,v])=>same(actual[k],v))};
});
const report={checkedAt:new Date().toISOString(),appVersion:'3.0.0',method:'Ten deliberately selected edge cases with manually specified expected behavior, including synthetic category-isolation fixtures. A diagnostic baseline, not a random sample, independent evaluation, user study, or overall accuracy estimate. Failed cases are tracked work; this script does not gate the existing supported-scenario CI.',passed:results.filter(r=>r.pass).length,total:results.length,results};
await writeFile(new URL('../docs/intent-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,total:report.total,gaps:results.filter(r=>!r.pass).map(r=>r.id)}));
