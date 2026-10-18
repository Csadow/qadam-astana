import {PRESETS,recommend,astanaNow,parseIntent} from '/src/engine.js';
import {actionText} from '/src/actions.js';
import {messages} from '/i18n.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let locale='en',pois=[],geometry=[],metadata={},result=null,origin=PRESETS[0],customLocation=null,runId=0,zoom=1,simulated=false,generation={},datasetReady=false;
const t=k=>messages[locale][k]??messages.en[k]??k;
const name=p=>p.names?.[locale]||p.name;
const sourceUrl=p=>/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(p.source?.url)?p.source.url:'https://www.openstreetmap.org';
function translate(){
 document.documentElement.lang=locale;
 $$('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(['headline','heroText'].includes(el.dataset.i18n))el.innerHTML=value;else el.textContent=value;});
 $('#query').placeholder=t('placeholder');
 $('#budget-value').textContent=`${$('#budget').value} ${t('min')}`;
 $('#about-content').innerHTML=`<h3>${t('aboutHeading')}</h3><p>${t('aboutFlow')}</p><h3>${t('aboutData')}</h3><p>${t('aboutLimits')}</p><h3>${t('aboutPrivacy')}</h3><p>${t('privacyAbout')}</p>`;
 $('#locate span:last-child').textContent=t(customLocation?'clearLocation':'useLocation');
 if(result)render();
}
function input(){
 origin=customLocation&&$('#location').value==='custom'?customLocation:PRESETS.find(p=>p.id===$('#location').value)||PRESETS[0];
 return {origin,budget:Number($('#budget').value),maxWalk:Number($('#max-walk').value),query:$('#query').value,
  interests:$$('[data-interest][aria-pressed=true]').map(b=>b.dataset.interest),weather:$('#weather').value,
  departure:$('#departure').value,locale,accessible:$('#accessible').checked,verifiedHours:$('#verified-hours').checked,
  pace:$('#gentle').checked?'gentle':'normal',returnToStart:$('#return').checked};
}
function notify(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);}
async function plan(){
 if(!datasetReady)return;
 const current=++runId;
 $('#find-button').disabled=true;notify(t('loading'));
 try{
  const context=input();
  result=recommend(context,pois);generation={};zoom=1;render();
  if(result.recommendations.length){
   const intent=parseIntent(context.query,context.interests);
   try{
    const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:result.recommendations.map(p=>p.id),locale,context:{family:intent.concepts.includes('family'),quiet:intent.quiet,socket:intent.socket}}),signal:AbortSignal.timeout(15000)});
    if(response.ok){const data=await response.json();if(current!==runId)return;generation=data;render();}
   }catch{/* Source-grounded template remains usable during provider or network failure. */}
  }
 }catch(error){notify(error.message,true);}finally{if(current===runId)$('#find-button').disabled=false;}
}
function render(){
 $('#mode-badge').textContent=t(generation.mode==='gemini-grounded'?'geminiMode':'templateMode');
 $('#results-title').textContent=result.trace.effectiveBudget===60?t('yourNextHour'):t('newResults');
 const notes=[simulated?t('simulation'):'',...result.warnings.filter(x=>x!=='estimates').map(t)].filter(Boolean);
 notify(notes.join(' '));
 $('#result-cards').innerHTML=result.recommendations.length?result.recommendations.map((p,i)=>{
  const suggestion=generation.suggestions?.find(s=>s.id===p.id);
  const defaultAction=parseIntent($('#query').value).socket&&p.category==='cafe'?'ask_socket':undefined;
  return `<article class="place-card" id="card-${esc(p.id)}"><div class="place-top"><span class="place-number">${i+1}</span><div class="place-title"><h3>${esc(name(p))}</h3><span class="category">${esc(t('categories')[p.category]||p.category)} · ≈${p.distanceM} m ${p.match==='partial'?'· '+esc(t('partial')):''}</span></div><span class="place-time">${p.walkMinutes} ${t('min')} ${t('walk')}</span></div><div class="place-body"><p class="why"><strong>${t('why')}:</strong> ${p.reasons.map(t).map(esc).join(' · ')}. ≈${p.visitMinutes} ${t('min')} ${t('visit')}.</p><div class="action-idea"><span class="idea-label">${t('idea')}</span>${esc(actionText(p,locale,suggestion?.actionId||defaultAction))}</div>${p.uncertainties.filter(u=>u!=='hours').map(u=>`<p class="uncertainty">${esc(t('unc_'+u))}</p>`).join('')}<div class="place-bottom"><span class="hours-label ${p.openingStatus==='open'?'open':''}">${t(p.openingStatus==='open'?'openHours':'unknownHours')}</span><a class="source-link" href="${sourceUrl(p)}" target="_blank" rel="noreferrer">${t('source')}</a></div><details class="source-details"><summary>${t('facts')}</summary><dl><dt>${t('collected')}</dt><dd>${esc(p.source.collectedAt.slice(0,10))}</dd><dt>${t('hours')}</dt><dd>${esc(p.hours||t('unknown'))}</dd><dt>${t('access')}</dt><dd>${esc(p.wheelchair)}</dd><dt>${t('description')}</dt><dd>${esc(p.description||t('noDescription'))}${p.descriptionOrigin==='summary_of_osm_tags'?' <small>(OSM tag summary)</small>':''}</dd></dl></details></div></article>`;
 }).join(''):`<div class="empty-state"><h3>${t('noResults')}</h3><p>${t('noResultsText')}</p></div>`;
 const r=result.route;
 $('#route-panel').innerHTML=r.stops.length?`<div class="route-heading"><h3>${t('routeTitle')}</h3><span>≈ ${r.totalMinutes} / ${result.trace.effectiveBudget} ${t('min')}</span></div><ol class="route-timeline">${r.stops.map((p,i)=>`<li><strong>${i+1}. ${esc(name(p))}</strong><span>${p.legMinutes} ${t('min')} ${t('walk')} + ${p.visitMinutes} ${t('min')} ${t('visit')}</span></li>`).join('')}</ol><div class="route-footer"><span>${r.walkMinutes} ${t('min')} ${t('walk')} · ${r.visitMinutes} ${t('min')} ${t('visit')}<br>${result.returnToStart?r.returnMinutes+' '+t('min')+' '+t('routeBack'):t('routeOneWay')} · ${t('routeEstimate')}</span><button id="export-walk">${t('export')}</button></div>`:'';
 $('#export-walk')?.addEventListener('click',exportWalk);
 $('#trace').innerHTML=`<div class="trace-grid"><div><strong>${result.trace.datasetSize}</strong><span>${t('loaded')}</span></div><div><strong>${result.trace.candidates}</strong><span>${t('eligible')}</span></div><div><strong>${result.trace.effectiveBudget}</strong><span>${t('budgetLabel')}</span></div></div><p>${t('traceText')}</p><p>${t(generation.mode==='gemini-grounded'?'geminiExplain':'templateExplain')}</p><p>${t('estimateNote')}</p><p>${t('sourceDate')}: ${esc(metadata.collectedAt?.slice(0,10)||'')} · OpenStreetMap / ODbL · ${esc(result.trace.retrieval)}</p><p>${t('excluded')}: ${Object.entries(result.trace.exclusions).filter(([,v])=>v).map(([k,v])=>`${esc(k)} ${v}`).join(' · ')}</p>`;
 drawMap();
}
function drawMap(){
 if(!result)return;
 const all=[...result.recommendations];for(const p of result.route.stops)if(!all.some(q=>p.id===q.id))all.push(p);
 const points=[origin,...all], cos=Math.cos(origin.lat*Math.PI/180),width=900,height=420;
 const xs=points.map(p=>(p.lon-origin.lon)*cos*111320),ys=points.map(p=>(p.lat-origin.lat)*111320);
 let spanX=Math.max(1700,Math.max(...xs)-Math.min(...xs)+900),spanY=Math.max(1300,Math.max(...ys)-Math.min(...ys)+800);
 const scale=Math.min(width/spanX,height/spanY)*zoom,cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
 const project=(lon,lat)=>[width/2+((lon-origin.lon)*cos*111320-cx)*scale,height/2-((lat-origin.lat)*111320-cy)*scale];
 const pathFor=pts=>pts.map((p,i)=>`${i?'L':'M'}${project(p[0],p[1]).map(x=>x.toFixed(1)).join(',')}`).join('');
 const area=geometry.filter(f=>['park','water','river'].includes(f.kind)).map(f=>`<path d="${pathFor(f.points)}${f.kind==='river'?'':'Z'}" fill="${f.kind==='park'?'#dce6c9':f.kind==='water'?'#bfd9d9':'none'}" stroke="${f.kind==='river'?'#bfd9d9':'none'}" stroke-width="20"/>`).join('');
 const roads=geometry.filter(f=>!['park','water','river'].includes(f.kind));
 const roadBorders=roads.map(f=>`<path d="${pathFor(f.points)}" stroke="${['primary','secondary'].includes(f.kind)?'#d5dbcc':'#e1e5d7'}" stroke-width="${['primary','secondary'].includes(f.kind)?9:4}"/>`).join('');
 const roadLines=roads.map(f=>`<path d="${pathFor(f.points)}" stroke="#fffef5" stroke-width="${['primary','secondary'].includes(f.kind)?6:2}"/>`).join('');
 const routePoints=[origin,...result.route.stops,...(result.returnToStart?[origin]:[])];
 const routePath=result.route.stops.length?`<path d="${pathFor(routePoints.map(p=>[p.lon,p.lat]))}" fill="none" stroke="#5f8055" stroke-width="2" stroke-dasharray="5 6" opacity=".65"/>`:'';
 const [ox,oy]=project(origin.lon,origin.lat);
 const markers=all.map(p=>{const [x,y]=project(p.lon,p.lat),i=result.recommendations.findIndex(q=>q.id===p.id);return `<g class="map-marker" tabindex="0" role="button" data-poi="${esc(p.id)}" aria-label="${esc(name(p))}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="17" fill="#254b3e" stroke="#fffefa" stroke-width="3"/><text y="5" text-anchor="middle" font-family="Arial" font-size="13" fill="#fffefa">${i>=0?i+1:'R'}</text><rect x="-80" y="23" width="160" height="22" rx="6" fill="#fffefae8"/><text y="38" text-anchor="middle" fill="#294936" font-family="Arial" font-size="11">${esc(name(p).length>24?name(p).slice(0,23)+'…':name(p))}</text></g>`;}).join('');
 $('#map').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" aria-label="${esc(t('neighborhood'))}"><rect width="900" height="420" fill="#edf0e4"/>${area}<g fill="none" stroke-linecap="round" stroke-linejoin="round">${roadBorders}${roadLines}</g>${routePath}<circle cx="${ox}" cy="${oy}" r="23" fill="#fffefa80"/><circle cx="${ox}" cy="${oy}" r="9" fill="#fffefa" stroke="#345a46" stroke-width="3"/>${markers}</svg>`;
 $$('.map-marker').forEach(el=>{const highlight=()=>{$$('.place-card').forEach(c=>c.classList.remove('highlight'));const card=document.getElementById('card-'+el.dataset.poi);card?.classList.add('highlight');card?.scrollIntoView({behavior:'smooth',block:'nearest'});};el.addEventListener('click',highlight);el.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();highlight();}});});
}
function exportWalk(){
 const r=result.route;const content=[t('exportTitle'),'ArcSolo · Build with AI',`${result.departure} · UTC+5`,`${r.totalMinutes} ${t('min')} · ${result.returnToStart?t('routeBack'):t('routeOneWay')}`,'',...r.stops.flatMap((p,i)=>[`${i+1}. ${name(p)}`,`${p.legMinutes} ${t('min')} ${t('walk')} + ${p.visitMinutes} ${t('min')} ${t('visit')}`,p.source.url,t(p.openingStatus==='open'?'openHours':'unknownHours'),actionText(p,locale),'']),t('estimateNote'),t('aboutLimits')].join('\n');
 const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='qadam-walk.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function scenario(id){
 const presets={expo:{location:'expo',interests:['landmark','nature','coffee'],budget:60,weather:'fair',query:{en:'Discover something unusual near EXPO',ru:'Необычная прогулка возле EXPO',kk:'EXPO маңында қызықты серуен'}},coffee:{location:'baiterek',interests:['coffee'],budget:60,weather:'fair',query:{en:'A quiet coffee stop with a socket',ru:'Хочу тихое кафе с розеткой',kk:'Розеткасы бар тыныш кафе'}},family:{location:'museum',interests:['family'],budget:120,weather:'fair',query:{en:'Explore with a child',ru:'Прогулка с ребёнком',kk:'Баламен серуендеу'}},rain:{location:'khan',interests:[],budget:90,weather:'rain',query:{en:'An indoor break from the rain',ru:'Укрыться от дождя и отдохнуть',kk:'Жаңбырдан паналап демалу'}}};
 const p=presets[id];$('#location').value=p.location;$('#query').value=p.query[locale];$('#budget').value=p.budget;$('#weather').value=p.weather;$('#max-walk').value='20';$('#accessible').checked=false;$('#verified-hours').checked=false;$('#gentle').checked=false;$('#return').checked=true;
 $('#departure').value=astanaNow().slice(0,10)+'T14:00';simulated=true;
 $$('[data-interest]').forEach(b=>b.setAttribute('aria-pressed',String(p.interests.includes(b.dataset.interest))));
 $$('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.scenario===id));translate();plan();
}
$('#location').innerHTML=PRESETS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('#departure').value=astanaNow();
$('#plan-form').addEventListener('submit',e=>{e.preventDefault();plan();});
$('#budget').addEventListener('input',()=>$('#budget-value').textContent=`${$('#budget').value} ${t('min')}`);
$('#departure').addEventListener('change',()=>simulated=false);
$$('[data-interest]').forEach(b=>b.addEventListener('click',()=>b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'))));
$$('.scenario').forEach(b=>b.addEventListener('click',()=>scenario(b.dataset.scenario)));
$('#language').addEventListener('change',()=>{locale=$('#language').value;translate();});
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(zoom*1.35,4);drawMap();});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(zoom/1.35,.4);drawMap();});$('#map-reset').addEventListener('click',()=>{zoom=1;drawMap();});
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());$('#close-dialog').addEventListener('click',()=>$('#about-dialog').close());
$('#locate').addEventListener('click',()=>{
 if(customLocation){customLocation=null;$('#location option[value=custom]')?.remove();$('#location').value='expo';translate();plan();return;}
 if(!navigator.geolocation){notify(t('locationDenied'),true);return;}
 notify(t('locationConsent'));
 navigator.geolocation.getCurrentPosition(pos=>{customLocation={id:'custom',lat:pos.coords.latitude,lon:pos.coords.longitude};const option=document.createElement('option');option.value='custom';option.textContent=t('currentLocation');$('#location').append(option);$('#location').value='custom';translate();plan();},()=>notify(t('locationDenied'),true),{enableHighAccuracy:false,timeout:10000,maximumAge:0});
});
translate();
try{const responses=await Promise.all(['/data/pois.json','/data/map.json','/data/metadata.json'].map(url=>fetch(url)));if(responses.some(r=>!r.ok))throw new Error('Dataset unavailable');[pois,geometry,metadata]=await Promise.all(responses.map(r=>r.json()));datasetReady=true;scenario('expo');}catch{notify(t('loadError'),true);$('#find-button').disabled=true;}
