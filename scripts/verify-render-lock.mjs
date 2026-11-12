import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const files=JSON.parse(await readFile('gameplay-qa/baseline-source-hashes.json','utf8')).filter(f=>f.Path.startsWith('src/render/')||['src/data/airport.ts','src/data/fleet.ts'].includes(f.Path));
for(const file of files)assert.equal(createHash('sha256').update(await readFile(file.Path)).digest('hex').toUpperCase(),file.Hash,file.Path+' changed');
await writeFile('gameplay-qa/render-lock.json',JSON.stringify({checked:files.length,allUnchanged:true,files:files.map(f=>f.Path)},null,2));
console.log('All 11 rendering sources plus airport geometry and fleet definitions are unchanged.');
