import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {settings} from '../../src/settings.js';

const sizes = [
  {name:'mobile-360',width:360,height:800},
  {name:'mobile-390',width:390,height:844},
  {name:'tablet-768',width:768,height:1024},
  {name:'desktop-1280',width:1280,height:800},
  {name:'desktop-1600',width:1600,height:900}
];
const routes = [
  ['inicio','home'],['campeoes','champions'],['amigos','friends'],
  ['detalhe-ahri','champion/Ahri'],['sobre','about'],
  settings.mode === 'social' ? ['galeria','gallery'] : ['partidas-demo','matches']
];

test.describe('Capturas full-page e auditoria visual', () => {
  for(const viewport of sizes) for(const [name,route] of routes) {
    test(viewport.name+' / '+name,async ({page}) => {
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      const javascriptErrors=[],consoleErrors=[],internalFailures=[],externalWarnings=[];
      page.on('pageerror',error=>javascriptErrors.push(error.message));
      page.on('console',message=>{
        if(message.type() !== 'error')return;
        const msg=message.text();
        (/ddragon|fonts\.googleapis|fonts\.gstatic/.test(msg) ? externalWarnings : consoleErrors).push(msg.slice(0,320));
      });
      page.on('response',response=>{
        if(response.status()<400)return;
        const uri=response.url(),local=new URL(uri).origin==='http://127.0.0.1:4173';
        (local?internalFailures:externalWarnings).push(response.status()+' '+uri.slice(0,220));
      });
      page.on('requestfailed',request=>{
        const uri=request.url();
        (uri.startsWith('http://127.0.0.1:4173/')?internalFailures:externalWarnings)
          .push('Falha de request '+uri.slice(0,180)+': '+request.failure()?.errorText);
      });
      // Fixture determinística: ativa catálogo reserva sem impedir carregamento das artes no CDN.
      await page.route('**/api/versions.json',r=>
        r.fulfill({status:200,contentType:'application/json',body:'["0.0.0"]'}));
      await page.goto('/#/'+route,{waitUntil:'domcontentloaded'});
      await expect(page.locator('main#main')).toBeVisible();
      await expect(page.locator('main h1')).toBeVisible();
      const problems=await page.evaluate(()=>{
        const issues=[],vw=window.innerWidth,root=document.documentElement;
        if(root.scrollWidth>vw+2)issues.push('Overflow horizontal do documento: '+root.scrollWidth+' > '+vw);
        if(!document.querySelector('main')?.textContent?.trim())issues.push('Conteúdo principal vazio');
        for(const el of document.querySelectorAll('main,.hero,.hero-image,.cards,.gallery,.columns,.filters,.stat-row,.match,.panel')){
          const style=getComputedStyle(el);
          if(el.scrollWidth>el.clientWidth+3&&!['auto','scroll'].includes(style.overflowX)){
            issues.push('Container transbordando: '+String(el.className||el.tagName)+' ('+el.scrollWidth+'/'+el.clientWidth+')');
          }
        }
        for(const el of document.querySelectorAll('main button,main input,main select,main a')){
          const r=el.getBoundingClientRect();
          if(r.width&&r.height&&(r.left < -2 || r.right > vw+2)){
            issues.push('Controle fora da tela: '+(el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,60));
          }
        }
        for(const group of document.querySelectorAll('.cards,.gallery,.stat-row,.advantages')){
          const children=[...group.children];
          for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
            const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect();
            if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&
               Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3){
              issues.push('Cards sobrepostos: '+group.className+' '+i+'/'+j);
            }
          }
        }
        const ids=new Set();
        for(const el of document.querySelectorAll('[id]')){
          if(ids.has(el.id))issues.push('ID duplicado: '+el.id);
          ids.add(el.id);
        }
        return [...new Set(issues)];
      });
      const dir=path.join('qa-artifacts','screenshots',viewport.name);
      await mkdir(dir,{recursive:true});
      const screenshot=path.join(dir,name+'.png');
      await page.screenshot({path:screenshot,fullPage:true,animations:'disabled',timeout:30000});
      const report={
        route,viewport,screenshot,
        layoutProblems:problems,javascriptErrors,consoleErrors,internalFailures,externalWarnings,
        passed:!(problems.length||javascriptErrors.length||consoleErrors.length||internalFailures.length)
      };
      await mkdir('qa-artifacts/reports',{recursive:true});
      await writeFile(path.join('qa-artifacts/reports',viewport.name+'--'+name+'.json'),
        JSON.stringify(report,null,2)+'\n');
      expect(problems,'Erros de layout').toEqual([]);
      expect(javascriptErrors,'Erros JS').toEqual([]);
      expect(consoleErrors,'Erros no console').toEqual([]);
      expect(internalFailures,'Falhas HTTP locais').toEqual([]);
    });
  }
});
