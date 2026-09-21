import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapPath, normalizeMapKey } from '../src/game/maps.js';
import { createRunTelemetry } from '../src/game/telemetry.js';
import { recordLocalScore, readLocalLeaderboard, fetchGlobalLeaderboard, submitGlobalScore } from '../src/services/leaderboard.js';

test('routes keep the original travel length and independent path copies', () => {
  assert.deepEqual(createMapPath('classic'), [{x:-120,y:220},{x:980,y:220},{x:980,y:620},{x:140,y:620},{x:140,y:420},{x:860,y:420}]);
  for (const key of ['classic', 'relay-yard']) {
    const path = createMapPath(key);
    let length = 0;
    for (let i=1;i<path.length;i++) {
      const a=path[i-1], b=path[i];
      assert.ok(a.x===b.x || a.y===b.y);
      length += Math.hypot(b.x-a.x,b.y-a.y);
    }
    assert.equal(length,3260);
    path[0].x=99;
    assert.equal(createMapPath(key)[0].x,-120);
  }
  assert.equal(normalizeMapKey('toString'),'classic');
});

test('local scores preserve legacy entries and isolate map and difficulty', () => {
  const values = new Map();
  const storage = {read:key=>values.get(key), write:(key,value)=>values.set(key,value)};
  recordLocalScore(storage,{name:'old',score:10},'easy');
  recordLocalScore(storage,{name:'new',score:20,mapKey:'relay-yard'},'easy');
  assert.equal(readLocalLeaderboard(storage,'easy')[0].name,'old');
  assert.equal(readLocalLeaderboard(storage,'easy','relay-yard')[0].name,'new');
  assert.deepEqual(readLocalLeaderboard(storage,'hard','relay-yard'),[]);
});

test('legacy servers cannot receive or display Relay Yard scores', async () => {
  const calls=[];
  const fetchImpl=async (...args)=>{calls.push(args);return {ok:true,json:async()=>({items:[{name:'classic score'}]})};};
  await assert.rejects(fetchGlobalLeaderboard('easy',10,fetchImpl,'relay-yard'),/not available/);
  assert.deepEqual(await submitGlobalScore({mapKey:'relay-yard'},fetchImpl),{submitted:false});
  assert.ok(calls.every(([,options])=>!options));
});

test('map-aware servers receive map identity and telemetry separates runs', async () => {
  const calls=[];
  const fetchImpl=async (...args)=>{calls.push(args);return {ok:true,json:async()=>({map:'relay-yard',items:[]})};};
  assert.deepEqual(await submitGlobalScore({mapKey:'relay-yard',difficultyKey:'hard'},fetchImpl),{submitted:true});
  assert.equal(JSON.parse(calls[1][1].body).map,'relay-yard');
  const options={seed:'same',difficultyKey:'hard',runLabel:'test'};
  assert.notEqual(createRunTelemetry(options).runId,createRunTelemetry({...options,mapKey:'relay-yard'}).runId);
});
