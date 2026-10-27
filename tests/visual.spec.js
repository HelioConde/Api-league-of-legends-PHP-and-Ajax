import {test,expect} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
const viewports=[
  {name:"mobile-360",width:360,height:800},
  {name:"mobile-390",width:390,height:844},
  {name:"tablet-768",width:768,height:1024},
  {name:"desktop-1280",width:1280,height:800},
  {name:"desktop-1600",width:1600,height:900}
];
const sections=[
  ["visao-geral","overview"],["partidas","matches"],["amigos","friends"],
  ["comparar","compare"],["galeria","gallery"],["dados-locais","settings"]
];
test.describe("QA Visual - 30 capturas completas",()=>{
  for(const viewport of viewports)for(const [label,section]of sections){
    test(viewport.name+" / "+label,async({page})=>{
      const javascriptErrors=[],consoleErrors=[],internalFailures=[],externalWarnings=[];
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      page.on("pageerror",error=>javascriptErrors.push(error.message));
      page.on("console",message=>{
        if(message.type()!=="error")return;
        const msg=message.text();
        if(/^Failed to load resource:/i.test(msg)){
          externalWarnings.push("Resource error (HTTP tracked separately): "+msg.slice(0,200));
        }else{
          (/fonts\.googleapis\.com|fonts\.gstatic\.com|ddragon\.leagueoflegends\.com/i.test(msg)?externalWarnings:consoleErrors).push(msg.slice(0,320));
        }
      });
      page.on("response",response=>{
        if(response.status()<400)return;
        const url=response.url();
        (new URL(url).origin==="http://127.0.0.1:4173"?internalFailures:externalWarnings).push("HTTP "+response.status()+" "+url.slice(0,220));
      });
      page.on("requestfailed",request=>{
        const url=request.url();
        (url.startsWith("http://127.0.0.1:4173/")?internalFailures:externalWarnings).push("Request "+url.slice(0,180)+": "+request.failure()?.errorText);
      });
      await page.goto("/",{waitUntil:"domcontentloaded"});
      if(section!=="overview")await page.locator('[data-section="'+section+'"]:visible').first().click();
      await expect(page.locator("#panel-"+section)).toBeVisible();
      await expect(page.locator("#page-title")).not.toBeEmpty();
      const layoutProblems=await page.evaluate(()=>{
        const issues=[],width=window.innerWidth,root=document.documentElement;
        if(root.scrollWidth>width+2)issues.push("Overflow horizontal: "+root.scrollWidth+"px > "+width+"px");
        const nav=document.querySelector(".mobile-nav");
        if(nav&&getComputedStyle(nav).display!=="none"){
          if(nav.scrollWidth>nav.clientWidth+2)issues.push("Menu mobile cortado: "+nav.scrollWidth+"/"+nav.clientWidth);
          for(const item of nav.querySelectorAll("button")){
            const r=item.getBoundingClientRect();
            if(r.left < -2||r.right>width+2)issues.push("Botão de navegação fora da tela: "+item.textContent.trim());
          }
        }
        for(const el of document.querySelectorAll("main,.panel,.section-panel,.search-banner,.overview-layout,.match-row,.friend-grid,.compare-grid,.gallery-stage,.settings-grid")){
          if(el.getClientRects().length===0||el.closest("[hidden]"))continue;
          const style=getComputedStyle(el);
          if(el.scrollWidth>el.clientWidth+3&&!["auto","scroll"].includes(style.overflowX))
            issues.push("Container clipped: "+String(el.className||el.id||el.tagName)+" ("+el.scrollWidth+"/"+el.clientWidth+")");
        }
        for(const el of document.querySelectorAll("main button,main input,main select,main a")){
          if(el.closest("[hidden]"))continue;
          const r=el.getBoundingClientRect();
          if(r.width>0&&r.height>0&&(r.left < -2||r.right > width+2))
            issues.push("Control outside viewport: "+(el.getAttribute("aria-label")||el.textContent||el.tagName).trim().slice(0,65));
        }
        for(const group of document.querySelectorAll(".stats-grid,.friend-grid,.compare-grid,.settings-grid")){
          if(group.closest("[hidden]"))continue;
          const kids=[...group.children].filter(x=>x.getBoundingClientRect().width>0);
          for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){
            const a=kids[i].getBoundingClientRect(),b=kids[j].getBoundingClientRect();
            if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3)
              issues.push("Overlapping cards: "+group.className+" ("+i+"/"+j+")");
          }
        }
        const ids=new Set();
        for(const el of document.querySelectorAll("[id]")){
          if(ids.has(el.id))issues.push("Duplicate HTML ID: "+el.id);
          ids.add(el.id);
        }
        return [...new Set(issues)];
      });
      const directory=path.join("qa-artifacts","screenshots",viewport.name);
      await mkdir(directory,{recursive:true});
      const screenshot=path.join(directory,label+".png");
      await page.screenshot({path:screenshot,fullPage:true,animations:"disabled",timeout:30000});
      const item={route:section,viewport,screenshot,
        layoutProblems,javascriptErrors,consoleErrors,internalFailures,externalWarnings,
        passed:!(layoutProblems.length||javascriptErrors.length||consoleErrors.length||internalFailures.length)
      };
      await mkdir("qa-artifacts/reports",{recursive:true});
      await writeFile(path.join("qa-artifacts","reports",viewport.name+"--"+label+".json"),JSON.stringify(item,null,2)+"\n");
      expect(layoutProblems,"Layout").toEqual([]);
      expect(javascriptErrors,"JavaScript").toEqual([]);
      expect(consoleErrors,"Console").toEqual([]);
      expect(internalFailures,"Local HTTP failures").toEqual([]);
    });
  }
});
