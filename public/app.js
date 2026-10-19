import {PRESETS,recommend,backupPlans,astanaNow,parseIntent,openingStatus,walkMinutes,editPlan} from '/src/engine.js';
import {actionText} from '/src/actions.js';
import {attachEvidence,evidenceFor} from '/src/evidence.js';
import {messages} from '/i18n.js';
import {upgrades} from '/upgrades.js';
import {refinement} from '/refinement.js';
import {expansion} from '/expansion.js';
import {createRouter} from '/src/routing.js';
import {recoveryOptions} from '/src/recovery.js';
import {journeyStory} from '/src/journeys.js';
for(const key of Object.keys(upgrades))Object.assign(messages[key],upgrades[key],refinement[key],expansion[key]);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let locale='en',pois=[],geometry=[],metadata={},result=null,origin=PRESETS[0],customLocation=null,runId=0,zoom=1,simulated=false,generation={},datasetReady=false;
let lastInput=null,backupOptions=[],originalPlan=null,generationPending=false;
const generationCache=new Map(),completedMissions=new Set();
let editState={pinnedIds:[],excludedIds:[],preferredIds:[],maxStops:3},editHistory=[],editFeedback='',generationController;
let timingConfirmedFor=null;
let routing=null,journeys=[],recovery={options:[]},recoveryOriginal=null;
const clockTime=value=>value?.slice(11,16)||"";
const DEMO_TIME='2026-10-20T14:00';
const t=k=>messages[locale][k]??messages.en[k]??k;
const name=p=>p.names?.[locale]||p.name;
const localized=x=>typeof x==='string'?x:x?.[locale]||x?.en||'';
const safeUrl=url=>/^https:\/\/[^\s<>"']+$/.test(url||'')?url:'#';
const sourceUrl=p=>/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(p.source?.url)?p.source.url:'https://www.openstreetmap.org';
function groupFields(){
 const current=$$('[data-member]').map(el=>el.value),defaults=['coffee','nature','culture','landmark','any'];
 $('#group-fields').hidden=!$('#group-enabled').checked;
 $('#group-members').innerHTML=Array.from({length:Number($('#group-size').value)},(_,i)=>`<div class="group-member"><label for="member-${i}">${t('member')} ${i+1}</label><select id="member-${i}" data-member="${i}">${['coffee','nature','culture','landmark','family','any'].map(k=>`<option value="${k}" ${k===(current[i]||defaults[i])?'selected':''}>${esc(t(k))}</option>`).join('')}</select></div>`).join('');
}
function translate(){
 document.documentElement.lang=locale;
 $$('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(['headline','heroText'].includes(el.dataset.i18n))el.innerHTML=value;else el.textContent=value;});
 $('#query').placeholder=t('placeholder');$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;
 $('#about-content').innerHTML=`<h3>${t('aboutHeading')}</h3><p>${t('aboutFlow')}</p><h3>${t('aboutData')}</h3><p>${t('aboutLimits')}</p><h3>${t('aboutPrivacy')}</h3><p>${t('privacyAbout')}</p>`;
 const selectedJourney=$('#journey').value;$('#journey').innerHTML=`<option value="">${t('freeWalk')}</option>${journeys.map(j=>`<option value="${esc(j.id)}">${esc(localized(j.title))}</option>`).join('')}`;$('#journey').value=selectedJourney;
 $('#locate span:last-child').textContent=t(customLocation?'clearLocation':'useLocation');groupFields();if(result)render();
}
function input(){
 origin=customLocation&&$('#location').value==='custom'?customLocation:PRESETS.find(p=>p.id===$('#location').value)||PRESETS[0];
 if($('#time-mode').value==='now')$('#departure').value=astanaNow();
 return {...editState,routing,timingOverride:timingConfirmedFor!==null&&timingConfirmedFor===$('#query').value,journeyIds:journeys.find(j=>j.id===$('#journey').value)?.stops.map(s=>s.poiId)||[],bufferMinutes:Number($('#buffer').value),returnBy:$('#deadline-enabled').checked?$('#return-by').value:null,origin,budget:Number($('#budget').value),maxWalk:Number($('#max-walk').value),query:$('#query').value,
  interests:$$('[data-interest][aria-pressed=true]').map(b=>b.dataset.interest),weather:$('#weather').value,setting:$('#setting').value,
  group:$('#group-enabled').checked?$$('[data-member]').map(el=>el.value):[],mood:$('#mood').value,
  departure:$('#departure').value,locale,accessible:$('#accessible').checked,verifiedHours:$('#verified-hours').checked,
  pace:$('#gentle').checked?'gentle':'normal',returnToStart:$('#return').checked};
}
function notify(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);}
function modeBadge(){const badge=$('#mode-badge');badge.textContent=t(generationPending?'thinking':generation.mode==='gemini-grounded'?'geminiMode':'templateMode');badge.classList.toggle('generation-pending',generationPending);}
async function plan({prepared,context:given,scroll=false}={}){
 if(!prepared){editHistory=[];editFeedback='';}
 if(!datasetReady)return;generationController?.abort();generationController=new AbortController();const controller=generationController,current=++runId;$('#find-button').disabled=true;notify(t('loading'));
 try{
  const context=given||input();lastInput=context;result=prepared||recommend(context,pois);backupOptions=backupPlans(context,pois);recovery=recoveryOptions(context,pois,result);generation={};generationPending=false;zoom=1;render();if(scroll){$('#planner').classList.add('compact');$('#planner-toggle').setAttribute('aria-expanded','false');$('#results-title').focus({preventScroll:true});$('.discovery').scrollIntoView({behavior:'smooth',block:'start'});}
  if(result.recommendations.length){
   const intent=parseIntent(context.query,context.interests);
   const payload={ids:result.recommendations.map(p=>p.id),visits:result.recommendations.map(p=>({id:p.id,minutes:result.route.stops.find(s=>s.id===p.id)?.visitMinutes||p.visitMinutes})),locale,context:{family:intent.concepts.includes('family')||context.group.includes('family'),quiet:intent.quiet,socket:intent.socket,interests:result.trace.concepts,group:context.group,mood:context.mood,weather:context.weather,setting:result.intent.setting,excluded:result.intent.excluded,budget:result.trace.effectiveBudget}};
   const cacheKey=JSON.stringify(payload);generationPending=true;modeBadge();
   try{
    let data=generationCache.get(cacheKey);
    if(!data){const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:cacheKey,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(21000)])});if(response.ok)data=await response.json();}
    if(current!==runId)return;
    if(data){generation=data;if(data.mode==='gemini-grounded'){if(generationCache.size>=20)generationCache.delete(generationCache.keys().next().value);generationCache.set(cacheKey,data);}render();}
   }catch{/* The source-backed plan stays usable if generation fails. */}
  }
 }catch(error){notify(error.message,true);}finally{if(current===runId){generationPending=false;modeBadge();$('#find-button').disabled=false;}}
}
function factsHTML(p,suggestion){
 const all=evidenceFor(p,locale).slice(1),chosen=all.filter(f=>suggestion?.evidenceIds?.includes(f.id));
 const facts=(chosen.length?chosen:all).slice(0,2);
 return facts.length?`<details class="source-facts"><summary>${t('sourceMore')} · ${facts.length}</summary>${facts.map(f=>`<p>${esc(f.text)}</p>${f.observationQuestion?'<p class="story-question">'+esc(localized(f.observationQuestion))+'</p>':''}<a href="${esc(safeUrl(f.url))}" target="_blank" rel="noreferrer">${esc(f.title)} ↗ · ${t('sourceChecked')} ${esc(f.checkedAt)}</a>`).join('')}</details>`:'';
}
function render(){
 modeBadge();$('#results-title').textContent=result.group.length?t('groupResult'):result.trace.effectiveBudget===60?t('yourNextHour'):t('newResults');
 const notes=[generation.reason==='public_preview'?t('publicPreviewNotice'):'',t($('#time-mode').value==='demo'?'demoNotice':$('#time-mode').value==='now'?'liveNotice':'customNotice'),originalPlan?t('changedPlan'):'',...result.warnings.filter(x=>x!=='estimates').map(t)].filter(Boolean);notify(notes.join(' '));
 $('#result-cards').innerHTML=result.recommendations.length?result.recommendations.map((p,i)=>{
  const suggestion=generation.suggestions?.find(s=>s.id===p.id),defaultAction=parseIntent(lastInput.query).socket&&p.category==='cafe'?'ask_socket':undefined;
  return `<article class="place-card" id="card-${esc(p.id)}">
   <div class="place-top"><span class="place-number">${i+1}</span><div class="place-title"><h3>${esc(name(p))}</h3><span class="category">${esc(t('categories')[p.category]||p.category)} · ≈${p.travel.distanceM} m · ${t(i?'fromPrevious':'fromStart')} ${p.match==='partial'?'· '+esc(t('partial')):''}</span></div><span class="place-time">${p.legMinutes} ${t('min')} ${t('walk')}</span></div>
   <div class="place-body"><p class="why">≈${p.visitMinutes} ${t('min')} ${t('visit')}${p.shortStop?' · '+t('shortStop'):''} · ${p.reasons.map(t).map(esc).join(' · ')}</p>
   ${suggestion?.why?`<div class="model-why"><span class="idea-label">${t('modelWhy')}</span>${esc(suggestion.why)}</div>`:''}
   <div class="action-idea"><span class="idea-label">${t(suggestion?.activity?'aiIdea':'idea')}</span>${esc(suggestion?.activity||actionText(p,locale,suggestion?.actionId||defaultAction))}</div>
   ${suggestion?.mission?`<details class="micro-mission"><summary>✳ ${t('missionMore')}</summary><p>${esc(suggestion.mission)}</p><button class="mission-toggle" data-mission="${esc(p.id)}" aria-pressed="${completedMissions.has(p.id)}">${completedMissions.has(p.id)?'✓ '+t('missionDone'):t('missionTry')}</button></details>`:''}
   <p class="uncertainty">${t(p.travel.mode==='mapped'?'routingMixed':p.travel.reason==='outside_graph'?'outsideCoverage':'unverifiedConnection')}</p>
   <p class="evidence-level">${t(evidenceFor(p,locale).length>1?'localEvidence':'categoryEvidence')}</p>
   ${p.uncertainties.filter(u=>u!=='hours').map(u=>`<p class="uncertainty">${esc(t('unc_'+u))}</p>`).join('')}
   ${(p.operationalNotes||[]).map(n=>`<p class="source-note">${esc(localized(n))}${n.url?` <a href="${esc(safeUrl(n.url))}" target="_blank" rel="noreferrer">${t('sourceWarning')} ↗</a>`:''}</p>`).join('')}
   <div class="place-bottom"><span class="hours-label ${p.openingStatus==='open'?'open':''}">${t(p.openingStatus==='open'?'openHours':'unknownHours')}</span><a class="source-link" href="${sourceUrl(p)}" target="_blank" rel="noreferrer">${t('source')}</a></div>
   ${factsHTML(p,suggestion)}
   <details class="source-details"><summary>${t('facts')}</summary><dl><dt>${t('collected')}</dt><dd>${esc(p.source.collectedAt.slice(0,10))}</dd><dt>${t('hours')}</dt><dd>${esc(p.hours||t('unknown'))}${p.hoursSource?` · <a href="${esc(safeUrl(p.hoursSource.url))}" target="_blank" rel="noreferrer">${esc(p.hoursSource.title)} ↗</a>`:''}</dd><dt>${t('access')}</dt><dd>${esc(p.wheelchair)}</dd><dt>${t('description')}</dt><dd>${esc(p.description||t('noDescription'))}${p.descriptionOrigin==='summary_of_osm_tags'?' <small>(OSM tag summary)</small>':''}</dd></dl></details></div></article>`;
 }).join(''):`<div class="empty-state"><h3>${t('noResults')}</h3><p>${t(result.warnings.includes('timing_confirmation')?'recovery_timing':editState.maxStops===0?'noRouteAfterEdit':'noResultsText')}</p></div>`;
 $$('[data-mission]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.mission;if(completedMissions.has(id))completedMissions.delete(id);else completedMissions.add(id);button.setAttribute('aria-pressed',String(completedMissions.has(id)));button.textContent=completedMissions.has(id)?'✓ '+t('missionDone'):t('missionTry');}));
 const r=result.route;
 $('#route-panel').innerHTML=r.stops.length?`<div class="route-heading"><h3>${t('routeTitle')}</h3><span>≈ ${r.totalMinutes} / ${result.trace.effectiveBudget} ${t('min')}</span></div><ol class="route-timeline">${r.stops.map((p,i)=>`<li><strong>${i+1}. ${esc(name(p))}</strong><span>${p.legMinutes} ${t('min')} ${t('walk')} + ${p.visitMinutes} ${t('min')} ${t('visit')}${p.shortStop?' · '+t('shortStop'):''}</span>${result.group.length?`<span class="route-member-note">${p.groupMatches.map(i=>t('member')+' '+(i+1)).join(' · ')}</span>`:''}<div class="stop-controls">${['keep','replace','remove'].map(action=>`<button type="button" data-edit="${action}" data-stop="${esc(p.id)}" ${action==='keep'?`aria-pressed="${editState.pinnedIds.includes(p.id)}"`:''} ${action!=='keep'&&editState.pinnedIds.includes(p.id)?'disabled':''} aria-label="${esc(t(action==='keep'&&editState.pinnedIds.includes(p.id)?'keptStop':action+'Stop')+' · '+name(p))}">${t(action==='keep'&&editState.pinnedIds.includes(p.id)?'keptStop':action+'Stop')}</button>`).join('')}</div></li>`).join('')}</ol><div class="route-footer"><span>${r.walkMinutes} ${t('min')} ${t('walk')} · ${r.visitMinutes} ${t('min')} ${t('visit')}<br>${result.returnToStart?r.returnMinutes+' '+t('min')+' '+t('routeBack'):t('routeOneWay')} · ${t('routeEstimate')}</span><button id="export-walk">${t('export')}</button></div>`:'';
 $('#export-walk')?.addEventListener('click',exportWalk);$$('[data-edit]').forEach(button=>button.addEventListener('click',()=>changeStop(button.dataset.edit,button.dataset.stop)));renderExtras();
 $('#trace').innerHTML=`<div class="trace-grid"><div><strong>${result.trace.datasetSize}</strong><span>${t('loaded')}</span></div><div><strong>${result.trace.candidates}</strong><span>${t('eligible')}</span></div><div><strong>${result.trace.effectiveBudget}</strong><span>${t('budgetLabel')}</span></div></div><p>${t('traceText')}</p><p>${t(generation.mode==='gemini-grounded'?'geminiExplain':'templateExplain')}</p><p>${t('estimateNote')}</p><p>${t('sourceDate')}: ${esc(metadata.collectedAt?.slice(0,10)||'')} · OpenStreetMap / ODbL · ${esc(result.trace.retrieval)}</p><p>${t('excluded')}: ${Object.entries(result.trace.exclusions).filter(([,v])=>v).map(([k,v])=>`${esc(k)} ${v}`).join(' · ')}</p>`;drawMap();
}
function renderExtras(){
 renderExpansion();
 const intent=result.intent,planOrigin=PRESETS.find(p=>p.lat===lastInput.origin.lat&&p.lon===lastInput.origin.lon)?.name||t('currentLocation');
 $('#planner-brief').textContent=`${planOrigin} · ${result.trace.effectiveBudget} ${t('min')}`;
 const chips=[`${planOrigin}`,`${result.trace.effectiveBudget} ${t('min')}`,`${intent.maxWalk} ${t('min')} ${t('walkingCap')}`,...result.trace.concepts.map(t),...intent.excluded.map(k=>t('exclude')+' '+t(k)),...intent.excludedCategories.map(k=>t('exclude')+' '+(t('categories')[k]||k)),...(result.timing.returnBy?[t('deadlineChip')+' '+clockTime(result.timing.returnBy)]:[]),...(result.timing.bufferMinutes?[result.timing.bufferMinutes+' '+t('minReserve')]:[]),intent.setting!=='any'?t(intent.setting):'',result.returnToStart?t('returnIncluded'):'',lastInput.verifiedHours?t('hoursRequired'):''].filter(Boolean);
 $('#intent-summary').innerHTML=`<span>${t('intentTitle')}</span><div>${chips.map(c=>`<span class="intent-chip">${esc(c)}</span>`).join('')}</div><button type="button" id="edit-request">${t('editRequest')} ↗</button>`;
 $('#edit-request').addEventListener('click',()=>{openPlanner();$('#query').focus();$('#planner').scrollIntoView({behavior:'smooth',block:'start'});});
 $('#edit-feedback').textContent=editFeedback;
 $('#edit-summary').innerHTML=(editHistory.length||editState.excludedIds.length||editState.pinnedIds.length)?`<div class="edit-summary"><p>${t('keptExplain')}</p><div>${editState.pinnedIds.map(id=>{const p=pois.find(p=>p.id===id);return `<button type="button" data-release="${esc(id)}">${esc(p?name(p):id)} · ${t('keptStop')} ×</button>`;}).join('')}${editHistory.length?`<button type="button" id="undo-edit">↶ ${t('undoEdit')}</button>`:''}<button type="button" id="reset-edits">${t('resetEdits')}</button></div></div>`:'';
 $('#undo-edit')?.addEventListener('click',()=>{const previous=editHistory.pop();generationController?.abort();++runId;({editState,result,generation,lastInput}=previous);generationPending=false;$('#find-button').disabled=false;editFeedback='';backupOptions=backupPlans(lastInput,pois);recovery=recoveryOptions(lastInput,pois,result);render();});
 $('#reset-edits')?.addEventListener('click',()=>{resetEdits();plan();});
 $$('[data-release]').forEach(button=>button.addEventListener('click',()=>{editState.pinnedIds=editState.pinnedIds.filter(id=>id!==button.dataset.release);editFeedback='';plan();}));

 $('#group-summary').innerHTML=result.group.length?`<div class="group-summary"><h3>${t('groupRoute')}</h3><p>${result.group.filter(g=>g.covered).length} / ${result.group.length} ${t('groupCovered')}</p><div class="coverage-chips">${result.group.map(g=>`<span class="coverage-chip ${g.covered?'yes':''}">${g.covered?'✓':'○'} ${t('member')} ${g.index+1} · ${esc(t(g.interest))} · ${t(g.covered?'covered':'uncovered')}</span>`).join('')}</div><p>${t('groupCaveat')}</p></div>`:'';
 $('#backup-panel').innerHTML=`<h3>${t('backupTitle')}</h3><p>${t('backupIntro')}</p><div class="backup-grid">${backupOptions.map(b=>`<article class="backup-card"><h4>${t(b.id==='shorter'?'shorter':'rainBackup')}</h4><strong>≈ ${b.result.route.totalMinutes} / ${b.result.trace.effectiveBudget} ${t('min')}</strong><p>${b.result.route.stops.length} ${t('stops')} · ${b.result.route.walkMinutes} ${t('min')} ${t('walk')}</p><p>${b.result.route.stops.map(name).map(esc).join(' → ')||t('noBackup')}</p><button data-backup="${b.id}" ${b.result.route.stops.length?'':'disabled'}>${t('applyBackup')}</button></article>`).join('')}</div>${originalPlan?`<button id="restore-plan" class="restore-button">↶ ${t('restorePlan')}</button>`:''}`;
 $$('[data-backup]').forEach(button=>button.addEventListener('click',()=>{const b=backupOptions.find(x=>x.id===button.dataset.backup);originalPlan ||= {budget:lastInput.budget,weather:lastInput.weather};if(b.changes.budget)$('#budget').value=String(b.changes.budget);if(b.changes.weather)$('#weather').value=b.changes.weather;$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;plan();}));
 $('#restore-plan')?.addEventListener('click',()=>{$('#budget').value=String(originalPlan.budget);$('#weather').value=originalPlan.weather;originalPlan=null;$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;plan();});
 const corrections=pois.filter(p=>walkMinutes(lastInput.origin,p,lastInput.pace)<=lastInput.maxWalk&&(p.accessRestricted||(p.hoursSource&&openingStatus(p.hours,new Date(lastInput.departure+':00+05:00'),1)==='closed'))).slice(0,4);
 $('#source-updates').hidden=!corrections.length;
 $('#source-updates').innerHTML=`<summary>${t('sourceChanges')}</summary><p>${t('sourceChangesHelp')}</p><ul class="source-updates-list">${corrections.map(p=>`<li><strong>${esc(name(p))}</strong><br>${p.accessRestricted?(p.operationalNotes||[]).filter(n=>n.url).slice(0,1).map(n=>`${esc(localized(n))} <a href="${esc(safeUrl(n.url))}" target="_blank" rel="noreferrer">${t('source')} ↗</a>`).join(''):`${t('hours')}: ${esc(p.hours||'')} <a href="${esc(safeUrl(p.hoursSource?.url))}" target="_blank" rel="noreferrer">${t('source')} ↗</a>`}</li>`).join('')}</ul>`;
}
function resetEdits(){editState={pinnedIds:[],excludedIds:[],preferredIds:[],maxStops:3};editHistory=[];editFeedback='';}
function renderExpansion(){
 const r=result.route,tm=result.timing,j=journeys.find(j=>j.id===$('#journey').value),story=journeyStory(j,pois,result,locale);
 const stamp=minutes=>clockTime(new Date(new Date(result.departure+':00+05:00').getTime()+minutes*60000+5*3600000).toISOString());
 $('#timing-panel').innerHTML=r.stops.length?`<details class="timing-details"><summary>${t('timeline')} · ${t(result.returnToStart?'plannedReturn':'plannedFinish')} ≈ ${clockTime(tm.plannedEnd)}${tm.bufferMinutes?' · '+tm.bufferMinutes+' '+t('minReserve'):''}</summary><p>${t('leaveAt')}: ${esc(result.departure.replace('T',' '))} · UTC+5</p><ol>${r.stops.map(s=>`<li><strong>${stamp(s.arrivalMinutes)}–${stamp(s.arrivalMinutes+s.visitMinutes)}</strong> ${esc(name(s))}</li>`).join('')}</ol><p>${t(result.returnToStart?'plannedReturn':'plannedFinish')}: ≈ ${esc(tm.plannedEnd.replace('T',' '))}<br>${t('reserveUntil')}: ${esc(tm.reservedEnd.replace('T',' '))}${tm.returnBy?'<br>'+t('deadlineChip')+': '+esc(tm.returnBy.replace('T',' ')):''}<br>${t('spareTime')}: ${tm.slackMinutes} ${t('min')}</p></details>`:'';
 $('#story-panel').hidden=!story;
 $('#story-panel').innerHTML=story?`<div class="story-header"><span class="eyebrow small">${t('sourceStory')}</span><h3>${esc(story.title)}</h3><span class="story-count">${story.chapters.length} / ${story.total} ${t('storyPart')}</span></div><p>${esc(story.introduction||t('storyPartial'))}</p><div class="story-chapters">${story.chapters.map((c,i)=>`<article><span class="chapter-number">0${i+1}</span><h4>${esc(c.name)}</h4><p class="story-question">${esc(c.question)}</p><details><summary>${t('storySources')}</summary>${c.facts.map(f=>`<p>${esc(f.text)} <a href="${esc(safeUrl(f.url))}" target="_blank" rel="noreferrer">${esc(f.title)} ↗</a></p>`).join('')}<p>${esc(c.condition)}</p></details></article>`).join('')}</div><button id="leave-story">${t('storyCustom')}</button>`:'';
 $('#leave-story')?.addEventListener('click',()=>{$('#journey').value='';editState.maxStops=3;recoveryOriginal=null;plan();});
 $('#recovery-panel').hidden=!recovery.reason&&!recoveryOriginal;
 $('#recovery-panel').innerHTML=`${recovery.reason?`<h3>${t('recoveryTitle')}</h3><p>${t('recovery_'+recovery.reason)}</p>${result.intent.stroller?'<p>'+t('strollerNote')+'</p>':''}<div class="recovery-options">${recovery.options.map((o,i)=>`<article><strong>${t(o.id==='more-time'?'moreTime':'laterDeparture')}</strong><p>${o.changes.departure?esc(o.changes.departure.replace('T',' ')):o.changes.budget+' '+t('min')}</p><p>≈ ${o.result.route.totalMinutes} ${t('min')} · ${o.result.route.stops.map(name).map(esc).join(' → ')}</p><button data-recovery="${i}">${t('applyAlternative')}</button></article>`).join('')}</div>${recovery.reason==='timing'?'<button id="confirm-timing">'+t('reviewTiming')+'</button>':recovery.options.length?'':'<p>'+t('noAlternative')+'</p>'}`:''}${recoveryOriginal?`<button id="restore-recovery">↶ ${t('restoreAlternative')}</button>`:''}`;
 $('#confirm-timing')?.addEventListener('click',()=>{openPlanner();$('#preferences').open=true;$('.more-options').open=true;$('#timing-confirmation').hidden=false;$('#budget').focus();$('#planner').scrollIntoView({behavior:'smooth',block:'start'});});
 $$('[data-recovery]').forEach(b=>b.addEventListener('click',()=>{
  const o=recovery.options[Number(b.dataset.recovery)];recoveryOriginal||={budget:lastInput.budget,query:lastInput.query,departure:lastInput.departure,timeMode:$('#time-mode').value};editHistory=[];
  if(o.changes.budget)$('#budget').value=String(o.changes.budget);if(o.changes.query!==undefined)$('#query').value=o.changes.query;
  if(o.changes.departure){$('#departure').value=o.changes.departure;$('#time-mode').value='custom';}
  $('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;plan({prepared:o.result,context:{...lastInput,...o.changes}});
 }));
 $('#restore-recovery')?.addEventListener('click',()=>{const old=recoveryOriginal;recoveryOriginal=null;$('#budget').value=String(old.budget);$('#query').value=old.query;$('#departure').value=old.departure;$('#time-mode').value=old.timeMode;$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;plan();});
 const mapped=r.legs.filter(l=>l.mode==='mapped').length,estimated=r.legs.some(l=>l.mode==='estimated'||l.connectorMeters>0);
 $('#routing-summary').textContent=[t(mapped?(estimated?'routingMixed':'routingMapped'):'routingEstimated'),mapped?t('routingConnection'):t('routingOutside'),r.legs.some(l=>l.exteriorViewpoint)?t('exteriorViewpoint'):'',result.intent.stroller?t('strollerNote'):''].filter(Boolean).join(' · ');
}
function changeStop(type,id){
 const edited=editPlan({...lastInput,...editState},pois,result,{type,id});
 if(!edited.ok){editFeedback=t(edited.reason);$('#edit-feedback').textContent=editFeedback;return;}
 editHistory.push({editState:structuredClone(editState),result,generation,lastInput});if(editHistory.length>10)editHistory.shift();
 editState={pinnedIds:edited.input.pinnedIds||[],excludedIds:edited.input.excludedIds||[],preferredIds:edited.input.preferredIds||[],maxStops:edited.input.maxStops??3};
 const before=result.route,after=edited.result.route,removed=before.stops.filter(p=>!after.stops.some(q=>q.id===p.id)),added=after.stops.filter(p=>!before.stops.some(q=>q.id===p.id));
 editFeedback=[removed.length?t('changeRemoved')+': '+removed.map(name).join(', '):'',added.length?t('changeAdded')+': '+added.map(name).join(', '):'',type!=='keep'?`${t('changeTime')}: ${before.totalMinutes} → ${after.totalMinutes} ${t('min')}`:''].filter(Boolean).join(' · ');
 if(type==='keep'){lastInput=edited.input;backupOptions=backupPlans(lastInput,pois);recovery=recoveryOptions(lastInput,pois,result);render();}else plan({prepared:edited.result,context:edited.input});
}
function drawMap(){
 if(!result)return;
 const all=[...result.recommendations];for(const p of result.route.stops)if(!all.some(q=>p.id===q.id))all.push(p);
 const routeCoordinates=result.route.legs.flatMap(l=>[...l.points,...l.connectors.flat()]).map(([lon,lat])=>({lon,lat}));
 const points=[origin,...all,...routeCoordinates], cos=Math.cos(origin.lat*Math.PI/180),width=900,height=420;
 const xs=points.map(p=>(p.lon-origin.lon)*cos*111320),ys=points.map(p=>(p.lat-origin.lat)*111320);
 let spanX=Math.max(1700,Math.max(...xs)-Math.min(...xs)+900),spanY=Math.max(1300,Math.max(...ys)-Math.min(...ys)+800);
 const scale=Math.min(width/spanX,height/spanY)*zoom,cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
 const project=(lon,lat)=>[width/2+((lon-origin.lon)*cos*111320-cx)*scale,height/2-((lat-origin.lat)*111320-cy)*scale];
 const pathFor=pts=>pts.map((p,i)=>`${i?'L':'M'}${project(p[0],p[1]).map(x=>x.toFixed(1)).join(',')}`).join('');
 const area=geometry.filter(f=>['park','water','river'].includes(f.kind)).map(f=>`<path d="${pathFor(f.points)}${f.kind==='river'?'':'Z'}" fill="${f.kind==='park'?'#dce6c9':f.kind==='water'?'#bfd9d9':'none'}" stroke="${f.kind==='river'?'#bfd9d9':'none'}" stroke-width="20"/>`).join('');
 const roads=geometry.filter(f=>!['park','water','river'].includes(f.kind));
 const roadBorders=roads.map(f=>`<path d="${pathFor(f.points)}" stroke="${['primary','secondary'].includes(f.kind)?'#d5dbcc':'#e1e5d7'}" stroke-width="${['primary','secondary'].includes(f.kind)?9:4}"/>`).join('');
 const roadLines=roads.map(f=>`<path d="${pathFor(f.points)}" stroke="#fffef5" stroke-width="${['primary','secondary'].includes(f.kind)?6:2}"/>`).join('');
 const routePath=result.route.legs.map(l=>`<path class="route-line ${l.mode}" d="${pathFor(l.points)}" fill="none" stroke="${l.mode==='mapped'?'#365e40':'#a17739'}" stroke-width="${l.mode==='mapped'?4:2}" ${l.mode==='mapped'?'':'stroke-dasharray="5 6"'}/>${l.connectors.map(c=>`<path class="route-connector" d="${pathFor(c)}" fill="none" stroke="#a17739" stroke-width="2" stroke-dasharray="3 4"/>`).join('')}`).join('');
 const [ox,oy]=project(origin.lon,origin.lat);
 // Separate nearby labels while a leader line preserves the actual geographic position.
 const placed=[],leaders=[];
 const markers=all.map(p=>{
  const [px,py]=project(p.lon,p.lat),i=result.recommendations.findIndex(q=>q.id===p.id);
  let x=px,y=py;
  for(const [dx,dy] of [[0,0],[180,0],[-180,0],[0,70],[0,-70],[180,70],[-180,70]]){
   x=Math.max(85,Math.min(width-85,px+dx));y=Math.max(48,Math.min(height-55,py+dy));
   if(!placed.some(q=>Math.abs(q.x-x)<175&&Math.abs(q.y-y)<65))break;
  }
  placed.push({x,y});
  const leader=x!==px||y!==py?`<path d="M${px.toFixed(1)},${py.toFixed(1)}L${x.toFixed(1)},${y.toFixed(1)}" stroke="#345a46" stroke-width="1"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#345a46"/>`:'';
  leaders.push(leader);
  return `<g class="map-marker" tabindex="0" role="button" data-poi="${esc(p.id)}" aria-label="${esc(name(p))}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="17" fill="#254b3e" stroke="#fffefa" stroke-width="3"/><text y="5" text-anchor="middle" font-family="Arial" font-size="13" fill="#fffefa">${i>=0?i+1:'R'}</text><rect x="-80" y="23" width="160" height="22" rx="6" fill="#fffefae8"/><text y="38" text-anchor="middle" fill="#294936" font-family="Arial" font-size="11">${esc(name(p).length>24?name(p).slice(0,23)+'…':name(p))}</text></g>`;}).join('');
 $('#map').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-label="${esc(t('neighborhood'))}"><rect width="900" height="420" fill="#edf0e4"/>${area}<g fill="none" stroke-linecap="round" stroke-linejoin="round">${roadBorders}${roadLines}</g>${routePath}${leaders.join('')}<circle cx="${ox}" cy="${oy}" r="23" fill="#fffefa80"/><circle cx="${ox}" cy="${oy}" r="9" fill="#fffefa" stroke="#345a46" stroke-width="3"/>${markers}</svg>`;
 $$('.map-marker').forEach(el=>{const highlight=()=>{$$('.place-card').forEach(c=>c.classList.remove('highlight'));const card=document.getElementById('card-'+el.dataset.poi);card?.classList.add('highlight');card?.scrollIntoView({behavior:'smooth',block:'nearest'});};el.addEventListener('click',highlight);el.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();highlight();}});});
}
function exportWalk(){
 const r=result.route,story=journeyStory(journeys.find(j=>j.id===$('#journey').value),pois,result,locale),tm=result.timing;
 const content=[t('exportTitle'),'ArcSolo · Build with AI',`${result.departure} · UTC+5`,`${r.totalMinutes} ${t('min')} · ${result.returnToStart?t('routeBack'):t('routeOneWay')}`,`${t('plannedFinish')}: ${tm.plannedEnd}`,`${t('reserveUntil')}: ${tm.reservedEnd} · ${tm.bufferMinutes} ${t('minReserve')}`,tm.returnBy?`${t('deadlineChip')}: ${tm.returnBy}`:'',story?`${story.title} · ${story.chapters.length}/${story.total}`:'','',...r.stops.flatMap((stop,i)=>{const p=pois.find(p=>p.id===stop.id),s=generation.suggestions?.find(s=>s.id===p.id),chapter=story?.chapters.find(c=>c.id===p.id);return [`${i+1}. ${name(p)}`,`${stop.legMinutes} ${t('min')} ${t('walk')} + ${stop.visitMinutes} ${t('min')} ${t('visit')}`,t(stop.travel.mode==='mapped'?'routingMapped':'routingEstimated'),p.source.url,t(stop.openingStatus==='open'?'openHours':'unknownHours'),chapter?.question||'',chapter?.condition||'',s?.why||'',s?.activity||actionText(p,locale),...evidenceFor(p,locale).slice(1).flatMap(f=>[f.text,f.url]),...(p.operationalNotes||[]).map(localized),''];}),t('routingNote'),t('estimateNote'),t('aboutLimits')].join('\n');
 const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='qadam-walk.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function scenario(id){
 const presets={expo:{location:'expo',interests:['nature','coffee'],budget:60,weather:'fair',query:{en:'Discover something unusual near EXPO',ru:'Необычная прогулка возле EXPO',kk:'EXPO маңында қызықты серуен'}},coffee:{location:'baiterek',interests:['coffee'],budget:60,weather:'fair',query:{en:'A quiet coffee stop with a socket',ru:'Хочу тихое кафе с розеткой',kk:'Розеткасы бар тыныш кафе'}},family:{location:'museum',interests:['family'],budget:120,weather:'fair',query:{en:'Explore with a child',ru:'Прогулка с ребёнком',kk:'Баламен серуендеу'}},rain:{location:'khan',interests:[],budget:90,weather:'rain',query:{en:'An indoor break from the rain',ru:'Укрыться от дождя и отдохнуть',kk:'Жаңбырдан паналап демалу'}}};
 originalPlan=null;recoveryOriginal=null;$('#journey').value='';completedMissions.clear();resetEdits();
 const isGroup=id==='group';$('#preferences').open=isGroup;$('.group-options').open=isGroup;const p=presets[isGroup?'expo':id];$('#group-enabled').checked=isGroup;$('#group-size').value='3';groupFields();$('#mood').value=isGroup?'curious':id==='family'?'playful':'balanced';
 if(isGroup){$('#group-members [data-member="0"]').value='coffee';$('#group-members [data-member="1"]').value='nature';$('#group-members [data-member="2"]').value='landmark';}$('#location').value=p.location;$('#query').value=p.query[locale];$('#budget').value=isGroup?120:p.budget;$('#weather').value=p.weather;$('#setting').value='any';$('#max-walk').value='20';$('#accessible').checked=false;$('#verified-hours').checked=false;$('#gentle').checked=false;$('#return').checked=true;
 if($('#time-mode').value==='demo')$('#departure').value=DEMO_TIME;
 else if($('#time-mode').value==='now')$('#departure').value=astanaNow();
 simulated=$('#time-mode').value==='demo';
 $$('[data-interest]').forEach(b=>b.setAttribute('aria-pressed',String(p.interests.includes(b.dataset.interest))));
 $$('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.scenario===id));translate();plan();
}
$('#location').innerHTML=PRESETS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('#departure').value=astanaNow();
$('#plan-form').addEventListener('submit',e=>{e.preventDefault();editHistory=[];editFeedback='';recoveryOriginal=null;plan({scroll:matchMedia('(max-width:760px)').matches});});
$('#query').addEventListener('input',()=>{timingConfirmedFor=null;$('#timing-confirmation').hidden=true;});
$('#use-timing-controls').addEventListener('click',()=>{timingConfirmedFor=$('#query').value;$('#timing-confirmation').hidden=true;plan();});
$('#budget').addEventListener('input',()=>$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`);
$('#departure').addEventListener('change',()=>{simulated=false;$('#time-mode').value='custom';});
$('#time-mode').addEventListener('change',()=>{const mode=$('#time-mode').value;simulated=mode==='demo';if(mode==='custom'){$('#preferences').open=true;$('.more-options').open=true;$('#departure').focus();return;}$('#departure').value=mode==='demo'?DEMO_TIME:astanaNow();editFeedback='';plan();});
$$('[data-interest]').forEach(b=>b.addEventListener('click',()=>b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'))));
$$('.scenario').forEach(b=>b.addEventListener('click',()=>scenario(b.dataset.scenario)));
$('#language').addEventListener('change',()=>{locale=$('#language').value;generation={};translate();plan();});
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(zoom*1.35,4);drawMap();});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(zoom/1.35,.4);drawMap();});$('#map-reset').addEventListener('click',()=>{zoom=1;drawMap();});
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());$('#close-dialog').addEventListener('click',()=>$('#about-dialog').close());
$('#locate').addEventListener('click',()=>{
 if(customLocation){routing?.clear();customLocation=null;$('#location option[value=custom]')?.remove();$('#location').value='expo';translate();plan();return;}
 if(!navigator.geolocation){notify(t('locationDenied'),true);return;}
 notify(t('locationConsent'));
 navigator.geolocation.getCurrentPosition(pos=>{customLocation={id:'custom',lat:pos.coords.latitude,lon:pos.coords.longitude};const option=document.createElement('option');option.value='custom';option.textContent=t('currentLocation');$('#location').append(option);$('#location').value='custom';translate();plan();},()=>notify(t('locationDenied'),true),{enableHighAccuracy:false,timeout:10000,maximumAge:0});
});
$('#deadline-enabled').addEventListener('change',()=>{$('#deadline-fields').hidden=!$('#deadline-enabled').checked;$('#return-by').required=$('#deadline-enabled').checked;if($('#deadline-enabled').checked){$('#return').checked=true;if(!$('#return-by').value)$('#return-by').value=$('#departure').value.slice(0,10)+'T15:00';}});
$('#journey').addEventListener('change',()=>{const j=journeys.find(j=>j.id===$('#journey').value);resetEdits();recoveryOriginal=null;if(j){$('#location').value=j.origin;$('#query').value='';$('#group-enabled').checked=false;groupFields();$$('[data-interest]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#mood').value='curious';editState.preferredIds=j.stops.map(s=>s.poiId);editState.maxStops=2;}plan();});
$('#group-enabled').addEventListener('change',groupFields);$('#group-size').addEventListener('change',groupFields);
function openPlanner(){$('#planner').classList.remove('compact');$('#planner-toggle').setAttribute('aria-expanded','true');}
$('#planner-toggle').addEventListener('click',()=>{const compact=$('#planner').classList.toggle('compact');$('#planner-toggle').setAttribute('aria-expanded',String(!compact));});
$('#planner').classList.toggle('compact',matchMedia('(max-width:760px)').matches);
$('#map-details').open=matchMedia('(min-width:761px)').matches;
translate();
try{const responses=await Promise.all(['/data/pois.json','/data/map.json','/data/metadata.json','/data/evidence.json','/data/walking-graph.json','/data/journeys.json'].map(url=>fetch(url)));if(responses.some(r=>!r.ok))throw new Error('Dataset unavailable');const [raw,geo,meta,pack,graph,stories]=await Promise.all(responses.map(r=>r.json()));pois=attachEvidence(raw,pack);geometry=geo;metadata=meta;routing=createRouter(graph);journeys=stories.journeys;datasetReady=true;translate();scenario('expo');}catch{notify(t('loadError'),true);$('#find-button').disabled=true;}
