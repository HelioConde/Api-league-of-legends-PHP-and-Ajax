export function normalizeRiotId(value) {
  return typeof value === "string" ? value.normalize("NFC").trim().replace(/\s*#\s*/g, "#") : "";
}
export function isValidRiotId(value) {
  const id = normalizeRiotId(value);
  return /^[\p{L}\p{N} _.:-]{3,16}#[\p{L}\p{N}]{2,5}$/u.test(id) && id.length <= 24;
}
export function sameRiotId(a,b) {
  return normalizeRiotId(a).toLocaleLowerCase("pt-BR") === normalizeRiotId(b).toLocaleLowerCase("pt-BR");
}
export function uniqueRiotIds(values) {
  const result=[];
  for (const value of values) {
    const id=normalizeRiotId(value);
    if(isValidRiotId(id) && !result.some(x=>sameRiotId(x,id))) result.push(id);
  }
  return result;
}
export function kda(match) {
  if(!match) return 0;
  return (match.kills + match.assists) / Math.max(1,match.deaths);
}
export function summarize(matches) {
  if(!Array.isArray(matches)||!matches.length) return null;
  const wins=matches.filter(m=>m.win).length;
  const kills=matches.reduce((total,m)=>total+m.kills,0);
  const deaths=matches.reduce((total,m)=>total+m.deaths,0);
  const assists=matches.reduce((total,m)=>total+m.assists,0);
  return {games:matches.length,wins,losses:matches.length-wins,winRate:Math.round(wins/matches.length*100),kda:(kills+assists)/Math.max(1,deaths)};
}
export function filterMatches(matches, result="all", champion="all") {
  return (Array.isArray(matches)?matches:[]).filter(m=>(result==="all" || (result==="win" ? m.win : !m.win)) && (champion==="all" || m.champion===champion));
}
export function safeImport(json, maxFriends=80) {
  if(typeof json!=="string"||json.length>150000) throw new Error("O arquivo é grande demais.");
  let parsed;
  try{parsed=JSON.parse(json)}catch{throw new Error("Este arquivo não contém JSON válido.")}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)||parsed.version!==2||
    !Array.isArray(parsed.friends)||!Array.isArray(parsed.favorites)) throw new Error("Formato de backup incompatível.");
  if(parsed.friends.length>maxFriends||parsed.favorites.length>maxFriends) throw new Error("O backup excede o limite de 80 jogadores.");
  if(parsed.friends.some(x=>!isValidRiotId(x))||parsed.favorites.some(x=>!isValidRiotId(x))) throw new Error("O backup contém Riot IDs inválidos.");
  if(parsed.selected!==null && parsed.selected!==undefined && !isValidRiotId(parsed.selected)) throw new Error("O jogador selecionado é inválido.");
  return {version:2,friends:uniqueRiotIds(parsed.friends),favorites:uniqueRiotIds(parsed.favorites),selected:normalizeRiotId(parsed.selected||"AlchemyFlames#BR1")};
}

/** Unifica amigos e favoritos para que um jogador favoritado não fique escondido. */
export function selectSavedPlayers(friends=[],favorites=[],filter="all",query="") {
  const saved=uniqueRiotIds(Array.isArray(friends)?friends:[]);
  const marked=uniqueRiotIds(Array.isArray(favorites)?favorites:[]);
  const needle=typeof query==="string"?query.trim().toLocaleLowerCase("pt-BR"):"";
  return uniqueRiotIds([...saved,...marked]).map(id=>({
    id,friend:saved.some(x=>sameRiotId(x,id)),favorite:marked.some(x=>sameRiotId(x,id))
  })).filter(item=>
    (filter!=="friends"||item.friend)&&(filter!=="favorites"||item.favorite)&&
    (!needle||item.id.toLocaleLowerCase("pt-BR").includes(needle))
  ).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.id.localeCompare(b.id,"pt-BR"));
}
/** Comparação apenas de estatísticas de demonstração disponíveis. */
export function compareSummaries(left,right) {
  if(!left||!right||![left.winRate,right.winRate,left.kda,right.kda].every(Number.isFinite))return null;
  const winGap=left.winRate-right.winRate;
  const kdaGap=left.kda-right.kda;
  return {winGap,kdaGap,leader:winGap===0?"tie":winGap>0?"left":"right"};
}
