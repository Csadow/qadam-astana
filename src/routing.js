import {distanceM,walkMinutes} from './geo.js';
const polygonBounds=new WeakMap();
function box(points){
 if(!polygonBounds.has(points)){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const [x,y] of points){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}polygonBounds.set(points,[minX,minY,maxX,maxY]);}
 return polygonBounds.get(points);
}
export function pointInside(p,points){
 const b=box(points);if(p.lon<b[0]||p.lon>b[2]||p.lat<b[1]||p.lat>b[3])return false;
 let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];if((ay>p.lat)!==(by>p.lat)&&p.lon<(bx-ax)*(p.lat-ay)/(by-ay)+ax)hit=!hit;
 }return hit;
}
function cross(a,b,c){return (b.lon-a.lon)*(c.lat-a.lat)-(b.lat-a.lat)*(c.lon-a.lon);}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<-1e-20&&cross(c,d,a)*cross(c,d,b)<-1e-20;}
export function clearConnector(a,b,obstacles,ignoreId){
 for(const o of obstacles){
  if(o.id===ignoreId)continue;
  const bb=box(o.points);if(Math.max(a.lon,b.lon)<bb[0]||Math.min(a.lon,b.lon)>bb[2]||Math.max(a.lat,b.lat)<bb[1]||Math.min(a.lat,b.lat)>bb[3])continue;
  if(o.kind!=='barrier'&&(pointInside(a,o.points)||pointInside(b,o.points)))return false;
  for(let i=1;i<o.points.length;i++)if(intersects(a,b,{lon:o.points[i-1][0],lat:o.points[i-1][1]},{lon:o.points[i][0],lat:o.points[i][1]}))return false;
 }return true;
}
class Heap{
 data=[];
 push(v){let i=this.data.length;this.data.push(v);while(i){const p=(i-1)>>1;if(this.data[p][0]<=v[0])break;this.data[i]=this.data[p];i=p;}this.data[i]=v;}
 pop(){const first=this.data[0],last=this.data.pop();if(this.data.length){let i=0;while(i*2+1<this.data.length){let c=i*2+1;if(c+1<this.data.length&&this.data[c+1][0]<this.data[c][0])c++;if(this.data[c][0]>=last[0])break;this.data[i]=this.data[c];i=c;}this.data[i]=last;}return first;}
}
/** Graph and all origin-dependent caches live only in page memory. */
export function createRouter(graph){
 const nodes=graph.nodes.map(([id,lon,lat])=>({id,lon,lat})),adj=nodes.map(()=>[]),snapCache=new Map(),trees=new Map(),legs=new Map();
 const cells=new Map();nodes.forEach((n,i)=>{const k=Math.floor(n.lon*500)+':'+Math.floor(n.lat*1000);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(i);});
 function nearby(p){const x=Math.floor(p.lon*500),y=Math.floor(p.lat*1000),out=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(const i of cells.get((x+dx)+':'+(y+dy))||[]){const d=distanceM(p,nodes[i]);if(d<=80)out.push({i,d});}return out.sort((a,b)=>a.d-b.d);}
 for(const [a,b,m,steps,way,dir] of graph.edges){if(dir!==-1)adj[a].push({to:b,m,steps,way});if(dir!==1)adj[b].push({to:a,m,steps,way});}
 const coverage=Object.values(graph.areas||{area:graph.bbox});
 const bounds=p=>coverage.some(b=>p.lon>=b[0]&&p.lon<=b[2]&&p.lat>=b[1]&&p.lat<=b[3]);
 const key=p=>`${p.lat.toFixed(7)},${p.lon.toFixed(7)}:${p.visitScope==='exterior'?'exterior':''}`;
 function snap(p){
  const k=key(p);if(snapCache.has(k))return snapCache.get(k);
  if(!bounds(p))return {reason:'outside_graph'};
  const enclosing=graph.obstacles.filter(o=>o.kind!=='barrier'&&pointInside(p,o.points));
  if(enclosing.some(o=>['restricted','water','fence'].includes(o.kind)))return {reason:'unverified_endpoint'};
  const building=enclosing.find(o=>o.kind==='building');
  if(building&&p.visitScope==='exterior'){
   const found=nearby(p).find(c=>!pointInside(nodes[c.i],building.points)&&clearConnector(nodes[c.i],p,graph.obstacles,building.id));
   if(found){const n=nodes[found.i],result={node:found.i,m:0,points:[[n.lon,n.lat]],viewpoint:true};snapCache.set(k,result);return result;}
  }
  const starts=building?(building.entrances||[]).map(([id,lon,lat])=>({id,lon,lat})): [p];
  let best=null;
  for(const start of starts){
   const candidates=nearby(start).slice(0,16);
   for(const c of candidates){
    if(!clearConnector(start,nodes[c.i],graph.obstacles,building?.id))continue;
    // Leave a mapped doorway towards the outside; never cut back through its building.
    if(building&&!clearConnector({lon:start.lon+(nodes[c.i].lon-start.lon)*.001,lat:start.lat+(nodes[c.i].lat-start.lat)*.001},nodes[c.i],[building]))continue;
    const m=c.d+distanceM(p,start)*1.3;
    if(m>250)continue;
    if(!best||m<best.m)best={node:c.i,m,buildingId:building?.id,points:[[p.lon,p.lat],...(building?[[start.lon,start.lat]]:[]),[nodes[c.i].lon,nodes[c.i].lat]],entrance:building?start.id:null};
    break;
   }
  }
  const result=best||{reason:'unverified_endpoint'};if(snapCache.size>500)snapCache.clear();snapCache.set(k,result);return result;
 }
 function tree(start,noSteps){
  const k=start+':'+noSteps;if(trees.has(k))return trees.get(k);
  const dist=new Float64Array(nodes.length).fill(Infinity),prev=new Int32Array(nodes.length).fill(-1),ways=new Float64Array(nodes.length);dist[start]=0;
  const heap=new Heap();heap.push([0,start]);
  while(heap.data.length){const [d,v]=heap.pop();if(d!==dist[v])continue;for(const e of adj[v]){if(noSteps&&e.steps)continue;const next=d+e.m;if(next<dist[e.to]){dist[e.to]=next;prev[e.to]=v;ways[e.to]=e.way;heap.push([next,e.to]);}}}
  const result={dist,prev,ways};if(trees.size>=50)trees.delete(trees.keys().next().value);trees.set(k,result);return result;
 }
 function leg(a,b,options={}){
  const pace=options.pace||'normal',noSteps=!!options.avoidSteps,k=key(a)+'>'+key(b)+':'+pace+':'+noSteps;
  if(legs.has(k))return legs.get(k);
  if(distanceM(a,b)<1)return {minutes:0,distanceM:0,mode:'same_point',points:[],connectors:[]};
  const aa=snap(a),bb=snap(b);let result;
  if(aa.reason||bb.reason||aa.buildingId&&aa.buildingId===bb.buildingId)result={minutes:walkMinutes(a,b,pace),distanceM:Math.round(distanceM(a,b)*1.3),mode:'estimated',reason:aa.reason||bb.reason||'interior_connection',points:[[a.lon,a.lat],[b.lon,b.lat]],connectors:[]};
  else{
   const t=tree(aa.node,noSteps),path=[];let n=bb.node;
   if(!Number.isFinite(t.dist[n]))result={minutes:Infinity,distanceM:Infinity,mode:'unreachable',reason:'disconnected',points:[],connectors:[]};
   else{
    const used=[];while(n!==aa.node){path.push([nodes[n].lon,nodes[n].lat]);used.push(t.ways[n]);n=t.prev[n];}path.push([nodes[n].lon,nodes[n].lat]);path.reverse();
    const metres=t.dist[bb.node]+aa.m+bb.m;
    result={minutes:Math.ceil(metres/(pace==='gentle'?55:75)),distanceM:Math.round(metres),mode:'mapped',points:path,connectors:[aa.points,[...bb.points].reverse()],connectorMeters:Math.round(aa.m+bb.m),exteriorViewpoint:!!(aa.viewpoint||bb.viewpoint),entrances:[aa.entrance,bb.entrance].filter(Boolean),wayIds:[...new Set(used)]};
   }
  }
  if(legs.size>=1200)legs.clear();legs.set(k,result);return result;
 }
 return {leg,area:graph.area,clear(){snapCache.clear();trees.clear();legs.clear();}};
}
