"""Generate local scenery from a deliberately conservative OSM API extract.

Run after downloading the 12 documented map tiles. No network access is needed.
Only features whose current way *and every node* predate the scenario are used:
this is an incomplete subset, not a reconstruction of a historical OSM database.
"""
from collections import Counter
from pathlib import Path
import hashlib
import json
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
TILES = ROOT / 'tmp/nose-roads-research/osm-api'
CUTOFF = '2026-09-06T04:00:00Z'
LAT0, LON0, HEADING = 25.08369583333333, 121.22971388888888, math.radians(49.08)
ROADS = {'motorway','motorway_link','trunk','trunk_link','primary','primary_link',
         'secondary','secondary_link','tertiary','tertiary_link','unclassified',
         'residential','living_street','service'}
RELEVANT = {'name','name:en','ref','highway','aeroway','amenity','parking','access',
            'vehicle','motor_vehicle','service','lanes','width','oneway','bridge',
            'tunnel','covered','layer','location','surface'}

def project(lat, lon):
    north = (lat-LAT0)*111132
    east = (lon-LON0)*111320*math.cos(math.radians(LAT0))
    return [round(east*math.sin(HEADING)+north*math.cos(HEADING), 2),
            round(east*math.cos(HEADING)-north*math.sin(HEADING)-760, 2)]

def newer(table, element):
    key = element.attrib['id']
    if key not in table or int(element.attrib['version']) > int(table[key].attrib['version']):
        table[key] = element

nodes, ways, manifest = {}, {}, []
files = sorted(TILES.glob('tile-*.xml'))
if len(files) != 12:
    raise SystemExit('Expected 12 OSM API tiles in ' + str(TILES))
for path in files:
    tile = {'tile':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    manifest.append(tile)
    for _, el in ET.iterparse(path, events=('end',)):
        if el.tag == 'bounds': tile['bounds'] = dict(el.attrib)
        elif el.tag == 'node': newer(nodes, el)
        elif el.tag == 'way': newer(ways, el)

features, source, counts = [], [], Counter()
for key, way in sorted(ways.items(), key=lambda item:int(item[0])):
    if way.attrib['timestamp'] > CUTOFF: continue
    tags = {t.attrib['k']:t.attrib['v'] for t in way.findall('tag')}
    if tags.get('access') in {'private','no'} or tags.get('motor_vehicle') in {'private','no'} or tags.get('vehicle') in {'private','no'}: continue
    if tags.get('highway') in ROADS:
        if tags.get('service') in {'emergency_access','driveway','parking_aisle'}: continue
        kind = 'road'
    elif tags.get('aeroway') == 'apron': kind = 'apron'
    elif tags.get('amenity') == 'parking': kind = 'parking'
    else: continue
    refs = [nd.attrib['ref'] for nd in way.findall('nd')]
    if len(refs) < 2 or any(ref not in nodes or nodes[ref].attrib['timestamp'] > CUTOFF for ref in refs): continue
    if kind != 'road' and (len(refs) < 4 or refs[0] != refs[-1]): continue
    coords = [project(float(nodes[ref].attrib['lat']),float(nodes[ref].attrib['lon'])) for ref in refs]
    # Preserve whole intersecting features; renderer clips individual road segments.
    if max(p[0] for p in coords) < -2800 or min(p[0] for p in coords) > 2800 or max(p[1] for p in coords) < -1450 or min(p[1] for p in coords) > 1450: continue
    selected = {k:tags[k] for k in sorted(RELEVANT & tags.keys())}
    raw_nodes = [{'id':int(ref),'lat':float(nodes[ref].attrib['lat']),'lon':float(nodes[ref].attrib['lon']),
                  'version':int(nodes[ref].attrib['version']),'timestamp':nodes[ref].attrib['timestamp']} for ref in refs]
    common = {'id':int(key),'version':int(way.attrib['version']),'timestamp':way.attrib['timestamp'],
              'kind':kind,'tags':selected}
    features.append({**common,'points':coords})
    source.append({**common,'nodes':raw_nodes})
    counts[kind] += 1

metadata = {'source':'https://api.openstreetmap.org/api/0.6/map',
            'attribution':'© OpenStreetMap contributors',
            'license':'https://opendatacommons.org/licenses/odbl/1-0/',
            'copyright':'https://www.openstreetmap.org/copyright',
            'retrieved':'2026-10-28','unchangedBefore':CUTOFF,
            'method':'Current objects whose way and every node were last edited before the cutoff. Incomplete subset, not a historical snapshot.',
            'projection':'RCTP AIP tangent plane, metres; visual only; no aircraft route changes.'}
output = ROOT / 'src/data/landside.json'
output.write_text(json.dumps({'metadata':metadata,'features':features},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
public = ROOT / 'public/assets/geography'
public.mkdir(parents=True,exist_ok=True)
(public / 'taoyuan-osm-source.json').write_text(json.dumps({'metadata':metadata,'features':source},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
(public / 'taoyuan-osm-manifest.json').write_text(json.dumps({'metadata':metadata,'counts':counts,'tiles':manifest},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'counts':counts,'runtimeBytes':output.stat().st_size,'sourceBytes':(public/'taoyuan-osm-source.json').stat().st_size},ensure_ascii=False))
