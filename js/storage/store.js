import {isValidRiotId,normalizeRiotId,sameRiotId,uniqueRiotIds,safeImport} from "../core.js";

export const STORAGE_KEY="league-friends-v2";
export const DEFAULT_STATE=Object.freeze({version:2,selected:"AlchemyFlames#BR1",friends:[],favorites:[]});
export function cleanState(data) {
  if(!data || typeof data!=="object") return {...DEFAULT_STATE,friends:[],favorites:[]};
  return {
    version:2,
    selected:isValidRiotId(data.selected)?normalizeRiotId(data.selected):DEFAULT_STATE.selected,
    friends:uniqueRiotIds(Array.isArray(data.friends)?data.friends.slice(0,80):[]),
    favorites:uniqueRiotIds(Array.isArray(data.favorites)?data.favorites.slice(0,80):[])
  };
}
export function readState(storage=globalThis.localStorage) {
  try {
    const saved=storage.getItem(STORAGE_KEY);
    if(saved) return cleanState(JSON.parse(saved));
    const oldFriends=JSON.parse(storage.getItem("tbfriends")||"[]");
    const legacyFriends=Array.isArray(oldFriends)?oldFriends.map(x=>x&&x.friend).filter(isValidRiotId):[];
    const oldSelected=storage.getItem("lolnick");
    return cleanState({selected:isValidRiotId(oldSelected)?oldSelected:DEFAULT_STATE.selected,friends:legacyFriends,favorites:[]});
  } catch {return cleanState(DEFAULT_STATE)}
}
export function saveState(state,storage=globalThis.localStorage) {
  const clean=cleanState(state);
  try {storage.setItem(STORAGE_KEY,JSON.stringify(clean));return true}
  catch {return false}
}
export function addFriend(state,id) {
  const value=normalizeRiotId(id);
  if(!isValidRiotId(value)) throw new Error("Informe um Riot ID válido: Nome#TAG.");
  const friends=uniqueRiotIds([...state.friends,value]);
  if(friends.length>80) throw new Error("Limite de 80 amigos locais atingido.");
  return cleanState({...state,friends});
}
export function removeFriend(state,id) {
  return cleanState({...state,friends:state.friends.filter(x=>!sameRiotId(x,id)),favorites:state.favorites.filter(x=>!sameRiotId(x,id))});
}
export function toggleFavorite(state,id) {
  const value=normalizeRiotId(id);
  if(!isValidRiotId(value)) throw new Error("Riot ID inválido.");
  const favorites=state.favorites.some(x=>sameRiotId(x,value))?state.favorites.filter(x=>!sameRiotId(x,value)):uniqueRiotIds([...state.favorites,value]);
  return cleanState({...state,favorites});
}
export function restoreBackup(raw,storage=globalThis.localStorage) {
  const imported=safeImport(raw);
  if(!saveState(imported,storage)) throw new Error("Não foi possível salvar o backup neste navegador.");
  return imported;
}
