# QA Visual

Playwright fotografa seis seções em cinco resoluções: 360×800, 390×844, 768×1024, 1280×800 e 1600×900. São 30 capturas full-page por execução.

Execute npm install, npx playwright install chromium, npm run test:e2e e npm run qa:report.

Artefatos: qa-artifacts/screenshots (PNG), qa-artifacts/reports (JSON), qa-artifacts/index.html (galeria), qa-artifacts/SUMMARY.md (resumo), qa-artifacts/playwright-report (HTML/trace).

Verificações: pageerror, console.error, falhas de recursos locais, scroll horizontal, elementos fora da viewport, cards sobrepostos e IDs duplicados. Falhas de CDNs externas são registradas como avisos, não erros do aplicativo.

A execução CI gera o artifact league-friends-visual-qa inclusive quando os testes são aprovados. As capturas permitem inspeção visual humana adicional.

## Estados extras após inspeção das primeiras imagens

Além das 30 telas padrão, cinco larguras fotografam dois estados adicionais: **amigos preenchidos** (Riot ID salvo localmente) e **perfil desconhecido** (sem estatísticas online). Total esperado: **40 capturas completas**. O teste usa o mesmo esquema JSON e a mesma galeria de artefatos.

A revisão das capturas originais levou a ajustes concretos: seis opções de navegação visíveis em telas de até 520px, Riot ID com TAG sem quebra interna, e barra de pesquisa compacta nas seções secundárias. Os testes adicionais verificam ausência de overflow, de imagens visíveis quebradas e de erros de JavaScript nesses estados.
