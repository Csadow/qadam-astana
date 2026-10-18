// Additional, fixed post-implementation examples; not an independent language benchmark.
import {parseIntent} from '../src/intent.js';
import {writeFile} from 'node:fs/promises';
const cases=[
 ['I have 2 hrs and 15 mins',{budget:135}],
 ['На прогулку 1 час и 20 минут',{budget:80}],
 ['1 сағат және 20 минут серуен',{budget:80}],
 ['75 minutes total, walking up to 8 minutes',{budget:75,maxWalk:8}],
 ['1,5 часа, пешком до 12 минут',{budget:90,maxWalk:12}],
 ['40 минут, жаяу 5 минут',{budget:40,maxWalk:5}],
 ['Do not exclude coffee',{concepts:['coffee'],excluded:[]}],
 ['Не хочу пропускать кофе',{concepts:['coffee'],excluded:[]}],
 ['A cafe with free Wi-Fi',{free:false}],
 ['Музей керек емес, сәулет',{excludedCategories:['museum'],concepts:['landmark']}],
 ['Out with a pram',{stroller:true,accessible:false}],
 ['Вернуться к 16:20',{returnByClock:'16:20'}],
];
const results=cases.map(([query,expected])=>{const intent=parseIntent(query),actual=Object.fromEntries(Object.keys(expected).map(k=>[k,intent[k]??null]));return {query,expected,actual,pass:JSON.stringify(expected)===JSON.stringify(actual)};});
const report={checkedAt:new Date().toISOString(),appVersion:'4.0.0',method:'Twelve additional examples specified after feature implementation and before executing this audit. Authored by the implementation agent, not an independent or representative language benchmark. This script was not used to tune the parser.',passed:results.filter(r=>r.pass).length,total:results.length,results};
await writeFile(new URL('../docs/intent-paraphrases.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
