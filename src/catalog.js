const ROOT='https://ddragon.leagueoflegends.com';
export const FALLBACK_VERSION='16.21.1';
export const FALLBACK=[
 ['Ahri','Mage'],['Ashe','Marksman'],['Braum','Support'],['Darius','Fighter'],
 ['Ezreal','Marksman'],['Garen','Fighter'],['Jinx','Marksman'],['Leona','Tank'],
 ['Lux','Mage'],['Yasuo','Fighter'],['Zed','Assassin'],['MissFortune','Marksman']
].map(([id,tag])=>({id,name:id==='MissFortune'?'Miss Fortune':id,title:'Campeão de Runeterra',tags:[tag],blurb:'Conheça este campeão de League of Legends.'}));
export const icon=(id,version)=>ROOT+'/cdn/'+encodeURIComponent(version)+'/img/champion/'+encodeURIComponent(id)+'.png';
export const splash=id=>ROOT+'/cdn/img/champion/splash/'+encodeURIComponent(id)+'_0.jpg';
export async function fetchChampions(fetcher=fetch){
 const controller=new AbortController(); const stop=setTimeout(()=>controller.abort(),10000);
 try{
  const vr=await fetcher(ROOT+'/api/versions.json',{signal:controller.signal});
  if(!vr.ok)throw Error('Falha na versão');
  const versions=await vr.json();
  const version=versions[0];
  if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Versão inválida');
  const result=await fetcher(ROOT+'/cdn/'+version+'/data/pt_BR/champion.json',{signal:controller.signal});
  if(!result.ok)throw Error('Falha no catálogo');
  const json=await result.json();
  const champions=Object.values(json.data||{}).filter(c=>/^[A-Za-z0-9]{1,32}$/.test(c.id)&&typeof c.name==='string')
   .map(c=>({id:c.id,name:c.name,title:c.title||'',tags:c.tags||[],blurb:c.blurb||''}))
   .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  if(!champions.length)throw Error('Catálogo vazio');
  return {version,champions,demo:false};
 }catch{return {version:FALLBACK_VERSION,champions:FALLBACK,demo:true};}
 finally{clearTimeout(stop);}
}
