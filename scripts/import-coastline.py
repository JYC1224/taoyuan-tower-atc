"""Project and simplify the connected mainland shoreline from the recorded OSM extract."""
from collections import defaultdict
from pathlib import Path
import json
import math
import shutil

root = Path(__file__).resolve().parent.parent
source = root / 'tmp/taoyuan-coast-source.json'
data = json.loads(source.read_text(encoding='utf-8'))
ways = [w for w in data['elements'] if len(w.get('nodes', [])) >= 2 and len(w.get('geometry', [])) == len(w['nodes'])]
ends = defaultdict(list)
for i, w in enumerate(ways):
    ends[w['nodes'][0]].append(i)
    ends[w['nodes'][-1]].append(i)

# Mainland is the largest connected endpoint component; closed offshore islands are separate.
seen, components = set(), []
for i in range(len(ways)):
    if i in seen:
        continue
    pending, component = [i], []
    seen.add(i)
    while pending:
        j = pending.pop()
        component.append(j)
        for node in (ways[j]['nodes'][0], ways[j]['nodes'][-1]):
            for k in ends[node]:
                if k not in seen:
                    seen.add(k)
                    pending.append(k)
    components.append(component)
component = max(components, key=lambda c: sum(len(ways[i]['nodes']) for i in c))
included = set(component)
boundary = [n for n, indices in ends.items() if len([i for i in indices if i in included]) == 1]
if len(boundary) != 2:
    raise ValueError('Expected one open mainland shoreline with two endpoints')
node, used, coords = boundary[0], set(), []
while True:
    options = [i for i in ends[node] if i in included and i not in used]
    if not options:
        break
    if len(options) != 1:
        raise ValueError('Ambiguous mainland coastline')
    i = options[0]
    used.add(i)
    way = ways[i]
    forward = way['nodes'][0] == node
    geom = way['geometry'] if forward else list(reversed(way['geometry']))
    coords.extend(geom if not coords else geom[1:])
    node = way['nodes'][-1] if forward else way['nodes'][0]
if len(used) != len(component):
    raise ValueError('Coastline component was not fully connected')

heading = math.radians(49.08)
def project(p):
    north = (p['lat'] - 25.08369583333333) * 111132
    east = (p['lon'] - 121.22971388888888) * 111320 * math.cos(math.radians(25.08369583333333))
    return [east * math.sin(heading) + north * math.cos(heading), east * math.cos(heading) - north * math.sin(heading) - 760]

points = [project(p) for p in coords]
if points[0][0] > points[-1][0]:
    points.reverse()

def simplify(points, tolerance):
    keep = {0, len(points) - 1}
    pending = [(0, len(points) - 1)]
    while pending:
        start, end = pending.pop()
        ax, az = points[start]
        bx, bz = points[end]
        dx, dz = bx - ax, bz - az
        denom = dx * dx + dz * dz
        best, best_index = tolerance * tolerance, None
        for i in range(start + 1, end):
            px, pz = points[i]
            t = max(0, min(1, ((px - ax) * dx + (pz - az) * dz) / denom)) if denom else 0
            error = (px - ax - t * dx) ** 2 + (pz - az - t * dz) ** 2
            if error > best:
                best, best_index = error, i
        if best_index is not None:
            keep.add(best_index)
            pending.extend([(start, best_index), (best_index, end)])
    return [[round(points[i][0], 1), round(points[i][1], 1)] for i in sorted(keep)]

metadata = {'source':'https://overpass.kumi.systems/api/interpreter', 'query':'natural=coastline; bbox 24.65,120.72,25.35,121.65',
            'snapshot':data['osm3s']['timestamp_osm_base'], 'retrieved':'2026-10-28',
            'attribution':'© OpenStreetMap contributors', 'license':'https://www.openstreetmap.org/copyright',
            'scope':'Largest connected mainland coast in the queried area; offshore islands omitted. Visual approximation, not navigation data.',
            'simplificationMetres':18, 'projection':'RCTP AIP tangent plane, metres'}
result = {'metadata':metadata,'points':simplify(points,18)}
(root/'src/data/coastline.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
shutil.copyfile(source,root/'public/assets/geography/taoyuan-coast-source.json')
print(f"Imported {len(used)} coastline ways, {len(points)} source points, {len(result['points'])} simplified points; snapshot {metadata['snapshot']}")
