/** Small, auditable EN/RU/KK intent parser. No query or location leaves the browser. */
export const CONCEPTS={
 coffee:{re:/coffee|café|cafe|кофе|кофей|кафе/iu,categories:['cafe']},
 culture:{re:/museum|culture|art\b|музе|культур|өнер/iu,categories:['museum','gallery','arts_centre','artwork','attraction']},
 nature:{re:/park|nature|green|парк|природ|саябақ|табиғат/iu,categories:['park','garden','viewpoint']},
 family:{re:/child|kid|family|реб[её]н|дет|семь|семей|баламен|бала|отбасы/iu,categories:['playground','museum','park','mall']},
 landmark:{re:/architecture|landmark|photo|архитект|фото|достоприм|сәулет/iu,categories:['attraction','artwork','viewpoint','museum']},
};
function mentions(query,re){
 return [...query.matchAll(new RegExp(re.source,'giu'))].map(m=>{
  const before=query.slice(Math.max(0,m.index-65),m.index).split(/[,;.!?]|\bbut\b|\bjust\b|\bonly\b|\bтолько\b|бірақ/iu).at(-1);
  const after=query.slice(m.index+m[0].length,m.index+m[0].length+30);
  const negated=/(?:^|\s)(?:no|not|without|avoid|skip|don't(?: want)?|do not(?: want)?|не(?: хочу|хотим|нужен|нужна|надо|нужно)?|без|кроме|исключи)\s+(?:[\p{L}-]+\s+){0,2}$/iu.test(before)||/^[\p{L}-]*\s+(?:керек емес|қажет емес|емес|жоқ)/iu.test(after);
  return {negated};
 });
}
export function parseIntent(query='',interests=[]){
 query=String(query).slice(0,600);
 const positive=[],excluded=[];
 for(const [key,v] of Object.entries(CONCEPTS)){const found=mentions(query,v.re);if(found.some(m=>m.negated))excluded.push(key);else if(found.length)positive.push(key);}
 const only=/(?:\bonly\b|\bjust\b|только|тек\s)/iu.test(query);
 const concepts=new Set(only&&positive.length?positive:[...interests.filter(k=>CONCEPTS[k]),...positive]);
 for(const key of excluded)concepts.delete(key);
 const indoor=mentions(query,/indoor|inside|в помещени|внутри|үй-жай|ғимарат іш/iu),outdoor=mentions(query,/outdoor|outside|на улице|на свежем воздухе|далада|ашық ауа/iu);
 const wantsIndoor=indoor.some(m=>!m.negated)||outdoor.some(m=>m.negated),wantsOutdoor=outdoor.some(m=>!m.negated)||indoor.some(m=>m.negated);
 const walk=query.match(/(?:within|no more than|не дальше|не более|до)\s*(\d{1,2})\s*(?:minutes?|mins?|минут[ауы]?|мин)\s*(?:on foot|walk|пешком)/iu);
 const durationText=walk?query.replace(walk[0],''):query;
 const range=[...durationText.matchAll(/(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s*(?:min|мин)/giu)];
 const minute=durationText.match(/(\d{1,3})\s*(?:minutes?|mins?|минут[ауы]?|мин)(?=$|[\s,.!?])/iu),hour=durationText.match(/(\d)\s*(?:hours?|hrs?|час[аов]*|сағат)/iu);
 const budget=range.length?Number(range.at(-1)[2]):minute?Number(minute[1]):hour?Number(hour[1])*60:undefined;
 return {concepts:[...concepts],excluded,only,budget,maxWalk:walk?Number(walk[1]):undefined,setting:wantsIndoor&&!wantsOutdoor?'indoor':wantsOutdoor&&!wantsIndoor?'outdoor':'any',settingConflict:wantsIndoor&&wantsOutdoor,
 quiet:/quiet|тиш|тих|тыныш/iu.test(query),socket:/socket|outlet|розет|қуат/iu.test(query),accessible:/wheelchair|step.free|коляск|кресл|арбамен/iu.test(query),
 free:/\bfree\b|бесплат|тегін/iu.test(query),airport:/flight|airport|вылет|аэропорт|ұшақ|әуежай/iu.test(query),night:/night|ноч|түн/iu.test(query)};
}
