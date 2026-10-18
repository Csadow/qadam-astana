import {evidenceFor} from './evidence.js';
/** Resolve every chapter against the same evidence and actual itinerary used by cards. */
export function journeyStory(journey,pois,plan,locale='en'){
 if(!journey)return null;
 const local=x=>x?.[locale]||x?.en||'';
 const chapters=plan.route.stops.flatMap(stop=>{
  const chapter=journey.stops.find(s=>s.poiId===stop.id),poi=pois.find(p=>p.id===stop.id);
  if(!chapter||!poi)return [];
  const facts=evidenceFor(poi,locale).filter(f=>chapter.factIds.includes(f.id));
  if(facts.length!==chapter.factIds.length)return [];
  return [{id:poi.id,name:poi.names?.[locale]||poi.name,question:local(chapter.observationQuestion),condition:local(chapter.condition),facts,visitMinutes:stop.visitMinutes}];
 });
 return {id:journey.id,title:local(journey.title),introduction:chapters.length===journey.stops.length?local(journey.introduction):'',complete:chapters.length===journey.stops.length,total:journey.stops.length,chapters};
}
