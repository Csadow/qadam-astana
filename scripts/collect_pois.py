#!/usr/bin/env python3
"""Reproducible Astana OSM collection. stdlib only; no fabricated venue facts."""
import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BBOX = '51.055,71.365,51.19,71.49'
QUERY = f'''[out:json][timeout:90];(
 nwr["amenity"~"^(cafe|restaurant|library|arts_centre)$"]({BBOX});
 nwr["tourism"~"^(museum|gallery|attraction|viewpoint|artwork)$"]({BBOX});
 nwr["leisure"~"^(park|garden|playground)$"]({BBOX});
 nwr["shop"="mall"]({BBOX});
);out center tags;'''
MAP_QUERY = f'''[out:json][timeout:90];(
 way["highway"~"^(primary|secondary|tertiary|residential|pedestrian)$"]({BBOX});
 way["waterway"="river"]({BBOX});
 way["natural"="water"]({BBOX});
 way["leisure"="park"]({BBOX});
);out geom;'''
ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
AREAS = {
    'expo': (71.392,51.078,71.423,51.104),
    'baiterek': (71.415,51.118,71.445,51.140),
    'museum': (71.455,51.110,71.483,51.133),
    'river': (71.415,51.150,71.444,51.175),
    'khan': (71.390,51.123,71.418,51.146),
}

def collect_map_api():
    """Small, sequential official OSM bounding-box downloads when Overpass is unavailable."""
    nodes, objects, fetched_at = {}, {}, {}
    for name, box in AREAS.items():
        path = ROOT/'data'/f'cache-{name}.osm'
        if not path.exists():
            url='https://www.openstreetmap.org/api/0.6/map?bbox='+','.join(map(str,box))
            req=urllib.request.Request(url,headers={'User-Agent':'Qadam-ArcSolo/1.0'})
            with urllib.request.urlopen(req,timeout=90) as response: raw=response.read()
            path.write_bytes(raw)
            time.sleep(1)
        root=ET.parse(path).getroot()
        fetched_at[name]=dt.datetime.fromtimestamp(path.stat().st_mtime,dt.timezone.utc).isoformat()
        for e in root:
            if e.tag not in ('node','way'): continue
            tags={t.attrib['k']:t.attrib['v'] for t in e.findall('tag')}
            obj={'type':e.tag,'id':int(e.attrib['id']),'tags':tags,'timestamp':e.attrib.get('timestamp')}
            if e.tag=='node':
                obj.update(lat=float(e.attrib['lat']),lon=float(e.attrib['lon']))
                nodes[obj['id']]={'lat':obj['lat'],'lon':obj['lon']}
            else: obj['refs']=[int(n.attrib['ref']) for n in e.findall('nd')]
            objects[(e.tag,obj['id'])]=obj
        print(f'Collected {name}',flush=True)
    pois, geometry=[],[]
    for obj in objects.values():
        t=obj['tags']
        if obj['type']=='way':
            geom=[nodes[r] for r in obj.pop('refs') if r in nodes]
            if not geom: continue
            obj['center']={'lat':sum(p['lat'] for p in geom)/len(geom),'lon':sum(p['lon'] for p in geom)/len(geom)}
            if t.get('highway') in ('primary','secondary','tertiary','residential','pedestrian') or t.get('waterway')=='river' or t.get('natural')=='water' or t.get('leisure')=='park':
                geometry.append({**obj,'geometry':geom})
        if (t.get('amenity') in ('cafe','restaurant','library','arts_centre') or t.get('tourism') in ('museum','gallery','attraction','viewpoint','artwork') or t.get('leisure') in ('park','garden','playground') or t.get('shop')=='mall'):
            pois.append(obj)
    return {'elements':pois,'qadamCollectedAt':min(fetched_at.values()),'qadamAreaFetchedAt':fetched_at}, {'elements':geometry}

def fetch(query):
    errors = []
    for endpoint in ENDPOINTS:
        try:
            req = urllib.request.Request(endpoint, urllib.parse.urlencode({'data':query}).encode(),
                {'User-Agent':'Qadam-ArcSolo-hackathon/1.0', 'Content-Type':'application/x-www-form-urlencoded'})
            with urllib.request.urlopen(req, timeout=120) as response:
                raw = response.read()
            data = json.loads(raw)
            if data.get('remark') or not data.get('elements'):
                raise ValueError(data.get('remark', 'Empty response'))
            return data, endpoint
        except Exception as error:
            errors.append(f'{endpoint}: {error}')
    raise RuntimeError('; '.join(errors))

def category(tags):
    if tags.get('amenity') in ('cafe', 'restaurant'): return tags['amenity']
    if tags.get('leisure') in ('park', 'garden', 'playground'): return tags['leisure']
    if tags.get('shop') == 'mall': return 'mall'
    if tags.get('amenity') == 'library': return 'library'
    return tags.get('tourism', 'arts_centre')

def normalize(raw, collected):
    result = []
    for e in raw['elements']:
        t = e.get('tags', {})
        if any(t.get(k) in ('yes','1') for k in ('disused','abandoned','demolished')): continue
        if t.get('access') in ('private', 'no'): continue
        name = t.get('name') or t.get('name:en') or t.get('name:ru')
        if not name: continue
        pos = e.get('center', e)
        if 'lat' not in pos or 'lon' not in pos: continue
        cat = category(t)
        summary = 'Mapped category: '+cat.replace('_',' ')+'.'
        if t.get('cuisine'): summary+=' Cuisine tag: '+t['cuisine'].replace(';',', ')+'.'
        if t.get('addr:street'): summary+=' Street: '+t['addr:street']+'.'
        original_description=t.get('description') or t.get('description:en') or ''
        result.append({
            'id':f"osm-{e['type']}-{e['id']}", 'name':name,
            'names':{lang:t.get('name:'+lang, name) for lang in ['en','ru','kk']},
            'lat':pos['lat'], 'lon':pos['lon'], 'category':cat,
            'description':original_description or summary,
            'descriptionOrigin':'osm_description' if original_description else 'summary_of_osm_tags',
            'tags':t, 'hours':t.get('opening_hours'),
            'wheelchair':t.get('wheelchair','unknown'),
            'website':t.get('website') or t.get('contact:website'),
            'phone':t.get('phone') or t.get('contact:phone'),
            'source':{'name':'OpenStreetMap','url':f"https://www.openstreetmap.org/{e['type']}/{e['id']}",
                'collectedAt':collected, 'lastEditedAt':e.get('timestamp'), 'license':'ODbL-1.0'},
        })
    # Collapse duplicate representations of the same named feature within ~45 m.
    deduped = []
    def aliases(p):
        return {re.sub(r'[^\w]','', n.casefold().replace('astana','').replace('астана','')) for n in [p['name'],*p['names'].values()]}
    for p in sorted(result, key=lambda p: (-len(p['tags']), p['id'])):
        if any(aliases(p) & aliases(q) and p['category'] == q['category']
               and abs(p['lat']-q['lat']) < .0004 and abs(p['lon']-q['lon']) < .0006 for q in deduped): continue
        deduped.append(p)
    return sorted(deduped, key=lambda p:p['id'])

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, separators=(',',':'))+'\n', encoding='utf-8')
    tmp.replace(path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--from-raw', type=Path, help='Rebuild without network using a previously collected snapshot')
    parser.add_argument('--map', action='store_true', help='Also collect static street and water geometry')
    parser.add_argument('--osm-api', action='store_true', help='Collect five demo areas through the official OSM map API')
    args = parser.parse_args()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    map_data = None
    if args.osm_api:
        raw, map_data = collect_map_api()
        now=raw['qadamCollectedAt']
        endpoint='https://www.openstreetmap.org/api/0.6/map'
        raw.update(qadamCollectedAt=now,qadamEndpoint=endpoint,qadamAreas=AREAS)
        write_json(ROOT/'data/raw-osm.json',raw)
    elif args.from_raw:
        raw = json.loads(args.from_raw.read_text())
        now = raw.get('qadamCollectedAt', now)
        endpoint = raw.get('qadamEndpoint','local snapshot')
    else:
        raw, endpoint = fetch(QUERY)
        raw['qadamCollectedAt'] = now
        raw['qadamEndpoint'] = endpoint
        write_json(ROOT/'data/raw-osm.json', raw)
    pois = normalize(raw, now)
    if len(pois) < 10: raise ValueError('Refusing to replace dataset with fewer than 10 named POIs')
    write_json(ROOT/'data/pois.json', pois)
    metadata = {'collectedAt':now, 'source':'OpenStreetMap contributors', 'license':'ODbL-1.0',
        'attributionUrl':'https://www.openstreetmap.org/copyright','endpoint':endpoint,'bbox':BBOX,
        'query':QUERY if not raw.get('qadamAreas') else None,'areas':raw.get('qadamAreas'), 'rawElements':len(raw['elements']),'poiCount':len(pois),
        'sha256':hashlib.sha256((ROOT/'data/pois.json').read_bytes()).hexdigest(),
        'coverage':{k:sum(bool(p.get(k)) for p in pois) for k in ['hours','description','website','phone']},
        'wheelchairKnown':sum(p['wheelchair']!='unknown' for p in pois),
        'originalDescriptions':sum(p['descriptionOrigin']=='osm_description' for p in pois),
        'tagSummaries':sum(p['descriptionOrigin']=='summary_of_osm_tags' for p in pois)}
    write_json(ROOT/'data/metadata.json', metadata)
    if args.map:
        time.sleep(2)
        geo = map_data if map_data else fetch(MAP_QUERY)[0]
        features = []
        for e in geo['elements']:
            if not e.get('geometry'): continue
            tags = e.get('tags',{})
            kind = 'water' if tags.get('natural')=='water' else 'river' if tags.get('waterway') else 'park' if tags.get('leisure') else tags.get('highway','road')
            features.append({'kind':kind,'name':tags.get('name',''),
                'points':[[round(p['lon'],6),round(p['lat'],6)] for p in e['geometry']]})
        write_json(ROOT/'data/map.json', features)
    print(json.dumps(metadata, ensure_ascii=False, indent=2))

if __name__ == '__main__': main()
