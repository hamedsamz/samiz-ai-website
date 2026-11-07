import assert from 'node:assert/strict';
import {makeMap,STAGES,SPAWN,cell,canStand,route,move,cast,checkAnswer,checkpoint,safeProgress,hasSight} from '../public/games/house-of-rain/world.js';

const map=makeMap();
for(let stage=0;stage<5;stage++){
  const cp=checkpoint(stage);
  assert.ok(canStand(map,cp.x,cp.y,stage),`Checkpoint ${stage} is walkable`);
  assert.ok(route(map,SPAWN,STAGES[stage],stage).length>0,`Stage ${stage+1} is reachable`);
  for(let future=stage+1;future<5;future++)assert.equal(route(map,SPAWN,STAGES[future],stage).length,0,`Stage ${future+1} stays locked`);
  const [x,y]=STAGES[stage].note;
  assert.ok(route(map,SPAWN,{x,y},stage).length>0,`Clue ${stage+1} is reachable`);
  assert.ok(checkAnswer(stage,STAGES[stage].answer));
  assert.equal(checkAnswer(stage,'wrong'),false);
  // The pursuer must be able to follow the player through every open doorway.
  const path=route(map,{x:12.5,y:3.5},STAGES[stage],stage);
  assert.ok(path.length>0);assert.ok(path.every(p=>cell(map,p.x,p.y,stage)===0));
}
assert.equal(checkAnswer(0,'۱۳۷۲'),true);
assert.equal(checkAnswer(4,'٤٢٧١'),true);
assert.equal(checkAnswer(0,'۱۳۷'),false);
assert.equal(checkAnswer(3,'بسم|الرحمن|الله|الرحیم'),false);
assert.equal(safeProgress(-1),0);assert.equal(safeProgress(6),0);assert.equal(safeProgress(2.5),0);assert.equal(safeProgress(5),5);
const player={...SPAWN};for(let i=0;i<100;i++)move(map,player,.1,0,0);
assert.ok(canStand(map,player.x,player.y,0));assert.ok(player.x<14);
assert.equal(cast(map,12.5,22,0,1,0).type,8);
assert.equal(cell(map,14.5,19.5,0),11);assert.equal(cell(map,14.5,19.5,1),0);
assert.equal(hasSight(map,{x:12.5,y:19.5},{x:19,y:19.5},0),false);
assert.equal(hasSight(map,{x:12.5,y:19.5},{x:19,y:19.5},1),true);
assert.ok(route(map,checkpoint(5),{x:12.5,y:22.5},5).length>0,'Final return to entrance is reachable');
console.log('PASS: all five stages, clue routes, locked doors, enemy paths, checkpoints, collisions, line of sight, final exit, answer validation and Persian/Arabic digits.');
