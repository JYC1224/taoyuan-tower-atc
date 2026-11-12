"""Resample public Mapzen Terrarium terrain tiles onto the simulator's local grid.

Run with --download to retrieve and cache the tiles; otherwise use the local cache.
Heights are for visual scenery, not flight operations or navigation.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image
import hashlib, json, math, sys, urllib.request

ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'tmp/terrain-source'
CACHE.mkdir(parents=True,exist_ok=True)
ZOOM=10
MIN_X,MAX_X,MIN_Z,MAX_Z,STEP=-64000,64000,-40000,80000,400
LAT,LON=25.08369583333333,121.22971388888888
HEADING=math.radians(49.08)
N=2**ZOOM

def lonlat(x,z):
    z+=760
    east=x*math.sin(HEADING)+z*math.cos(HEADING)
    north=x*math.cos(HEADING)-z*math.sin(HEADING)
    return LON+east/(111320*math.cos(math.radians(LAT))),LAT+north/111132

def pixels(lon,lat):
    x=(lon+180)/360*N*256
    y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*N*256
    return x,y

corners=[pixels(*lonlat(x,z)) for x in (MIN_X,MAX_X) for z in (MIN_Z,MAX_Z)]
min_tx=math.floor(min(x for x,y in corners)/256)
max_tx=math.floor(max(x for x,y in corners)/256)
min_ty=math.floor(min(y for x,y in corners)/256)
max_ty=math.floor(max(y for x,y in corners)/256)
keys=[(x,y) for x in range(min_tx,max_tx+1) for y in range(min_ty,max_ty+1)]

def fetch(key):
    x,y=key
    path=CACHE/f'{ZOOM}-{x}-{y}.png'
    url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png'
    if not path.exists():
        if '--download' not in sys.argv: raise RuntimeError(f'Missing {path}; rerun with --download')
        with urllib.request.urlopen(url,timeout=45) as response:
            payload=response.read()
        path.write_bytes(payload)
    with Image.open(path) as im:
        image=im.convert('RGB')
        if image.size!=(256,256): raise RuntimeError(f'Unexpected tile dimensions: {path}')
        image.load()
    return key,(image,{'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})

with ThreadPoolExecutor(max_workers=6) as pool: tiles=dict(pool.map(fetch,keys))
def height(x,z):
    px,py=pixels(*lonlat(x,z)); tx=int(px//256);ty=int(py//256)
    r,g,b=tiles[(tx,ty)][0].getpixel((int(px)%256,int(py)%256))
    return round(r*256+g+b/256-32768)

rows=[]
for z in range(MIN_Z,MAX_Z+1,STEP):
    rows.extend(height(x,z) for x in range(MIN_X,MAX_X+1,STEP))
output={'minX':MIN_X,'minZ':MIN_Z,'step':STEP,'width':(MAX_X-MIN_X)//STEP+1,'height':(MAX_Z-MIN_Z)//STEP+1,'heights':rows}
(ROOT/'src/data/taoyuanTerrain.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
manifest={'dataset':'Mapzen Terrain Tiles / Terrarium','source':'https://registry.opendata.aws/terrain-tiles/','retrieved':'2026-11-10','zoom':ZOOM,'processing':'nearest tile pixel to 400m local grid; runtime visual flattening and clipping near airport and ocean','vertical':'Metres above source datum, rounded to whole metres','tiles':[tiles[k][1] for k in keys]}
(ROOT/'public/assets/geography/taoyuan-terrain-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'{len(keys)} tiles, {len(rows)} samples, elevation range {min(rows)}..{max(rows)}m')
