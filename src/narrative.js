import {evidenceFor} from './evidence.js';
const INTERESTS=['coffee','culture','nature','family','landmark','any'];
export function generationContext(body) {
 const c=body.context||{};
 return {locale:['en','ru','kk'].includes(body.locale)?body.locale:'en',family:c.family===true,quiet:c.quiet===true,socket:c.socket===true,
  interests:Array.isArray(c.interests)?[...new Set(c.interests.filter(i=>INTERESTS.includes(i)))].slice(0,5):[],
  group:Array.isArray(c.group)?c.group.filter(i=>INTERESTS.includes(i)).slice(0,5):[],
  mood:['curious','calm','playful'].includes(c.mood)?c.mood:'balanced',weather:['rain','cold'].includes(c.weather)?c.weather:'fair',
  setting:['indoor','outdoor'].includes(c.setting)?c.setting:'any',excluded:Array.isArray(c.excluded)?c.excluded.filter(i=>INTERESTS.includes(i)).slice(0,5):[],
  budget:Number.isFinite(c.budget)?Math.min(240,Math.max(10,Math.round(c.budget))):60};
}
function prose(value,min,max) {
 if(typeof value!=='string'||value.trim().length<min||value.length>max||/[<>\x00-\x08]|https?:\/\//i.test(value))throw new Error('Invalid narrative text');
 if(/(?:one|two|three|five|ten|fifteen|twenty|thirty|forty|sixty|од(?:ин|ну|ного)|дв(?:а|ух)|тр[иё]х?|пят[ьи]|десят[ьи]|пятнадцат[ьи]|двадцат[ьи]|тридцат[ьи]|сорок[а]?|бір|екі|үш|бес|он|жиырма|отыз|қырық)\s*(?:minutes?|hours?|минут[а-я]*|час[а-я]*|сағат)/iu.test(value))throw new Error('Generated duration belongs in the itinerary');
 // Defense in depth, not a semantic proof: never use prose to assert operating conditions.
 if(/\d\s*(?:мин|minutes?|hours?|час|тенге|₸|тг\b|₽|\$)|\d{1,2}:\d{2}|open now|открыт[аоы]? сейчас|ашық қазір|free (?:entry|admission)|бесплатн|есть розетк|has (?:sockets|outlets)|sockets? (?:are|is) available|guarantee|гарантир|wheelchair.accessible|доступн[ао]? для коляс|безопасн(?:ый|ая|ое) маршрут/i.test(value))throw new Error('Unsupported operational claim');
 return value.trim();
}
export function validateNarrative(value,pois,locale='en') {
 if(!value||!Array.isArray(value.suggestions)||value.suggestions.length!==pois.length)throw new Error('Missing recommendations');
 const seen=new Set(),missions=new Set();
 return value.suggestions.map(s=>{
  const p=pois.find(p=>p.id===s.id);
  if(!p||seen.has(s.id))throw new Error('Unknown or duplicate POI');seen.add(s.id);
  const combined=[s.why,s.activity,s.mission].join(' ');
  const platform=/viewing platform|observation deck|смотров[а-я]* площад|бақылау алаңы/iu;
  if(platform.test(combined)&&!evidenceFor(p,locale).slice(1).some(f=>platform.test(f.text)))throw new Error('Unsourced viewing facility');
  if(/accessible (?:route|path|walk)|(?:route|path) (?:is|are) accessible|доступн[а-я]* (?:маршрут|дорожк)|қолжетімді бағыт/iu.test(combined))throw new Error('Unverified route access claim');
  if((p.operationalNotes||[]).some(n=>/photo|фото|permission|рұқсат/iu.test(JSON.stringify(n)))&&/photo|photograph|съ[её]м|фото|рұқсат/iu.test(combined))throw new Error('Operational photography rule belongs in source notes');
  if(p.visitScope==='exterior'&&/подним|подъ[её]м|аялы|алақан|go inside|go up|take the lift|ішке кір|көтеріл/i.test([s.why,s.activity,s.mission].join(' ')))throw new Error('Interior activity in an exterior stop');
  const available=new Set(evidenceFor(p,locale).map(f=>f.id));
  if(!Array.isArray(s.evidenceIds)||!s.evidenceIds.length||s.evidenceIds.length>3||new Set(s.evidenceIds).size!==s.evidenceIds.length||s.evidenceIds.some(id=>!available.has(id)))throw new Error('Unsupported citation');
  if(available.size>1&&!s.evidenceIds.some(id=>id!==p.id+':category'))throw new Error('Rich evidence omitted');
  const mission=String(s.mission).trim().toLocaleLowerCase();if(missions.has(mission))throw new Error('Repeated mission');missions.add(mission);
  return {id:p.id,why:prose(s.why,10,340),activity:prose(s.activity,10,400),mission:prose(s.mission,8,180),evidenceIds:s.evidenceIds};
 });
}
