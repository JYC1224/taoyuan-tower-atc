import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=new URL('../public/',import.meta.url),manifest=JSON.parse(await readFile(new URL('assets/realism/manifest.json',root),'utf8'));
assert.equal(manifest.runtimeNetworkDependency,false);
assert.equal(manifest.assets.length,13);
let total=0;
for(const asset of manifest.assets){
 assert(/^assets\/realism\/[a-zA-Z0-9_-]+\.(jpg|hdr)$/.test(asset.file));
 assert.equal(asset.license,'CC0-1.0');
 assert.equal(new URL(asset.sourceUrl).hostname,'dl.polyhaven.org');
 const bytes=await readFile(new URL(asset.file,root));
 assert.equal(bytes.length,asset.bytes,asset.file+' size');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file+' digest');
 total+=bytes.length;
}
console.log(`Verified ${manifest.assets.length} local CC0 material files, ${total} bytes, with recorded SHA-256 digests.`);
