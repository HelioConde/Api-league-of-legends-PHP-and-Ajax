import {chromium} from "@playwright/test";
import {spawn} from "node:child_process";
import {mkdir,writeFile,appendFile} from "node:fs/promises";
import path from "node:path";

const sizes=[360,390,768,1280,1600];
const sections=["overview","matches","friends","compare","gallery","settings"];
const base=process.env.LF_AUDIT_URL||"http://127.0.0.1:4173/";
const origin=new URL(base).origin;
const dir=path.resolve("artifacts/visual-audit");
const report={createdAt:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,base,sizes,sections,captures:[],issues:[],events:[],measurements:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const isLocal=url=>{try{return new URL(url).origin===origin}catch{return false}};
function recordIssue(type,severity,width,section,detail){
  report.issues.push({type,severity,width,section,detail:String(detail).slice(0,600)});
}
function logEvent(width,section,type,detail,url=""){
  const severity=(url&&!isLocal(url))?"warning":"error";
  report.events.push({width,section,type,detail:String(detail).slice(0,600),url});
  recordIssue(type,severity,width,section,detail);
}
async function startServer(){
  if(process.env.LF_AUDIT_URL)return null;
  const child=spawn(process.platform==="win32"?"npm.cmd":"npm",["run","start"],{stdio:"ignore"});
  for(let attempt=0;attempt<100;attempt++){
    if(child.exitCode!==null)break;
    try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok)return child}catch{}
    await sleep(200);
  }
  child.kill("SIGTERM");
  throw new Error("O servidor local não iniciou em "+base);
}
async function inspect(page){
  return page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const desc=e=>e.tagName.toLowerCase()+(e.id?"#"+e.id:"")+(e.classList.length?"."+[...e.classList].slice(0,2).join("."):"");
    const visible=e=>{
      const s=getComputedStyle(e),r=e.getBoundingClientRect();
      return !e.closest("[hidden],.sr-only")&&s.visibility!=="hidden"&&s.display!=="none"&&r.width>1&&r.height>1;
    };
    const ignored=e=>!!e.closest(".mobile-nav,[data-audit-overflow-ok]");
    const outliers=[...document.querySelectorAll("main button, main input, main select, .topbar .status-pill, .section-heading h2, .profile-id")].filter(e=>visible(e)&&!ignored(e)&&
      (e.getBoundingClientRect().left < -2||e.getBoundingClientRect().right > width+2)).map(e=>({element:desc(e),text:e.textContent.trim().slice(0,60)}));
    const clipped=[...document.querySelectorAll("h1,h2,h3,label,.profile-id,.panel-top button,.search-field button,.friend-actions button")].filter(e=>{
      if(!visible(e)||ignored(e)||e.closest(".match-desc"))return false;
      const s=getComputedStyle(e);
      return (s.overflowX==="hidden"||s.overflowY==="hidden"||s.textOverflow==="ellipsis")&&(e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3);
    }).map(e=>({element:desc(e),text:e.textContent.trim().slice(0,60)}));
    const controls=[...document.querySelectorAll("main button,main input,main select")].filter(e=>visible(e)&&!ignored(e));
    const overlaps=[];
    for(let i=0;i<controls.length;i++){
      const a=controls[i],r=a.getBoundingClientRect();
      for(let j=i+1;j<controls.length;j++){
        const b=controls[j],t=b.getBoundingClientRect();
        if(a.contains(b)||b.contains(a))continue;
        const dx=Math.min(r.right,t.right)-Math.max(r.left,t.left);
        const dy=Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top);
        if(dx>Math.min(r.width,t.width)*.25&&dy>Math.min(r.height,t.height)*.25)overlaps.push(desc(a)+" overlaps "+desc(b));
      }
    }
    const brokenImages=[...document.images].filter(e=>visible(e)&&e.complete&&(!e.naturalWidth||!e.naturalHeight)).map(e=>e.currentSrc);
    return {width,scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
      height:document.documentElement.scrollHeight,outliers,clipped,overlaps,brokenImages,controls:controls.length};
  });
}
async function perform(){
  await mkdir(dir,{recursive:true});
  const server=await startServer();
  let browser;
  try{
    browser=await chromium.launch();
    for(const width of sizes){
      const context=await browser.newContext({viewport:{width,height:width<=390?844:900},deviceScaleFactor:1,reducedMotion:"reduce",colorScheme:"dark",locale:"pt-BR",serviceWorkers:"block"});
      const page=await context.newPage();
      let section="overview";
      page.on("pageerror",error=>logEvent(width,section,"pageerror",error.message));
      page.on("console",msg=>{if(msg.type()==="error")logEvent(width,section,"console-error",msg.text(),msg.location().url)});
      page.on("requestfailed",r=>logEvent(width,section,"request-failed",r.url()+" "+r.failure()?.errorText,r.url()));
      page.on("response",r=>{if(r.status()>=400)logEvent(width,section,"http-error",r.status()+" "+r.url(),r.url())});
      try{
        await page.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
        await page.locator("#profile-card .profile-id").waitFor({timeout:15000});
        await page.evaluate(()=>document.fonts.ready);
        for(const key of sections){
          section=key;
          const nav=width<=780?".mobile-nav":".sidebar";
          const button=page.locator(nav+' [data-section="'+key+'"]');
          if(width<=780)await button.evaluate(e=>e.scrollIntoView({block:"nearest",inline:"nearest"}));
          await button.click();
          await page.locator("#panel-"+key).waitFor({state:"visible"});
          if(key==="friends"){
            await page.locator("#friend-id").fill("VisualQA#BR1");
            await page.locator("#friend-form button[type=submit]").click();
          }
          await page.evaluate(()=>Promise.all([...document.images].filter(e=>e.getClientRects().length).map(img=>img.complete?null:new Promise(resolve=>{
            img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true});setTimeout(resolve,4000);
          }))));
          const stats=await inspect(page);
          report.measurements.push({width,section,...stats});
          if(stats.scrollWidth>stats.width+2)recordIssue("horizontal-overflow","error",width,key,stats.scrollWidth+"px > "+stats.width+"px");
          for(const field of ["outliers","overlaps","brokenImages"])for(const value of stats[field])recordIssue(field,"error",width,key,JSON.stringify(value));
          for(const value of stats.clipped)recordIssue("clipped-text","warning",width,key,JSON.stringify(value));
          const imageName=width+"/"+key+".png";
          await mkdir(path.join(dir,String(width)),{recursive:true});
          await page.screenshot({path:path.join(dir,imageName),fullPage:true,animations:"disabled",caret:"hide"});
          report.captures.push({width,section:key,file:imageName,pageHeight:stats.height});
          console.log("VISUAL_CAPTURE "+width+"px "+key+" "+stats.height+"px");
        }
      }catch(error){
        recordIssue("audit-failure","error",width,section,error.stack||error.message);
        await mkdir(path.join(dir,String(width)),{recursive:true});
        await page.screenshot({path:path.join(dir,String(width),"failure.png"),fullPage:true}).catch(()=>{});
      }finally{await context.close()}
    }
  }finally{
    if(browser)await browser.close();
    if(server)server.kill("SIGTERM");
  }
}
try{await perform()}catch(error){recordIssue("runner","error","all","setup",error.stack||error.message)}
const errors=report.issues.filter(i=>i.severity==="error");
const warnings=report.issues.filter(i=>i.severity==="warning");
const table=report.captures.map(x=>"| "+x.width+" | "+x.section+" | "+x.pageHeight+"px | [PNG](./"+x.file+") |").join("\n");
const issueList=report.issues.map(x=>"- "+x.severity.toUpperCase()+" / "+x.width+" / "+x.section+" / "+x.type+": "+x.detail).join("\n")||"Nenhum problema detectado.";
const markdown=[
  "# Auditoria visual automatizada — League Friends",
  "",
  "Data: "+report.createdAt+" | Commit: "+(report.commit||"local"),
  "",
  "Capturas: "+report.captures.length+" | Erros: "+errors.length+" | Avisos: "+warnings.length,
  "",
  "## Screenshots de página inteira",
  "",
  "| Largura | Seção | Altura | Imagem |","|---|---|---:|---|",table,
  "",
  "## Diagnósticos",
  "",
  issueList,
  "",
  "O overflow da barra mobile é intencional. Problemas com CDNs externas são avisos; erros locais fazem a verificação falhar.",
  ""
].join("\n");
await mkdir(dir,{recursive:true});
await writeFile(path.join(dir,"diagnostics.json"),JSON.stringify(report,null,2));
await writeFile(path.join(dir,"REPORT.md"),markdown);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,
  "## League Friends — auditoria visual\n\n"+report.captures.length+" capturas, **"+errors.length+" erros** e **"+warnings.length+" avisos**. Baixe o artefato league-friends-visual-audit para ver as imagens completas e REPORT.md.\n");
console.log("AUDIT_SUMMARY_JSON "+JSON.stringify({captures:report.captures.length,errors:errors.length,warnings:warnings.length}));
for(const entry of report.issues.slice(0,80))console.log("AUDIT_ISSUE "+JSON.stringify(entry));
if(errors.length)process.exitCode=1;
