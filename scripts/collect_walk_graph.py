"""Build a conservative EXPO walking graph from the collected OSM extract.

Reproduce without network: python3 scripts/collect_walk_graph.py --from-source data/walking-source.json
"""
from pathlib import Path
from collections import Counter
import argparse,hashlib,json,math,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
KEYS={'highway','foot','foot:conditional','access','access:conditional','barrier','building','natural','water','area','indoor','bridge','tunnel','oneway:foot','wheelchair','entrance','amenity','landuse','name','name:en','surface'}
ALLOWED={'footway','path','pedestrian','steps'}
PERMITTED={'yes','designated','permissive'}
def inside(p,polygon):
    x,y=p;hit=False
    for (a,b),(c,d) in zip(polygon,polygon[1:]+polygon[:1]):
        if (b>y)!=(d>y) and x<(c-a)*(y-b)/(d-b)+a:hit=not hit
    return hit
def distance(a,b):
    r=math.pi/180;dlat=(b[1]-a[1])*r;dlon=(b[0]-a[0])*r
    x=math.sin(dlat/2)**2+math.cos(a[1]*r)*math.cos(b[1]*r)*math.sin(dlon/2)**2
    return round(6371000*2*math.atan2(math.sqrt(x),math.sqrt(max(0,1-x))),2)
def permitted(t):
    if 'foot:conditional' in t or 'access:conditional' in t:return False
    if t.get('foot') in PERMITTED:return True
    return t.get('foot') is None and t.get('access') in {None,'yes','designated','permissive','public'}
def build(source):
    nodes={str(n['id']):n for n in source['nodes']};box=source['bbox'];obstacles=[];restricted=[]
    for w in source['ways']:
        t=w['tags'];refs=w['nodes'];pts=[[nodes[str(i)]['lon'],nodes[str(i)]['lat']] for i in refs if str(i) in nodes]
        if t.get('barrier') in {'fence','wall'} and len(pts)>=2 and refs[0]!=refs[-1]:
            obstacles.append({'id':w['id'],'kind':'barrier','points':pts,'entrances':[]});continue
        if len(pts)<3 or refs[0]!=refs[-1]:continue
        # School/university grounds are not used as public shortcuts, even when individual paths lack access tags.
        is_restricted=t.get('amenity') in {'school','university'} or t.get('landuse')=='education' or t.get('access') in {'no','private'}
        kind='restricted' if is_restricted else 'water' if t.get('natural')=='water' else 'building' if t.get('building') and t['building']!='no' else 'fence' if t.get('barrier') in {'fence','wall'} else None
        if not kind:continue
        entrances=[]
        if kind=='building':
            for ref in refs:
                n=nodes.get(str(ref));nt=n.get('tags',{}) if n else {}
                if nt.get('entrance') in {'yes','main','exit'} and permitted(nt) and nt.get('entrance')!='exit':entrances.append([n['id'],n['lon'],n['lat']])
        o={'id':w['id'],'kind':kind,'points':pts,'entrances':entrances};obstacles.append(o)
        if is_restricted:restricted.append(pts)
    blocked=set()
    for ref,n in nodes.items():
        t=n.get('tags',{})
        if not permitted(t) or (t.get('barrier') not in {None,'no','kerb','bollard','cycle_barrier'} and t.get('foot') not in PERMITTED):blocked.add(ref)
        if any(inside([n['lon'],n['lat']],p) for p in restricted):blocked.add(ref)
    graph_nodes={};edges=[];rejected=Counter();ways_used=set()
    for w in source['ways']:
        t=w['tags'];hw=t.get('highway')
        if hw not in ALLOWED and not (hw in {'cycleway','residential','service','living_street'} and t.get('foot') in PERMITTED):continue
        if not permitted(t) or t.get('indoor')=='yes' or t.get('area')=='yes':rejected['access_or_non_linear']+=1;continue
        for a,b in zip(w['nodes'],w['nodes'][1:]):
            a,b=str(a),str(b)
            if a not in nodes or b not in nodes:rejected['missing_node']+=1;continue
            if a in blocked or b in blocked:rejected['restricted_or_barrier']+=1;continue
            na,nb=nodes[a],nodes[b];pa=[na['lon'],na['lat']];pb=[nb['lon'],nb['lat']]
            if not all(box[0]<=p[0]<=box[2] and box[1]<=p[1]<=box[3] for p in [pa,pb]):continue
            if any(inside([(pa[0]+pb[0])/2,(pa[1]+pb[1])/2],p) for p in restricted):continue
            metres=distance(pa,pb)
            if metres<=0:continue
            for ref in [a,b]:
                if ref not in graph_nodes:graph_nodes[ref]=len(graph_nodes)
            direction=1 if t.get('oneway:foot')=='yes' else -1 if t.get('oneway:foot')=='-1' else 0
            edges.append([graph_nodes[a],graph_nodes[b],metres,hw=='steps',w['id'],direction]);ways_used.add(w['id'])
    output={'version':1,'area':'expo','bbox':box,'collectedAt':source['collectedAt'],'source':'OpenStreetMap contributors','license':'ODbL-1.0',
      'profile':'Mapped pedestrian ways; explicit foot permission on shared roads; unknown gates, conditional access and school/university grounds excluded. No claim of current or step-free access.',
      'nodes':[[int(ref),nodes[ref]['lon'],nodes[ref]['lat']] for ref in graph_nodes],'edges':edges,'obstacles':obstacles,
      'metadata':{'ways':len(ways_used),'rejected':dict(rejected),'sourceSha256':hashlib.sha256(json.dumps(source,sort_keys=True,separators=(',',':')).encode()).hexdigest()}}
    return output
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--from-source',type=Path);args=parser.parse_args()
    if args.from_source:source=json.loads(args.from_source.read_text())
    else:
        metadata=json.loads((ROOT/'data/metadata.json').read_text());root=ET.parse(ROOT/'data/cache-expo.osm').getroot()
        nodes=[];ways=[]
        for n in root.findall('node'):
            nodes.append({'id':int(n.attrib['id']),'lon':float(n.attrib['lon']),'lat':float(n.attrib['lat']),'tags':{t.attrib['k']:t.attrib['v'] for t in n.findall('tag') if t.attrib['k'] in KEYS}})
        for w in root.findall('way'):
            t={t.attrib['k']:t.attrib['v'] for t in w.findall('tag') if t.attrib['k'] in KEYS}
            if t:ways.append({'id':int(w.attrib['id']),'nodes':[int(n.attrib['ref']) for n in w.findall('nd')],'tags':t})
        used={r for w in ways for r in w['nodes']};nodes=[n for n in nodes if n['id'] in used]
        source={'bbox':metadata['areas']['expo'],'collectedAt':metadata['collectedAt'],'nodes':nodes,'ways':ways,'sourceUrl':'https://www.openstreetmap.org/api/0.6/map','license':'ODbL-1.0'}
        (ROOT/'data/walking-source.json').write_text(json.dumps(source,ensure_ascii=False,separators=(',',':'))+'\n')
    graph=build(source);(ROOT/'data/walking-graph.json').write_text(json.dumps(graph,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'nodes':len(graph['nodes']),'edges':len(graph['edges']),'obstacles':len(graph['obstacles']),**graph['metadata']},indent=2))
if __name__=='__main__':main()
