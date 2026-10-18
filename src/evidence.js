/** Separate first-party enrichment from the reproducible OSM snapshot. */
export function attachEvidence(pois,pack={places:[]}) {
 const entries=new Map((pack.places||[]).map(p=>[p.id,p]));
 return pois.map(p=>{
  const e=entries.get(p.id);
  return {...p,visitScope:e?.visitScope,capabilities:(pack.capabilityEvidence||[]).filter(c=>c.id===p.id),evidence:e?.facts||[],operationalNotes:e?.notes||[],accessRestricted:e?.accessRestricted===true,
   ...(e?.hours?{hours:e.hours,hoursSource:e.hoursSource}:{}),
   ...(e?.themes?{themes:e.themes}:{}),...(e?.names?{names:{...p.names,...e.names}}:{})};
 });
}
export function evidenceFor(p,locale='en') {
 const fallback={id:p.id+':category',text:`${p.name}: ${p.category}.`,url:p.source.url,title:'OpenStreetMap',checkedAt:p.source.collectedAt};
 return [fallback,...(p.evidence||[]).filter(f=>!(p.visitScope==='exterior'&&f.visitScope==='interior')).map(f=>({...f,text:typeof f.text==='string'?f.text:f.text[locale]||f.text.en}))];
}
