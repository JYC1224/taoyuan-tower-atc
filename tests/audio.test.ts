import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEvents} from '../src/audioEvents';
import type {Aircraft,AircraftState,RadioMessage} from '../src/types';

const plane=(state:AircraftState)=>({id:'CI101',state} as Aircraft);
const message=(id:number,aircraftId?:string)=>({id,aircraftId,time:0,text:'Cleared to land',level:'info'} as RadioMessage);

test('touchdown sounds once even when the transient state is skipped',()=>{
 const events=new AudioEvents();events.reset([plane('FINAL')],[]);
 assert.equal(events.update([plane('DECELERATING')],[],true).touchdowns.length,1);
 assert.equal(events.update([plane('DECELERATING')],[],true).touchdowns.length,0);
 events.reset([plane('FINAL')],[]);
 assert.equal(events.update([plane('TOUCHDOWN')],[],true).touchdowns.length,1);
 assert.equal(events.update([plane('DECELERATING')],[],true).touchdowns.length,0);
});
test('radio only emits new aircraft messages and does not replay paused or reset history',()=>{
 const events=new AudioEvents();events.reset([], [message(2,'A')]);
 assert.equal(events.update([], [message(2,'A')],true).message,undefined);
 assert.equal(events.update([], [message(3,'A'),message(2,'A')],true).message?.id,3);
 assert.equal(events.update([], [message(4,'A')],false).message,undefined);
 assert.equal(events.update([], [message(4,'A')],true).message,undefined);
 assert.equal(events.update([], [message(5)],true).message,undefined);
 events.reset([], [message(1,'B')]);
 assert.equal(events.update([], [message(2,'B'),message(1,'B')],true).message?.id,2);
});
