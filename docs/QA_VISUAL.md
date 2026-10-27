# QA Visual com Playwright

A nova suíte fotografa seis telas em cinco resoluções, totalizando 30 capturas de página inteira por repositório em cada execução.

Resoluções: mobile 360x800 e 390x844; tablet 768x1024; desktop 1280x800 e 1600x900.
Telas: início, catálogo, amigos, detalhe da Ahri, sobre e galeria ou partidas demonstrativas.

Executar:
- npm install
- npx playwright install chromium
- npm run test:e2e
- npm run qa:report

Ver capturas e relatórios:
- qa-artifacts/screenshots/: screenshots PNG full-page
- qa-artifacts/reports/: JSON de erros e avisos por tela
- qa-artifacts/index.html: galeria com miniaturas
- qa-artifacts/SUMMARY.md: quadro de problemas
- qa-artifacts/playwright-report/: relatório oficial do Playwright

Os testes verificam exceções JavaScript, console.error, falhas HTTP locais, largura extra na tela, controles fora da viewport, cards sobrepostos e IDs repetidos. Falhas em CDNs externos são avisos, não reprovação do layout interno.

A ação CI executada em pull requests anexa league-friends-visual-qa inclusive quando os testes passam. Na aba Actions, abra a execução e baixe o artefato.

As capturas usam catálogo de reserva determinístico para permitir comparação visual estável. Elas são evidências para revisão visual humana e não uma garantia de qualidade perceptual perfeita.
