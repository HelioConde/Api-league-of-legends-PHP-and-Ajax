export function cleanName(v){ return typeof v==='string'?v.trim().replace(/\s+/g,' ').slice(0,40):''; }
export function cleanRegion(v){ return ['BR1','NA1','EUW1','EUN1','LA1','LA2','KR','JP1'].includes(v)?v:'BR1'; }
export function legacyFriends(input){
  let list; try{list=typeof input==='string'?JSON.parse(input):input;}catch{return [];}
  if(!Array.isArray(list))return [];
  return list.map(item=>{try{
    const x=typeof item==='string'?JSON.parse(item):item;
    const name=cleanName(typeof x==='string'?x:(x?.name||x?.gameName||''));
    return name?{name,region:cleanRegion(x?.region)}:null;
  }catch{return null;}}).filter(Boolean);
}
export function normalizeState(value){
 const obj=value&&typeof value==='object'?value:{};
 const seen=new Set();
 const friends=legacyFriends(obj.friends).filter(f=>{
   const key=(f.region+f.name).toLocaleLowerCase('pt-BR');
   if(seen.has(key))return false;
   seen.add(key);return true;
 }).slice(0,100);
 const favorites=Array.isArray(obj.favorites)?[...new Set(obj.favorites.filter(v=>typeof v==='string'&&/^[A-Za-z0-9]{1,32}$/.test(v)))].slice(0,200):[];
 return {friends,favorites};
}
export function loadState(key,storage=globalThis.localStorage){
 try{return normalizeState(storage.getItem(key)?JSON.parse(storage.getItem(key)):{friends:legacyFriends(storage.getItem('tbAmigos')||storage.getItem('tbfriends'))});}
 catch{return normalizeState({});}
}
export function saveState(key,state,storage=globalThis.localStorage){
 try{storage.setItem(key,JSON.stringify(normalizeState(state)));return true;}catch{return false;}
}
