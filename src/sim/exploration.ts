import type {Scenario} from '../types';

/** A sightseeing session owns no controller position and never waits for a player. */
export function explorationScenario(scenario:Scenario):Scenario {
 return {...scenario,duration:0,difficulty:'assisted',positions:[],tutorial:false,incidents:'off',routineAutomation:true,exploration:true};
}
