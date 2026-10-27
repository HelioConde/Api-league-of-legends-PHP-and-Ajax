# QA Visual

Playwright fotografa seis seções em cinco resoluções: 360×800, 390×844, 768×1024, 1280×800 e 1600×900. São 30 capturas full-page por execução.

Execute npm install, npx playwright install chromium, npm run test:e2e e npm run qa:report.

Artefatos: qa-artifacts/screenshots (PNG), qa-artifacts/reports (JSON), qa-artifacts/index.html (galeria), qa-artifacts/SUMMARY.md (resumo), qa-artifacts/playwright-report (HTML/trace).

Verificações: pageerror, console.error, falhas de recursos locais, scroll horizontal, elementos fora da viewport, cards sobrepostos e IDs duplicados. Falhas de CDNs externas são registradas como avisos, não erros do aplicativo.

A execução CI gera o artifact league-friends-visual-qa inclusive quando os testes são aprovados. As capturas permitem inspeção visual humana adicional.
