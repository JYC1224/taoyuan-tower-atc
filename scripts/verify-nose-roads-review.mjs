import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.ATC_QA_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/nose-roads-review/index.html');assert.equal(await page.locator('#view option').count(),17);
 for(const id of ['A350-front','B789-side','airport-aerial','airport-landside']){
  await page.selectOption('#view',id);
  await page.waitForFunction(()=>['before','after'].every(id=>{const image=document.getElementById(id);return image.complete&&image.naturalWidth===1440;}));
 }
 await page.locator('[data-split="0"]').click();assert.equal(await page.locator('#slider').inputValue(),'0');
 assert.equal(await page.locator('a[href="https://www.openstreetmap.org/copyright"]').count(),1);assert.deepEqual(errors,[]);
 console.log('17-view comparison, image loading, slider and map attribution passed.');
}finally{await browser.close();}
