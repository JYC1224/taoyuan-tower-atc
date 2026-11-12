import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../public/docs/',import.meta.url),{recursive:true});
for(const name of ['DATA_SOURCES.md','REALISM_NOTES.md','ASSET_PROVENANCE.md']){
  await copyFile(new URL('../'+name,import.meta.url),new URL('../public/docs/'+name,import.meta.url));
}
