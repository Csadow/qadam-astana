/** Small, auditable EN/RU/KK intent parser. No query or location leaves the browser. */
import {parseTimeIntent} from './time-intent.js';
export const CONCEPTS={
 coffee:{re:/coffee|café|cafe|кофе|кофей|кафе/iu,categories:['cafe']},
 culture:{re:/museum|culture|art\b|музе|культур|өнер/iu,categories:['museum','gallery','arts_centre','artwork','attraction']},
 nature:{re:/park|nature|green|парк|природ|саябақ|табиғат/iu,categories:['park','garden','viewpoint']},
 family:{re:/child|kid|family|stroller|pram|реб[её]н|дет|семь|семей|баламен|бала|отбасы/iu,categories:['playground','museum','park','mall']},
 landmark:{re:/architecture|landmark|photo|архитект|фото|достоприм|сәулет/iu,categories:['attraction','artwork','viewpoint','museum']},
};
function mentions(query,re){
 return [...query.matchAll(new RegExp(re.source,'giu'))].map(m=>{
  const before=query.slice(Math.max(0,m.index-65),m.index).split(/[,;.!?]|\bbut\b|\bjust\b|\bonly\b|только|бірақ/iu).at(-1);
  const after=query.slice(m.index+m[0].length,m.index+m[0].length+30);
  const doubleNegative=/(?:do not|don't|not)\s+(?:want to\s+)?(?:skip|avoid|exclude)\s*$/iu.test(before)||/не\s+(?:хочу\s+)?(?:пропускать|исключать|избегать)\s*$/iu.test(before);
  const negated=!doubleNegative&&(/(?:^|\s)(?:no|not|without|avoid|skip|don't(?: want)?|do not(?: want)?|не(?: хочу|хотим|нужен|нужна|надо|нужно)?|без|кроме|исключи)\s+(?:[\p{L}-]+\s+){0,2}$/iu.test(before)||/^[\p{L}-]*\s+(?:керек емес|қажет емес|емес|жоқ)/iu.test(after));
  return {negated,text:m[0]};
 });
}
export function parseIntent(query='',interests=[]){
 query=String(query).slice(0,600).replace(/’/g,"'");
 const categories={museum:/museum|музе/iu,gallery:/galler|галере/iu,park:/park|парк|саябақ/iu,garden:/garden|сад\b|бақ\b/iu,restaurant:/restaurant|ресторан|мейрамхана/iu};
 const excludedCategories=Object.entries(categories).filter(([,re])=>mentions(query,re).some(m=>m.negated)).map(([k])=>k);
 const positive=[],excluded=[];
 for(const [key,v] of Object.entries(CONCEPTS)){
  const found=mentions(query,v.re),negative=found.filter(m=>m.negated);
  if(negative.some(m=>!Object.values(categories).some(re=>re.test(m.text))))excluded.push(key);
  else if(found.some(m=>!m.negated))positive.push(key);
 }
 const only=/(?:\bonly\b|\bjust\b|только|тек\s)/iu.test(query);
 const concepts=new Set(only&&positive.length?positive:[...interests.filter(k=>CONCEPTS[k]),...positive]);
 for(const key of excluded)concepts.delete(key);
 const indoor=mentions(query,/indoor|inside|в помещени|внутри|үй-жай|ғимарат іш/iu),outdoor=mentions(query,/outdoor|outside|на улице|на свежем воздухе|далада|ашық ауа/iu);
 const wantsIndoor=indoor.some(m=>!m.negated)||outdoor.some(m=>m.negated),wantsOutdoor=outdoor.some(m=>!m.negated)||indoor.some(m=>m.negated);
 const timing=parseTimeIntent(query);
 const stroller=/stroller|pram|детск[а-я]*\s+коляск|бала\s*арб/iu.test(query);
 if(stroller&&!excluded.includes('family'))concepts.add('family');
 const priceText=query.replace(/(?:free|бесплатн[а-я]*|тегін)\s*(?:wi[ -]?fi|wifi|вай[ -]?фай)/giu,'');
 return {concepts:[...concepts],excluded,excludedCategories,only,...timing,setting:wantsIndoor&&!wantsOutdoor?'indoor':wantsOutdoor&&!wantsIndoor?'outdoor':'any',settingConflict:wantsIndoor&&wantsOutdoor,
 quiet:/quiet|тиш|тих|тыныш/iu.test(query),socket:/socket|outlet|розет|қуат/iu.test(query),stroller,accessible:/wheelchair|step.free|инвалидн[а-я]*\s+(?:коляск|кресл)|мүгедек/iu.test(query)||(!stroller&&/коляск|кресл|арбамен/iu.test(query)),
 free:/\bfree\b|бесплат|тегін/iu.test(priceText),airport:/flight|airport|вылет|аэропорт|ұшақ|әуежай/iu.test(query),night:/night|ноч|түн/iu.test(query)};
}
