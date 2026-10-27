import test from "node:test";
import assert from "node:assert/strict";
import {normalizeRiotId,isValidRiotId,sameRiotId,uniqueRiotIds,summarize,filterMatches,safeImport} from "../js/core.js";
import {cleanState,readState,saveState,addFriend,removeFriend,toggleFavorite,restoreBackup,DEFAULT_STATE} from "../js/storage/store.js";
import {lookupPlayer,allPlayers} from "../js/services/players.js";
const createStorage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}};
test("Riot ID normalizado e validado",()=>{
  assert.equal(normalizeRiotId(" Ahri Main # BR1 "),"Ahri Main#BR1");
  assert.equal(isValidRiotId("AhriMain#BR1"),true);
  assert.equal(isValidRiotId("Jogador"),false);
  assert.equal(isValidRiotId("<script>#BR1"),false);
  assert.equal(sameRiotId("ahriMain#br1","AHRIMAIN#BR1"),true);
});
test("deduplicação de jogadores",()=>{
  assert.deepEqual(uniqueRiotIds(["AhriMain#BR1","ahrimain#br1","bad","JunglePath#BR1"]),["AhriMain#BR1","JunglePath#BR1"]);
});
test("estatísticas e filtros",()=>{
  const m=[{champion:"Ahri",win:true,kills:10,deaths:2,assists:6},{champion:"Annie",win:false,kills:1,deaths:4,assists:2}];
  assert.deepEqual(summarize(m),{games:2,wins:1,losses:1,winRate:50,kda:19/6});
  assert.equal(summarize([]),null);
  assert.equal(filterMatches(m,"win").length,1);
  assert.equal(filterMatches(m,"loss","Ahri").length,0);
  assert.equal(filterMatches(m,"all","Annie").length,1);
});
test("amigos, favoritos, exclusão",()=>{
  const base=cleanState(DEFAULT_STATE);
  const first=addFriend(base,"NovaAmiga#BR1");
  assert.deepEqual(first.friends,["NovaAmiga#BR1"]);
  assert.deepEqual(addFriend(first,"novaamiga#br1").friends,first.friends);
  const fav=toggleFavorite(first,"NovaAmiga#BR1");
  assert.deepEqual(fav.favorites,["NovaAmiga#BR1"]);
  assert.deepEqual(removeFriend(fav,"NovaAmiga#BR1").favorites,[]);
  assert.throws(()=>addFriend(base,"invalido"),/Riot ID válido/);
});
test("persistência com recuperação de dados inválidos",()=>{
  const storage=createStorage();
  const state=addFriend(cleanState(DEFAULT_STATE),"NovaAmiga#BR1");
  assert.equal(saveState(state,storage),true);
  assert.deepEqual(readState(storage).friends,["NovaAmiga#BR1"]);
  storage.setItem("league-friends-v2","{erro");
  assert.deepEqual(readState(storage).friends,[]);
});
test("backup JSON versionado",()=>{
  const storage=createStorage();
  const valid=JSON.stringify({version:2,selected:"AhriMain#BR1",friends:["NovaAmiga#BR1"],favorites:["NovaAmiga#BR1"]});
  assert.equal(restoreBackup(valid,storage).selected,"AhriMain#BR1");
  assert.deepEqual(readState(storage).favorites,["NovaAmiga#BR1"]);
  assert.deepEqual(safeImport(valid).friends,["NovaAmiga#BR1"]);
  assert.throws(()=>safeImport('{"version":2,"friends":[],"favorites":["<script>#BR1"]}'),/inválidos/);
  assert.throws(()=>safeImport('{"version":999,"friends":[],"favorites":[]}'),/incompatível/);
  assert.throws(()=>safeImport("not-json"),/JSON válido/);
});
test("perfis inexistentes não recebem números fabricados",()=>{
  assert.equal(lookupPlayer("AlchemyFlames#BR1").isDemo,true);
  const player=lookupPlayer("OutroNome#BR1");
  assert.equal(player.isDemo,false);
  assert.equal(player.summary,null);
  assert.deepEqual(player.matches,[]);
  assert.ok(allPlayers(addFriend(cleanState(DEFAULT_STATE),"OutroNome#BR1")).includes("OutroNome#BR1"));
});
