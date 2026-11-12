import {readFile,writeFile} from 'node:fs/promises';

const root=new URL('../visual-qa/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8').then(JSON.parse);
const [before,after,high]=await Promise.all(['before-native/metrics.json','after/metrics.json','after-high/metrics.json'].map(read));
const labels=[['塔臺・日間','Tower day'],['塔臺・夜間','Tower night'],['登機門近景','Aircraft at gate'],['滑行','Aircraft taxi'],['起飛滑跑','Takeoff roll'],['最後進場','Landing approach'],['第一航廈','Terminal 1'],['第二航廈','Terminal 2'],['塔臺外觀','Tower exterior'],['機場鳥瞰','Airport aerial'],['雨天','Rain'],['傍晚','Evening']];
const notes=[
 '修復天花板重疊與遠景深度條紋，保留原有工作席與視點。',
 '柔化燈具光點，增加航廈窗光與停機坪照明。',
 '平滑機身與貼圖接縫，修正廊橋對接與輪胎接地。',
 '增加發動機、起落架與翼尖細節，保留原有滑行路徑。',
 '改善跑道標線、磨耗與機體陰影，起飛狀態未變更。',
 '改善機身輪廓與大氣遠景，保留原有進場姿態。',
 '加入第一航廈懸垂曲線屋頂、柱列與立面節奏。',
 '第二航廈採用分層平屋頂、天窗與鋼構，區別第一航廈。',
 '依 ANWS 參考呈現西側折面金屬與東側白色曲面。',
 '保留第三航廈施工區，補足海岸、田地及概化工業建築。',
 '以雨絲、濕地粗糙度與天空反射呈現雨天；天氣邏輯不變。',
 '調整傍晚曝光、霧化遠景與燈光過渡。'
];
const rows=after.results.map((result,i)=>({id:result.fixture.name,title:labels[i][0],english:labels[i][1],note:notes[i],before:before.results.find(r=>r.fixture.name===result.fixture.name),after:result,high:high.results.find(r=>r.fixture.name===result.fixture.name)}));
const comparison={date:'2026-09-07',viewport:after.viewport,renderer:after.results[0].renderer,method:'Paused seed 182731 fixtures, 1440x900 CSS pixels, DPR 1. Each result is the median of 12 RAF intervals, not a sustained gameplay benchmark. Baseline always uses Medium; High changes internal resolution.',errors:[...before.errors,...after.errors,...high.errors],rows};
await writeFile(new URL('comparison.json',root),JSON.stringify(comparison,null,2));
const table=['| View | Before Medium ms | After Medium ms | After High ms | Draw calls before → after Medium |','| --- | ---: | ---: | ---: | ---: |',...rows.map(r=>`| ${r.english} | ${r.before.medianFrameMs.toFixed(1)} | ${r.after.medianFrameMs.toFixed(1)} | ${r.high.medianFrameMs.toFixed(1)} | ${r.before.calls} → ${r.after.calls} |`)];
await writeFile(new URL('performance-table.md',root),table.join('\n')+'\n');
const data=JSON.stringify(comparison).replaceAll('<','\\u003c');
await writeFile(new URL('review.html',root),`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>桃園塔臺 — 畫面修復比較</title>
<style>
:root{color-scheme:dark;font-family:system-ui,"Microsoft JhengHei",sans-serif;background:#101b24;color:#e5edf1}*{box-sizing:border-box}body{margin:0}main{max-width:1488px;margin:auto;padding:32px 24px}header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.eyebrow{font:12px ui-monospace,monospace;letter-spacing:2px;color:#7ccbb8}h1{font-size:clamp(24px,3vw,36px);font-weight:550;letter-spacing:.04em;margin:8px 0}p{color:#aebec9;line-height:1.7;margin:0;font-size:14px}.tag{border:1px solid #35514f;color:#8fd5c0;border-radius:24px;padding:8px 14px;font-size:12px;white-space:nowrap}.toolbar{display:flex;gap:20px;align-items:end;margin-bottom:16px;flex-wrap:wrap}label{display:grid;gap:7px;font-size:12px;color:#aebec9}select,button{background:#1c2d3a;color:#e5edf1;border:1px solid #39505e;border-radius:7px;font:inherit;padding:10px 14px}select{min-width:235px;font-size:14px}button{cursor:pointer}button:hover{background:#2b4353}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #8fe3c5;outline-offset:3px}.spacer{flex:1}#stage{position:relative;aspect-ratio:8/5;background:#17232b;border:1px solid #39505e;border-radius:10px;overflow:hidden;--split:50%}#stage img{display:block;position:absolute;width:100%;height:100%;object-fit:contain}#new{clip-path:inset(0 0 0 var(--split))}.divider{position:absolute;top:0;bottom:0;left:var(--split);width:2px;background:#c3e8df;pointer-events:none}.divider:after{content:'↔';position:absolute;top:50%;transform:translate(-50%,-50%);background:#16372f;border:1px solid #a3d9c8;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;color:white}.stamp{position:absolute;top:16px;background:#101b24dd;border:1px solid #70869766;border-radius:5px;padding:8px 12px;font:12px ui-monospace,monospace;pointer-events:none}.stamp.old{left:16px}.stamp.new{right:16px;color:#a1edcc}#slider{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}.control{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:13px 0 24px}.control p{font-size:12px}.control button{font-size:12px;padding:8px 12px}.details{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:16px}.detail{border-top:1px solid #314452;padding:16px 0}h2{font-size:17px;font-weight:500;margin:0 0 8px}.number{font-size:24px;color:#e5edf1;font-variant-numeric:tabular-nums}.small{font-size:12px;color:#93a7b6}.note{margin-top:22px;background:#172833;padding:18px;border-radius:8px}.note p{font-size:12px}a{color:#92d4c3}footer{margin-top:24px;display:flex;gap:24px;flex-wrap:wrap;font-size:12px}@media(max-width:700px){main{padding:20px 12px}header{display:block}.tag{display:inline-block;margin-top:12px}.details{grid-template-columns:1fr 1fr}.detail:first-child{grid-column:span 2}.spacer{display:none}.toolbar{gap:12px}select{min-width:180px}.stamp{font-size:10px;padding:5px;top:8px}.stamp.old{left:8px}.stamp.new{right:8px}.control{flex-wrap:wrap}}
</style></head><body><main>
<header><div><div class="eyebrow">RCTP / TPE · VISUAL UPDATE · 2026.09.07</div><h1>桃園塔臺・畫面修復比較</h1><p>12 組固定視角，逐項檢查幾何、材質與光影。</p></div><div class="tag">11 個非渲染來源檔保持一致</div></header>
<div class="toolbar"><label>觀察視角<select id="view" aria-label="觀察視角"></select></label><label>更新版本畫質<select id="quality" aria-label="更新版本畫質"><option value="after">Medium · 標準</option><option value="high">High · 更高解析度</option></select></label><div class="spacer"></div><button id="previous" aria-label="上一個視角">← 上一個</button><button id="next" aria-label="下一個視角">下一個 →</button></div>
<div id="stage"><img id="old" alt="更新前"><img id="new" alt="更新後"><div class="divider"></div><div class="stamp old">BEFORE · MEDIUM</div><div id="newStamp" class="stamp new">AFTER · MEDIUM</div><input id="slider" aria-label="前後畫面分隔位置，0 為全更新後，100 為全更新前" type="range" min="0" max="100" value="50"></div>
<div class="control"><p>拖曳分隔線，或以方向鍵微調。截圖為遊戲實際輸出；檢查時隱藏 HUD。</p><div><button data-split="100">全部更新前</button> <button data-split="50">並列比較</button> <button data-split="0">全部更新後</button></div></div>
<div class="details"><div class="detail"><h2 id="title"></h2><p id="note"></p></div><div class="detail"><h2>更新前 · Medium</h2><div class="number" id="oldMetric"></div><p class="small" id="oldCalls"></p></div><div class="detail"><h2 id="newLabel">更新後 · Medium</h2><div class="number" id="newMetric"></div><p class="small" id="newCalls"></p></div></div>
<div class="note"><p>量測環境：Intel UHD Graphics 730 / Chrome / 1440 × 900 / DPR 1。每個值為 12 個 RAF 間隔的中位數；屬於短時間、暫停情境的取樣，不能代表長時間遊玩或所有 GPU 的幀率。High 使用 1944 × 1215 內部解析度；更新前均為 Medium。天氣、相機與亂數種子一致。建築及航空公司塗裝為有參考來源的程序化近似，並非測繪模型或精確官方標誌。</p></div>
<footer><a href="../VISUAL_CHANGELOG.md">修復與驗證紀錄</a><a href="../VISUAL_REFERENCES.md">視覺參考來源</a><a href="comparison.json">原始比較資料</a><a href="http://127.0.0.1:4173">開啟本機遊戲</a></footer>
</main><script>
const data=${data};const $=id=>document.getElementById(id),view=$('view'),quality=$('quality');data.rows.forEach((r,i)=>view.add(new Option(String(i+1).padStart(2,'0')+' · '+r.title,r.id)));view.selectedIndex=2;
function split(value){$('slider').value=value;$('stage').style.setProperty('--split',value+'%');}function update(){const r=data.rows[view.selectedIndex],q=quality.value,b=r.before,a=r[q],label=q==='high'?'High':'Medium';$('old').src='before-native/'+r.id+'.png';$('new').src=(q==='high'?'after-high':'after')+'/'+r.id+'.png';$('old').alt=r.title+'，更新前 Medium';$('new').alt=r.title+'，更新後 '+label;$('title').textContent=r.title+' / '+r.english;$('note').textContent=r.note;$('newStamp').textContent='AFTER · '+label.toUpperCase();$('newLabel').textContent='更新後 · '+label;for(const [key,m]of [['old',b],['new',a]]){$(key+'Metric').textContent=m.medianFrameMs.toFixed(1)+' ms';$(key+'Calls').textContent=m.calls+' draw calls · '+m.width+' × '+m.height;}}
view.addEventListener('change',update);quality.addEventListener('change',update);$('slider').addEventListener('input',e=>split(e.target.value));$('previous').onclick=()=>{view.selectedIndex=(view.selectedIndex+data.rows.length-1)%data.rows.length;update();};$('next').onclick=()=>{view.selectedIndex=(view.selectedIndex+1)%data.rows.length;update();};document.querySelectorAll('[data-split]').forEach(button=>button.onclick=()=>split(button.dataset.split));update();
</script></body></html>`);
console.log('Wrote 12-view review.html, comparison.json and performance-table.md.');
