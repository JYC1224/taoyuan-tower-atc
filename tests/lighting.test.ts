import test from 'node:test';
import assert from 'node:assert/strict';
import {lightingState} from '../src/render/lighting';

test('Taoyuan solar position and airport lighting follow local time',()=>{
 const morning=lightingState(8,'clear'),noon=lightingState(12,'clear'),evening=lightingState(17.5,'clear'),night=lightingState(22,'clear');
 assert.ok(noon.up>morning.up&&noon.up>evening.up);assert.ok(night.up<0);
 assert.ok(noon.sunHeight>.95&&night.sunHeight===0);assert.ok(night.artificial>.99&&noon.artificial<.01);
 assert.ok(evening.warm>noon.warm);assert.notEqual(Math.sign(morning.x),Math.sign(evening.x));
});
test('cloud and rain reduce direct shadow contrast and twilight remains continuous',()=>{
 assert.ok(lightingState(12,'storm').shadowStrength<lightingState(12,'clear').shadowStrength);
 for(let hour=0;hour<24;hour+=1/60){const a=lightingState(hour,'clear'),b=lightingState(hour+1/60,'clear');assert.ok(Math.abs(a.artificial-b.artificial)<.05);assert.ok(Math.abs(a.daylight-b.daylight)<.05);}
});
