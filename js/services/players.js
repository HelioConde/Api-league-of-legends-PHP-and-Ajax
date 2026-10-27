import {DEMO_PLAYERS} from "../data/demo.js";
import {sameRiotId,normalizeRiotId,summarize} from "../core.js";
export function findDemoPlayer(id) {
  return DEMO_PLAYERS.find(player=>sameRiotId(player.riotId,id))||null;
}
export function lookupPlayer(id) {
  const demo=findDemoPlayer(id);
  if(demo) return {...demo,isDemo:true,dataAvailable:true,summary:summarize(demo.matches)};
  return {riotId:normalizeRiotId(id),region:"—",level:null,tier:null,division:null,lp:null,icon:null,favoriteChampion:null,favoriteChampionId:null,matches:[],isDemo:false,dataAvailable:false,summary:null};
}
export function allPlayers(state) {
  const ids=[...DEMO_PLAYERS.map(p=>p.riotId),...state.friends];
  const result=[];
  for(const id of ids) if(!result.some(x=>sameRiotId(x,id))) result.push(id);
  return result;
}
