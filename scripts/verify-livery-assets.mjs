import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../public/assets/liveries/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
assert.equal(manifest.runtimeNetworkDependency,false);assert.equal(manifest.notCC0,true);assert(Array.isArray(manifest.files)&&manifest.files.length>0);
const names=new Set();
let bytes=0;
for(const file of manifest.files){
 assert(/^[a-z0-9-]+\.(png|svg)$/.test(file.file));assert(!names.has(file.file),file.file+' duplicate manifest entry');names.add(file.file);const data=await readFile(new URL(file.file,root));
 assert.equal(data.length,file.bytes,file.file+' size');assert.equal(createHash('sha256').update(data).digest('hex'),file.sha256,file.file+' digest');
 if(file.file.endsWith('.svg'))assert(!/<script|<foreignObject|<image|\son\w+=|(?:href|src)=["'](?:https?:|\/\/|data:text)/i.test(data.toString()),file.file+' active/external content');bytes+=data.length;
}
await mkdir('livery-qa',{recursive:true});await writeFile('livery-qa/assets.json',JSON.stringify({files:manifest.files.length,bytes,sha256Verified:true,localOnly:true,notAllOpenLicensed:true},null,2)+'\n');
console.log(`Verified ${manifest.files.length} local brand files, their source digests and static SVG content.`);
