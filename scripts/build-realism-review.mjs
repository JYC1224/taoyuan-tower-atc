import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Rebuild after npm run build. Images are actual paused game frames, never retouched.
const root=new URL('../',import.meta.url),out=new URL('dist/realism-review/',root);
const read=path=>readFile(new URL(path,root),'utf8').then(JSON.parse);
const [before,after,high,performance]=await Promise.all([
 'visual-qa/realism-before/metrics.json','visual-qa/realism-after/metrics.json',
 'visual-qa/realism-high/metrics.json','realism-qa/performance-final.json'
].map(read));
assert.deepEqual([...before.errors,...after.errors,...high.errors,...performance.errors],[]);
const labels=['塔臺日間','塔臺夜間','登機門近景','滑行','起飛滑跑','最後進場','第一航廈','第二航廈','塔臺外觀','機場鳥瞰','雨天','傍晚','A350 前方近景','B787 前方近景','A350 引擎與機翼'];
const notes=[
 '保留工作席與視點；新增吸音天花板與燈條，減少玻璃遮色。',
 '保留夜間燈光與視線；室內反射及天花板亮度隨日夜變化。',
 '機身新增表面粗糙度、機窗和細縫；廊橋門檻配合機門高度。',
 '機翼改用有厚度的曲面，機翼與發動機細節依視距顯示。',
 '跑道使用實拍瀝青材質，搭配原有標線及輪胎磨耗。',
 '保留原有進場姿態；改善機身漆面、曲面機翼與天空層次。',
 '保留航廈外形，改善立面玻璃、停機坪表面及天空反射。',
 '新增概化屋頂空調與停機坪設施，保留既有航廈幾何。',
 '保留桃園塔臺造型，調整反射、光照與通透度。',
 '地面以多尺度草地變化取代重複圓斑；機場配置與滑行圖保持一致。',
 '保留原有雨絲及天氣；新材質以粗糙度與環境反射回應濕度。',
 '天空、霧與地面反射保留原有日夜與天氣控制。',
 'A350 機鼻與駕駛艙遮罩、翼型厚度、翼尖及引擎外殼近景。',
 'B787 機鼻窗形、曲面翼與後掠外形；航空公司圖樣仍為原創概化。',
 '新增曲面風扇葉片、翼面細節、襟翼整流罩與細微漆面變化。'
];
await mkdir(out,{recursive:true});
const rows=[];
for(const [i,result]of after.results.entries()){
 const id=result.fixture.name;assert(/^[a-z0-9-]+$/.test(id));
 assert(before.results.some(r=>r.fixture.name===id)&&high.results.some(r=>r.fixture.name===id));
 for(const [name,directory]of [['before','realism-before'],['after','realism-after'],['high','realism-high']]){
  await mkdir(new URL(name+'/',out),{recursive:true});
  await copyFile(new URL(`visual-qa/${directory}/${id}.png`,root),new URL(`${name}/${id}.png`,out));
 }
 rows.push({id,title:labels[i],note:notes[i]});
}
assert.equal(rows.length,15);
const data={date:'2026-10-28',viewport:after.viewport,rows,performance,quality:{before:'medium',after:'medium',high:'high'},method:'Seed 182731; paused matching camera, time and weather. HUD hidden only for capture. High uses higher internal resolution. Performance is a separate paired native-GPU test.'};
await writeFile(new URL('comparison.json',out),JSON.stringify(data,null,2)+'\n');
const embedded=JSON.stringify(data).replaceAll('<','\\u003c');
await writeFile(new URL('index.html',out),`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>桃園塔臺・真實度提升比較</title>
<style>
:root{color-scheme:dark;font-family:system-ui,"Microsoft JhengHei",sans-serif;background:#0c1921;color:#e0e9ed}*{box-sizing:border-box}body{margin:0}main{max-width:1488px;margin:auto;padding:32px 24px}header{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:26px}.eyebrow{font:12px ui-monospace,monospace;letter-spacing:2px;color:#8dccbb}h1{font-size:clamp(23px,3vw,35px);font-weight:550;margin:8px 0 12px}p{color:#a8beca;font-size:14px;line-height:1.7;margin:0}.tag{white-space:nowrap;border:1px solid #36534f;color:#a7dacb;border-radius:22px;padding:9px 14px;font-size:12px}.toolbar{display:flex;flex-wrap:wrap;gap:16px;align-items:end;margin-bottom:16px}label{display:grid;gap:7px;color:#a9bdc9;font-size:12px}select,button{background:#192e3b;color:#e2edf1;border:1px solid #385262;border-radius:7px;font:inherit;padding:10px 14px}select{min-width:230px;font-size:14px}button{cursor:pointer}button:hover{background:#294453}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #a3e3cb;outline-offset:3px}.spacer{flex:1}#stage{position:relative;aspect-ratio:8/5;background:#16262f;border:1px solid #3b5361;border-radius:9px;overflow:hidden;--split:50%}#stage img{position:absolute;display:block;width:100%;height:100%;object-fit:contain}#new{clip-path:inset(0 0 0 var(--split))}.line{position:absolute;inset:0 auto 0 var(--split);width:2px;background:#c4e4d9;pointer-events:none}.line:after{content:'↔';position:absolute;top:50%;transform:translate(-50%,-50%);background:#163b32;border:1px solid #b0ddce;border-radius:50%;width:36px;height:36px;display:grid;place-items:center}.stamp{position:absolute;top:16px;background:#0a1a22df;border:1px solid #75929d70;border-radius:5px;padding:7px 12px;font:12px ui-monospace,monospace;pointer-events:none}.old{left:16px}.new{right:16px;color:#a9e9cf}#slider{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}.controls{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0 24px}.controls button{font-size:12px;padding:8px 12px}.controls p{font-size:12px}.detail{border-top:1px solid #2b4351;padding:18px 0}h2{font-weight:500;font-size:18px;margin:0 0 8px}.bench{display:flex;gap:20px;flex-wrap:wrap;margin:16px 0}.metric{background:#162a35;border:1px solid #2c4652;border-radius:8px;padding:14px 18px;min-width:190px}.metric strong{display:block;font-size:22px;font-weight:500;color:#dceae9;margin-top:6px}.metric small{color:#9db6c1;font-size:12px}.note{margin-top:14px;padding:18px;background:#142730;border-radius:8px}.note p{font-size:12px}a{color:#a2dbca}footer{display:flex;gap:24px;flex-wrap:wrap;margin-top:24px;font-size:13px}@media(max-width:700px){main{padding:20px 12px}header{display:block}.tag{display:inline-block;margin-top:12px}.spacer{display:none}select{min-width:180px}.stamp{font-size:10px;top:8px;padding:5px}.old{left:8px}.new{right:8px}.metric{min-width:150px}}
</style></head><body><main>
<header><div><div class="eyebrow">RCTP / TPE · REALISM UPDATE · 2026.10.28</div><h1>桃園塔臺・畫面真實度提升</h1><p>15 組同視點、同時間與天氣的實際遊戲畫面，可拖曳檢查更新前後。</p></div><div class="tag">18 個遊戲邏輯／資料來源檔保持原樣</div></header>
<div class="toolbar"><label>觀察視角<select id="view" aria-label="觀察視角"></select></label><label>更新後畫質<select id="quality" aria-label="更新後畫質"><option value="after">Medium · 標準</option><option value="high">High · 更高解析度</option></select></label><div class="spacer"></div><button id="previous">← 上一個</button><button id="next">下一個 →</button></div>
<div id="stage"><img id="old" alt="更新前"><img id="new" alt="更新後"><div class="line"></div><div class="stamp old">BEFORE · MEDIUM</div><div class="stamp new" id="stamp">AFTER · MEDIUM</div><input id="slider" type="range" min="0" max="100" value="50" aria-label="比較分隔位置：0 顯示全部更新後，100 顯示全部更新前"></div>
<div class="controls"><p>拖曳畫面或以方向鍵調整。比較截圖隱藏 HUD；遊戲保留原有操作介面。</p><div><button data-split="100">全部更新前</button> <button data-split="50">並列比較</button> <button data-split="0">全部更新後</button></div></div>
<div class="detail"><h2 id="title"></h2><p id="note"></p></div>
<div class="detail"><h2>同一台電腦的新舊版本效能對照</h2><p>14 架飛機、塔臺座席、Medium、1440 × 900、4× MSAA 與陰影。每組 180 格，交錯量測兩輪。</p><div class="bench" id="bench"></div><p>數字為兩輪中位畫格時間的平均；時間越低越順暢。High 加入超採樣與完整環境光照，較適合獨立顯示卡。</p></div>
<div class="note"><p>截圖為遊戲原始輸出。天空及地面材質來自本機保存的 Poly Haven CC0 素材，其餘細節為專案自製。這次提升保留原有機場配置與管制玩法；建築與飛機仍為程序化近似模型。此為單一 Intel UHD Graphics 730 的短期效能測試，無法代表所有硬體、視角或長時間負載。更新前固定 Medium；更新後 High 的內部解析度為 1944 × 1215。</p></div>
<footer><a href="../index.html">開啟遊戲</a><a href="comparison.json">比較與效能原始資料</a><a href="../assets/realism/manifest.json">素材來源與雜湊</a><a href="https://polyhaven.com/license">Powered by Poly Haven · CC0</a></footer>
</main><script>
const data=${embedded},$=id=>document.getElementById(id),view=$('view'),quality=$('quality');data.rows.forEach((r,i)=>view.add(new Option(String(i+1).padStart(2,'0')+' · '+r.title,r.id)));view.selectedIndex=12;
function split(value){$('slider').value=value;$('stage').style.setProperty('--split',value+'%');}function update(){const row=data.rows[view.selectedIndex],q=quality.value;$('old').src='before/'+row.id+'.png';$('new').src=q+'/'+row.id+'.png';$('old').alt=row.title+'，更新前 Medium';$('new').alt=row.title+'，更新後 '+(q==='high'?'High':'Medium');$('stamp').textContent='AFTER · '+(q==='high'?'HIGH':'MEDIUM');$('title').textContent=row.title;$('note').textContent=row.note;}
view.onchange=update;quality.onchange=update;$('slider').oninput=e=>split(e.target.value);$('previous').onclick=()=>{view.selectedIndex=(view.selectedIndex+14)%15;update();};$('next').onclick=()=>{view.selectedIndex=(view.selectedIndex+1)%15;update();};document.querySelectorAll('[data-split]').forEach(b=>b.onclick=()=>split(b.dataset.split));
for(const row of data.performance.summary){const box=document.createElement('div');box.className='metric';const label=document.createElement('small');label.textContent=row.speed===0?'暫停':row.speed+'× 模擬';const value=document.createElement('strong');value.textContent=row.baselineFrameMs.toFixed(1)+' → '+row.currentFrameMs.toFixed(1)+' ms';const detail=document.createElement('small');detail.textContent='畫格時間 '+(row.changePercent>=0?'+':'')+row.changePercent.toFixed(1)+'%';box.append(label,value,detail);$('bench').append(box);}update();
</script></body></html>`);
console.log('Built dist/realism-review/index.html: 15 matching views, Medium / High, paired performance data.');
