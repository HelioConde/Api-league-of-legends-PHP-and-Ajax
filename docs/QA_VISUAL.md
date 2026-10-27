# QA Visual

Playwright fotografa seis seções em cinco resoluções: 360×800, 390×844, 768×1024, 1280×800 e 1600×900. São 30 capturas full-page por execução.

Execute npm install, npx playwright install chromium, npm run test:e2e e npm run qa:report.

Artefatos: qa-artifacts/screenshots (PNG), qa-artifacts/reports (JSON), qa-artifacts/index.html (galeria), qa-artifacts/SUMMARY.md (resumo), qa-artifacts/playwright-report (HTML/trace).

Verificações: pageerror, console.error, falhas de recursos locais, scroll horizontal, elementos fora da viewport, cards sobrepostos e IDs duplicados. Falhas de CDNs externas são registradas como avisos, não erros do aplicativo.

A execução CI gera o artifact league-friends-visual-qa inclusive quando os testes são aprovados. As capturas permitem inspeção visual humana adicional.

## Melhorias detectadas pelas capturas de 360 px

- O menu mobile original dependia de rolagem horizontal e cortava a última opção.
- Em telas de até 520 px, o menu agora usa uma grade de 3 colunas e duas linhas; as seis seções ficam visíveis sem deslizar.
- O teste `visual.spec.js` verifica que nenhum botão de navegação extrapole a área visível e que o menu não precise de rolagem horizontal.
- Essa checagem complementa a antiga inspeção de `document.scrollWidth`, que não detectava containers com `overflow-x:auto`.
