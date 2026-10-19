import {recommend,parseIntent,astanaNow,parseDeparture} from './engine.js';
/** Each alternative changes one named constraint and is tested by the same planner. */
export function recoveryOptions(raw,pois,current=recommend(raw,pois)){
 if(current.warnings.includes('timing_confirmation'))return {reason:'timing',options:[]};
 const target=Math.min(raw.journeyIds?.length||1,raw.maxStops??3);
 if(current.route.stops.length>=target||raw.maxStops===0)return {reason:null,options:[]};
 const reason=current.warnings.includes('deadline_passed')?'deadline':current.warnings.includes('buffer_exhausted')?'buffer':current.conflicts.length?'kept':current.intent.settingConflict?'setting':current.trace.candidates?'combination':'constraints';
 if(['deadline','kept','setting'].includes(reason))return {reason,options:[]};
 const options=[],intent=parseIntent(raw.query),start=current.timing.grossBudget;
 for(let budget=start+15;budget<=Math.min(240,start+120);budget+=15){
  const changes={budget,...(intent.budgetPhrase?{query:String(raw.query).replace(intent.budgetPhrase,budget+' min')}:{})};
  const result=recommend({...raw,...changes},pois);
  if(result.route.stops.length>=target){options.push({id:'more-time',changes,result});break;}
 }
 if(!current.timing.returnBy){
  const departure=parseDeparture(current.departure);
  for(const minutes of [60,120,24*60,48*60,72*60]){
   const changes={departure:astanaNow(new Date(departure.getTime()+minutes*60000))},result=recommend({...raw,...changes},pois);
   if(result.route.stops.length>=target){options.push({id:'later',changes,result});break;}
  }
 }
 return {reason:options.some(o=>o.id==='more-time')?'time':options.some(o=>o.id==='later')?'hours':reason,options};
}
