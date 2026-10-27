import {readdir,readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import path from 'node:path';

const root='qa-artifacts',reportDir=path.join(root,'reports');
let paths=[];
try{paths=(await readdir(reportDir)).filter(p=>p.endsWith('.json'));}catch{}
const reports=await Promise.all(paths.map(async name=>JSON.parse(await readFile(path.join(reportDir,name),'utf8'))));
reports.sort((a,b)=>a.viewport.width-b.viewport.width||a.route.localeCompare(b.route));
const bad=reports.filter(r=>!r.passed),pass=reports.length-bad.length;
const summary=[
  '## Auditoria Playwright — capturas full-page','',
  '| Indicador | Resultado |','| --- | ---: |',
  '| Screenshots salvas | '+reports.length+' |',
  '| Cenários aprovados | '+pass+' |',
  '| Cenários com problemas | '+bad.length+' |',
  '| Avisos CDN externa | '+reports.reduce((n,r)=>n+r.externalWarnings.length,0)+' |','',
  '### Diagnósticos',
  ...(bad.length?bad.map(r=>'- '+r.viewport.name+' / '+r.route+': '+
    [...r.layoutProblems,...r.javascriptErrors,...r.consoleErrors,...r.internalFailures]
      .join(' · ').replaceAll('|','/').slice(0,600)) : ['Nenhuma falha interna detectada.']),
  '',
  'Capturas e relatório HTML: artefato league-friends-visual-qa.'
].join('\n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=reports.map(r=>{
  const src=r.screenshot.replace(/^qa-artifacts\//,'');
  const errors=[...r.layoutProblems,...r.javascriptErrors,...r.consoleErrors,...r.internalFailures];
  return '<article><a href="'+escape(src)+'"><img loading="lazy" src="'+escape(src)+'" alt="'+
    escape(r.viewport.name+' '+r.route)+'"></a><h2>'+escape(r.route)+'</h2><p>'+
    escape(r.viewport.name)+' — '+r.viewport.width+'×'+r.viewport.height+'</p><p class="'+
    (r.passed?'pass':'fail')+'">'+(r.passed?'Aprovado':'Problemas detectados')+
    '</p><pre>'+escape(errors.join('\n')||'Sem problemas internos')+'</pre></article>';
}).join('');
await mkdir(root,{recursive:true});
await writeFile(path.join(root,'SUMMARY.md'),summary+'\n');
await writeFile(path.join(root,'index.html'),
 '<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>League Friends — QA Visual</title><style>body{background:#0b1420;color:#eaf2ff;font:15px system-ui;margin:0;padding:25px}'+
 'header,main{max-width:1300px;margin:auto}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:18px}'+
 'article{border:1px solid #48617a;background:#172b3d;border-radius:12px;padding:14px}'+
 'img{width:100%;height:240px;object-fit:cover;object-position:top}h2{font-size:17px}.pass{color:#8ee4bc}.fail{color:#ff9bad}'+
 'pre{white-space:pre-wrap;max-height:160px;overflow:auto;font-size:11px}</style>'+
 '<header><h1>Capturas automáticas — League Friends</h1><p>'+pass+' de '+reports.length+
 ' cenários aprovados. Clique em uma captura para ver a página inteira.</p></header><main>'+cards+'</main></html>');
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
console.log(summary);
if(!reports.length)process.exitCode=1;
