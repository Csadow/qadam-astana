import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recommend,validateInput,parseIntent,PRESETS} from '../src/engine.js';
import {createRouter,clearConnector,pointInside} from '../src/routing.js';
import {recoveryOptions} from '../src/recovery.js';
import {journeyStory} from '../src/journeys.js';
import {attachEvidence} from '../src/evidence.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const pois=attachEvidence(read('data/pois.json'),read('data/evidence.json')),graph=read('data/walking-graph.json'),routing=createRouter(graph),journeys=read('data/journeys.json').journeys;
const origin={lat:51.1,lon:71.4},base={origin,budget:90,maxWalk:20,departure:'2026-10-20T14:00',returnToStart:true};
const poi=(id,category,extra={})=>({id,name:id,category,...origin,tags:{},hours:'24/7',source:{url:'https://www.openstreetmap.org/node/1'},...extra});
const fixture=[poi('art','artwork'),poi('museum','museum'),poi('cafe','cafe'),poi('park','park')];
test('compound durations and per-leg limits coexist across three languages',()=>{
 for(const query of ['1 hour and 30 minutes, max 10 minutes walking','1 час и 30 минут, пешком до 10 минут','1 сағат 30 минут, жаяу 10 минут']){const p=parseIntent(query);assert.equal(p.budget,90);assert.equal(p.maxWalk,10);}
 assert.equal(parseIntent('1.5 hours').budget,90);
});
test('specific category exclusions preserve artworks and unrelated preferences',()=>{
 const r=recommend({...base,query:'No museums, architecture please'},fixture);assert.ok(r.route.stops.some(p=>p.category==='artwork'));assert.ok(!r.route.stops.some(p=>p.category==='museum'));
 for(const q of ['No coffee, just a park','Не хочу кофе, только парк','Кофе керек емес, тек саябақ'])assert.deepEqual(recommend({...base,query:q},fixture).route.stops.map(p=>p.id),['park']);
});
test('bounded double negatives, free wifi and stroller context do not invent access claims',()=>{
 for(const q of ['I do not want to skip coffee','Не хочу исключать кофе']){assert.deepEqual(parseIntent(q).concepts,['coffee']);assert.deepEqual(parseIntent(q).excluded,[]);}
 for(const q of ['Coffee with free wifi','Кафе с бесплатным Wi-Fi','Тегін wifi'])assert.equal(parseIntent(q).free,false);
 for(const q of ['Walking with a stroller','С детской коляской','Бала арбасы']){assert.equal(parseIntent(q).stroller,true);assert.equal(parseIntent(q).accessible,false);assert.ok(parseIntent(q).concepts.includes('family'));}
 assert.equal(parseIntent('С инвалидной коляской').accessible,true);
});
test('deadline forces the return leg and reserves buffer inside the smaller budget',()=>{
 const r=recommend({...base,budget:120,returnBy:'2026-10-20T15:00',bufferMinutes:15,returnToStart:false},fixture);
 assert.equal(r.returnToStart,true);assert.equal(r.trace.effectiveBudget,45);assert.equal(r.timing.grossBudget,60);assert.ok(r.route.totalMinutes+15<=60);assert.ok(r.timing.reservedEnd<=r.timing.returnBy);assert.equal(r.route.legs.length,r.route.stops.length+1);
 const later=validateInput({...base,departure:'2026-10-20T14:30',returnBy:'2026-10-20T15:00',bufferMinutes:15});assert.equal(later.budget,15);
});
test('typed return clocks stay on the departure date; overnight dates are explicit',()=>{
 const typed=validateInput({...base,query:'back by 15:00',bufferMinutes:10});assert.equal(typed.budget,50);
 const past=recommend({...base,departure:'2026-10-20T23:30',query:'back by 01:00'},fixture);assert.equal(past.route.stops.length,0);assert.ok(past.warnings.includes('deadline_passed'));
 const overnight=validateInput({...base,departure:'2026-10-20T23:30',returnBy:'2026-10-21T01:00',bufferMinutes:15});assert.equal(overnight.budget,75);
 assert.throws(()=>validateInput({...base,returnBy:'2026-10-32T15:00'}));
});
test('buffer exhaustion and invalid buffers cannot produce a visit',()=>{
 assert.equal(recommend({...base,budget:15,bufferMinutes:15},fixture).route.stops.length,0);
 for(const bufferMinutes of [-1,61,2.5,NaN])assert.throws(()=>validateInput({...base,bufferMinutes}));
});
const miniature=(edges,obstacles=[])=>({area:'test',bbox:[0,0,.01,.01],nodes:[[1,.001,.001],[2,.001,.003],[3,.003,.003],[4,.003,.001]],edges,obstacles});
const a={lon:.001,lat:.001},b={lon:.003,lat:.001};
test('pedestrian detours use graph distance, never the straight shortcut',()=>{
 const r=createRouter(miniature([[0,1,220,false,10,0],[1,2,220,false,11,0],[2,3,220,false,12,0]])).leg(a,b);assert.equal(r.mode,'mapped');assert.equal(r.distanceM,660);assert.equal(r.minutes,9);assert.equal(r.points.length,4);assert.deepEqual(new Set(r.wayIds),new Set([10,11,12]));
});
test('one-way foot paths and disconnected components do not silently fall back',()=>{
 const r=createRouter(miniature([[0,3,220,false,10,1],[1,2,220,false,11,0]]));assert.equal(r.leg(a,b).mode,'mapped');assert.equal(r.leg(b,a).mode,'unreachable');assert.equal(r.leg(a,{lon:.001,lat:.003}).minutes,Infinity);
});
test('avoiding steps takes the longer path; gentle pace changes the same geometry',()=>{
 const r=createRouter(miniature([[0,3,220,true,10,0],[0,1,220,false,11,0],[1,2,220,false,12,0],[2,3,220,false,13,0]]));
 assert.equal(r.leg(a,b).minutes,3);assert.equal(r.leg(a,b,{avoidSteps:true}).distanceM,660);assert.equal(r.leg(a,b,{avoidSteps:true,pace:'gentle'}).minutes,12);
});
test('unmapped areas and blocked endpoint connectors are explicitly estimated',()=>{
 const wall={id:1,kind:'fence',points:[[.0015,0],[.0025,0],[.0025,.004],[.0015,.004],[.0015,0]],entrances:[]};assert.equal(clearConnector(a,b,[wall]),false);
 const r=createRouter(miniature([[0,3,220,false,10,0]],[wall]));assert.equal(r.leg(a,{lat:.001,lon:.002}).reason,'unverified_endpoint');assert.equal(r.leg(a,{lat:.1,lon:.1}).reason,'outside_graph');
});
test('interior venue connections require a doorway; exterior viewpoint stays outside',()=>{
 const building={id:9,kind:'building',points:[[.0006,.0006],[.0014,.0006],[.0014,.0014],[.0006,.0014],[.0006,.0006]],entrances:[]};
 const g=miniature([[0,3,220,false,10,0]],[building]);g.nodes[0]=[1,.001,.0016];const r=createRouter(g);
 assert.equal(r.leg(a,b).reason,'unverified_endpoint');const view=r.leg({...a,visitScope:'exterior'},b);assert.equal(view.mode,'mapped');assert.equal(view.exteriorViewpoint,true);assert.ok(view.points.every(([lon,lat])=>!pointInside({lon,lat},building.points)));
 building.entrances=[[20,.001,.0014]];const indoor=createRouter(g).leg(a,b);assert.equal(indoor.mode,'mapped');assert.deepEqual(indoor.entrances,[20]);assert.ok(indoor.connectorMeters>0);
});
test('route eligibility and opening times use graph travel time, including return',()=>{
 const fake={leg:()=>({minutes:20,mode:'mapped',points:[],connectors:[]})};
 assert.equal(recommend({...base,routing:fake,budget:45},[poi('museum','museum')]).route.stops.length,0);
 assert.equal(recommend({...base,routing:fake,budget:120},[poi('cafe','cafe',{hours:'Tu 14:00-14:25'})]).route.stops.length,0);
 assert.equal(recommend({...base,routing:fake,maxWalk:19},fixture).route.stops.length,0);
});
test('collected EXPO route contains mapped paths and excludes NU campus shortcuts',()=>{
 const r=recommend({...base,origin:PRESETS[0],budget:60,interests:['nature','coffee'],routing},pois);assert.ok(r.route.stops.length>=2);assert.ok(r.route.legs.some(l=>l.mode==='mapped'&&l.points.length>20));assert.ok(r.route.totalMinutes<=60);
 const campus=graph.obstacles.find(o=>o.id===424894683);assert.ok(campus);assert.equal(campus.kind,'restricted');assert.ok(graph.nodes.every(([id,lon,lat])=>!pointInside({lon,lat},campus.points)));
});
test('recovery proposes the first tested useful time increase and preserves constraints',()=>{
 const p=poi('museum','museum',{wheelchair:'yes'}),raw={...base,budget:15,query:'15 minutes, a museum',bufferMinutes:5,accessible:true,weather:'rain',maxWalk:7};
 const options=recoveryOptions(raw,[p]).options;const more=options.find(o=>o.id==='more-time');assert.ok(more);assert.equal(more.changes.budget,45);assert.equal(more.changes.query,'45 min, a museum');assert.deepEqual(Object.keys(more.changes).sort(),['budget','query']);assert.ok(more.result.route.totalMinutes+5<=45);assert.equal(more.result.returnToStart,true);
 assert.equal(recoveryOptions(raw,[poi('unknown','museum')]).options.length,0);
});
test('recovery never loosens a hard deadline, a kept-stop conflict or explicit removal',()=>{
 assert.equal(recoveryOptions({...base,budget:15,returnBy:'2026-10-20T14:15'},[poi('museum','museum')]).options.length,0);
 assert.equal(recoveryOptions({...base,pinnedIds:['park'],weather:'rain'},fixture).reason,'kept');
 assert.equal(recoveryOptions({...base,maxStops:0},fixture).options.length,0);
});
test('closure recovery changes only departure and rechecks published hours',()=>{
 const raw={...base,budget:90,departure:'2026-10-19T14:00'},data=[poi('museum','museum',{hours:'Tu-Su 10:00-18:00'})];const options=recoveryOptions(raw,data).options;assert.equal(options.length,1);assert.deepEqual(options[0].changes,{departure:'2026-10-20T14:00'});assert.equal(options[0].result.route.stops[0].openingStatus,'open');
});
test('all three stories resolve exact source facts in EN/RU/KK and obey the planner',()=>{
 for(const j of journeys){const raw={...base,routing,origin:PRESETS.find(p=>p.id===j.origin),budget:120,maxWalk:30,journeyIds:j.stops.map(s=>s.poiId),preferredIds:j.stops.map(s=>s.poiId),maxStops:2};const r=recommend(raw,pois);assert.equal(r.route.stops.length,2,j.id);
  for(const locale of ['en','ru','kk']){const story=journeyStory(j,pois,r,locale);assert.equal(story.complete,true,j.id);assert.ok(story.introduction);assert.ok(story.chapters.every(c=>c.facts.length&&c.question&&c.condition));assert.ok(story.chapters.flatMap(c=>c.facts).every(f=>f.url.startsWith('https://')));}
 }
});
test('partial story hides the full introduction and recovery computes the missing chapter',()=>{
 const j=journeys[2],raw={...base,routing,origin:PRESETS[2],budget:60,maxWalk:30,journeyIds:j.stops.map(s=>s.poiId),preferredIds:j.stops.map(s=>s.poiId),maxStops:2},r=recommend(raw,pois),story=journeyStory(j,pois,r,'en');assert.equal(story.complete,false);assert.equal(story.introduction,'');assert.ok(story.chapters.length<2);assert.ok(recoveryOptions(raw,pois,r).options.some(o=>o.result.route.stops.length===2));
 const monday=recommend({...raw,budget:120,departure:'2026-10-19T14:00'},pois);assert.ok(!monday.route.stops.some(p=>p.id==='osm-node-4894937300'));
});
