"""Import selected mapped settlements, rivers and major roads for visual scenery."""
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen
import json,math,sys

ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'tmp/regional-osm.json'
QUERY='''[out:json][timeout:120];(
node["place"~"^(city|town|suburb)$"](24.80,120.90,25.40,121.65);
way["highway"~"^(motorway|trunk|primary)$"](24.90,121.00,25.30,121.55);
way["waterway"="river"](24.90,121.00,25.30,121.55);
);out geom;'''
if '--download' in sys.argv:
    request=Request('https://overpass.kumi.systems/api/interpreter',data=urlencode({'data':QUERY}).encode(),headers={'User-Agent':'TaoyuanATCSimulator/1.0 (open visual scenery research)'})
    with urlopen(request,timeout=180) as response: CACHE.write_bytes(response.read())
if not CACHE.exists(): raise RuntimeError('Missing cached response; rerun with --download')
source=json.loads(CACHE.read_text(encoding='utf-8'))
if 'elements' not in source: raise RuntimeError('Invalid Overpass response')
lat0,lon0=25.08369583333333,121.22971388888888
h=math.radians(49.08)
def project(lat,lon):
    n=(lat-lat0)*111132;e=(lon-lon0)*111320*math.cos(math.radians(lat0))
    return [round(e*math.sin(h)+n*math.cos(h)),round(e*math.cos(h)-n*math.sin(h)-760)]
settlements=[];ways=[]
for item in source['elements']:
    tags=item.get('tags',{})
    if item['type']=='node': settlements.append({'id':item['id'],'kind':tags.get('place'),'name':tags.get('name',''),'point':project(item['lat'],item['lon'])})
    elif item['type']=='way' and len(item.get('geometry',[]))>1:
        if tags.get('tunnel') in ('yes','building_passage','culvert') or tags.get('covered')=='yes': continue
        original=[project(p['lat'],p['lon']) for p in item['geometry']]
        # Keep a 30m radial tolerance and preserve endpoints to reduce geometry cost.
        pts=[original[0]]
        for point in original[1:-1]:
            if math.hypot(point[0]-pts[-1][0],point[1]-pts[-1][1])>=30: pts.append(point)
        pts.append(original[-1])
        if not any(6500<math.hypot(*p)<50000 for p in pts): continue
        ways.append({'id':item['id'],'kind':'river' if tags.get('waterway')=='river' else tags.get('highway'),'bridge':tags.get('bridge')=='yes','points':pts})
out={'source':'© OpenStreetMap contributors, ODbL 1.0','retrieved':'2026-11-10','snapshot':source.get('osm3s',{}).get('timestamp_osm_base'),'settlements':settlements,'ways':ways}
encoded=json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n'
(ROOT/'src/data/regionalOSM.json').write_text(encoded,encoding='utf-8')
(ROOT/'public/assets/geography/taoyuan-regional-osm.json').write_text(encoded,encoding='utf-8')
print(f'{len(settlements)} settlements, {len(ways)} surface ways; snapshot {out["snapshot"]}')
