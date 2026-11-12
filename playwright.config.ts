import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const windowsChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({
  testDir:'./tests',testMatch:'browser.spec.ts',timeout:120000,workers:1,
  reporter:[['list'],['json',{outputFile:'test-results/browser-results.json'}]],
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},screenshot:'only-on-failure',
    launchOptions:{...(existsSync(windowsChrome)?{executablePath:windowsChrome}:{}),args:process.env.ATC_NATIVE_GPU?['--enable-webgl']:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
  webServer:{command:'npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:true,timeout:30000}
});
