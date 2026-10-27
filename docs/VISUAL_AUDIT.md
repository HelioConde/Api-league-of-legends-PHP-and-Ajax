# Capturas automáticas e inspeção visual

## Objetivo
A auditoria utiliza Playwright/Chromium para visitar as seis seções em cinco larguras: 360px, 390px, 768px, 1280px e 1600px. Gera 30 imagens PNG de página inteira **a cada execução**, além de diagnósticos JSON e relatório Markdown. O estado de amigos da página é semeado com um Riot ID de teste para verificar a UI preenchida. A aplicação continua 100% estática, sem PHP e sem banco de dados.

## Como usar

1. Instale dependências: npm install
2. Instale navegador Chromium: npx playwright install chromium
3. Rode: npm run audit:visual
4. Veja artifacts/visual-audit/REPORT.md e imagens nas pastas por largura.
5. Não é necessário iniciar o servidor: o script inicia e encerra o servidor local automaticamente.
6. Opcional: defina LF_AUDIT_URL com a URL já hospedada para auditar um site em produção.

Em push e pull request, o workflow de qualidade executa a auditoria automaticamente, preservando os resultados no artefato **league-friends-visual-audit** por 14 dias. Execute também manualmente usando workflow_dispatch.

## Arquivos

- REPORT.md: sumário, links relativos para as capturas e descrição de falhas/avisos.
- diagnostics.json: data, commit, 30 capturas, eventos de console/rede e medições por seção e resolução.
- 360/, 390/, 768/, 1280/, 1600/: PNGs com nomes overview, matches, friends, compare, gallery e settings.

## Critérios de erro
- pageerror: exceção não capturada JavaScript;
- console-error: mensagem de erro do console;
- request-failed / http-error: requisição falha ou HTTP 4xx/5xx;
- horizontal-overflow: documento com largura maior que viewport (exclui o overflow interno intencional da barra de navegação mobile);
- outliers: controles ou cabeçalhos importantes fora da área horizontal visível;
- overlaps: controles acionáveis se interceptando significativamente;
- brokenImages: imagens visíveis sem tamanho intrínseco.

Falhas em recursos externos são avisos (CDNs estão fora do controle do projeto); texto potencialmente recortado é aviso. Qualquer erro de primeira parte faz o comando encerrar com código de erro, bloqueando o check de QA na PR.

## Limitações
O script mede condições DOM e oferece evidências visuais. Não pode afirmar sozinho que todo detalhe visual, contraste, sobreposição não interativa ou estética esteja perfeito. Revise as PNGs ao lado dos eventos e faça revisão manual de teclado, leitor de tela e responsividade. Capturas são fixadas com reduce motion para diminuir variação.

## GitHub Actions
Abra Actions > League Friends - testes > Execução desejada > Artifacts > league-friends-visual-audit e baixe o ZIP. Não adicione as PNGs geradas ao branch principal, pois são saídas de testes temporárias.
