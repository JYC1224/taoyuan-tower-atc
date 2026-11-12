import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const all=JSON.parse(await readFile('realism-qa/baseline-source-hashes.json','utf8')),protectedFiles=all.filter(f=>!f.path.startsWith('src/render/'));
for(const file of protectedFiles)assert.equal(createHash('sha256').update(await readFile(file.path)).digest('hex'),file.sha256,file.path+' changed');
await writeFile('realism-qa/logic-lock.json',JSON.stringify({checked:protectedFiles.length,allUnchanged:true,files:protectedFiles.map(f=>f.path)},null,2));
console.log(`All ${protectedFiles.length} gameplay, UI, audio and airport/fleet data sources remain unchanged.`);
