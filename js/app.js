import {DEMO_PLAYERS,DEMO_NOTICE} from "./data/demo.js";
import {normalizeRiotId,isValidRiotId,sameRiotId,kda,filterMatches,selectSavedPlayers,compareSummaries} from "./core.js";
import {readState,saveState,addFriend,removeFriend,toggleFavorite,restoreBackup,DEFAULT_STATE} from "./storage/store.js";
import {lookupPlayer,allPlayers} from "./services/players.js";

const byId=id=>document.getElementById(id);
const SECTION_TITLES={overview:"Visão geral",matches:"Partidas",friends:"Amigos",compare:"Comparar",gallery:"Galeria",settings:"Dados locais"};
const CHAMPION_ICONS=new Set([1,32,103,266]);
const galleryImages=Array.from({length:6},(_,i)=>"./img/"+(i+1)+".jpg");
let state=readState();
let current=lookupPlayer(state.selected);
let section="overview";
let galleryIndex=0;
let compareA=DEMO_PLAYERS[0].riotId;
let compareB=DEMO_PLAYERS[1].riotId;
let editingFriend=null;
let savedFilter="all";

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function championImage(id) {
  return CHAMPION_ICONS.has(Number(id))?"./iconIMG/"+Number(id)+".png":"./img/logo.png";
}
function status(message,type="info"){
  const node=byId("feedback");
  node.textContent=message;
  node.dataset.type=type;
}
function commit(next,message){
  state=next;
  if(!saveState(state)) status("Seu navegador bloqueou o armazenamento. As alterações poderão desaparecer ao recarregar.","error");
  else if(message) status(message);
  current=lookupPlayer(state.selected);
  renderAll();
}
function renderProfile(){
  const badge=document.querySelector(".profile-panel .mini-chip");
  if(badge)badge.textContent=current.isDemo?"DEMONSTRAÇÃO":"SEM DADOS ONLINE";
  const favorite=state.favorites.some(id=>sameRiotId(id,current.riotId));
  const friend=state.friends.some(id=>sameRiotId(id,current.riotId));
  const [name,tag]=current.riotId.split("#");
  const summary=current.summary;
  byId("profile-card").innerHTML=[
    '<div class="profile-hero">',
    current.isDemo?'<img class="profile-icon" src="'+championImage(current.icon)+'" alt="'+escapeHtml("Ícone demonstrativo de "+current.favoriteChampion)+'">':'<div class="profile-icon profile-placeholder" role="img" aria-label="Sem imagem de perfil disponível">?</div>',
    '<div><div class="profile-id">',escapeHtml(name),'<span class="profile-tag">#',escapeHtml(tag),'</span></div>',
    '<p class="profile-region">',current.isDemo?"Região "+escapeHtml(current.region)+" · Nível "+current.level:"Riot ID salvo localmente · Sem dados de partidas",'</p></div></div>',
    '<div class="rank-box"><div><small>RANQUEADA SOLO / DUO</small><strong>',current.isDemo?escapeHtml(current.tier+" "+current.division):"Sem estatísticas",'</strong><small>',current.isDemo?current.lp+" PDL · Exemplo fictício":"A consulta à Riot API não está habilitada",'</small></div>',current.isDemo?'<div class="rank-emblem" aria-hidden="true">◆</div>':'','</div>',
    '<div class="profile-facts"><div><small>Campeão favorito</small><strong>',escapeHtml(current.favoriteChampion||"Não informado"),'</strong></div>',
    '<div><small>Vitórias nos exemplos</small><strong>',summary?summary.wins:"—",'</strong></div>',
    '<div><small>Partidas exibidas</small><strong>',summary?summary.games:"—",'</strong></div>',
    '<div><small>Taxa de vitória</small><strong>',summary?summary.winRate+"%":"—",'</strong></div></div>',
    '<div class="profile-actions"><button type="button" data-profile-action="favorite" class="',favorite?"is-favorite":"",'" aria-pressed="',favorite,'">',favorite?"★ Favorito":"☆ Favoritar",'</button>',
    '<button type="button" data-profile-action="friend" ',friend?'disabled':'','>',friend?"✓ Nos amigos":"＋ Adicionar amigo",'</button></div>'
  ].join("");
}
function statCard(label,value,detail,good=false){
  return '<div class="stat-tile"><span>'+escapeHtml(label)+'</span><strong'+(good?' class="good"':'')+'>'+escapeHtml(value)+'</strong><small>'+escapeHtml(detail)+'</small></div>';
}
function renderStats(){
  const summary=current.summary;
  if(!summary){
    byId("stats-grid").innerHTML=statCard("Partidas","—","Sem dados")+statCard("Vitórias","—","Sem dados")+statCard("Taxa de vitória","—","Sem dados")+statCard("KDA","—","Sem dados");
    return;
  }
  byId("stats-grid").innerHTML=[
    statCard("Partidas",summary.games,"Total demonstrativo"),
    statCard("Vitórias",summary.wins,"Derrotas: "+summary.losses),
    statCard("Taxa de vitória",summary.winRate+"%","Nos exemplos",summary.winRate>=50),
    statCard("KDA",summary.kda.toFixed(2),"Média agregada")
  ].join("");
}
function matchMarkup(match){
  return [
    '<article class="match-row ',match.win?'win':'loss','">',
    '<span class="match-stripe" aria-hidden="true"></span><img class="match-avatar" src="',championImage(match.championId),'" alt="">',
    '<div class="match-desc"><strong>',escapeHtml(match.champion),' <span class="',match.win?'win-label':'loss-label','">· ',match.win?'Vitória':'Derrota','</span></strong>',
    '<small>',escapeHtml(match.mode),' · ',escapeHtml(match.date),' · ',escapeHtml(match.duration),'</small></div>',
    '<div class="match-kda">',match.kills,' / ',match.deaths,' / ',match.assists,'<small>KDA ',kda(match).toFixed(2),'</small></div></article>'
  ].join("");
}
function emptyMarkup(title,body){
  return '<div class="empty"><strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(body)+'</p></div>';
}
function renderRecent(){
  byId("recent-matches").innerHTML=current.matches.length?
    '<div class="match-list">'+current.matches.slice(0,3).map(matchMarkup).join("")+'</div>':
    emptyMarkup("Nenhuma partida disponível","Perfis criados localmente não recebem estatísticas automáticas.");
}
function renderMatchFilters(){
  const filter=byId("champion-filter");
  const selected=filter.value;
  const champions=[...new Set(current.matches.map(m=>m.champion))];
  filter.replaceChildren(new Option("Todos","all"),...champions.map(champ=>new Option(champ,champ)));
  filter.value=champions.includes(selected)?selected:"all";
}
function renderMatches(){
  const matches=filterMatches(current.matches,byId("match-filter").value,byId("champion-filter").value);
  byId("full-matches").innerHTML=matches.length?
    '<div class="match-list">'+matches.map(matchMarkup).join("")+'</div>':
    emptyMarkup(current.matches.length?"Nenhum resultado para este filtro":"Sem histórico disponível",current.matches.length?"Altere os filtros para visualizar outras partidas.":"Este perfil não possui partidas de demonstração.");
}
function renderFriends(){
  const entries=selectSavedPlayers(state.friends,state.favorites,savedFilter,byId("saved-search").value);
  const total=selectSavedPlayers(state.friends,state.favorites).length;
  const friendCount=state.friends.length;
  const favoriteCount=state.favorites.length;
  byId("saved-summary").textContent=total===0?"Nenhum jogador salvo neste navegador.":
    entries.length+" de "+total+" jogadores · "+friendCount+(friendCount===1?" amigo":" amigos")+" · "+favoriteCount+(favoriteCount===1?" favorito":" favoritos");
  byId("friend-list").innerHTML=entries.length?entries.map(item=>{
    const escaped=escapeHtml(item.id);
    const isDemo=DEMO_PLAYERS.some(x=>sameRiotId(x.riotId,item.id));
    return [
      '<article class="friend-card"><div class="friend-title"><strong>',escaped,'</strong><div class="friend-chips">',
      item.favorite?'<span class="saved-chip favorite-chip">★ Favorito</span>':'',
      item.friend?'<span class="saved-chip">Amigo</span>':'',
      '</div></div><small>',isDemo?"Perfil demonstrativo · estatísticas fictícias":"Riot ID local · estatísticas indisponíveis",'</small>',
      '<div class="friend-actions"><button type="button" data-action="select" data-id="',escaped,'">Abrir</button>',
      '<button type="button" data-action="favorite" data-id="',escaped,'" aria-pressed="',item.favorite,'" class="',item.favorite?"is-favorite":"",'">',item.favorite?"★ Desfavoritar":"☆ Favoritar",'</button>',
      item.friend?'<button type="button" data-action="edit" data-id="'+escaped+'">Editar</button>':
        '<button type="button" data-action="add" data-id="'+escaped+'">＋ Amigo</button>',
      item.friend?'<button type="button" data-action="remove" data-id="'+escaped+'">Excluir</button>':'',
      '</div></article>'
    ].join("");
  }).join(""):
    emptyMarkup(total===0?"Sua lista está vazia":"Nenhum jogador encontrado",
      total===0?"Adicione um Riot ID ou favorite um perfil para vê-lo aqui.":"Altere a busca ou o filtro para mostrar mais jogadores.");
}
function fillSelect(select,ids,value){
  select.replaceChildren(...ids.map(id=>new Option(id,id)));
  if(ids.some(id=>sameRiotId(id,value))) select.value=ids.find(id=>sameRiotId(id,value));
}
function renderComparison(){
  const ids=allPlayers(state);
  if(!ids.some(id=>sameRiotId(id,compareA))) compareA=ids[0];
  if(!ids.some(id=>sameRiotId(id,compareB))) compareB=ids[1]||ids[0];
  fillSelect(byId("compare-a"),ids,compareA);
  fillSelect(byId("compare-b"),ids,compareB);
  const left=lookupPlayer(compareA);
  const right=lookupPlayer(compareB);
  const same=sameRiotId(compareA,compareB);
  const comparison=same?null:compareSummaries(left.summary,right.summary);
  if(same){
    byId("compare-insight").innerHTML='<div class="insight-message">Selecione dois jogadores diferentes para comparar.</div>';
  }else if(!comparison){
    byId("compare-insight").innerHTML='<div class="insight-message">Um dos perfis não possui estatísticas. Escolha dois exemplos para comparar resultados fictícios.</div>';
  }else{
    const winner=comparison.leader==="tie"?"Empate na taxa de vitória":
      "Maior taxa de vitória: "+escapeHtml(comparison.leader==="left"?compareA:compareB);
    const gap=Math.abs(comparison.winGap);
    const maxRate=Math.max(1,left.summary.winRate,right.summary.winRate);
    byId("compare-insight").innerHTML=[
      '<div class="insight-header"><span class="eyebrow">LEITURA DO DUO · SIMULAÇÃO</span><strong>',winner,
      '</strong><small>Diferença de ',gap,' ponto',gap===1?'':'s',' percentual',gap===1?'':'is',
      ' · apenas ',left.summary.games,' e ',right.summary.games,' partidas fictícias</small></div>',
      '<div class="insight-bars">',
      [left,right].map(player=>'<div class="insight-bar"><span>'+escapeHtml(player.riotId)+
        '</span><strong>'+player.summary.winRate+'%</strong><div class="bar-track" aria-hidden="true"><div style="width:'+
        (player.summary.winRate/maxRate*100)+'%"></div></div></div>').join(""),
      '</div>'
    ].join("");
  }
  byId("compare-output").innerHTML=[compareA,compareB].map(id=>{
    const player=lookupPlayer(id);
    const s=player.summary;
    return '<article class="panel compare-card"><span class="eyebrow">'+(player.isDemo?"ESTATÍSTICAS FICTÍCIAS":"DADOS INDISPONÍVEIS")+'</span><h3>'+escapeHtml(player.riotId)+'</h3>'+
    '<p>Elo: <strong>'+escapeHtml(player.tier?player.tier+" "+player.division:"Não informado")+'</strong></p>'+
    '<p>Partidas: <strong>'+(s?s.games:"—")+'</strong></p>'+
    '<p>Vitórias: <strong>'+(s?s.wins:"—")+'</strong></p>'+
    '<p>Taxa de vitória: <strong>'+(s?s.winRate+"%":"—")+'</strong></p>'+
    '<p>KDA: <strong>'+(s?s.kda.toFixed(2):"—")+'</strong></p></article>';
  }).join("");
}
function renderAll(){
  renderProfile();
  renderStats();
  renderRecent();
  renderMatchFilters();
  renderMatches();
  renderFriends();
  renderComparison();
}
function showSection(next){
  if(!Object.prototype.hasOwnProperty.call(SECTION_TITLES,next)) return;
  const changed=section!==next;
  if(changed)status("");
  section=next;
  // Evita manter a rolagem da página anterior após navegar pelo menu.
  if(changed && typeof window.scrollTo==="function") window.scrollTo({top:0,behavior:"instant"});
  document.querySelector(".workspace").classList.toggle("is-secondary",next!=="overview");
  for(const key of Object.keys(SECTION_TITLES)){
    byId("panel-"+key).hidden=key!==next;
  }
  document.querySelectorAll("[data-section]").forEach(button=>{
    const active=button.dataset.section===next;
    if(active) button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
    button.classList.toggle("is-active",active);
  });
  byId("page-title").textContent=SECTION_TITLES[next];
  document.title=SECTION_TITLES[next]+" | League Friends";
}
function setGallery(index){
  galleryIndex=(index+galleryImages.length)%galleryImages.length;
  byId("gallery-image").src=galleryImages[galleryIndex];
  byId("gallery-widget").style.setProperty("--gallery-bg",`url("${new URL(galleryImages[galleryIndex],document.baseURI).href}")`);
  byId("gallery-image").alt="Arte temática "+(galleryIndex+1)+" de "+galleryImages.length;
  byId("gallery-count").textContent=(galleryIndex+1)+" de "+galleryImages.length;
  byId("gallery-dots").replaceChildren(...galleryImages.map((_,i)=>{
    const dot=document.createElement("button");
    dot.type="button";
    dot.setAttribute("aria-label","Mostrar imagem "+(i+1));
    dot.setAttribute("aria-current",String(i===galleryIndex));
    dot.addEventListener("click",()=>setGallery(i));
    return dot;
  }));
}
function setupEditing(id){
  editingFriend=id;
  byId("friend-id").value=id;
  const button=byId("friend-form").querySelector("button[type=submit]");
  button.textContent="Salvar alteração";
  let cancel=byId("cancel-edit");
  if(!cancel){
    cancel=document.createElement("button");
    cancel.type="button";cancel.id="cancel-edit";cancel.textContent="Cancelar";
    byId("friend-form").querySelector(".inline-fields").append(cancel);
    cancel.addEventListener("click",resetEditing);
  }
  byId("friend-id").focus();
}
function resetEditing(){
  editingFriend=null;
  byId("friend-id").value="";
  byId("friend-form").querySelector("button[type=submit]").textContent="Adicionar amigo";
  byId("cancel-edit")?.remove();
}

document.querySelectorAll("[data-section]").forEach(button=>button.addEventListener("click",()=>showSection(button.dataset.section)));
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>showSection(button.dataset.go)));
document.querySelectorAll("[data-demo-id]").forEach(button=>button.addEventListener("click",()=>{
  const id=button.dataset.demoId;
  byId("riot-id").value=id;
  showSection("overview");
  commit({...state,selected:id},"Perfil de demonstração selecionado.");
}));
byId("saved-search").addEventListener("input",renderFriends);
byId("saved-filter").addEventListener("change",event=>{savedFilter=event.target.value;renderFriends()});

byId("search-form").addEventListener("submit",event=>{
  event.preventDefault();
  const id=normalizeRiotId(byId("riot-id").value);
  if(!isValidRiotId(id)){status("Informe um Riot ID válido, por exemplo Nome#BR1.","error");return}
  showSection("overview");
  commit({...state,selected:id},DEMO_PLAYERS.some(x=>sameRiotId(x.riotId,id))?"Perfil fictício carregado.":"Riot ID selecionado. Este jogador não possui estatísticas no modo demonstração.");
});
byId("profile-card").addEventListener("click",event=>{
  const action=event.target.closest("button[data-profile-action]")?.dataset.profileAction;
  if(!action) return;
  try{
    if(action==="friend"){
      if(state.friends.some(id=>sameRiotId(id,current.riotId))){status("Esse jogador já está na sua lista.");return}
      commit(addFriend(state,current.riotId),"Amigo salvo neste navegador.");
    }
    if(action==="favorite") commit(toggleFavorite(state,current.riotId),"Favoritos atualizados.");
  }catch(err){status(err.message,"error")}
});
byId("friend-form").addEventListener("submit",event=>{
  event.preventDefault();
  const id=normalizeRiotId(byId("friend-id").value);
  if(!isValidRiotId(id)){status("Use Nome#TAG, com nome de 3 a 16 caracteres e TAG de 2 a 5.","error");return}
  try{
    let next=state;
    if(editingFriend && !sameRiotId(editingFriend,id)){
      if(state.friends.some(x=>sameRiotId(x,id))){status("Já existe um amigo com esse Riot ID.","error");return}
      const wasFavorite=state.favorites.some(x=>sameRiotId(x,editingFriend));
      const wasSelected=sameRiotId(state.selected,editingFriend);
      next=removeFriend(next,editingFriend);
      next=addFriend(next,id);
      if(wasFavorite) next=toggleFavorite(next,id);
      if(wasSelected) next={...next,selected:id};
    }else if(!editingFriend && state.friends.some(x=>sameRiotId(x,id))){
      status("Este amigo já está salvo.","error");return;
    }else next=addFriend(state,id);
    commit(next,editingFriend?"Amigo atualizado.":"Amigo adicionado à sua lista.");
    resetEditing();
  }catch(err){status(err.message,"error")}
});
byId("friend-list").addEventListener("click",event=>{
  const button=event.target.closest("button[data-action]");
  if(!button) return;
  const id=button.dataset.id;
  try{
    if(button.dataset.action==="select"){showSection("overview");commit({...state,selected:id},"Perfil selecionado.")}
    if(button.dataset.action==="favorite") commit(toggleFavorite(state,id),"Favoritos atualizados.");
    if(button.dataset.action==="add") commit(addFriend(state,id),"Jogador adicionado aos amigos.");
    if(button.dataset.action==="edit") setupEditing(id);
    if(button.dataset.action==="remove"){commit(removeFriend(state,id),"Amigo excluído.");if(editingFriend&&sameRiotId(editingFriend,id))resetEditing()}
  }catch(err){status(err.message,"error")}
});
byId("match-filter").addEventListener("change",renderMatches);
byId("champion-filter").addEventListener("change",renderMatches);
byId("compare-a").addEventListener("change",event=>{compareA=event.target.value;renderComparison()});
byId("compare-b").addEventListener("change",event=>{compareB=event.target.value;renderComparison()});

byId("gallery-prev").addEventListener("click",()=>setGallery(galleryIndex-1));
byId("gallery-next").addEventListener("click",()=>setGallery(galleryIndex+1));
byId("gallery-widget").addEventListener("keydown",event=>{
  if(event.key==="ArrowLeft"){event.preventDefault();setGallery(galleryIndex-1)}
  if(event.key==="ArrowRight"){event.preventDefault();setGallery(galleryIndex+1)}
});

byId("export-data").addEventListener("click",()=>{
  const json=JSON.stringify(state,null,2);
  const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="league-friends-backup.json";
  document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
  status("Backup criado. Guarde o arquivo em um local seguro.");
});
byId("import-data").addEventListener("change",async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  byId("import-filename").textContent=file.name;
  try{
    if(file.size>150000) throw new Error("Arquivo muito grande. Limite de 150 KB.");
    const imported=restoreBackup(await file.text());
    state=imported;current=lookupPlayer(state.selected);resetEditing();renderAll();showSection("overview");
    status("Backup importado. A lista local foi substituída.");
  }catch(err){status("Importação cancelada: "+err.message,"error")}
  finally{event.target.value=""}
});
byId("reset-data").addEventListener("click",()=>byId("confirm-dialog").showModal());
byId("confirm-dialog").addEventListener("close",()=>{
  if(byId("confirm-dialog").returnValue!=="confirm")return;
  resetEditing();
  commit({...DEFAULT_STATE,friends:[],favorites:[]},"Dados locais limpos.");
  showSection("overview");
});

document.addEventListener("error",event=>{
  const img=event.target;
  if(img instanceof HTMLImageElement && !img.dataset.fallback){img.dataset.fallback="true";img.src="./img/logo.png"}
},true);
document.addEventListener("keydown",event=>{
  if(event.key==="Escape" && editingFriend) resetEditing();
});
renderAll();
setGallery(0);
showSection(section);
console.info("League Friends — versão estática",DEMO_NOTICE);
