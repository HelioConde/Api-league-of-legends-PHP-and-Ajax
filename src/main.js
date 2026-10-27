import './style.css';
import {settings} from './settings.js';
import {cleanName,cleanRegion,loadState,normalizeState,saveState} from './storage.js';
import {FALLBACK,FALLBACK_VERSION,fetchChampions,icon,splash} from './catalog.js';
import demo from '../data/demo.json';

const key='league-friends:'+settings.slug+':v2';
let data=loadState(key);
let catalog={champions:FALLBACK,version:FALLBACK_VERSION,demo:true};
let query='',role='all',matchFilter='all';
const app=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const page=()=>{
 const hash=location.hash.slice(2)||'home';
 return /^[a-zA-Z0-9/_-]+$/.test(hash)?hash:'home';
};
const link=(id,label,active)=>'<a href="#/'+id+'" class="nav-link'+(active===id?' active':'')+'"'+(active===id?' aria-current="page"':'')+'>'+label+'</a>';
const pill=(value,warn=false)=>'<span class="pill'+(warn?' warning':'')+'">'+esc(value)+'</span>';
function layout(){
 const active=page(),target=settings.mode==='social'?'gallery':'matches';
 const sub=settings.mode==='social'?'Galeria':'Partidas demo';
 const links=[link('home','Início',active),link('champions','Campeões',active),link('friends','Amigos',active),link(target,sub,active),link('about','Sobre',active)].join('');
 return '<header class="header"><div class="container header-row"><a class="brand" href="#/home" aria-label="League Friends, início"><span class="logo-mark">L</span><span><b>LEAGUE <i>FRIENDS</i></b><small>'+esc(settings.mode==='social'?'SOCIAL HUB':'RIFT INSIGHTS')+'</small></span></a>'+
 '<nav class="nav" aria-label="Navegação principal">'+links+'</nav><a class="github" href="https://github.com/HelioConde/'+encodeURIComponent(settings.slug)+'" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></header>'+
 '<main class="container content" id="main" tabindex="-1">'+content(active)+'</main>'+
 '<footer class="footer"><div class="container footer-row"><span>Projeto independente · Não afiliado à Riot Games.</span><span>Criado por Hélio Conde · <a href="#/about">Sobre</a></span></div></footer>'+
 '<div id="feedback" class="feedback" role="status" aria-live="polite"></div><input class="visually-hidden" type="file" accept="application/json,.json" id="import-file" aria-label="Selecionar arquivo de backup JSON">';
}
function hero(){
 const values=settings.mode==='social'?
 [[catalog.champions.length,'campeões'],[data.friends.length,'amigos locais'],[data.favorites.length,'favoritos']]:
 [[catalog.champions.length,'campeões'],[demo.matches.length,'partidas demo'],['100%','estático']];
 return '<section class="hero"><div><div class="overline"><span class="status-dot"></span> EXPLORE RUNETERRA '+pill(catalog.demo?'Catálogo reserva':'Patch '+catalog.version,catalog.demo)+'</div>'+
 '<h1>Um novo jeito de viver o <em>universo de League.</em></h1><p>'+esc(settings.subtitle)+' Explore, descubra e salve suas escolhas neste navegador.</p>'+
 '<div class="actions"><a class="button primary" href="#/champions">Explorar campeões <span aria-hidden="true">→</span></a>'+
 '<a class="button secondary" href="#/'+(settings.mode==='social'?'friends':'matches')+'">'+(settings.mode==='social'?'Meus amigos':'Histórico fictício')+'</a></div>'+
 '<div class="metrics">'+values.map(v=>'<div class="metric"><strong>'+v[0]+'</strong><span>'+v[1]+'</span></div>').join('')+'</div></div>'+
 '<div class="hero-image"><img src="'+splash('Ahri')+'" alt="" loading="eager"><div class="hero-image-shade"></div><div class="art-label">EXPLORE <strong>RUNETERRA</strong><small>LEAGUE FRIENDS 2.0</small></div></div></section>'+
 '<section class="section"><div class="section-heading"><div><span class="label">CONHEÇA OS CAMPEÕES</span><h2>Destaques da semana</h2></div><a class="subtle-link" href="#/champions">Ver todos →</a></div>'+
 '<div class="cards featured">'+catalog.champions.slice(0,3).map(card).join('')+'</div></section>'+
 '<section class="advantages"><div><b>✧ Privado por padrão</b><p>Amigos e favoritos ficam no dispositivo.</p></div><div><b>◇ Sem servidor próprio</b><p>Dados públicos e exemplos de demonstração.</p></div><div><b>⌁ Pronto para mobile</b><p>Interface adaptada para diferentes telas.</p></div></section>';
}
function card(c){
 const fav=data.favorites.includes(c.id);
 return '<article class="champ-card"><a href="#/champion/'+encodeURIComponent(c.id)+'" class="cover" aria-label="Ver '+esc(c.name)+'"><img src="'+splash(c.id)+'" loading="lazy" alt=""></a>'+
 '<div class="card-line"><div><h3><a href="#/champion/'+encodeURIComponent(c.id)+'">'+esc(c.name)+'</a></h3><small>'+esc(c.title||c.tags?.join(' · '))+'</small></div>'+
 '<button class="favorite'+(fav?' selected':'')+'" data-favorite="'+esc(c.id)+'" aria-label="'+(fav?'Remover ':'Favoritar ')+esc(c.name)+'" aria-pressed="'+fav+'">'+(fav?'♥':'♡')+'</button></div></article>';
}
function championPage(){
 return '<section class="intro"><span class="label">BIBLIOTECA DE RUNETERRA</span><h1>Campeões</h1><p>Busque por nome, filtre por função e salve seus favoritos.</p></section>'+
 '<section class="filters" aria-label="Filtros de campeões"><div class="field"><label for="search">Buscar campeão</label><input id="search" type="search" autocomplete="off" placeholder="Ex.: Ahri, Jinx, Lux" value="'+esc(query)+'"></div>'+
 '<div class="field"><label for="role">Função</label><select id="role">'+[['all','Todas'],['Mage','Mago'],['Marksman','Atirador'],['Fighter','Lutador'],['Assassin','Assassino'],['Tank','Tanque'],['Support','Suporte']].map(v=>
 '<option value="'+v[0]+'"'+(role===v[0]?' selected':'')+'>'+v[1]+'</option>').join('')+'</select></div></section>'+
 '<p class="result-count" id="results" role="status"></p><div class="cards" id="champion-grid"></div>';
}
function updateList(){
 const grid=document.getElementById('champion-grid');if(!grid)return;
 const filtered=catalog.champions.filter(c=>(role==='all'||c.tags.includes(role))&&(c.name+' '+c.title).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 grid.innerHTML=filtered.length?filtered.map(card).join(''):'<div class="empty">Nenhum campeão encontrado. Ajuste a busca ou o filtro.</div>';
 document.getElementById('results').textContent=filtered.length+' campeões encontrados'+(catalog.demo?' · catálogo de reserva':'');
}
function detail(id){
 const c=catalog.champions.find(ch=>ch.id===id);
 if(!c)return '<div class="intro"><h1>Campeão não encontrado</h1><a class="subtle-link" href="#/champions">Voltar aos campeões</a></div>';
 const fav=data.favorites.includes(c.id);
 return '<a href="#/champions" class="back">← Voltar aos campeões</a><section class="detail"><div class="detail-image"><img src="'+splash(c.id)+'" alt="Arte de '+esc(c.name)+'"></div>'+
 '<div><span class="label">CAMPEÃO</span><h1>'+esc(c.name)+'</h1><h2>'+esc(c.title)+'</h2><p>'+esc(c.blurb?.replace(/<[^>]*>/g,'')||'Conheça esta lenda de Runeterra.')+'</p>'+
 '<div class="tag-row">'+c.tags.map(t=>pill(t)).join('')+'</div><button class="button primary" data-favorite="'+esc(c.id)+'">'+(fav?'♥ Remover dos favoritos':'♡ Adicionar aos favoritos')+'</button>'+
 '<p class="note">Dados de campeões do Riot Data Dragon, quando disponível.</p></div></section>';
}
function friends(){
 return '<section class="intro"><span class="label">SUA COMUNIDADE</span><h1>Amigos</h1><p>Guarde apelidos neste navegador. Isto não consulta contas ou amizades reais da Riot.</p></section>'+
 '<div class="columns"><section class="panel"><h2>Adicionar amigo</h2><form id="friend-form" class="form"><div class="field"><label for="friend-name">Nome ou Riot ID</label>'+
 '<input id="friend-name" name="name" required maxlength="40" minlength="2" placeholder="Ex.: Amigo#BR1" autocomplete="off"></div>'+
 '<div class="field"><label for="region">Região</label><select id="region" name="region">'+['BR1','NA1','EUW1','EUN1','LA1','LA2','KR','JP1'].map(r=>'<option>'+r+'</option>').join('')+'</select></div>'+
 '<button type="submit" class="button primary">+ Adicionar</button></form><p class="note">Dados armazenados apenas no seu dispositivo.</p></section>'+
 '<section class="panel"><h2>Minha lista '+pill(data.friends.length+' salvos')+'</h2>'+
 (data.friends.length?'<ul class="friend-list">'+data.friends.map((f,i)=>'<li class="friend"><span class="avatar" aria-hidden="true">'+esc(f.name.slice(0,1).toUpperCase())+'</span>'+
 '<span class="friend-info"><b>'+esc(f.name)+'</b><small>Região '+esc(f.region)+'</small></span><button class="button danger small" data-remove="'+i+'" aria-label="Remover '+esc(f.name)+'">Remover</button></li>').join('')+'</ul>':
 '<div class="empty">Ainda não há amigos salvos. Adicione o primeiro!</div>')+'</section></div>'+
 '<section class="panel backup"><h2>Backup local</h2><p>Exporte e importe a lista de amigos e favoritos em JSON.</p>'+
 '<div class="actions"><button class="button secondary" data-action="export">Exportar JSON</button><button class="button secondary" data-action="import">Importar JSON</button>'+
 '<button class="button danger-outline" data-action="clear">Apagar dados locais</button></div></section>';
}
function gallery(){
 return '<section class="intro"><span class="label">GALERIA</span><h1>Arte de Runeterra</h1><p>Uma seleção de artes dos campeões para explorar.</p></section>'+
 '<div class="gallery">'+catalog.champions.slice(0,12).map(c=>'<a href="#/champion/'+encodeURIComponent(c.id)+'" class="gallery-card">'+
 '<img src="'+splash(c.id)+'" loading="lazy" alt="Arte de '+esc(c.name)+'"><strong>'+esc(c.name)+' ↗</strong></a>').join('')+'</div>';
}
function matchCard(m){
 const win=m.result==='Vitória';
 const kda=((m.kills+m.assists)/Math.max(m.deaths,1)).toFixed(2);
 return '<article class="match '+(win?'win':'loss')+'"><div class="match-champ"><img loading="lazy" src="'+icon(m.champion,catalog.version)+'" alt="">'+
 '<div><strong>'+esc(m.champion)+'</strong><small>'+esc(m.mode)+'</small></div></div>'+
 '<div class="outcome"><b>'+esc(m.result)+'</b><small>Demonstração</small></div>'+
 '<div><b>'+m.kills+' / '+m.deaths+' / '+m.assists+'</b><small>'+kda+' KDA</small></div><div class="duration">'+esc(m.duration)+'</div></article>';
}
function matches(){
 const wins=demo.matches.filter(m=>m.result==='Vitória').length,rate=Math.round(100*wins/demo.matches.length);
 const kda=demo.matches.reduce((a,m)=>a+(m.kills+m.assists)/Math.max(1,m.deaths),0)/demo.matches.length;
 const filtered=demo.matches.filter(m=>matchFilter==='all'||matchFilter===m.result);
 return '<section class="intro"><span class="label">DADOS FICTÍCIOS</span><h1>Partidas de demonstração</h1><p>Histórico ilustrativo. Nenhuma partida exibida aqui pertence a jogadores reais.</p>'+
 pill(demo.notice,true)+'</section><section class="stat-row"><div class="stat"><span>Vitórias</span><strong>'+rate+'%</strong><small>Simuladas</small></div>'+
 '<div class="stat"><span>KDA médio</span><strong>'+kda.toFixed(2)+'</strong><small>Simulado</small></div><div class="stat"><span>Partidas</span><strong>'+demo.matches.length+'</strong><small>Exemplos</small></div></section>'+
 '<div class="section-heading"><h2>Histórico fictício</h2><div class="field"><label for="match-filter">Resultado</label><select id="match-filter">'+[['all','Todos'],['Vitória','Vitória'],['Derrota','Derrota']].map(v=>
 '<option value="'+v[0]+'"'+(matchFilter===v[0]?' selected':'')+'>'+v[1]+'</option>').join('')+'</select></div></div>'+
 '<div class="match-list">'+filtered.map(matchCard).join('')+'</div>';
}
function about(){
 return '<section class="intro"><span class="label">O PROJETO</span><h1>Uma nova fase para um projeto clássico.</h1>'+
 '<p>Reconstrução moderna de um exercício de desenvolvimento Front-End, hospedado sem backend próprio.</p></section>'+
 '<div class="columns"><section class="panel"><h2>O que funciona</h2><p>Catálogo público de campeões, busca, filtros, favoritos, galeria, lista de amigos e backup local. '+
 (settings.mode==='stats'?'As partidas são exemplos fictícios.':'A galeria usa artes oficiais dos campeões.')+'</p></section>'+
 '<section class="panel"><h2>Limites e privacidade</h2><p>Sem login, sem consultas privadas à Riot e sem API key no navegador. Amigos e favoritos são locais; exporte seus dados antes de limpar o navegador.</p>'+
 '<p>Quando o Data Dragon não puder ser consultado, mostramos um catálogo de reserva.</p></section></div>'+
 '<section class="panel"><h2>Contato</h2><p>Veja o histórico e a evolução dos projetos.</p><a class="button secondary" href="https://github.com/HelioConde" target="_blank" rel="noopener noreferrer">Visitar GitHub ↗</a></section>'+
 '<p class="note legal">League of Legends pertence à Riot Games. Este projeto independente não é endossado pela Riot Games.</p>';
}
function content(current){
 if(current==='home')return hero();
 if(current==='champions')return championPage();
 if(current.startsWith('champion/'))return detail(current.slice(9));
 if(current==='friends')return friends();
 if(current==='gallery'&&settings.mode==='social')return gallery();
 if(current==='matches'&&settings.mode==='stats')return matches();
 if(current==='about')return about();
 return '<section class="intro"><h1>Página não encontrada</h1><a href="#/home" class="button primary">Voltar ao início</a></section>';
}
function render(){
 app.innerHTML=layout();
 if(page()==='champions')updateList();
 document.title=(page()==='home'?settings.title:'League Friends · '+page().split('/')[0]);
}
function notify(text){const node=document.getElementById('feedback');if(node){node.textContent=text;node.classList.add('visible');}}
function persist(){if(!saveState(key,data))notify('O armazenamento foi bloqueado. Exporte um backup.');}
function exportJson(){
 const out={version:2,exportedAt:new Date().toISOString(),...normalizeState(data)};
 const file=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),anchor=document.createElement('a');
 anchor.href=url;anchor.download='league-friends-backup.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',e=>{
 const fav=e.target.closest('[data-favorite]');
 if(fav){
  const id=fav.dataset.favorite;
  if(!catalog.champions.some(c=>c.id===id))return;
  data.favorites=data.favorites.includes(id)?data.favorites.filter(v=>v!==id):[...data.favorites,id];
  persist();render();notify(data.favorites.includes(id)?'Adicionado aos favoritos.':'Removido dos favoritos.');return;
 }
 const remove=e.target.closest('[data-remove]');
 if(remove){
  const i=Number(remove.dataset.remove);
  if(Number.isInteger(i)&&i>=0&&i<data.friends.length){data.friends.splice(i,1);persist();render();notify('Amigo removido.');}
  return;
 }
 const action=e.target.closest('[data-action]')?.dataset.action;
 if(action==='export')exportJson();
 if(action==='import')document.getElementById('import-file').click();
 if(action==='clear'&&window.confirm('Apagar amigos e favoritos deste navegador?')){data=normalizeState({});persist();render();notify('Dados apagados.');}
});
document.addEventListener('submit',e=>{
 if(e.target.id!=='friend-form')return;
 e.preventDefault();const form=new FormData(e.target),name=cleanName(form.get('name')),region=cleanRegion(form.get('region'));
 if(name.length<2){notify('Informe pelo menos dois caracteres.');return;}
 if(data.friends.some(f=>f.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')&&f.region===region)){notify('Amigo já cadastrado.');return;}
 if(data.friends.length>=100){notify('Limite local de 100 amigos.');return;}
 data.friends.push({name,region});persist();render();notify('Amigo adicionado.');
});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;updateList();}});
document.addEventListener('change',async e=>{
 if(e.target.id==='role'){role=e.target.value;updateList();}
 if(e.target.id==='match-filter'){matchFilter=e.target.value;render();}
 if(e.target.id==='import-file'&&e.target.files?.[0]){
  try{
   const file=e.target.files[0];if(file.size>200000)throw Error('Backup acima de 200 KB.');
   const input=JSON.parse(await file.text());
   if(!input||!Array.isArray(input.friends)||!Array.isArray(input.favorites))throw Error('Backup inválido.');
   data=normalizeState(input);persist();render();notify('Backup importado.');
  }catch(err){notify(err.message||'Falha na importação.');}
 }
});
window.addEventListener('hashchange',()=>{render();document.getElementById('main')?.focus({preventScroll:true});window.scrollTo(0,0);});
render();
fetchChampions().then(next=>{catalog=next;render();}).catch(()=>{});
