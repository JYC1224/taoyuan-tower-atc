"""Extract the mapped tower-campus footprints from locally downloaded OSM XML tiles.

Only ways and nodes last edited before the simulation reference date are used.
This is not a historical OSM snapshot: later changes may have removed features.
"""
import json, math, pathlib, xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
TILES = ROOT / 'tmp/nose-roads-research/osm-api'
WANTED = {758856658, 758856659, 758856660, 758856661, 758856662, 758856663}
CUTOFF = '2026-09-06T04:00:00Z'
nodes, ways = {}, {}
for path in sorted(TILES.glob('tile-*.xml')):
    for _, element in ET.iterparse(path, events=('end',)):
        if element.tag == 'node':
            key = int(element.get('id'))
            item = (int(element.get('version', '0')), element.get('timestamp', ''), float(element.get('lat')), float(element.get('lon')))
            if key not in nodes or item[0] > nodes[key][0]: nodes[key] = item
        elif element.tag == 'way' and int(element.get('id')) in WANTED:
            key = int(element.get('id'))
            item = {'id': key, 'version': int(element.get('version', '0')), 'timestamp': element.get('timestamp', ''),
                    'nodes': [int(n.get('ref')) for n in element.findall('nd')],
                    'tags': {t.get('k'): t.get('v') for t in element.findall('tag')}}
            if key not in ways or item['version'] > ways[key]['version']: ways[key] = item
        if element.tag in ('node', 'way', 'relation'): element.clear()
if set(ways) != WANTED: raise RuntimeError(f'Missing ways: {WANTED-set(ways)}')
heading = math.radians(49.08)
features = []
for way in sorted(ways.values(), key=lambda w:w['id']):
    if way['timestamp'] > CUTOFF: raise RuntimeError(f'Way {way["id"]} was changed after reference date')
    points=[]
    for ref in way['nodes']:
        _, timestamp, lat, lon = nodes[ref]
        if timestamp > CUTOFF: raise RuntimeError(f'Node {ref} was changed after reference date')
        north=(lat-25.08369583333333)*111132
        east=(lon-121.22971388888888)*111320*math.cos(math.radians(25.08369583333333))
        points.append([round(east*math.sin(heading)+north*math.cos(heading),2), round(east*math.cos(heading)-north*math.sin(heading)-760,2)])
    features.append({**way, 'points': points})
out = {'source':'OpenStreetMap contributors, ODbL 1.0', 'referenceDate':'2026-09-06', 'note':'Current map objects whose ways and nodes predate the reference date; not a complete historical snapshot. Heights and architectural details are estimates.', 'features':features}
encoded=json.dumps(out, ensure_ascii=False, indent=2)+'\n'
(ROOT/'src/data/terminalCore.json').write_text(encoded, encoding='utf-8')
(ROOT/'public/assets/geography/terminal-core-osm-source.json').write_text(encoded, encoding='utf-8')
print(f'Extracted {len(features)} mapped tower-campus footprints')
